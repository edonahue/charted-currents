#!/usr/bin/env python3
"""
tests/test_dataset_context.py

Packet 7: Analytical and Historical Unit Tests for Dataset Context
Verifies explicit canonical mapping, deterministic aggregation, sentinel numbers,
and language safeguards.
"""

import json
import unittest
from pathlib import Path
import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent
MAPPING_PATH = REPO_ROOT / "data" / "mapping" / "crespo_places.yml"
CONTEXT_PATH = REPO_ROOT / "public" / "data" / "dataset_context.json"
CORPUS_PATH = REPO_ROOT / "data" / "reviewed_corpus.yml"


class TestDatasetContext(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(CORPUS_PATH, "r", encoding="utf-8") as f:
            cls.corpus = yaml.safe_load(f)
        cls.canonical_place_ids = {p["id"] for p in cls.corpus.get("places", [])}

        with open(MAPPING_PATH, "r", encoding="utf-8") as f:
            cls.mapping_data = yaml.safe_load(f)
        cls.mappings = cls.mapping_data.get("mappings", [])

        with open(CONTEXT_PATH, "r", encoding="utf-8") as f:
            cls.context = json.load(f)

    def test_canonical_mapping_completeness(self):
        """Every canonical place must have an explicit reviewed mapping entry."""
        mapped_ids = {m["canonical_place_id"] for m in self.mappings}
        self.assertEqual(mapped_ids, self.canonical_place_ids)
        self.assertEqual(len(self.mappings), 29)

    def test_counting_unit_and_baseline_metadata(self):
        """Metadata must strictly preserve the locked counting unit and baseline scope."""
        meta = self.context.get("metadata", {})
        self.assertEqual(meta.get("counting_unit"), "one Crespo TODOSNAVIOS row / Crespo vessel record")
        self.assertEqual(meta.get("baseline_period"), "1650-1730")
        self.assertEqual(meta.get("total_records_in_baseline"), 1928)
        self.assertEqual(meta.get("period_presets"), ["all", "1684-1695", "1702-1712"])

    def test_havana_sentinel_aggregates(self):
        """Havana must independently match the pinned analytical counts across all presets."""
        havana = self.context["places"].get("place_havana")
        self.assertIsNotNone(havana)
        self.assertEqual(havana["status"], "mapped")
        self.assertEqual(havana["crespo_lugar_id"], 498)
        self.assertEqual(havana["source_native_label"], "La Habana")

        # All period (1650-1730)
        p_all = havana["periods"]["all"]
        self.assertEqual(p_all["total_records"], 28)
        self.assertEqual(p_all["departure_records"], 7)
        self.assertEqual(p_all["arrival_records"], 21)

        # Counterparts check for Havana all
        cadiz_cp = next((cp for cp in p_all["top_counterparts"] if cp["source_label"] == "Cádiz"), None)
        self.assertIsNotNone(cadiz_cp)
        self.assertEqual(cadiz_cp["total_records"], 16)
        self.assertEqual(cadiz_cp["recorded_as_destination"], 2)
        self.assertEqual(cadiz_cp["recorded_as_origin"], 14)

        # Early period (1684-1695)
        p_early = havana["periods"]["1684-1695"]
        self.assertEqual(p_early["total_records"], 5)
        self.assertEqual(p_early["departure_records"], 1)
        self.assertEqual(p_early["arrival_records"], 4)

        # Prize period (1702-1712)
        p_prize = havana["periods"]["1702-1712"]
        self.assertEqual(p_prize["total_records"], 2)
        self.assertEqual(p_prize["departure_records"], 0)
        self.assertEqual(p_prize["arrival_records"], 2)

    def test_cadiz_and_curacao_sentinel_aggregates(self):
        """Cádiz and Curaçao must match pinned baseline numbers."""
        cadiz = self.context["places"].get("place_cadiz")
        self.assertEqual(cadiz["periods"]["all"]["total_records"], 1093)
        self.assertEqual(cadiz["periods"]["all"]["departure_records"], 985)
        self.assertEqual(cadiz["periods"]["all"]["arrival_records"], 132)

        curacao = self.context["places"].get("place_curacao")
        self.assertEqual(curacao["periods"]["all"]["total_records"], 138)
        self.assertEqual(curacao["periods"]["all"]["departure_records"], 26)
        self.assertEqual(curacao["periods"]["all"]["arrival_records"], 112)

    def test_unrecorded_places_handling(self):
        """Unrecorded places must have 0 counts and restrained coverage caveat without imperial claims."""
        unrecorded_ids = ["place_port_royal", "place_nevis", "place_antigua", "place_dartmouth"]
        for pid in unrecorded_ids:
            p = self.context["places"].get(pid)
            self.assertIsNotNone(p, f"Missing place {pid}")
            self.assertEqual(p["status"], "unrecorded")
            self.assertIsNone(p["crespo_lugar_id"])
            self.assertEqual(p["coverage_caveat"], "No matching Crespo vessel records in this scoped dataset.")
            for preset_id in ["all", "1684-1695", "1702-1712"]:
                p_data = p["periods"][preset_id]
                self.assertEqual(p_data["total_records"], 0)
                self.assertEqual(p_data["departure_records"], 0)
                self.assertEqual(p_data["arrival_records"], 0)
                self.assertEqual(len(p_data["top_counterparts"]), 0)

    def test_no_prohibited_semantic_phrases(self):
        """Raw JSON output must not contain prohibited casual or overclaiming phrases."""
        raw_text = json.dumps(self.context).lower()
        forbidden = [
            "ships sailed",
            "voyages used",
            "traffic volume",
            "market share",
            "handled 28 voyages",
            "imperial archival partition",
        ]
        for phrase in forbidden:
            self.assertNotIn(phrase, raw_text, f"Prohibited phrase found: '{phrase}'")


if __name__ == "__main__":
    unittest.main()
