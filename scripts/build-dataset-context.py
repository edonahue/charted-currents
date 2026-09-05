#!/usr/bin/env python3
"""
scripts/build-dataset-context.py

Packet 7: Deterministic Build-Time Materialization of Dataset Context
Computes whole-dataset analytical context from the local Crespo DuckDB mirror
for all 29 public canonical places across the project's temporal presets:
- 'all': 1650-1730
- '1684-1695': 1684-1695 (Early / Disaster Context)
- '1702-1712': 1702-1712 (Prize Papers Sample)

Requirements:
- Requires local Crespo DuckDB mirror (data/analytics/crespo.duckdb); fails if missing.
- Encodes input provenance fingerprints (source MDB, mapping file, generator).
- Distinguishes mapped places (which may query 0 records) from unmapped places (no numeric periods).
- Replaces same_port_return with both_endpoint_records and enforces endpoint union arithmetic.
- Strictly excludes the selected place from its own top_counterparts.

Output: public/data/dataset_context.json
"""

import hashlib
import json
import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = REPO_ROOT / "data" / "analytics" / "crespo.duckdb"
MAPPING_PATH = REPO_ROOT / "data" / "mapping" / "crespo_places.yml"
OUTPUT_PATH = REPO_ROOT / "public" / "data" / "dataset_context.json"

GENERATOR_VERSION = "1.1.0"
SOURCE_MDB_SHA256 = "4418df290114fd9131f2b5b22e99c33e1f9ac0665046ac8616e44bf8ea5fa9e5"

try:
    import duckdb
except ImportError:
    venv_python = REPO_ROOT / ".venv" / "bin" / "python"
    if venv_python.exists() and sys.executable != str(venv_python):
        os.execv(str(venv_python), [str(venv_python)] + sys.argv)
    duckdb = None

import yaml

PERIOD_PRESETS = [
    {
        "id": "all",
        "label": "All (1650–1730)",
        "start_year": 1650,
        "end_year": 1730
    },
    {
        "id": "1684-1695",
        "label": "1684–1695 (Early / Disaster Context)",
        "start_year": 1684,
        "end_year": 1695
    },
    {
        "id": "1702-1712",
        "label": "1702–1712 (Prize Papers Sample)",
        "start_year": 1702,
        "end_year": 1712
    }
]


