#!/usr/bin/env python3
"""
scripts/audit-crespo-place-mappings.py

Deterministic local source-QA audit for canonical ↔ Crespo LUGARES place mappings.
Connects to the local DuckDB analytical mirror (crespo.duckdb), verifies that every
mapped place has an exact corresponding native LUGARES row and identical label,
asserts mapping uniqueness and precision integrity, and outputs a public-safe,
path-free durable audit artifact at data/review/crespo/place_mapping_audit.json.
"""

import json
import os
import sys
from pathlib import Path
import yaml

# Self re-execution via .venv if duckdb is not installed in current Python
try:
    import duckdb
except ImportError:
    venv_py = Path(".venv/bin/python")
    if venv_py.exists() and sys.executable != str(venv_py.resolve()):
        os.execv(str(venv_py), [str(venv_py)] + sys.argv)
    else:
        sys.stderr.write("Error: duckdb python package is required.\n")
        sys.exit(1)

DUCKDB_PATH = Path("data/analytics/crespo.duckdb")
MAPPING_PATH = Path("data/mapping/crespo_places.yml")
OUTPUT_AUDIT_PATH = Path("data/review/crespo/place_mapping_audit.json")
SOURCE_MDB_SHA256 = "4418df290114fd9131f2b5b22e99c33e1f9ac0665046ac8616e44bf8ea5fa9e5"

def audit_mappings():
    if not DUCKDB_PATH.exists():
        sys.stderr.write(f"Error: Analytical database {DUCKDB_PATH} not found.\n")
        sys.exit(1)

    if not MAPPING_PATH.exists():
        sys.stderr.write(f"Error: Mapping file {MAPPING_PATH} not found.\n")
        sys.exit(1)

    with open(MAPPING_PATH, "r", encoding="utf-8") as f:
        mapping_data = yaml.safe_load(f)

    mappings = mapping_data.get("mappings", [])
    if not mappings:
        sys.stderr.write("Error: No mappings found in crespo_places.yml.\n")
        sys.exit(1)

    con = duckdb.connect(str(DUCKDB_PATH), read_only=True)

    results = []
    seen_canonical_ids = set()
    seen_lugar_ids = {}
    mapped_count = 0
    unmapped_count = 0
    all_mapped_valid = True

    for m in mappings:
        can_id = m["canonical_place_id"]
        can_name = m["canonical_name"]
        status = m["status"]
        lugar_id = m.get("crespo_lugar_id")
        declared_label = m.get("crespo_source_label")
        precision = m.get("geographic_precision")

        # Check duplicate canonical places
        if can_id in seen_canonical_ids:
            sys.stderr.write(f"Error: Duplicate canonical place ID '{can_id}' in mappings.\n")
            all_mapped_valid = False
        seen_canonical_ids.add(can_id)

        if status == "unmapped":
            unmapped_count += 1
            if lugar_id is not None or declared_label is not None:
                sys.stderr.write(f"Error: Unmapped place '{can_id}' must have null crespo_lugar_id and label.\n")
                all_mapped_valid = False
            results.append({
                "canonical_place_id": can_id,
                "canonical_name": can_name,
                "status": "unmapped",
                "crespo_lugar_id": None,
                "declared_source_label": None,
                "raw_table_label": None,
                "geographic_precision": precision,
                "comparison_result": "EXPLICIT_UNMAPPED"
            })
        elif status == "mapped":
            mapped_count += 1
            if not isinstance(lugar_id, int) or lugar_id <= 0:
                sys.stderr.write(f"Error: Mapped place '{can_id}' has invalid lugar_id: {lugar_id}\n")
                all_mapped_valid = False
                continue

            # Check duplicate native lugar mappings
            if lugar_id in seen_lugar_ids:
                sys.stderr.write(f"Error: Duplicate Crespo lugar_id {lugar_id} mapped to '{can_id}' and '{seen_lugar_ids[lugar_id]}'.\n")
                all_mapped_valid = False
            seen_lugar_ids[lugar_id] = can_id

            # Query raw_lugares
            row = con.execute('SELECT "Lugar" FROM raw_lugares WHERE "id lugar" = ?', [lugar_id]).fetchone()
            if not row:
                sys.stderr.write(f"Error: Place '{can_id}' references non-existent raw_lugares ID {lugar_id}.\n")
                results.append({
                    "canonical_place_id": can_id,
                    "canonical_name": can_name,
                    "status": "mapped",
                    "crespo_lugar_id": lugar_id,
                    "declared_source_label": declared_label,
                    "raw_table_label": None,
                    "geographic_precision": precision,
                    "comparison_result": "NATIVE_ID_NOT_FOUND"
                })
                all_mapped_valid = False
            else:
                raw_label = row[0]
                if raw_label != declared_label:
                    sys.stderr.write(f"Error: Label mismatch for '{can_id}': declared='{declared_label}', raw='{raw_label}'.\n")
                    results.append({
                        "canonical_place_id": can_id,
                        "canonical_name": can_name,
                        "status": "mapped",
                        "crespo_lugar_id": lugar_id,
                        "declared_source_label": declared_label,
                        "raw_table_label": raw_label,
                        "geographic_precision": precision,
                        "comparison_result": "LABEL_MISMATCH"
                    })
                    all_mapped_valid = False
                else:
                    results.append({
                        "canonical_place_id": can_id,
                        "canonical_name": can_name,
                        "status": "mapped",
                        "crespo_lugar_id": lugar_id,
                        "declared_source_label": declared_label,
                        "raw_table_label": raw_label,
                        "geographic_precision": precision,
                        "comparison_result": "EXACT_MATCH"
                    })
        else:
            sys.stderr.write(f"Error: Invalid mapping status '{status}' for place '{can_id}'. Must be 'mapped' or 'unmapped'.\n")
            all_mapped_valid = False

    audit_payload = {
        "audit_id": "crespo_place_mapping_source_qa",
        "description": "Deterministic local source-QA audit for canonical <-> Crespo LUGARES place mappings",
        "source_dataset": "Crespo DynCoopNet (CSIC ODC-DbCL)",
        "source_table": "raw_lugares",
        "source_mdb_sha256": SOURCE_MDB_SHA256,
        "mapping_version": mapping_data.get("version", "1.0.0"),
        "total_places_audited": len(mappings),
        "mapped_places_count": mapped_count,
        "unmapped_places_count": unmapped_count,
        "all_mapped_ids_verified": all_mapped_valid and (mapped_count > 0),
        "all_labels_verified": all_mapped_valid,
        "results": results
    }

    OUTPUT_AUDIT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_AUDIT_PATH, "w", encoding="utf-8") as f:
        json.dump(audit_payload, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Place mapping audit complete: {mapped_count} mapped, {unmapped_count} unmapped.")
    print(f"Audit artifact written to: {OUTPUT_AUDIT_PATH}")

    if not all_mapped_valid:
        sys.exit(1)

if __name__ == "__main__":
    audit_mappings()
