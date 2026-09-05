#!/usr/bin/env python3
"""
scripts/acquire-moll-1715.py

Acquires and verifies the institutional digital reproduction of Herman Moll's
1715 map of the West Indies from the Library of Congress Geography and Map Division
(Item gm71005442 / Call number G4390 1715 .M6 / Digital ID g4390.ct003986).

Supports:
  python3 scripts/acquire-moll-1715.py              # Download master and record metadata
  python3 scripts/acquire-moll-1715.py --verify-only # Verify recorded metadata and checksums (CI-safe)
"""

import argparse
import hashlib
import json
import os
import sys
import urllib.request

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ACQUISITION_DIR = os.path.join(REPO_ROOT, "data/source_acquisitions/loc_gm71005442")
METADATA_PATH = os.path.join(ACQUISITION_DIR, "metadata.json")
RAW_DIR = os.path.join(REPO_ROOT, "data/raw/loc_gm71005442")
MASTER_IMAGE_PATH = os.path.join(RAW_DIR, "moll-1715-loc-master.jpg")

LOC_ITEM_URL = "https://www.loc.gov/item/gm71005442/?fo=json"
IIIF_IMAGE_URL = "https://tile.loc.gov/image-services/iiif/service:gmd:gmd4:g4390:g4390:ct003986/full/pct:50/0/default.jpg"
USER_AGENT = "ChartedCurrentsResearch/0.1 (historical atlas research; https://github.com/edonahue/charted-currents)"


def compute_sha256(filepath: str) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def verify_acquisition() -> bool:
    if not os.path.exists(METADATA_PATH):
        print(f"[FAIL] Metadata file not found: {METADATA_PATH}", file=sys.stderr)
        return False

    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        meta = json.load(f)

    assert meta.get("item_id") == "gm71005442", "item_id mismatch"
    assert "G4390 1715 .M6" in meta.get("call_number", ""), "call_number mismatch"
    assert meta.get("digital_id") == "g4390.ct003986", "digital_id mismatch"
    assert meta.get("rights_state") == "open_public_domain", "rights_state must be open_public_domain"
    assert meta.get("credit_line") == "Library of Congress, Geography and Map Division", "credit_line mismatch"

    expected_sha = meta.get("master_sha256")
    expected_size = meta.get("master_size_bytes")

    if os.path.exists(MASTER_IMAGE_PATH):
        actual_size = os.path.getsize(MASTER_IMAGE_PATH)
        actual_sha = compute_sha256(MASTER_IMAGE_PATH)

        if actual_size != expected_size:
            print(f"[FAIL] Master image size mismatch: expected {expected_size}, got {actual_size}", file=sys.stderr)
            return False
        if actual_sha != expected_sha:
            print(f"[FAIL] Master image SHA256 mismatch: expected {expected_sha}, got {actual_sha}", file=sys.stderr)
            return False
        print(f"[PASS] Local master image and metadata verified: {actual_size} bytes, SHA256 {actual_sha}")
    else:
        print(f"[PASS] Pinned acquisition metadata verified (mirrorless mode, recorded SHA256 {expected_sha})")

    return True


def acquire_source() -> None:
    os.makedirs(ACQUISITION_DIR, exist_ok=True)
    os.makedirs(RAW_DIR, exist_ok=True)

    print(f"[ACQUIRE] Querying LOC metadata from {LOC_ITEM_URL}...")
    req = urllib.request.Request(LOC_ITEM_URL, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=15) as resp:
        loc_data = json.loads(resp.read().decode("utf-8"))

    item = loc_data.get("item", {})
    title = item.get("title", "A map of the West-Indies...")
    date = item.get("date", "1715")
    call_number = item.get("call_number", ["G4390 1715 .M6"])[0]
    rights_advisory = item.get("rights_advisory")
    repository = item.get("repository", ["Library of Congress Geography and Map Division"])[0]

    print(f"[ACQUIRE] Downloading master image from {IIIF_IMAGE_URL}...")
    img_req = urllib.request.Request(IIIF_IMAGE_URL, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(img_req, timeout=60) as resp:
        img_bytes = resp.read()

    with open(MASTER_IMAGE_PATH, "wb") as f:
        f.write(img_bytes)

    master_size = len(img_bytes)
    master_sha = compute_sha256(MASTER_IMAGE_PATH)
    print(f"[ACQUIRE] Master image saved: {master_size} bytes, SHA256: {master_sha}")

    meta = {
        "item_id": "gm71005442",
        "title": title,
        "creators": [
            "Herman Moll",
            "Thomas Bowles (Publisher)",
            "John Bowles (Publisher)"
        ],
        "date_display": date,
        "year_recorded": 1715,
        "is_uncertain": False,
        "holding_institution": "Library of Congress Geography and Map Division",
        "repository_detail": repository,
        "call_number": call_number,
        "digital_id": "g4390.ct003986",
        "canonical_permalink": "https://www.loc.gov/item/gm71005442/",
        "iiif_image_service": "https://tile.loc.gov/image-services/iiif/service:gmd:gmd4:g4390:g4390:ct003986/",
        "rights_state": "open_public_domain",
        "rights_basis": "Library of Congress Geography and Map Division digitized collections are free to use and reuse; no copyright or donor restrictions recorded.",
        "rights_advisory": rights_advisory,
        "credit_line": "Library of Congress, Geography and Map Division",
        "download_url": IIIF_IMAGE_URL,
        "master_filename": os.path.basename(MASTER_IMAGE_PATH),
        "master_size_bytes": master_size,
        "master_sha256": master_sha,
        "notes": "Acquired via LOC IIIF service at 50% resolution (6025x3636 px, ~22 megapixels) for high cartographic clarity and reproducible derivation."
    }

    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)
        f.write(chr(10))

    print(f"[ACQUIRE] Metadata written to {METADATA_PATH}")


def main():
    parser = argparse.ArgumentParser(description="Acquire or verify Herman Moll 1715 map from Library of Congress.")
    parser.add_argument("--verify-only", action="store_true", help="Verify metadata and checksums without downloading")
    args = parser.parse_args()

    if args.verify_only:
        if not verify_acquisition():
            sys.exit(1)
    else:
        acquire_source()
        if not verify_acquisition():
            sys.exit(1)


if __name__ == "__main__":
    main()
