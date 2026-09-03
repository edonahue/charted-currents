#!/usr/bin/env python3
"""
data/pipeline/adapters/crespo_adapter.py

Data-driven CrespoDynCoopNet Adapter for Charted Currents.
Transforms raw Carrera de Indias register records from source row dictionaries
into normalized candidate occurrence envelopes with multilingual name attestations.
Zero fallback constants; missing historical values remain null.
"""

import json
import os
import re
import sys
import unicodedata
from typing import Dict, List, Any, Optional

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
DEFAULT_SOURCE_ROWS_PATH = os.path.join(REPO_ROOT, "data/candidates/crespo/source_rows.json")
DEFAULT_FLOTAS_PATH = os.path.join(REPO_ROOT, "data/candidates/crespo/flotas_rows.json")

class CrespoAdapter:
    """Transforms raw Crespo source row dictionaries into candidate occurrence envelopes."""

    ADAPTER_ID = "crespo_dyncoopnet"
    SOURCE_ID = "src_crespo_dyncoopnet"
    UPSTREAM_ARCHIVE_ID = "src_pares_agi"

    @staticmethod
    def normalize_search_key(text: str) -> str:
        """Produce reproducible normalized search key with Unicode NFKD accent folding."""
        if not text:
            return ""
        decomposed = unicodedata.normalize("NFKD", str(text))
        stripped = "".join(c for c in decomposed if not unicodedata.combining(c))
        lowered = stripped.lower()
        cleaned = re.sub(r"[^\w\s]", " ", lowered)
        return " ".join(cleaned.split())

    @classmethod
    def load_flotas_lookup(cls, flotas_path: str = DEFAULT_FLOTAS_PATH) -> Dict[int, Dict[str, Any]]:
        """Load optional derived FLOTAS table lookup."""
        if not os.path.exists(flotas_path):
            return {}
        try:
            with open(flotas_path, "r", encoding="utf-8") as f:
                flotas = json.load(f)
            return {int(row["ID"]): row for row in flotas if "ID" in row}
        except Exception:
            return {}

    @classmethod
    def transform_source_row(cls, row: Dict[str, Any], flotas_lookup: Optional[Dict[int, Dict[str, Any]]] = None) -> Dict[str, Any]:
        """Convert a raw extracted source row dictionary into a candidate occurrence envelope."""
        native_id = row.get("ID")
        if native_id is None:
            raise ValueError("Source row missing required 'ID' field.")

        raw_vessel = row.get("ESPECTRO DEL NAVIO")
        year_str = str(row.get("AÑO", "")) if row.get("AÑO") is not None else None
        year_match = re.search(r"\d{4}", year_str) if year_str else None
        year = int(year_match.group(0)) if year_match else None

        tonnage_raw = row.get("TONELAJE")
        master_name = row.get("CAPITAN / MAESTRE")
        origin_name = row.get("PUERTO DE SALIDA")
        dest_name = row.get("PUERTO DE LLEGADA")
        fuente = row.get("FUENTE", "")
        flag = row.get("BANDERA")
        fleet_id_raw = row.get("FLOTAS CONOCIDAS")

        # Resolve fleet context if available
        fleet_context = None
        if flotas_lookup and fleet_id_raw is not None:
            try:
                fid = int(fleet_id_raw)
                if fid in flotas_lookup:
                    f_row = flotas_lookup[fid]
                    fleet_context = {
                        "native_fleet_id": fid,
                        "fleet_title": f_row.get("ID FLOTA TOTAL"),
                        "raw_compound_description": f_row.get("FLOTA"),
                        "commander_display": f_row.get("_derived_commander_name"),
                        "fleet_origin": f_row.get("ORIGEN"),
                        "fleet_destination": f_row.get("DESTINO"),
                        "year": int(f_row.get("FECHA")) if f_row.get("FECHA") and str(f_row.get("FECHA")).isdigit() else None,
                        "project_derived_linked_navio_row_count": f_row.get("_project_derived_linked_navio_row_count") or f_row.get("_project_derived_vessel_count"),
                        "project_derived_vessel_count": f_row.get("_project_derived_linked_navio_row_count") or f_row.get("_project_derived_vessel_count"),
                        "source_citation": f_row.get("FUENTE O DOCUMENTO")
                    }
            except (ValueError, TypeError):
                pass

        attestations = []
        if raw_vessel:
            attestations.append({
                "raw_name": raw_vessel,
                "evidence_layer": "scholarly_dataset_value",
                "language": "es",
                "attestation_relationship": "source_transcription",
                "source_record_id": f"sr_crespo_navio_{native_id}",
                "normalized_search_key": cls.normalize_search_key(raw_vessel)
            })

        normalized_origin = None
        if origin_name:
            n_key = cls.normalize_search_key(origin_name)
            normalized_origin = "place_cadiz" if n_key == "cadiz" else f"place_{n_key}"

        normalized_dest = None
        if dest_name:
            n_key = cls.normalize_search_key(dest_name)
            normalized_dest = "place_havana" if n_key in ["la habana", "habana", "havana"] else f"place_{n_key}"

        envelope = {
            "candidate_id": f"occ_crespo_{native_id}",
            "adapter_id": cls.ADAPTER_ID,
            "source_id": cls.SOURCE_ID,
            "source_record_id": f"sr_crespo_navio_{native_id}",
            "upstream_archive_source_id": cls.UPSTREAM_ARCHIVE_ID if fuente else None,
            "source_citation": fuente if fuente else None,
            "rights_posture": "public_domain_with_dataset_license",
            "raw_record": {
                "native_id": native_id,
                "raw_vessel_name": raw_vessel,
                "recorded_year": year_str,
                "recorded_tonnage": tonnage_raw,
                "master_name": master_name,
                "departure_place": origin_name,
                "arrival_place": dest_name,
                "fleet_convoy_id": fleet_id_raw,
                "flag": flag,
                "fuente_citation": fuente
            },
            "name_attestations": attestations,
            "fleet_convoy": fleet_context,
            "normalized_fields": {
                "origin_place_id": normalized_origin,
                "destination_place_id": normalized_dest,
                "recorded_year": year,
                "reported_burden_display": f"Recorded tonnage: {tonnage_raw}" if tonnage_raw else None,
                "recorded_master": master_name
            }
        }
        return envelope

    @classmethod
    def load_and_transform_candidates(cls, source_rows_path: str = DEFAULT_SOURCE_ROWS_PATH, flotas_path: str = DEFAULT_FLOTAS_PATH) -> List[Dict[str, Any]]:
        """Load committed derived raw source rows and transform them into candidate envelopes."""
        if not os.path.exists(source_rows_path):
            raise FileNotFoundError(f"Source rows file not found: {source_rows_path}")

        flotas_lookup = cls.load_flotas_lookup(flotas_path)

        with open(source_rows_path, "r", encoding="utf-8") as f:
            rows = json.load(f)

        return [cls.transform_source_row(r, flotas_lookup) for r in rows]

def main():
    source_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SOURCE_ROWS_PATH
    flotas_path = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_FLOTAS_PATH
    candidates = CrespoAdapter.load_and_transform_candidates(source_path, flotas_path)
    print(json.dumps(candidates, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
