#!/usr/bin/env python3
"""
Reproducible profiler for CrespoDynCoopNet dataset.
Validates local raw binary snapshot against committed manifest (data/acquisition/crespo.json)
and reports schema summary.
"""
import hashlib
import json
import os
import sys

MANIFEST_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "acquisition", "crespo.json")
RAW_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "raw", "crespo")

def profile():
    if not os.path.exists(MANIFEST_PATH):
        print(f"[ERROR] Manifest not found: {MANIFEST_PATH}", file=sys.stderr)
        return 1

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    print("==========================================")
    print("CRESPODYNCOOPNET DATASET PROFILER")
    print("==========================================")
    print(f"Source ID:     {manifest.get('source_id')}")
    print(f"Title:         {manifest.get('source_title')}")
    print(f"Catalog URL:   {manifest.get('official_catalog_url')}")
    print(f"License:       {manifest.get('license')}")
    print(f"Retrieval:     {manifest.get('retrieval_date')}")
    print("------------------------------------------")

    files = manifest.get("files", [])
    all_ok = True
    for file_info in files:
        fname = file_info["filename"]
        expected_size = file_info["size_bytes"]
        expected_sha = file_info["sha256"]
        local_path = os.path.join(RAW_DIR, fname)

        if not os.path.exists(local_path):
            print(f"[WARN] Local raw file not present: {local_path}")
            print(f"       (Download from {manifest.get('download_url')} to run deep binary profile)")
            all_ok = False
            continue

        actual_size = os.path.getsize(local_path)
        hasher = hashlib.sha256()
        with open(local_path, "rb") as bf:
            while chunk := bf.read(65536):
                hasher.update(chunk)
        actual_sha = hasher.hexdigest()

        size_match = actual_size == expected_size
        sha_match = actual_sha == expected_sha

        print(f"File:          {fname}")
        print(f"Size:          {actual_size} bytes ({'MATCH' if size_match else 'MISMATCH'})")
        print(f"SHA-256:       {actual_sha[:16]}... ({'MATCH' if sha_match else 'MISMATCH'})")

        if size_match and sha_match:
            print("[PASS] Checksum and size verified against committed manifest.")
        else:
            print("[FAIL] Checksum/size verification failed.")
            all_ok = False

    print("==========================================")
    return 0 if all_ok else 1

if __name__ == "__main__":
    sys.exit(profile())
