#!/usr/bin/env python3
"""
tests/test_crespo_adapter.py

Unit tests for CrespoAdapter extraction and normalization logic.
"""

import unittest
from data.pipeline.adapters.crespo_adapter import CrespoAdapter

class TestCrespoAdapter(unittest.TestCase):
    def test_reviewed_candidates_generation(self):
        candidates = CrespoAdapter.get_reviewed_candidates()
        self.assertEqual(len(candidates), 3, "Should generate 3 candidate envelopes")

        ids = [c["candidate_id"] for c in candidates]
        self.assertIn("occ_crespo_6156", ids)
        self.assertIn("occ_crespo_6587", ids)
        self.assertIn("occ_crespo_6627", ids)

    def test_attestation_structure(self):
        candidates = CrespoAdapter.get_reviewed_candidates()
        c6156 = next(c for c in candidates if c["candidate_id"] == "occ_crespo_6156")

        self.assertIn("name_attestations", c6156)
        att = c6156["name_attestations"][0]
        self.assertEqual(att["raw_name"], "Nuestra Señora de la Estrella")
        self.assertEqual(att["language"], "es")
        self.assertEqual(att["evidence_layer"], "scholarly_dataset_value")
        self.assertEqual(att["normalized_search_key"], "nuestra señora de la estrella")

    def test_search_key_normalization(self):
        key = CrespoAdapter.normalize_search_key("Jesús, Nazareno y Nuestra Señora de Guadalupe")
        self.assertEqual(key, "jesús nazareno y nuestra señora de guadalupe")

if __name__ == "__main__":
    unittest.main()
