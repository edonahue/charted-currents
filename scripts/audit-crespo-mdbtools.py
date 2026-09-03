#!/usr/bin/env python3
"""
scripts/audit-crespo-mdbtools.py

Independent cross-parser source-fidelity audit comparing native mdbtools C-parser
output directly against committed Python access-parser extracted fixtures for Crespo MDB.
"""

import csv
import json
import os
import subprocess
import sys
from typing import Dict, Any, List

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MDB_PATH = os.path.join(REPO_ROOT, "data/raw/crespo/CrespoDynCoopNetDATASETS.mdb")
NAVIO_FIXTURE = os.path.join(REPO_ROOT, "data/candidates/crespo/source_rows.json")
FLOTAS_FIXTURE = os.path.join(REPO_ROOT, "data/candidates/crespo/flotas_rows.json")
REPORT_PATH = os.path.join(REPO_ROOT, "data/review/crespo/mdbtools_source_fidelity_audit.json")

AUDIT_NAVIO_IDS = [6156, 6177, 6587, 6627, 6820, 6825, 6890, 6906]
AUDIT_FLOTA_IDS = [4, 141, 168]

NAVIO_FIELDS = [
    "ID", "AÑO", "ESPECTRO DEL NAVIO", "CAPITAN / MAESTRE", "MAESTRE",
    "FLOTAS CONOCIDAS", "PUERTO DE SALIDA", "PUERTO DE LLEGADA", "RUTA",
    "TONELAJE", "BANDERA", "FUENTE"
]

FLOTA_FIELDS = [
    "ID", "ID FLOTA TOTAL", "FLOTA", "ORIGEN", "DESTINO", "FECHA",
    "Nº DE MERCANTES", "FUENTE O DOCUMENTO", "NOTAS"
]

def export_mdb_table(table_name: str) -> List[Dict[str, str]]:
    cmd = ["mdb-export", MDB_PATH, table_name]
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
    reader = csv.DictReader(proc.stdout.splitlines())
    return list(reader)

def normalize_compare_val(val: Any) -> str:
    if val is None:
        return ""
    s = str(val).strip()
    if s == "(Invalid Date)":
        return ""
    # Treat integer floats e.g. "1684.0" as "1684" for parser representation check
    if s.endswith(".0") and s[:-2].lstrip("-").isdigit():
        return s[:-2]
    return s

def classify_field(ap_val: Any, mdb_val: Any) -> tuple[str, str]:
    norm_ap = normalize_compare_val(ap_val)
    norm_mdb = normalize_compare_val(mdb_val)

    if norm_ap == norm_mdb:
        raw_ap_s = "" if ap_val is None else str(ap_val)
        raw_mdb_s = "" if mdb_val is None else str(mdb_val)
        if raw_ap_s == raw_mdb_s:
            return "MATCH", "Exact character match"
        else:
            return "PARSER_REPRESENTATION_DIFFERENCE", f"Equivalent normalized value ('{norm_ap}'), differing raw representations ('{raw_ap_s}' vs '{raw_mdb_s}')"
    
    if norm_ap == "" and norm_mdb == "":
        return "MATCH", "Both null/empty"
    
    # Check for known Jet4 unicode decompression difference (U+2026 ellipsis '\x26\x20' where access-parser decodes low-byte 0x26 as '& ')
    if norm_ap.replace("& ", "…").replace("&", "…") == norm_mdb:
        return "PARSER_REPRESENTATION_DIFFERENCE", "Jet4 unicode decompression difference: access-parser decodes U+2026 ellipsis as '& ' (low byte 0x26); mdbtools decodes '…' (U+2026)"

    return "MISMATCH", f"Value mismatch: access-parser='{ap_val}', mdbtools='{mdb_val}'"

