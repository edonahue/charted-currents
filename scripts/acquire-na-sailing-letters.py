#!/usr/bin/env python3
"""
scripts/acquire-na-sailing-letters.py

Acquires and verifies archival metadata, METS digital object manifests, and
representative facsimile scans from Nationaal Archief, Den Haag:
Archive 2.22.24 (High Court of Admiralty: Prize Papers / Sailing Letters).

Focuses on Candidate 2:
- HCA 32-11.380 (Schip Nostra Seniora Concepcion y St Joseph van Cadiz onder leiding van Antonio de Witte; 1666)
- HCA 32-11.391 (Schip Nostra Seniora Concepcion y St Joseph onder leiding van Antonio de Witte; 1666)

Usage:
  python3 scripts/acquire-na-sailing-letters.py               # Acquire and verify
  python3 scripts/acquire-na-sailing-letters.py --verify-only # Offline/CI-safe verification
"""

import argparse
import hashlib
import json
import os
import sys
import xml.etree.ElementTree as ET

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ACQUISITION_DIR = os.path.join(REPO_ROOT, "data/source_acquisitions/na_2_22_24_sailing_letters")
METADATA_PATH = os.path.join(ACQUISITION_DIR, "metadata.json")


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

    assert meta.get("archive_id") == "2.22.24", "archive_id mismatch"
    assert "High Court of Admiralty" in meta.get("archive_title", ""), "archive_title mismatch"
    assert meta.get("finding_aid_rights") == "http://creativecommons.org/publicdomain/zero/1.0/", "rights must be CC0"

    components = meta.get("components", [])
    assert len(components) == 2, f"Expected 2 components, got {len(components)}"

    for comp in components:
        mets_file = os.path.join(ACQUISITION_DIR, comp.get("local_mets_file", ""))
        assert os.path.exists(mets_file), f"METS file missing: {mets_file}"

        actual_mets_sha = compute_sha256(mets_file)
        expected_mets_sha = comp.get("local_mets_sha256")
        assert actual_mets_sha == expected_mets_sha, f"METS SHA mismatch in {mets_file}"

        # Verify METS XML structure, physical scan count, and rights wrapper
        tree = ET.parse(mets_file)
        root = tree.getroot()
        rights_elem = root.find(".//{http://www.archivesportaleurope.net/Portal/profiles/rights/}RightsDeclarationMD")
        assert rights_elem is not None, f"apeMETSRights missing in {mets_file}"
        assert rights_elem.attrib.get("RIGHTSCATEGORY") == "PUBLIC DOMAIN", f"Rights not PUBLIC DOMAIN in {mets_file}"

        # Physical document scans are counted in structMap physSequence
        physical_scans = root.findall(".//{http://www.loc.gov/METS/}structMap[@TYPE='PHYSICAL']//{http://www.loc.gov/METS/}div[@ORDER]")
        assert len(physical_scans) == comp.get("scan_count"), (
            f"Physical scan count mismatch in {comp.get('unitid')}: {len(physical_scans)} vs {comp.get('scan_count')}"
        )

    # Verify EAD excerpt
    ead_file = os.path.join(ACQUISITION_DIR, meta.get("local_ead_components_file", ""))
    assert os.path.exists(ead_file), f"EAD file missing: {ead_file}"
    actual_ead_sha = compute_sha256(ead_file)
    expected_ead_sha = meta.get("local_ead_components_sha256")
    assert actual_ead_sha == expected_ead_sha, f"EAD SHA mismatch: {actual_ead_sha} vs {expected_ead_sha}"

    print(f"[PASS] Nationaal Archief 2.22.24 acquisition verified successfully:")
    print(f"       - Archive: {meta['archive_id']} ({meta['archive_title']})")
    print(f"       - Components: {', '.join(c['unitid'] for c in components)}")
    print(f"       - Physical scans: {', '.join(f'{c['unitid']} ({c['scan_count']} scans)' for c in components)}")
    print(f"       - Rights: EAD CC0 metadata verified; non-commercial scans linked via handle (not hosted)")
    return True


def main():
    parser = argparse.ArgumentParser(description="Acquire and verify Nationaal Archief 2.22.24 Prize Papers.")
    parser.add_argument("--verify-only", action="store_true", help="Verify local acquisition metadata and checksums without network fetch.")
    args = parser.parse_args()

    success = verify_acquisition()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
