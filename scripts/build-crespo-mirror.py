#!/usr/bin/env python3
"""scripts/build-crespo-mirror.py

Builds a raw-preserving local analytical mirror (Parquet + DuckDB) from the
raw CrespoDynCoopNet MS Access database using mdbtools and DuckDB.

Outputs:
  - data/analytics/crespo/*.parquet (gitignored)
  - data/analytics/crespo.duckdb (gitignored)
  - data/review/crespo/mirror_manifest.json (tracked, deterministic, public-safe)

Configurable via CHARTED_CURRENTS_ANALYTICS_DIR environment variable.
"""

from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import duckdb

REPO_ROOT = Path(__file__).resolve().parent.parent
MDB_PATH = REPO_ROOT / "data" / "raw" / "crespo" / "CrespoDynCoopNetDATASETS.mdb"
MANIFEST_PATH = REPO_ROOT / "data" / "review" / "crespo" / "mirror_manifest.json"

ANALYTICS_DIR = Path(
    os.environ.get("CHARTED_CURRENTS_ANALYTICS_DIR", REPO_ROOT / "data" / "analytics")
)
PARQUET_DIR = ANALYTICS_DIR / "crespo"
DUCKDB_PATH = ANALYTICS_DIR / "crespo.duckdb"


def compute_sha256(file_path: Path) -> str:
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def get_mdbtools_version() -> str:
    try:
        out = subprocess.run(
            ["mdb-export", "--version"],
            capture_output=True,
            text=True,
            check=False,
        )
        first_line = (out.stdout or out.stderr or "unknown").splitlines()[0].strip()
        return first_line
    except Exception:
        return "mdbtools (version undetected)"


def get_mdb_tables() -> list[str]:
    out = subprocess.run(
        ["mdb-tables", "-1", str(MDB_PATH)],
        capture_output=True,
        text=True,
        check=True,
    )
    tables = [line.strip() for line in out.stdout.splitlines() if line.strip()]
    return sorted(tables)


