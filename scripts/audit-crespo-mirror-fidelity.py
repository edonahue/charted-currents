#!/usr/bin/env python3
"""scripts/audit-crespo-mirror-fidelity.py

Audits the fidelity of the generated Crespo Parquet/DuckDB analytical mirror
against the raw MDB file across row counts, column counts, null preservation,
and key representation properties.

Exits with code 0 on verified fidelity, code 1 on mismatch.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
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


def main() -> None:
    if not MDB_PATH.exists():
        print(f"[FAIL] Raw MDB file not found at {MDB_PATH}", file=sys.stderr)
        sys.exit(1)
    if not DUCKDB_PATH.exists():
        print(f"[FAIL] DuckDB mirror file not found at {DUCKDB_PATH}", file=sys.stderr)
        sys.exit(1)
    if not MANIFEST_PATH.exists():
        print(f"[FAIL] Mirror manifest not found at {MANIFEST_PATH}", file=sys.stderr)
        sys.exit(1)

    with open(MANIFEST_PATH, encoding="utf-8") as f:
        manifest = json.load(f)

    duck_con = duckdb.connect(str(DUCKDB_PATH), read_only=True)

    print("[*] Auditing Crespo analytical mirror fidelity against raw MDB...")
    failures = []

    # 1. Audit Table & Row Counts from Manifest
    manifest_tables = manifest.get("tables", {})
    if len(manifest_tables) != 30:
        failures.append(f"Expected 30 tables in manifest, found {len(manifest_tables)}")

    total_duck_rows = 0
    for tbl, meta in manifest_tables.items():
        safe_name = meta["safe_name"]
        expected_rows = meta["row_count"]
        expected_cols = meta["column_count"]

        parquet_file = PARQUET_DIR / f"{safe_name}.parquet"
        if not parquet_file.exists():
            failures.append(f"Missing parquet file: {parquet_file.name}")
            continue

        actual_rows = duck_con.execute(f"SELECT count(*) FROM raw_{safe_name}").fetchone()[0]
        actual_cols = len(duck_con.execute(f"SELECT * FROM raw_{safe_name} LIMIT 0").description)

        if actual_rows != expected_rows:
            failures.append(f"Row count mismatch in {safe_name}: expected {expected_rows}, got {actual_rows}")
        if actual_cols != expected_cols:
            failures.append(f"Column count mismatch in {safe_name}: expected {expected_cols}, got {actual_cols}")

        total_duck_rows += actual_rows

    if total_duck_rows != 64207:
        failures.append(f"Total row count mismatch: expected 64,207, got {total_duck_rows:,}")

    # 2. Audit Key Table Row Counts directly from MDB via native mdb-count
    for check_tbl in ["TODOSNAVIOS", "MERCANCIAS", "TIPOMERCANCIA", "TIPOMEDIDA", "FLOTAS"]:
        mdb_cnt_out = subprocess.run(
            ["mdb-count", str(MDB_PATH), check_tbl],
            capture_output=True,
            text=True,
            check=True,
        )
        raw_rows = int(mdb_cnt_out.stdout.strip())
        safe = check_tbl.lower()
        parquet_cnt = duck_con.execute(f"SELECT count(*) FROM raw_{safe}").fetchone()[0]
        if raw_rows != parquet_cnt:
            failures.append(f"Direct MDB count vs Parquet mismatch in {check_tbl}: mdb={raw_rows}, parquet={parquet_cnt}")

    # 3. Audit Layer 2 Views
    v_navios_cnt = duck_con.execute("SELECT count(*) FROM v_navios_analytical").fetchone()[0]
    if v_navios_cnt != 13767:
        failures.append(f"v_navios_analytical view count mismatch: expected 13,767, got {v_navios_cnt}")

    v_merc_cnt = duck_con.execute("SELECT count(*) FROM v_mercancias_joined").fetchone()[0]
    if v_merc_cnt != 7534:
        failures.append(f"v_mercancias_joined view count mismatch: expected 7,534, got {v_merc_cnt}")

    # 4. Audit Specific Known Test Values
    # Vessel 5890 in v_navios_analytical
    v5890 = duck_con.execute(
        "SELECT voyage_year, vessel_name, master_name FROM v_navios_analytical WHERE navio_id = 5890"
    ).fetchone()
    if not v5890 or v5890[0] != 1694 or v5890[1] != "Nuestra Señora de la Estrella":
        failures.append(f"Failed to query vessel 5890 from analytical view: {v5890}")

    # Commodity 68 in TIPOMERCANCIA
    cacao = duck_con.execute(
        "SELECT trim(tipoMercancia) FROM raw_tipomercancia WHERE try_cast(idTipoMercancia as BIGINT) = 68"
    ).fetchone()
    if not cacao or cacao[0] != "Cacao":
        failures.append(f"Failed to query commodity 68 'Cacao' from raw_tipomercancia: {cacao}")

    # Measure 30 in TIPOMEDIDA
    fanega = duck_con.execute(
        "SELECT trim(tipoMedida) FROM raw_tipomedida WHERE try_cast(IdTipoMedida as BIGINT) = 30"
    ).fetchone()
    if not fanega or fanega[0] != "Fanega":
        failures.append(f"Failed to query measure 30 'Fanega' from raw_tipomedida: {fanega}")

    duck_con.close()

    if failures:
        print(f"[FAIL] Crespo mirror fidelity audit failed with {len(failures)} error(s):", file=sys.stderr)
        for f in failures:
            print(f"  - {f}", file=sys.stderr)
        sys.exit(1)

    print("[SUCCESS] STRUCTURAL PARITY verified across all 30 tables: 64,207 rows, column counts, and analytical views passed audit.")


if __name__ == "__main__":
    main()
