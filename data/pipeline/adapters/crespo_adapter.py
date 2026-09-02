#!/usr/bin/env python3
"""
CrespoDynCoopNet Adapter for Charted Currents.
Transforms raw Carrera de Indias register records from CrespoDynCoopNet
into normalized candidate occurrence envelopes with multilingual name attestations.
"""
import os
import json
import re
from typing import Dict, List, Any, Optional

class CrespoAdapter:
    """Extracts and normalizes Spanish Atlantic voyage/register occurrences from Crespo dataset."""

    ADAPTER_ID = "crespo_dyncoopnet"
    SOURCE_ID = "src_crespo_dyncoopnet"
    UPSTREAM_ARCHIVE_ID = "src_pares_agi"

    # Known reviewed occurrences with exact source extractions
    REVIEWED_OCCURRENCES = [
        {
            "native_id": 6156,
            "year": 1684,
            "raw_name": "Nuestra Señora de la Estrella",
            "tonnage_raw": "278",
            "origin_id": 195,
            "origin_name": "Cádiz",
            "dest_id": 498,
            "dest_name": "La Habana",
            "master_id": 10939,
            "master_name": "Juan Bernardo de Heredia",
            "fleet_id": 141,
            "fleet_name": "Galeones a Tierra Firme (Gonzalo Chacón Medina y Salazar)",
            "fuente": "A.G.I.: CONTRATACION, 1240, N.6",
            "sovereignty": "Spanish Empire",
            "canonical_vessel_id": "ship_nuestra_senora_de_la_estrella_1684",
            "reconciliation_notes": "Distinct 1684 Havana voyage register from Flota 141; distinct from Tierra Firme register occ_crespo_6177."
        },
        {
            "native_id": 6587,
            "year": 1695,
            "raw_name": "Nuestra Señora de los Remedios y las Animas",
            "tonnage_raw": "318",
            "origin_id": 195,
            "origin_name": "Cádiz",
            "dest_id": 498,
            "dest_name": "La Habana",
            "master_id": 11213,
            "master_name": "Diego Dazá",
            "fleet_id": 168,
            "fleet_name": "Flota a Nueva España (Ignacio de Barrios Leal)",
            "fuente": "A.G.I.: CONTRATACION, 1255, N.7",
            "sovereignty": "Spanish Empire",
            "canonical_vessel_id": "ship_remedios_y_animas_1695",
            "reconciliation_notes": "Unique 318-ton vessel registered for the 1695 Flota a Nueva España under master Diego Dazá."
        },
        {
            "native_id": 6627,
            "year": 1706,
            "raw_name": "Jesús, Nazareno y Nuestra Señora de Guadalupe",
            "tonnage_raw": "112",
            "origin_id": 195,
            "origin_name": "Cádiz",
            "dest_id": 498,
            "dest_name": "La Habana",
            "master_id": 11357,
            "master_name": "Bartolomé Antonio Garrote",
            "fleet_id": 4,
            "fleet_name": "Flota a Nueva España de 1706 (Diego Fernández Santillán)",
            "fuente": "A.G.I.: CONTRATACION, 1266, N.5",
            "sovereignty": "Spanish Empire",
            "canonical_vessel_id": "ship_jesus_nazareno_guadalupe_1706",
            "reconciliation_notes": "112-ton merchant registered for the 1706 Flota calling at Havana; PARES catalogue title is shortened to 'Jesús Nazareno'."
        }
    ]

    # Staged collision candidate for identity regression testing
    STAGED_COLLISION_CANDIDATE = {
        "native_id": 6177,
        "year": 1684,
        "raw_name": "Nuestra Señora de la Estrella",
        "tonnage_raw": None,
        "origin_id": 195,
        "origin_name": "Cádiz",
        "dest_id": 929,
        "dest_name": "Tierra Firme",
        "master_id": 10705,
        "master_name": "Pedro Carrillo de Albornoz",
        "fleet_id": 141,
        "fleet_name": "Galeones a Tierra Firme (Gonzalo Chacón Medina y Salazar)",
        "fuente": "A.G.I.: CONTRATACION, 1241, N. 1, R. 13",
        "sovereignty": "Spanish Empire",
        "status": "staged_unresolved_collision"
    }

    @staticmethod
    def normalize_search_key(text: str) -> str:
        """Produce reproducible normalized search key without mutating stored historical raw text."""
        if not text:
            return ""
        t = text.lower()
        # Remove punctuation
        t = re.sub(r"[^\w\s]", " ", t)
        # Collapse whitespace
        return " ".join(t.split())

    @classmethod
    def generate_candidate_envelope(cls, rec: Dict[str, Any]) -> Dict[str, Any]:
        """Convert a raw occurrence record into a source candidate envelope."""
        native_id = f"occ_crespo_{rec['native_id']}"
        raw_vessel = rec["raw_name"]
        year = rec["year"]
        
        attestations = [
            {
                "raw_name": raw_vessel,
                "evidence_layer": "scholarly_dataset_value",
                "language": "es",
                "attestation_relationship": "source_transcription",
                "source_record_id": f"sr_crespo_navio_{rec['native_id']}",
                "normalized_search_key": cls.normalize_search_key(raw_vessel)
            }
        ]

        envelope = {
            "candidate_id": native_id,
            "adapter_id": cls.ADAPTER_ID,
            "source_id": cls.SOURCE_ID,
            "source_record_id": f"sr_crespo_navio_{rec['native_id']}",
            "upstream_archive_source_id": cls.UPSTREAM_ARCHIVE_ID,
            "source_citation": rec["fuente"],
            "rights_posture": "public_domain_with_dataset_license",
            "raw_record": {
                "native_id": rec["native_id"],
                "raw_vessel_name": raw_vessel,
                "recorded_year": str(year),
                "recorded_tonnage": rec.get("tonnage_raw"),
                "master_name": rec.get("master_name"),
                "departure_place": rec.get("origin_name"),
                "arrival_place": rec.get("dest_name"),
                "fleet_convoy": rec.get("fleet_name")
            },
            "name_attestations": attestations,
            "normalized_fields": {
                "origin_place_id": "place_cadiz",
                "destination_place_id": "place_havana" if rec["dest_id"] == 498 else f"place_{rec['dest_name'].lower()}",
                "recorded_year": year,
                "reported_burden_display": f"Recorded tonnage: {rec['tonnage_raw']}" if rec.get("tonnage_raw") else "Unrecorded burden",
                "master_name": rec.get("master_name"),
                "sovereignty": rec.get("sovereignty", "Spanish Empire")
            },
            "reconciliation": {
                "canonical_vessel_id": rec.get("canonical_vessel_id"),
                "status": "reviewed_accepted" if rec.get("canonical_vessel_id") else "staged_unresolved",
                "notes": rec.get("reconciliation_notes", "")
            }
        }
        return envelope

    @classmethod
    def get_reviewed_candidates(cls) -> List[Dict[str, Any]]:
        return [cls.generate_candidate_envelope(r) for r in cls.REVIEWED_OCCURRENCES]

if __name__ == "__main__":
    candidates = CrespoAdapter.get_reviewed_candidates()
    print(json.dumps(candidates, indent=2, ensure_ascii=False))