def file_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def load_mappings():
    if not MAPPING_PATH.exists():
        raise FileNotFoundError(f"Mapping file not found: {MAPPING_PATH}")
    with open(MAPPING_PATH, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data


def compute_dataset_context():
    if not DB_PATH.exists():
        sys.stderr.write(f"Error: Crespo DuckDB mirror not found at {DB_PATH}.\nLocal build requires the analytical database mirror.\n")
        sys.exit(1)

    mapping_data = load_mappings()
    mappings = mapping_data.get("mappings", [])
    mapping_version = mapping_data.get("version", "1.0.0")
    mapping_sha = file_sha256(MAPPING_PATH)
    generator_sha = file_sha256(Path(__file__).resolve())

    con = duckdb.connect(str(DB_PATH), read_only=True)

    # Compute baseline total records (unique TODOSNAVIOS rows in 1650-1730)
    total_baseline_records = con.execute("""
        SELECT count(*) 
        FROM raw_todosnavios 
        WHERE try_cast("AÑO" as INTEGER) BETWEEN 1650 AND 1730
    """).fetchone()[0]

    # Pre-fetch lugares dictionary for fast name resolution
    lugares_rows = con.execute('SELECT "id lugar", "Lugar" FROM raw_lugares').fetchall()
    lugar_dict = {row[0]: row[1] for row in lugares_rows}

    places_output = {}

    for mapping in mappings:
        canonical_id = mapping["canonical_place_id"]
        crespo_id = mapping.get("crespo_lugar_id")
        status = mapping.get("status", "unmapped")
        source_label = mapping.get("crespo_source_label")
        precision = mapping.get("geographic_precision")

        if status == "unmapped" or not crespo_id:
            # Unmapped place lacking reviewed Crespo LUGARES resolution
            # Do NOT manufacture period objects containing numeric zeroes
            places_output[canonical_id] = {
                "canonical_place_id": canonical_id,
                "canonical_name": mapping["canonical_name"],
                "status": "unmapped",
                "crespo_lugar_id": None,
                "source_native_label": None,
                "geographic_precision": precision,
                "coverage_caveat": "No reviewed Crespo place mapping is currently established for this place. Dataset context is unavailable.",
                "periods": None
            }
            continue

        # Mapped place: query DuckDB for each preset
        periods_data = {}
        for preset in PERIOD_PRESETS:
            sy = preset["start_year"]
            ey = preset["end_year"]

            # Query unique TODOSNAVIOS rows matching either endpoint
            rows = con.execute("""
                SELECT 
                    "PUERTO DE PARTIDA", 
                    "PUERTO DE ARRIBADA"
                FROM raw_todosnavios
                WHERE try_cast("AÑO" as INTEGER) BETWEEN ? AND ?
                  AND ("PUERTO DE PARTIDA" = ? OR "PUERTO DE ARRIBADA" = ?)
            """, [sy, ey, crespo_id, crespo_id]).fetchall()

            total_records = len(rows)
            records_with_origin = sum(1 for r in rows if r[0] == crespo_id)
            records_with_destination = sum(1 for r in rows if r[1] == crespo_id)
            both_endpoint_records = sum(1 for r in rows if r[0] == crespo_id and r[1] == crespo_id)

            # Enforce endpoint union arithmetic invariant
            assert total_records == records_with_origin + records_with_destination - both_endpoint_records, (
                f"Arithmetic mismatch for {canonical_id} ({preset['id']}): "
                f"total={total_records}, origin={records_with_origin}, dest={records_with_destination}, both={both_endpoint_records}"
            )

            # Build counterparts map: strictly exclude the place itself
            counterparts_map = {}
            for dep, arr in rows:
                if dep == crespo_id and arr == crespo_id:
                    # Both endpoints list this place; there is no other counterpart in this row
                    continue
                elif dep == crespo_id:
                    cp_id = arr if (arr is not None and arr > 0) else 0
                    role = "outbound"
                else:
                    cp_id = dep if (dep is not None and dep > 0) else 0
                    role = "inbound"

                # Ensure place never becomes its own counterpart
                if cp_id == crespo_id:
                    continue

                if cp_id not in counterparts_map:
                    counterparts_map[cp_id] = {
                        "total": 0,
                        "outbound": 0,
                        "inbound": 0
                    }
                counterparts_map[cp_id]["total"] += 1
                if role == "outbound":
                    counterparts_map[cp_id]["outbound"] += 1
                elif role == "inbound":
                    counterparts_map[cp_id]["inbound"] += 1

            # Format top counterparts (up to 5)
            top_cps = []
            for cid, counts in sorted(counterparts_map.items(), key=lambda x: x[1]["total"], reverse=True)[:5]:
                if cid == 0:
                    cp_name = "Unspecified Endpoint"
                else:
                    cp_name = lugar_dict.get(cid, f"Unknown Lugar ({cid})")

                top_cps.append({
                    "crespo_lugar_id": cid if cid > 0 else None,
                    "source_label": cp_name,
                    "total_records": counts["total"],
                    "recorded_as_destination": counts["outbound"],
                    "recorded_as_origin": counts["inbound"]
                })

            periods_data[preset["id"]] = {
                "period_id": preset["id"],
                "period_label": preset["label"],
                "start_year": sy,
                "end_year": ey,
                "total_records": total_records,
                "records_with_origin": records_with_origin,
                "records_with_destination": records_with_destination,
                "both_endpoint_records": both_endpoint_records,
                "departure_records": records_with_origin,
                "arrival_records": records_with_destination,
                "top_counterparts": top_cps
            }

        # Format place-level caveat
        all_period = periods_data.get("all")
        if all_period and all_period["total_records"] == 0:
            coverage_caveat = f"No Crespo vessel records record {mapping['canonical_name']} as an endpoint in All (1650–1730)."
        else:
            coverage_caveat = "Dataset context summarizes records in the CrespoDynCoopNet scholarly dataset; counts describe source records, not complete historical traffic."

        places_output[canonical_id] = {
            "canonical_place_id": canonical_id,
            "canonical_name": mapping["canonical_name"],
            "status": "mapped",
            "crespo_lugar_id": crespo_id,
            "source_native_label": source_label,
            "geographic_precision": precision,
            "coverage_caveat": coverage_caveat,
            "periods": periods_data
        }

    output_data = {
        "metadata": {
            "version": "1.1.0",
            "source_dataset": "Crespo DynCoopNet (CSIC ODC-DbCL)",
            "source_tables": [
                "raw_todosnavios",
                "raw_lugares"
            ],
            "source_mdb_sha256": SOURCE_MDB_SHA256,
            "mapping_version": mapping_version,
            "mapping_file_sha256": mapping_sha,
            "generator_version": GENERATOR_VERSION,
            "generator_sha256": generator_sha,
            "counting_unit": "one Crespo TODOSNAVIOS row / Crespo vessel record",
            "baseline_period": "1650-1730",
            "total_records_in_baseline": total_baseline_records,
            "period_presets": [p["id"] for p in PERIOD_PRESETS],
            "derivation_class": "Class C (Relational derivation and deterministic aggregation)",
            "epistemic_disclaimer": "Dataset context summarizes records in the CrespoDynCoopNet scholarly dataset; counts describe source records, not complete historical traffic."
        },
        "places": places_output
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
        f.write("\n")

    mapped_count = sum(1 for p in places_output.values() if p["status"] == "mapped")
    unmapped_count = sum(1 for p in places_output.values() if p["status"] == "unmapped")
    print(f"Successfully generated {OUTPUT_PATH}")
    print(f"Total places: {len(places_output)} ({mapped_count} mapped, {unmapped_count} unmapped)")
    print(f"Total records in baseline (1650-1730): {total_baseline_records}")


if __name__ == "__main__":
    compute_dataset_context()
