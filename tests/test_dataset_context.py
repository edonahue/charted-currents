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

        mapped_count = sum(1 for m in self.mappings if m.get("crespo_lugar_id") is not None)
        unmapped_count = sum(1 for m in self.mappings if m.get("crespo_lugar_id") is None)
        self.assertEqual(mapped_count, 19)
        self.assertEqual(unmapped_count, 10)

    def test_counting_unit_and_baseline_metadata(self):
        """Metadata must strictly preserve the locked counting unit, baseline scope, and provenance hashes."""
        meta = self.context.get("metadata", {})
        self.assertEqual(meta.get("counting_unit"), "one Crespo TODOSNAVIOS row / Crespo vessel record")
        self.assertEqual(meta.get("baseline_period"), "1650-1730")
        self.assertEqual(meta.get("total_records_in_baseline"), 1928)
        self.assertEqual(meta.get("period_presets"), ["all", "1684-1695", "1702-1712"])
        self.assertIn("source_mdb_sha256", meta)
        self.assertIn("mapping_file_sha256", meta)
        self.assertIn("generator_sha256", meta)

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
        self.assertEqual(p_all["records_with_origin"], 7)
        self.assertEqual(p_all["records_with_destination"], 21)
        self.assertEqual(p_all["both_endpoint_records"], 0)
        self.assertEqual(p_all["total_records"], p_all["records_with_origin"] + p_all["records_with_destination"] - p_all["both_endpoint_records"])

        # Counterparts check for Havana all
        cadiz_cp = next((cp for cp in p_all["top_counterparts"] if cp["source_label"] == "Cádiz"), None)
        self.assertIsNotNone(cadiz_cp)
        self.assertEqual(cadiz_cp["total_records"], 16)
        self.assertEqual(cadiz_cp["recorded_as_destination"], 2)
        self.assertEqual(cadiz_cp["recorded_as_origin"], 14)

        # Early period (1684-1695)
        p_early = havana["periods"]["1684-1695"]
        self.assertEqual(p_early["total_records"], 5)
        self.assertEqual(p_early["records_with_origin"], 1)
        self.assertEqual(p_early["records_with_destination"], 4)
        self.assertEqual(p_early["both_endpoint_records"], 0)

        # Prize period (1702-1712)
        p_prize = havana["periods"]["1702-1712"]
        self.assertEqual(p_prize["total_records"], 2)
        self.assertEqual(p_prize["records_with_origin"], 0)
        self.assertEqual(p_prize["records_with_destination"], 2)
        self.assertEqual(p_prize["both_endpoint_records"], 0)

    def test_cadiz_both_endpoints_and_union_arithmetic(self):
        """Cádiz must match pinned baseline numbers with both_endpoint_records = 24 and self-exclusion."""
        cadiz = self.context["places"].get("place_cadiz")
        self.assertEqual(cadiz["status"], "mapped")
        p_all = cadiz["periods"]["all"]
        self.assertEqual(p_all["total_records"], 1093)
        self.assertEqual(p_all["records_with_origin"], 985)
        self.assertEqual(p_all["records_with_destination"], 132)
        self.assertEqual(p_all["both_endpoint_records"], 24)
        # Union arithmetic: 985 + 132 - 24 = 1093
        self.assertEqual(
            p_all["total_records"],
            p_all["records_with_origin"] + p_all["records_with_destination"] - p_all["both_endpoint_records"],
        )
        # Self-counterpart exclusion
        for cp in p_all["top_counterparts"]:
            self.assertNotEqual(cp["crespo_lugar_id"], 195)
            self.assertNotEqual(cp["source_label"], "Cádiz")
            self.assertNotIn("same_port_return", cp)

    def test_london_mapped_zero_sentinel(self):
        """London is mapped (Lugar ID 559) but has zero records in 1650-1730."""
        london = self.context["places"].get("place_london")
        self.assertIsNotNone(london)
        self.assertEqual(london["status"], "mapped")
        self.assertEqual(london["crespo_lugar_id"], 559)
        self.assertEqual(london["source_native_label"], "Londres")
        self.assertEqual(london["periods"]["all"]["total_records"], 0)
        self.assertEqual(len(london["periods"]["all"]["top_counterparts"]), 0)
        self.assertIn("No Crespo vessel records record London as an endpoint in All (1650–1730).", london["coverage_caveat"])

    def test_unmapped_places_handling(self):
        """Unmapped places must have status 'unmapped', periods: null, and neutral unavailable copy."""
        unmapped_ids = ["place_port_royal", "place_st_domingo", "place_nevis", "place_antigua", "place_dartmouth"]
        for pid in unmapped_ids:
            p = self.context["places"].get(pid)
            self.assertIsNotNone(p, f"Missing place {pid}")
            self.assertEqual(p["status"], "unmapped")
            self.assertIsNone(p["crespo_lugar_id"])
            self.assertIsNone(p["source_native_label"])
            self.assertIsNone(p["periods"], f"Unmapped place {pid} must have periods: null")
            self.assertEqual(
                p["coverage_caveat"],
                "No reviewed Crespo place mapping is currently established for this place. Dataset context is unavailable.",
            )

    def test_union_arithmetic_all_mapped_places(self):
        """All mapped places across all presets must satisfy union arithmetic and counterpart self-exclusion."""
        for pid, place in self.context["places"].items():
            if place["status"] == "mapped":
                self.assertIsNotNone(place["periods"])
                for preset_id in ["all", "1684-1695", "1702-1712"]:
                    per = place["periods"][preset_id]
                    self.assertEqual(
                        per["total_records"],
                        per["records_with_origin"] + per["records_with_destination"] - per["both_endpoint_records"],
                        f"Union arithmetic violated for {pid} ({preset_id})",
                    )
                    for cp in per["top_counterparts"]:
                        self.assertNotEqual(cp["crespo_lugar_id"], place["crespo_lugar_id"], f"Self-counterpart leak in {pid}")
                        self.assertNotIn("same_port_return", cp)

    def test_no_prohibited_semantic_phrases(self):
        """Raw JSON output must not contain prohibited casual, obsolete, or overclaiming phrases."""
        raw_text = json.dumps(self.context).lower()
        forbidden = [
            "same_port_return",
            "ships sailed",
            "distinct physical vessels",
            "voyages used",
            "traffic volume",
            "market share",
            "handled 28 voyages",
            "imperial archival partition",
            "archival partition",
            "unrecorded",
        ]
        for phrase in forbidden:
            self.assertNotIn(phrase, raw_text, f"Prohibited phrase found: '{phrase}'")


if __name__ == "__main__":
    unittest.main()
