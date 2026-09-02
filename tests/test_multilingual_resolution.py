#!/usr/bin/env python3
"""
tests/test_multilingual_resolution.py

Regression and invariant test suite for multilingual name attestations,
entity resolution rules, and the Nuestra Señora de la Estrella collision case.
"""

import os
import json
import unittest
import yaml

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

class TestMultilingualResolution(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        reviewed_path = os.path.join(REPO_ROOT, "data", "reviewed_corpus.yml")
        with open(reviewed_path, "r", encoding="utf-8") as f:
            cls.corpus = yaml.safe_load(f)

        entities_path = os.path.join(REPO_ROOT, "public", "data", "entities.json")
        with open(entities_path, "r", encoding="utf-8") as f:
            cls.entities = json.load(f)

    def test_havana_multilingual_attestations(self):
        """Verify Havana preserves both English and Spanish attestations without mutation."""
        havana = next((p for p in self.corpus["places"] if p["id"] == "place_havana"), None)
        self.assertIsNotNone(havana, "place_havana must exist in corpus")
        self.assertEqual(havana["canonical_name"], "Havana", "Preferred display label must remain English 'Havana'")
        self.assertEqual(havana.get("endonym"), "La Habana", "Endonym must be 'La Habana'")

        attestations = havana.get("attestations", [])
        self.assertGreaterEqual(len(attestations), 2, "Havana must have at least 2 distinct verified source attestations")

        languages = {a["language"] for a in attestations}
        self.assertIn("en", languages, "Must preserve English attestation")
        self.assertIn("es", languages, "Must preserve Spanish attestation")

        # Verify raw strings are never mutated into artificial blends
        raw_names = {a["raw_name"] for a in attestations}
        self.assertIn("Havana", raw_names)
        self.assertIn("La Habana", raw_names)

    def test_cadiz_accent_folding(self):
        """Verify Cádiz preserves accent in display/raw and produces folded normalized search key."""
        cadiz = next((p for p in self.corpus["places"] if p["id"] == "place_cadiz"), None)
        self.assertIsNotNone(cadiz, "place_cadiz must exist in corpus")
        self.assertEqual(cadiz["canonical_name"], "Cádiz")
        self.assertEqual(cadiz.get("endonym"), "Cádiz")

        attestations = cadiz.get("attestations", [])
        keys = {a.get("normalized_search_key") for a in attestations if "normalized_search_key" in a}
        self.assertIn("cadiz", keys, "Normalized search key must fold accent for index matching")

    def test_estrella_1684_collision_invariants(self):
        """Verify Nuestra Señora de la Estrella 1684 collision case: distinct occurrences are not falsely merged."""
        # Check that occurrence 6156 exists for Havana
        occ_6156 = next((o for o in self.corpus["ship_occurrences"] if o["id"] == "occ_crespo_6156"), None)
        self.assertIsNotNone(occ_6156, "occ_crespo_6156 must be published")
        self.assertEqual(occ_6156["recorded_voyage_destination"], "La Habana")
        self.assertEqual(occ_6156["raw_tonnage"], "278")
        self.assertEqual(occ_6156["recorded_master"], "Juan Bernardo de Heredia")

        # Check resolution edge to canonical vessel
        edge_6156 = next((e for e in self.corpus["entity_resolution_edges"] if e["occurrence_id"] == "occ_crespo_6156"), None)
        self.assertIsNotNone(edge_6156, "Resolution edge for occ_crespo_6156 must exist")
        self.assertEqual(edge_6156["target_entity_id"], "ship_nuestra_senora_de_la_estrella_1684")

    def test_devotional_tokens_and_pares_catalogue_variant(self):
        """Verify full devotional names are preserved in canonical vessel and PARES variant is attested."""
        guadalupe = next((s for s in self.corpus["ships"] if s["id"] == "ship_jesus_nazareno_guadalupe_1706"), None)
        self.assertIsNotNone(guadalupe)
        # Check that 'Jesús, Nazareno y Nuestra Señora de Guadalupe' contains all devotional elements
        self.assertIn("Jesús", guadalupe["canonical_name"])
        self.assertIn("Nuestra Señora", guadalupe["canonical_name"])
        self.assertIn("Guadalupe", guadalupe["canonical_name"])

        # Check that PARES catalogue variant is attested
        attestations = guadalupe.get("attestations", [])
        pares_att = next((a for a in attestations if a.get("source_record_id") == "sr_pares_contratacion_1266_n5"), None)
        self.assertIsNotNone(pares_att, "Must preserve PARES catalogue variant attestation")
        self.assertEqual(pares_att["raw_name"], "Jesús Nazareno")
        self.assertEqual(pares_att["evidence_layer"], "archival_catalogue_metadata")

    def test_evidence_layer_validity(self):
        """Verify every attestation has a valid evidence_layer classification."""
        valid_layers = {
            "historical_document_text",
            "archival_catalogue_metadata",
            "scholarly_dataset_value",
            "historical_map_label",
            "modern_authority_label",
            "project_editorial_label"
        }
        for p in self.corpus.get("places", []):
            for a in p.get("attestations", []):
                layer = a.get("evidence_layer")
                self.assertIn(layer, valid_layers, f"Place {p['id']} attestation has invalid layer {layer}")

        for occ in self.corpus.get("ship_occurrences", []):
            for a in occ.get("attestations", []):
                layer = a.get("evidence_layer")
                self.assertIn(layer, valid_layers, f"Occurrence {occ['id']} attestation has invalid layer {layer}")

        for ship in self.corpus.get("ships", []):
            for a in ship.get("attestations", []):
                layer = a.get("evidence_layer")
                self.assertIn(layer, valid_layers, f"Ship {ship['id']} attestation has invalid layer {layer}")

if __name__ == "__main__":
    unittest.main()
