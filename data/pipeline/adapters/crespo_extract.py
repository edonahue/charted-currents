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
DEFAULT_MERCANCIAS_OUTPUT_PATH = os.path.join(REPO_ROOT, "data/candidates/crespo/mercancias_rows.json")
DEFAULT_TIPOMERCANCIA_OUTPUT_PATH = os.path.join(REPO_ROOT, "data/candidates/crespo/tipomercancia_rows.json")
DEFAULT_TIPOMEDIDA_OUTPUT_PATH = os.path.join(REPO_ROOT, "data/candidates/crespo/tipomedida_rows.json")
DEFAULT_SELECTION_PATH = os.path.join(REPO_ROOT, "data/review/crespo/extraction_selection.json")

def sanitize_value(val: Any) -> Any:
    """Sanitize parser-specific sentinels like '(Invalid Date)' to None."""
    if val is None:
        return None
    str_val = str(val).strip()
    if str_val == "" or str_val == "(Invalid Date)":
        return None
    return val

def extract_rows(
    mdb_path: str,
    target_ids: List[int],
    target_flota_ids: List[int],
    commodity_navio_ids: List[int],
    output_path: str,
    flotas_output_path: str = DEFAULT_FLOTAS_OUTPUT_PATH,
    mercancias_output_path: str = DEFAULT_MERCANCIAS_OUTPUT_PATH,
    tipomercancia_output_path: str = DEFAULT_TIPOMERCANCIA_OUTPUT_PATH,
    tipomedida_output_path: str = DEFAULT_TIPOMEDIDA_OUTPUT_PATH,
):
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

                extracted_flotas.append(f_row)

        os.makedirs(os.path.dirname(flotas_output_path), exist_ok=True)
        with open(flotas_output_path, "w", encoding="utf-8") as f:
            json.dump(extracted_flotas, f, indent=2, ensure_ascii=False, default=str)
            f.write("\n")
        print(f"Extracted {len(extracted_flotas)} rows from FLOTAS to {flotas_output_path}")

    # Extract MERCANCIAS rows
    extracted_mercancias = []
    referenced_commodity_keys = set()
    referenced_measure_keys = set()

    if commodity_navio_ids:
        mercancias = db.parse_table("MERCANCIAS")
        if mercancias:
            navio_mercante_col = mercancias.get("NAVIO MERCANTE", [])
            target_comm_set = set(commodity_navio_ids)
            for idx, nm_id in enumerate(navio_mercante_col):
                if nm_id in target_comm_set or (isinstance(nm_id, str) and str(nm_id).isdigit() and int(nm_id) in target_comm_set):
                    m_row = {}
                    for col_name, col_data in mercancias.items():
                        val = sanitize_value(col_data[idx])
                        if val is not None:
                            m_row[col_name] = val
                    extracted_mercancias.append(m_row)

                    comm_key = m_row.get("MERCANCIA")
                    if comm_key is not None and str(comm_key).isdigit():
                        referenced_commodity_keys.add(int(comm_key))

                    meas_key = m_row.get("MEDIDAS")
                    if meas_key is not None and str(meas_key).isdigit() and int(meas_key) > 0:
                        referenced_measure_keys.add(int(meas_key))

            os.makedirs(os.path.dirname(mercancias_output_path), exist_ok=True)
            with open(mercancias_output_path, "w", encoding="utf-8") as f:
                json.dump(extracted_mercancias, f, indent=2, ensure_ascii=False, default=str)
                f.write("\n")
            print(f"Extracted {len(extracted_mercancias)} rows from MERCANCIAS to {mercancias_output_path}")

    # Extract referenced TIPOMERCANCIA rows
    if referenced_commodity_keys:
        tipo_merc = db.parse_table("TIPOMERCANCIA")
        if tipo_merc:
            tm_id_col = tipo_merc.get("idTipoMercancia", [])
            extracted_tm = []
            for idx, tm_id in enumerate(tm_id_col):
                if tm_id in referenced_commodity_keys or (isinstance(tm_id, str) and str(tm_id).isdigit() and int(tm_id) in referenced_commodity_keys):
                    tm_row = {}
                    for col_name, col_data in tipo_merc.items():
                        val = sanitize_value(col_data[idx])
                        if val is not None:
                            tm_row[col_name] = val
                    extracted_tm.append(tm_row)

            os.makedirs(os.path.dirname(tipomercancia_output_path), exist_ok=True)
            with open(tipomercancia_output_path, "w", encoding="utf-8") as f:
                json.dump(extracted_tm, f, indent=2, ensure_ascii=False, default=str)
                f.write("\n")
            print(f"Extracted {len(extracted_tm)} referenced rows from TIPOMERCANCIA to {tipomercancia_output_path}")

    # Extract referenced TIPOMEDIDA rows
    if referenced_measure_keys:
        tipo_med = db.parse_table("TIPOMEDIDA")
        if tipo_med:
            tmed_id_col = tipo_med.get("IdTipoMedida", [])
            extracted_tmed = []
            for idx, tmed_id in enumerate(tmed_id_col):
                if tmed_id in referenced_measure_keys or (isinstance(tmed_id, str) and str(tmed_id).isdigit() and int(tmed_id) in referenced_measure_keys):
                    tmed_row = {}
                    for col_name, col_data in tipo_med.items():
                        val = sanitize_value(col_data[idx])
                        if val is not None:
                            tmed_row[col_name] = val
                    extracted_tmed.append(tmed_row)

            os.makedirs(os.path.dirname(tipomedida_output_path), exist_ok=True)
            with open(tipomedida_output_path, "w", encoding="utf-8") as f:
                json.dump(extracted_tmed, f, indent=2, ensure_ascii=False, default=str)
                f.write("\n")
            print(f"Extracted {len(extracted_tmed)} referenced rows from TIPOMEDIDA to {tipomedida_output_path}")

    return extracted_rows

def main():
    parser = argparse.ArgumentParser(description="Extract target rows from Crespo MDB to JSON")
    parser.add_argument("--mdb", default=DEFAULT_MDB_PATH, help="Path to MDB file")
    parser.add_argument("--selection", default=DEFAULT_SELECTION_PATH, help="Path to reviewed extraction selection JSON")
    parser.add_argument("--output", default=DEFAULT_OUTPUT_PATH, help="Output JSON path")
    parser.add_argument("--flotas-output", default=DEFAULT_FLOTAS_OUTPUT_PATH, help="Output FLOTAS JSON path")
    parser.add_argument("--ids", default=None, help="Optional comma-separated list of target navio IDs")
    parser.add_argument("--flota-ids", default=None, help="Optional comma-separated list of target flota IDs")

    args = parser.parse_args()

    navio_ids = []
    flota_ids = []
    commodity_navio_ids = []

    if args.selection and os.path.exists(args.selection):
        with open(args.selection, "r", encoding="utf-8") as f:
            sel = json.load(f)
            navio_ids = sel.get("navio_ids", [])
            flota_ids = sel.get("flota_ids", [])
            commodity_navio_ids = sel.get("commodity_navio_ids", [])

    if args.ids:
        navio_ids = [int(i.strip()) for i in args.ids.split(",") if i.strip()]
    if args.flota_ids:
        flota_ids = [int(i.strip()) for i in args.flota_ids.split(",") if i.strip()]

    if not navio_ids:
        raise ValueError("No navio IDs specified (via --selection or --ids)")

    extract_rows(args.mdb, navio_ids, flota_ids, commodity_navio_ids, args.output, args.flotas_output)

if __name__ == "__main__":
    main()