def run_audit():
    print("============================================================")
    print("CHARTED CURRENTS · INDEPENDENT MDBTOOLS SOURCE-FIDELITY AUDIT")
    print("============================================================")
    print(f"Source MDB: {MDB_PATH}")

    # Load access-parser fixtures
    with open(NAVIO_FIXTURE, "r", encoding="utf-8") as f:
        ap_navios = {int(r["ID"]): r for r in json.load(f)}
    
    with open(FLOTAS_FIXTURE, "r", encoding="utf-8") as f:
        ap_flotas = {int(r["ID"]): r for r in json.load(f)}

    # Export via mdbtools
    print("Exporting TODOSNAVIOS via mdb-export...")
    mdb_navios_all = export_mdb_table("TODOSNAVIOS")
    mdb_navios = {}
    for r in mdb_navios_all:
        try:
            rid = int(r["ID"])
            if rid in AUDIT_NAVIO_IDS:
                mdb_navios[rid] = r
        except (ValueError, KeyError):
            pass

    print("Exporting FLOTAS via mdb-export...")
    mdb_flotas_all = export_mdb_table("FLOTAS")
    mdb_flotas = {}
    for r in mdb_flotas_all:
        try:
            fid = int(r["ID"])
            if fid in AUDIT_FLOTA_IDS:
                mdb_flotas[fid] = r
        except (ValueError, KeyError):
            pass

    results = {
        "summary": {
            "total_fields_compared": 0,
            "match_count": 0,
            "representation_difference_count": 0,
            "mismatch_count": 0,
            "unavailable_count": 0
        },
        "todosnavios": {},
        "flotas": {}
    }

    # Audit TODOSNAVIOS
    for nid in AUDIT_NAVIO_IDS:
        row_ap = ap_navios.get(nid, {})
        row_mdb = mdb_navios.get(nid, {})
        row_report = {}
        for field in NAVIO_FIELDS:
            results["summary"]["total_fields_compared"] += 1
            if field not in row_mdb and field not in row_ap:
                status, note = "UNAVAILABLE", "Field missing from both parsers"
                results["summary"]["unavailable_count"] += 1
            else:
                val_ap = row_ap.get(field)
                val_mdb = row_mdb.get(field)
                status, note = classify_field(val_ap, val_mdb)
                if status == "MATCH":
                    results["summary"]["match_count"] += 1
                elif status == "PARSER_REPRESENTATION_DIFFERENCE":
                    results["summary"]["representation_difference_count"] += 1
                else:
                    results["summary"]["mismatch_count"] += 1
            row_report[field] = {
                "status": status,
                "access_parser_val": row_ap.get(field),
                "mdbtools_val": row_mdb.get(field),
                "note": note
            }
        results["todosnavios"][str(nid)] = row_report

    # Audit FLOTAS
    for fid in AUDIT_FLOTA_IDS:
        row_ap = ap_flotas.get(fid, {})
        row_mdb = mdb_flotas.get(fid, {})
        row_report = {}
        for field in FLOTA_FIELDS:
            results["summary"]["total_fields_compared"] += 1
            if field not in row_mdb and field not in row_ap:
                status, note = "UNAVAILABLE", "Field missing from both parsers"
                results["summary"]["unavailable_count"] += 1
            else:
                val_ap = row_ap.get(field)
                val_mdb = row_mdb.get(field)
                status, note = classify_field(val_ap, val_mdb)
                if status == "MATCH":
                    results["summary"]["match_count"] += 1
                elif status == "PARSER_REPRESENTATION_DIFFERENCE":
                    results["summary"]["representation_difference_count"] += 1
                else:
                    results["summary"]["mismatch_count"] += 1
            row_report[field] = {
                "status": status,
                "access_parser_val": row_ap.get(field),
                "mdbtools_val": row_mdb.get(field),
                "note": note
            }
        results["flotas"][str(fid)] = row_report

    # Save audit report
    os.makedirs(os.path.dirname(REPORT_PATH), exist_ok=True)
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print("\n--- AUDIT SUMMARY ---")
    print(f"Total Fields Compared:        {results['summary']['total_fields_compared']}")
    print(f"MATCH:                        {results['summary']['match_count']}")
    print(f"REPRESENTATION DIFFERENCE:    {results['summary']['representation_difference_count']}")
    print(f"MISMATCH:                     {results['summary']['mismatch_count']}")
    print(f"UNAVAILABLE:                  {results['summary']['unavailable_count']}")
    print(f"Audit Report Artifact:        {REPORT_PATH}")
    print("============================================================\n")

    if results["summary"]["mismatch_count"] > 0:
        print("[FAIL] Substantive mismatches discovered between mdbtools and access-parser!", file=sys.stderr)
        sys.exit(1)
    else:
        print("[PASS] Independent cross-parser source-fidelity QA verified: ZERO substantive mismatches.")

if __name__ == "__main__":
    run_audit()
