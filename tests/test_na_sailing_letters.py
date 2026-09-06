#!/usr/bin/env python3
"""
tests/test_na_sailing_letters.py

Automated unit, provenance, and rights invariant tests for Packet 9:
First Dutch Atlantic Documentary Thread (Nationaal Archief 2.22.24 / Sailing Letters).
"""

import json
import os
import unittest


class TestNationaalArchiefSailingLetters(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        cls.public_data_dir = os.path.join(cls.repo_root, "public", "data")

        with open(os.path.join(cls.public_data_dir, "sources.json"), "r", encoding="utf-8") as f:
            cls.sources_data = json.load(f)

        with open(os.path.join(cls.public_data_dir, "entities.json"), "r", encoding="utf-8") as f:
            cls.entities = json.load(f)

        with open(os.path.join(cls.public_data_dir, "manifest.json"), "r", encoding="utf-8") as f:
            cls.manifest = json.load(f)

    def test_nationaal_archief_source_registered(self):
        """Source src_na_2_22_24_sailing_letters must exist with open public domain rights and valid credit line."""
        sources_by_id = {s["id"]: s for s in self.sources_data["sources"]}
        self.assertIn("src_na_2_22_24_sailing_letters", sources_by_id)
        source = sources_by_id["src_na_2_22_24_sailing_letters"]
        self.assertEqual(source["holding_institution"], "Nationaal Archief, Den Haag")
        self.assertEqual(source["stable_identifier"], "NL-HaNA 2.22.24")
        self.assertEqual(source["rights_posture"], "open_public_domain")
        self.assertIn("The National Archives, Kew", source["credit_line"])
        self.assertIn("2.22.24", source["item_url"])

    def test_hca32_candidate_records_and_handles(self):
        """Source records HCA32-11.380 and 11.391 must have persistent handles and link to upstream TNA HCA 32."""
        records_by_id = {r["id"]: r for r in self.sources_data["source_records"]}
        self.assertIn("sr_na_hca32_11_380", records_by_id)
        self.assertIn("sr_na_hca32_11_391", records_by_id)

        rec_380 = records_by_id["sr_na_hca32_11_380"]
        self.assertEqual(rec_380["source_id"], "src_na_2_22_24_sailing_letters")
        self.assertEqual(rec_380["inspection_state"], "digital_content_inspected")
        self.assertEqual(rec_380["upstream_archive_source_id"], "src_tna_hca_32")
        self.assertEqual(rec_380["upstream_archive_reference"], "TNA HCA 32/11/380")
        self.assertTrue(rec_380.get("persistent_handle", "").startswith("http://hdl.handle.net/10648/"))
        self.assertEqual(rec_380.get("scan_count"), 15)

        rec_391 = records_by_id["sr_na_hca32_11_391"]
        self.assertEqual(rec_391["source_id"], "src_na_2_22_24_sailing_letters")
        self.assertEqual(rec_391["upstream_archive_source_id"], "src_tna_hca_32")
        self.assertEqual(rec_391.get("scan_count"), 21)

    def test_cadiz_dutch_attestation(self):
        """place_cadiz must include a Dutch archival catalogue attestation from HCA 32-11.380."""
        places_by_id = {p["id"]: p for p in self.entities["places"]}
        self.assertIn("place_cadiz", places_by_id)
        cadiz = places_by_id["place_cadiz"]
        attestations = cadiz.get("attestations", [])

        nl_atts = [a for a in attestations if a.get("language") == "nl"]
        self.assertEqual(len(nl_atts), 1, "Expected exactly 1 Dutch attestation on place_cadiz")
        nl_att = nl_atts[0]
        self.assertEqual(nl_att["raw_name"], "Cadiz")
        self.assertEqual(nl_att["evidence_layer"], "archival_catalogue_metadata")
        self.assertEqual(nl_att["source_record_id"], "sr_na_hca32_11_380")
        self.assertIn("ast_na_380_dep_cadiz", cadiz.get("source_assertion_ids", []))

    def test_nostra_seniora_ship_and_person_resolution(self):
        """Nostra Seniora Concepcion must be a documented canonical vessel with master Antonio de Witte."""
        ships_by_id = {s["id"]: s for s in self.entities["ships"]}
        self.assertIn("ship_nostra_seniora_concepcion_1666", ships_by_id)
        ship = ships_by_id["ship_nostra_seniora_concepcion_1666"]
        self.assertEqual(ship["canonical_name"], "Nostra Seniora Concepcion y St Joseph")
        self.assertEqual(ship["master_display"], "Antonio de Witte")
        self.assertIn("Second Anglo-Dutch War", ship["capture_display"])

        # Check resolution edge
        edges = self.entities["entity_resolution_edges"]
        ship_edges = [e for e in edges if e["target_entity_id"] == "ship_nostra_seniora_concepcion_1666"]
        self.assertEqual(len(ship_edges), 1)
        self.assertEqual(ship_edges[0]["resolution_state"], "documented_identity")

        # Check master person entity and occurrence
        persons_by_id = {p["id"]: p for p in self.entities.get("persons", [])}
        self.assertIn("person_antonio_de_witte_1666", persons_by_id)
        person = persons_by_id["person_antonio_de_witte_1666"]
        self.assertEqual(person["canonical_name"], "Antonio de Witte")
        self.assertEqual(person["evidence_state"], "documented")
        self.assertIn("master", person["roles"])

        person_edges = [e for e in edges if e["target_entity_id"] == "person_antonio_de_witte_1666"]
        self.assertEqual(len(person_edges), 1)
        self.assertEqual(person_edges[0]["occurrence_id"], "occ_person_antonio_de_witte_380")

    def test_facsimile_visual_integrity(self):
        """Facsimile visual must link to HCA 32-11.380 and reference existing asset on disk."""
        visuals_by_id = {v["id"]: v for v in self.entities["visuals"]}
        self.assertIn("vis_na_hca32_11_380_facsimile", visuals_by_id)
        vis = visuals_by_id["vis_na_hca32_11_380_facsimile"]
        self.assertEqual(vis["source_id"], "src_na_2_22_24_sailing_letters")
        self.assertEqual(vis["holding_institution"], "Nationaal Archief, Den Haag")
        self.assertEqual(vis["rights_state"], "open_public_domain")
        self.assertIn("5802eb91", vis["digital_id"])

        full_asset_path = os.path.join(self.repo_root, "public", vis["asset_path"])
        self.assertTrue(os.path.exists(full_asset_path), f"Facsimile image missing at {full_asset_path}")
        self.assertTrue(os.path.getsize(full_asset_path) > 100000, "Facsimile image appears corrupted or too small")


if __name__ == "__main__":
    unittest.main()
