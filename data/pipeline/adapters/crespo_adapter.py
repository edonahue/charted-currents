#!/usr/bin/env python3
"""
data/pipeline/adapters/crespo_adapter.py

Data-driven CrespoDynCoopNet Adapter for Charted Currents.
Transforms raw Carrera de Indias register records from source row dictionaries
into normalized candidate occurrence envelopes with multilingual name attestations.
"""

import json
import os
import re
import sys
import unicodedata
from typing import Dict, List, Any, Optional

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
DEFAULT_SOURCE_ROWS_PATH = os.path.join(REPO_ROOT, "data/candidates/crespo/source_rows.json")

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
        # 1. Normalize with NFKD to separate base characters from combining diacritics
        decomposed = unicodedata.normalize("NFKD", str(text))
        # 2. Strip combining marks (accents, tildes, etc.)
        stripped = "".join(c for c in decomposed if not unicodedata.combining(c))
        # 3. Lowercase
        lowered = stripped.lower()
        # 4. Replace non-alphanumeric characters with spaces
        cleaned = re.sub(r"[^\w\s]", " ", lowered)
        # 5. Collapse multiple whitespace characters into single space
        return " ".join(cleaned.split())

    @classmethod
    def transform_source_row(cls, row: Dict[str, Any]) -> Dict[str, Any]:
        """Convert a raw extracted source row dictionary into a candidate occurrence envelope."""
        native_id = row.get("ID")
        if native_id is None:
            raise ValueError("Source row missing required 'ID' field.")

        raw_vessel = row.get("ESPECTRO DEL NAVIO", "Unknown Vessel")
        year_str = str(row.get("AÑO", ""))
        year_match = re.search(r"\d{4}", year_str)
        year = int(year_match.group(0)) if year_match else None

        tonnage_raw = row.get("TONELAJE")
        master_name = row.get("CAPITAN / MAESTRE")
        origin_name = row.get("PUERTO DE SALIDA", "Cádiz")
        dest_name = row.get("PUERTO DE LLEGADA", "La Habana")
        fuente = row.get("FUENTE", "")
        flag = row.get("BANDERA", "Española")

        attestations = [
            {
                "raw_name": raw_vessel,
                "evidence_layer": "scholarly_dataset_value",
                "language": "es",
                "attestation_relationship": "source_transcription",
                "source_record_id": f"sr_crespo_navio_{native_id}",
                "normalized_search_key": cls.normalize_search_key(raw_vessel)
            }
        ]

        envelope = {
            "candidate_id": f"occ_crespo_{native_id}",
            "adapter_id": cls.ADAPTER_ID,
            "source_id": cls.SOURCE_ID,
            "source_record_id": f"sr_crespo_navio_{native_id}",
            "upstream_archive_source_id": cls.UPSTREAM_ARCHIVE_ID,
            "source_citation": fuente,
            "rights_posture": "public_domain_with_dataset_license",
            "raw_record": {
                "native_id": native_id,
                "raw_vessel_name": raw_vessel,
                "recorded_year": year_str,
                "recorded_tonnage": tonnage_raw,
                "master_name": master_name,
                "departure_place": origin_name,
                "arrival_place": dest_name,
                "fleet_convoy_id": row.get("FLOTAS CONOCIDAS"),
                "fuente_citation": fuente
            },
            "name_attestations": attestations,
            "normalized_fields": {
                "origin_place_id": "place_cadiz" if cls.normalize_search_key(origin_name) == "cadiz" else f"place_{cls.normalize_search_key(origin_name)}",
                "destination_place_id": "place_havana" if cls.normalize_search_key(dest_name) in ["la habana", "habana", "havana"] else f"place_{cls.normalize_search_key(dest_name)}",
                "recorded_year": year,
                "reported_burden_display": f"Recorded tonnage: {tonnage_raw}" if tonnage_raw else "Unrecorded burden",
                "recorded_master": master_name,
                "sovereignty": "Spanish Empire" if flag == "Española" else flag
            }
        }
        return envelope

    @classmethod
    def load_and_transform_candidates(cls, source_rows_path: str = DEFAULT_SOURCE_ROWS_PATH) -> List[Dict[str, Any]]:
        """Load committed derived raw source rows and transform them into candidate envelopes."""
        if not os.path.exists(source_rows_path):
            raise FileNotFoundError(f"Source rows file not found: {source_rows_path}")

        with open(source_rows_path, "r", encoding="utf-8") as f:
            rows = json.load(f)

        return [cls.transform_source_row(r) for r in rows]

def main():
    source_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SOURCE_ROWS_PATH
    candidates = CrespoAdapter.load_and_transform_candidates(source_path)
    print(json.dumps(candidates, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
