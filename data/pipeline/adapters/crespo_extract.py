#!/usr/bin/env python3
"""
data/pipeline/adapters/crespo_extract.py

Deterministic CLI extractor from local CrespoDynCoopNetDATASETS.mdb
to raw JSON source row fixtures for candidate generation and clean CI.
"""

import argparse
import json
import os
import re
import sys
from typing import List, Dict, Any

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
DEFAULT_MDB_PATH = os.path.join(REPO_ROOT, "data/raw/crespo/CrespoDynCoopNetDATASETS.mdb")
DEFAULT_OUTPUT_PATH = os.path.join(REPO_ROOT, "data/candidates/crespo/source_rows.json")
DEFAULT_FLOTAS_OUTPUT_PATH = os.path.join(REPO_ROOT, "data/candidates/crespo/flotas_rows.json")
DEFAULT_SELECTION_PATH = os.path.join(REPO_ROOT, "data/review/crespo/extraction_selection.json")

def sanitize_value(val: Any) -> Any:
    """Sanitize parser-specific sentinels like '(Invalid Date)' to None."""
    if val is None:
        return None
    str_val = str(val).strip()
    if str_val == "" or str_val == "(Invalid Date)":
        return None
    return val

def extract_rows(mdb_path: str, target_ids: List[int], target_flota_ids: List[int], output_path: str, flotas_output_path: str = DEFAULT_FLOTAS_OUTPUT_PATH):
    project_venv_lib = os.path.join(REPO_ROOT, ".venv", "lib", f"python{sys.version_info.major}.{sys.version_info.minor}", "site-packages")
    if os.path.exists(project_venv_lib) and project_venv_lib not in sys.path:
        sys.path.insert(0, project_venv_lib)

    try:
        from access_parser import AccessParser
    except ImportError:
        print(
            "[ERROR] 'access-parser' is required for Crespo MDB extraction.\n"
            "Install project ETL dependencies with: pip install -e . or pip install access-parser",
            file=sys.stderr
        )
        sys.exit(1)

    if not os.path.exists(mdb_path):
        print(
            f"[ERROR] Raw MDB file not found at {mdb_path}.\n"
            "Place CrespoDynCoopNetDATASETS.mdb in data/raw/crespo/ or run npm run data:verify-crespo-acquisition.",
            file=sys.stderr
        )
        sys.exit(1)

    db = AccessParser(mdb_path)
    todos_navios = db.parse_table("TODOSNAVIOS")
    if not todos_navios:
        raise ValueError("TODOSNAVIOS table is empty or could not be parsed.")

    id_col = todos_navios.get("ID")
    if not id_col:
        raise ValueError("ID column not found in TODOSNAVIOS table.")

    extracted_rows = []
    target_set = set(target_ids)

    for idx, row_id in enumerate(id_col):
        if row_id in target_set or (isinstance(row_id, str) and int(row_id) in target_set):
            row_dict = {}
            for col_name, col_data in todos_navios.items():
                val = sanitize_value(col_data[idx])
                if val is not None:
                    row_dict[col_name] = val
            extracted_rows.append(row_dict)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(extracted_rows, f, indent=2, ensure_ascii=False, default=str)
        f.write("\n")

    print(f"Extracted {len(extracted_rows)} rows from TODOSNAVIOS to {output_path}")

    # Extract FLOTAS rows
    flotas = db.parse_table("FLOTAS")
    if flotas:
        flotas_ids = flotas.get("ID", [])
        target_flotas = set(target_flota_ids)
        extracted_flotas = []
        for idx, f_id in enumerate(flotas_ids):
            if f_id in target_flotas or (isinstance(f_id, str) and int(f_id) in target_flotas):
                f_row = {}
                for col_name, col_data in flotas.items():
                    val = sanitize_value(col_data[idx])
                    if val is not None:
                        f_row[col_name] = val
                
                # Derive parsed commander and project-derived vessel count
                flota_str = f_row.get("FLOTA", "")
                commander_match = re.search(r"\((.*?)\)", flota_str)
                commander_name = commander_match.group(1).strip() if commander_match else None
                f_row["_derived_commander_name"] = commander_name
                
                # Count matching TODOSNAVIOS rows in dataset
                flota_col = todos_navios.get("FLOTAS CONOCIDAS", [])
                linked_count = sum(1 for fl in flota_col if fl == f_id or (isinstance(fl, str) and str(fl).isdigit() and int(fl) == int(f_id)))
                f_row["_project_derived_linked_navio_row_count"] = linked_count
                f_row["_project_derived_vessel_count"] = linked_count

                extracted_flotas.append(f_row)

        os.makedirs(os.path.dirname(flotas_output_path), exist_ok=True)
        with open(flotas_output_path, "w", encoding="utf-8") as f:
            json.dump(extracted_flotas, f, indent=2, ensure_ascii=False, default=str)
            f.write("\n")
        print(f"Extracted {len(extracted_flotas)} rows from FLOTAS to {flotas_output_path}")

    return extracted_rows

def main():
    parser = argparse.ArgumentParser(description="Extract target rows from Crespo MDB to JSON")
    parser.add_argument("--mdb", default=DEFAULT_MDB_PATH, help="Path to MDB file")
    parser.add_argument("--selection", default=DEFAULT_SELECTION_PATH, help="Path to reviewed extraction selection JSON")
    parser.add_argument("--output", default=DEFAULT_OUTPUT_PATH, help="Output JSON path")
    parser.add_argument("--flotas-output", default=DEFAULT_FLOTAS_OUTPUT_PATH, help="Output FLOTAS JSON path")
    parser.add_argument("--ids", default=None, help="Optional comma-separated list of target navio IDs (overrides selection file)")
    parser.add_argument("--flota-ids", default=None, help="Optional comma-separated list of target flota IDs (overrides selection file)")

    args = parser.parse_args()

    navio_ids = []
    flota_ids = []

    if args.selection and os.path.exists(args.selection):
        with open(args.selection, "r", encoding="utf-8") as f:
            sel = json.load(f)
            navio_ids = sel.get("navio_ids", [])
            flota_ids = sel.get("flota_ids", [])

    if args.ids:
        navio_ids = [int(i.strip()) for i in args.ids.split(",") if i.strip()]
    if args.flota_ids:
        flota_ids = [int(i.strip()) for i in args.flota_ids.split(",") if i.strip()]

    if not navio_ids:
        raise ValueError("No navio IDs specified (via --selection or --ids)")

    extract_rows(args.mdb, navio_ids, flota_ids, args.output, args.flotas_output)

if __name__ == "__main__":
    main()
