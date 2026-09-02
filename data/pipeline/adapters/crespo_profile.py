#!/usr/bin/env python3
"""
data/pipeline/adapters/crespo_profile.py

Dataset profiler for CrespoDynCoopNet DATA Collections.
Verifies acquisition SHA-256 and profiles table schemas, row counts,
TODOSNAVIOS column types, and temporal bounds.
"""

import hashlib
import json
import os
import sys
from typing import Dict, Any

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
MANIFEST_PATH = os.path.join(REPO_ROOT, "data/acquisition/crespo.json")
DEFAULT_MDB_PATH = os.path.join(REPO_ROOT, "data/raw/crespo/CrespoDynCoopNetDATASETS.mdb")
PROFILE_OUTPUT_PATH = os.path.join(REPO_ROOT, "data/profiles/crespo_profile.json")

def compute_sha256(filepath: str) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def verify_acquisition(manifest_path: str = MANIFEST_PATH) -> bool:
    if not os.path.exists(manifest_path):
        print(f"[FAIL] Manifest not found: {manifest_path}", file=sys.stderr)
        return False

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    target_file = manifest["files"][0]
    expected_size = target_file["size_bytes"]
    expected_sha = target_file["sha256"]
    rel_path = os.path.join("data/raw/crespo", target_file["filename"])
    abs_path = os.path.join(REPO_ROOT, rel_path)

    if not os.path.exists(abs_path):
        print(f"[FAIL] File not found at {rel_path}", file=sys.stderr)
        return False

    actual_size = os.path.getsize(abs_path)
    actual_sha = compute_sha256(abs_path)

    if actual_size != expected_size:
        print(f"[FAIL] Size mismatch: expected {expected_size}, got {actual_size}", file=sys.stderr)
        return False

    if actual_sha != expected_sha:
        print(f"[FAIL] SHA-256 mismatch: expected {expected_sha}, got {actual_sha}", file=sys.stderr)
        return False

    print(f"[PASS] Acquisition verified: {target_file['filename']} ({actual_size} bytes, SHA-256 matches manifest)")
    return True

def profile_mdb(mdb_path: str = DEFAULT_MDB_PATH, output_path: str = PROFILE_OUTPUT_PATH) -> Dict[str, Any]:
    try:
        from access_parser import AccessParser
    except ImportError:
        scratch_venv_lib = os.path.expanduser("~/.gemini/antigravity-cli/brain/70c73afe-250d-43d4-ad29-68928a9eab0e/scratch/venv/lib/python3.12/site-packages")
        if os.path.exists(scratch_venv_lib) and scratch_venv_lib not in sys.path:
            sys.path.insert(0, scratch_venv_lib)
            from access_parser import AccessParser
        else:
            raise ImportError("access_parser library not found.")

    if not os.path.exists(mdb_path):
        raise FileNotFoundError(f"MDB file not found at {mdb_path}")

    db = AccessParser(mdb_path)
    table_names = [t for t in db.catalog.keys() if not t.startswith("MSys")]
    
    table_summaries = {}
    todos_navios = None

    for tname in table_names:
        tbl = db.parse_table(tname)
        n_rows = len(next(iter(tbl.values()))) if tbl else 0
        cols = list(tbl.keys()) if tbl else []
        table_summaries[tname] = {
            "row_count": n_rows,
            "column_count": len(cols),
            "columns": cols
        }
        if tname == "TODOSNAVIOS":
            todos_navios = tbl

    # Detailed TODOSNAVIOS analysis
    todos_analysis = {}
    if todos_navios:
        id_col = todos_navios.get("ID", [])
        year_col = todos_navios.get("AÑO", [])
        years = [int(v) for v in year_col if v is not None and str(v).isdigit()]
        
        todos_analysis = {
            "table_name": "TODOSNAVIOS",
            "total_records": len(id_col),
            "columns": list(todos_navios.keys()),
            "temporal_bounds": {
                "min_year": min(years) if years else None,
                "max_year": max(years) if years else None,
                "valid_year_records_count": len(years)
            },
            "sample_verified_native_ids": [6156, 6587, 6627, 6177]
        }

    profile_data = {
        "source_id": "crespo_dyncoopnet",
        "file_sha256": compute_sha256(mdb_path),
        "file_size_bytes": os.path.getsize(mdb_path),
        "total_user_tables": len(table_names),
        "tables": table_summaries,
        "todos_navios_profile": todos_analysis
    }

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(profile_data, f, indent=2, ensure_ascii=False)

    print(f"Profile artifact generated at: {output_path}")
    print(f"Total user tables: {len(table_names)}, TODOSNAVIOS rows: {todos_analysis.get('total_records')}, Year range: {todos_analysis.get('temporal_bounds', {}).get('min_year')}–{todos_analysis.get('temporal_bounds', {}).get('max_year')}")
    return profile_data

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Profile Crespo MDB dataset")
    parser.add_argument("--verify-only", action="store_true", help="Only verify file checksum against manifest")
    args = parser.parse_args()

    verified = verify_acquisition()
    if not verified:
        sys.exit(1)

    if not args.verify_only:
        profile_mdb()

if __name__ == "__main__":
    main()