def main() -> None:
    if not MDB_PATH.exists():
        print(f"[ERROR] Raw MDB file not found at {MDB_PATH}", file=sys.stderr)
        sys.exit(1)

    print(f"[*] Reading raw MDB: {MDB_PATH.name}")
    mdb_sha = compute_sha256(MDB_PATH)
    mdb_version = get_mdbtools_version()
    print(f"[*] MDB SHA-256: {mdb_sha}")
    print(f"[*] mdbtools version: {mdb_version}")

    PARQUET_DIR.mkdir(parents=True, exist_ok=True)

    tables = get_mdb_tables()
    print(f"[*] Found {len(tables)} tables in MDB.")

    # Remove existing DuckDB file if rebuilding
    if DUCKDB_PATH.exists():
        DUCKDB_PATH.unlink()

    duck_con = duckdb.connect(str(DUCKDB_PATH))

    manifest_tables: dict[str, dict[str, int]] = {}
    total_rows = 0

    tmpdir = tempfile.mkdtemp(prefix="crespo_export_")
    try:
        for tbl in tables:
            # Export table to temporary CSV via mdb-export
            tmp_csv = Path(tmpdir) / f"{tbl}.csv"
            with open(tmp_csv, "w", encoding="utf-8") as f:
                subprocess.run(
                    ["mdb-export", str(MDB_PATH), tbl],
                    stdout=f,
                    check=True,
                )

            # Sanitize filename for Parquet
            safe_tbl = tbl.replace(" ", "_").replace("&", "_and_").lower()
            parquet_file = PARQUET_DIR / f"{safe_tbl}.parquet"

            # Ingest to Parquet preserving raw strings and nulls
            duck_con.execute(
                f"""
                COPY (
                    SELECT * FROM read_csv('{tmp_csv}', header=true, ignore_errors=true)
                ) TO '{parquet_file}' (FORMAT PARQUET, COMPRESSION ZSTD);
                """
            )

            # Register raw view in DuckDB
            duck_con.execute(
                f"""
                CREATE VIEW raw_{safe_tbl} AS SELECT * FROM read_parquet('{parquet_file}');
                """
            )

            # Count rows and columns
            row_count = duck_con.execute(f"SELECT count(*) FROM raw_{safe_tbl}").fetchone()[0]
            col_count = len(duck_con.execute(f"SELECT * FROM raw_{safe_tbl} LIMIT 0").description)

            total_rows += row_count
            manifest_tables[tbl] = {
                "safe_name": safe_tbl,
                "row_count": row_count,
                "column_count": col_count,
            }
            print(f"  [+] {tbl:30s} -> {safe_tbl}.parquet ({row_count:,} rows, {col_count} cols)")

    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

    print(f"[*] Building Layer 2 analytical views in {DUCKDB_PATH.name}...")

    # Analytical View 1: v_navios_analytical
    duck_con.execute(
        """
        CREATE OR REPLACE VIEW v_navios_analytical AS
        SELECT
            try_cast(ID as BIGINT) as navio_id,
            try_cast(AÑO as INTEGER) as voyage_year,
            trim("ESPECTRO DEL NAVIO") as vessel_name,
            trim("CAPITAN / MAESTRE") as master_name,
            try_cast(MAESTRE as BIGINT) as maestre_id,
            trim("PUERTO DE SALIDA") as origin_port,
            trim("PUERTO DE LLEGADA") as destination_port,
            trim(RUTA) as route_raw,
            trim(BANDERA) as flag_raw,
            try_cast("FLOTAS CONOCIDAS" as BIGINT) as flota_id,
            trim(FLOTA) as flota_name,
            trim(INCIDENCIAS) as incidents,
            trim("MERCANCIA (VER ANEXO EN TODOS)") as goods_summary_text,
            trim("VALOR DE LA MERCANCIA") as goods_value_text,
            trim(FUENTE) as fuente_citation
        FROM raw_todosnavios;
        """
    )

    # Analytical View 2: v_mercancias_joined
    duck_con.execute(
        """
        CREATE OR REPLACE VIEW v_mercancias_joined AS
        SELECT
            try_cast(m.identificador as BIGINT) as mercancia_row_id,
            try_cast(m."NAVIO MERCANTE" as BIGINT) as navio_id,
            try_cast(m.MERCANCIA as BIGINT) as commodity_ref_key,
            trim(tm.tipoMercancia) as recorded_commodity_label,
            try_cast(m.CANTIDAD as BIGINT) as raw_quantity,
            CASE WHEN try_cast(m.CANTIDAD as BIGINT) > 0 THEN try_cast(m.CANTIDAD as BIGINT) ELSE NULL END as parsed_quantity,
            try_cast(m.MEDIDAS as BIGINT) as measure_ref_key,
            trim(tmed.tipoMedida) as recorded_measure_label,
            try_cast(m.VALOR as BIGINT) as raw_valor,
            trim(m.MONEDA) as raw_moneda,
            trim(m.CONSIGNATARIO) as recorded_consignee,
            trim(m.NOTAS) as raw_notas,
            n.voyage_year,
            n.vessel_name,
            n.master_name,
            n.origin_port,
            n.destination_port,
            n.fuente_citation as vessel_fuente_citation
        FROM raw_mercancias m
        LEFT JOIN raw_tipomercancia tm ON try_cast(m.MERCANCIA as BIGINT) = try_cast(tm.idTipoMercancia as BIGINT)
        LEFT JOIN raw_tipomedida tmed ON try_cast(m.MEDIDAS as BIGINT) = try_cast(tmed.IdTipoMedida as BIGINT)
        LEFT JOIN v_navios_analytical n ON try_cast(m."NAVIO MERCANTE" as BIGINT) = n.navio_id;
        """
    )

    duck_con.close()

    # Generate deterministic, public-safe manifest (NO build timestamps, NO absolute paths)
    manifest = {
        "source_dataset": "crespo_dyncoopnet",
        "source_mdb_sha256": mdb_sha,
        "source_acquisition_file": "CrespoDynCoopNetDATASETS.mdb",
        "generator_version": "1.0.0",
        "mdbtools_version": mdb_version,
        "total_tables": len(manifest_tables),
        "total_rows": total_rows,
        "tables": manifest_tables,
        "known_caveats": [
            "MDB raw strings preserve source whitespace and Jet4 encodings.",
            "TIPOMEDIDA IDs start at 1; MEDIDAS=0 represents unrecorded unit in source database.",
            "CANTIDAD=0 represents unrecorded or unitemized quantity in source database.",
            "Dates with day 0 (e.g. 01/00/00) represent year/month-only precision in Access.",
            "TODOSNAVIOS summary text differs from itemized MERCANCIAS consignment sums by ~6.7% for vessel 5890.",
            "Dutch container measure 'vat' in TODOSNAVIOS summary for vessel 4493 is recorded as ID 95 'Vara' in TIPOMEDIDA.",
            "Layer 1 Parquet files preserve raw string/null representations; typed parsing is performed strictly in Layer 2 views."
        ]
    }

    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"[SUCCESS] Analytical mirror built: {total_rows:,} rows across {len(manifest_tables)} tables.")
    print(f"[SUCCESS] Deterministic manifest written: {MANIFEST_PATH.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
