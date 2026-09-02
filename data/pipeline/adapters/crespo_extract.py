#!/usr/bin/env python3
"""
data/pipeline/adapters/crespo_extract.py

Deterministic CLI extractor from local CrespoDynCoopNetDATASETS.mdb
to raw JSON source row fixtures for candidate generation and clean CI.
"""

import argparse
import json
import os
import sys

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
DEFAULT_MDB_PATH = os.path.join(REPO_ROOT, "data/raw/crespo/CrespoDynCoopNetDATASETS.mdb")
DEFAULT_OUTPUT_PATH = os.path.join(REPO_ROOT, "data/candidates/crespo/source_rows.json")

def extract_rows(mdb_path: str, target_ids: list[int], output_path: str):
    try:
        from access_parser import AccessParser
    except ImportError:
        # Fallback to scratch venv if available
        scratch_venv_lib = os.path.expanduser("~/.gemini/antigravity-cli/brain/70c73afe-250d-43d4-ad29-68928a9eab0e/scratch/venv/lib/python3.12/site-packages")
        if os.path.exists(scratch_venv_lib) and scratch_venv_lib not in sys.path:
            sys.path.insert(0, scratch_venv_lib)
            from access_parser import AccessParser
        else:
            raise ImportError("access_parser library not found. Please install access-parser or configure virtualenv.")

    if not os.path.exists(mdb_path):
        raise FileNotFoundError(f"MDB file not found at {mdb_path}")

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
                val = col_data[idx]
                if val is not None and str(val).strip() != "":
                    row_dict[col_name] = val
            extracted_rows.append(row_dict)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(extracted_rows, f, indent=2, ensure_ascii=False, default=str)

    print(f"Extracted {len(extracted_rows)} rows from TODOSNAVIOS to {output_path}")
    return extracted_rows

def main():
    parser = argparse.ArgumentParser(description="Extract target rows from Crespo MDB to JSON")
    parser.add_argument("--mdb", default=DEFAULT_MDB_PATH, help="Path to MDB file")
    parser.add_argument("--output", default=DEFAULT_OUTPUT_PATH, help="Output JSON path")
    parser.add_argument("--ids", default="6156,6587,6627,6177", help="Comma-separated list of target IDs")

    args = parser.parse_args()
    target_ids = [int(i.strip()) for i in args.ids.split(",") if i.strip()]
    extract_rows(args.mdb, target_ids, args.output)

if __name__ == "__main__":
    main()
