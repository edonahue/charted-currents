#!/usr/bin/env python3
"""
scripts/build-dataset-context.py

Packet 7: Deterministic Build-Time Materialization of Dataset Context
Computes whole-dataset analytical context from the local Crespo DuckDB mirror
for all 29 public canonical places across the project's temporal presets:
- 'all': 1650-1730
- '1684-1695': 1684-1695 (Early / Disaster Context)
- '1702-1712': 1702-1712 (Prize Papers Sample)

Output: public/data/dataset_context.json
"""

import json
import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = REPO_ROOT / "data" / "analytics" / "crespo.duckdb"
MAPPING_PATH = REPO_ROOT / "data" / "mapping" / "crespo_places.yml"
OUTPUT_PATH = REPO_ROOT / "public" / "data" / "dataset_context.json"

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


def load_mappings():
    if not MAPPING_PATH.exists():
        raise FileNotFoundError(f"Mapping file not found: {MAPPING_PATH}")
    with open(MAPPING_PATH, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data.get("mappings", [])


def compute_dataset_context():
    if not DB_PATH.exists():
        if OUTPUT_PATH.exists():
            print(f"Notice: {DB_PATH} not found (gitignored local analytical mirror). Preserving committed {OUTPUT_PATH}.")
            return
        raise FileNotFoundError(f"Crespo DuckDB mirror not found at {DB_PATH} and no committed output at {OUTPUT_PATH}")

    mappings = load_mappings()
    con = duckdb.connect(str(DB_PATH), read_only=True)

    # Compute baseline total records
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
        status = mapping.get("status", "unrecorded")
        source_label = mapping.get("crespo_source_label")
        precision = mapping.get("geographic_precision")

        if status == "unrecorded" or not crespo_id:
            # Unrecorded place in Crespo sample
            periods_data = {}
            for preset in PERIOD_PRESETS:
                periods_data[preset["id"]] = {
                    "period_id": preset["id"],
                    "period_label": preset["label"],
                    "start_year": preset["start_year"],
                    "end_year": preset["end_year"],
                    "total_records": 0,
                    "departure_records": 0,
                    "arrival_records": 0,
                    "top_counterparts": []
                }

            places_output[canonical_id] = {
                "canonical_place_id": canonical_id,
                "canonical_name": mapping["canonical_name"],
                "status": "unrecorded",
                "crespo_lugar_id": None,
                "source_native_label": None,
                "geographic_precision": precision,
                "coverage_caveat": "No matching Crespo vessel records in this scoped dataset.",
                "periods": periods_data
            }
            continue

        # Mapped place
        periods_data = {}
        for preset in PERIOD_PRESETS:
            sy = preset["start_year"]
            ey = preset["end_year"]

            # Query all matching records for this place in this period
            rows = con.execute("""
                SELECT 
                    "PUERTO DE PARTIDA", 
                    "PUERTO DE ARRIBADA"
                FROM raw_todosnavios
                WHERE try_cast("AÑO" as INTEGER) BETWEEN ? AND ?
                  AND ("PUERTO DE PARTIDA" = ? OR "PUERTO DE ARRIBADA" = ?)
            """, [sy, ey, crespo_id, crespo_id]).fetchall()

            total_records = len(rows)
            dep_records = sum(1 for r in rows if r[0] == crespo_id)
            arr_records = sum(1 for r in rows if r[1] == crespo_id)

            # Build counterparts map
            counterparts_map = {}
            for dep, arr in rows:
                if dep == crespo_id and arr == crespo_id:
                    cp_id = crespo_id
                    role = "same_port"
                elif dep == crespo_id:
                    cp_id = arr if (arr is not None and arr > 0) else 0
                    role = "outbound"
                else:
                    cp_id = dep if (dep is not None and dep > 0) else 0
                    role = "inbound"

                if cp_id not in counterparts_map:
                    counterparts_map[cp_id] = {
                        "total": 0,
                        "outbound": 0,
                        "inbound": 0,
                        "same_port": 0
                    }
                counterparts_map[cp_id]["total"] += 1
                if role == "outbound":
                    counterparts_map[cp_id]["outbound"] += 1
                elif role == "inbound":
                    counterparts_map[cp_id]["inbound"] += 1
                else:
                    counterparts_map[cp_id]["same_port"] += 1

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
                    "recorded_as_origin": counts["inbound"],
                    "same_port_return": counts["same_port"]
                })

            periods_data[preset["id"]] = {
                "period_id": preset["id"],
                "period_label": preset["label"],
                "start_year": sy,
                "end_year": ey,
                "total_records": total_records,
                "departure_records": dep_records,
                "arrival_records": arr_records,
                "top_counterparts": top_cps
            }

        places_output[canonical_id] = {
            "canonical_place_id": canonical_id,
            "canonical_name": mapping["canonical_name"],
            "status": "mapped",
            "crespo_lugar_id": crespo_id,
            "source_native_label": source_label,
            "geographic_precision": precision,
            "coverage_caveat": "Dataset context summarizes records in CrespoDynCoopNet; counts describe source records, not complete historical traffic.",
            "periods": periods_data
        }

    con.close()

    payload = {
        "metadata": {
            "version": "1.0.0",
            "source_dataset": "Crespo DynCoopNet (CSIC ODC-DbCL)",
            "source_tables": ["raw_todosnavios", "raw_lugares"],
            "counting_unit": "one Crespo TODOSNAVIOS row / Crespo vessel record",
            "baseline_period": "1650-1730",
            "total_records_in_baseline": total_baseline_records,
            "period_presets": [p["id"] for p in PERIOD_PRESETS],
            "derivation_class": "Class C (Relational derivation and deterministic aggregation)",
            "epistemic_disclaimer": "Dataset context summarizes records in CrespoDynCoopNet; counts describe source records, not complete historical traffic."
        },
        "places": places_output
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    print(f"Successfully generated {OUTPUT_PATH}")
    print(f"Total mapped/unrecorded places: {len(places_output)}")
    print(f"Total records in baseline (1650-1730): {total_baseline_records}")


if __name__ == "__main__":
    compute_dataset_context()
