#!/usr/bin/env python3
"""
tests/test_na_sailing_letters.py

Automated unit, provenance, and rights invariant tests for Packet 9:
Direct Prize Papers Documentary Thread via Nationaal Archief
(Nationaal Archief 2.22.24 / Sailing Letters).
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
        """Source src_na_2_22_24_sailing_letters must exist with open access rights and valid credit line."""
        sources_by_id = {s["id"]: s for s in self.sources_data["sources"]}
        self.assertIn("src_na_2_22_24_sailing_letters", sources_by_id)
        source = sources_by_id["src_na_2_22_24_sailing_letters"]
        self.assertEqual(source["holding_institution"], "Nationaal Archief, Den Haag")
        self.assertEqual(source["stable_identifier"], "NL-HaNA 2.22.24")
        self.assertEqual(source["rights_posture"], "open_access_no_registration_required")
        self.assertIn("The National Archives, Kew", source["credit_line"])
        self.assertIn("2.22.24", source["item_url"])

    def test_hca32_candidate_records_and_handles(self):
        """Source records HCA32-11.380 and 11.391 must have persistent handles, metadata_only state, and correct scan counts."""
        records_by_id = {r["id"]: r for r in self.sources_data["source_records"]}
        self.assertIn("sr_na_hca32_11_380", records_by_id)
        self.assertIn("sr_na_hca32_11_391", records_by_id)

        rec_380 = records_by_id["sr_na_hca32_11_380"]
        self.assertEqual(rec_380["source_id"], "src_na_2_22_24_sailing_letters")
        self.assertEqual(rec_380["inspection_state"], "metadata_only")
        self.assertEqual(rec_380["upstream_archive_source_id"], "src_tna_hca_32")
        self.assertEqual(rec_380["upstream_archive_reference"], "TNA HCA 32/11/380")
        self.assertTrue(rec_380.get("persistent_handle", "").startswith("http://hdl.handle.net/10648/"))
        self.assertEqual(rec_380.get("scan_count"), 5)

        rec_391 = records_by_id["sr_na_hca32_11_391"]
        self.assertEqual(rec_391["source_id"], "src_na_2_22_24_sailing_letters")
        self.assertEqual(rec_391["inspection_state"], "metadata_only")
        self.assertEqual(rec_391["upstream_archive_source_id"], "src_tna_hca_32")
        self.assertEqual(rec_391["upstream_archive_reference"], "TNA HCA 32/11/391")
        self.assertTrue(rec_391.get("persistent_handle", "").startswith("http://hdl.handle.net/10648/"))
        self.assertEqual(rec_391.get("scan_count"), 7)

    def test_cadiz_source_assertion_and_no_modern_attestation(self):
        """place_cadiz must link ast_na_380_origin_descriptor without modern Dutch toponym attestation."""
        places_by_id = {p["id"]: p for p in self.entities["places"]}
        self.assertIn("place_cadiz", places_by_id)
        cadiz = places_by_id["place_cadiz"]
        attestations = cadiz.get("attestations", [])

        nl_atts = [a for a in attestations if a.get("language") == "nl"]
        self.assertEqual(len(nl_atts), 0, "place_cadiz must not contain modern Dutch toponym attestation")
        self.assertIn("ast_na_380_origin_descriptor", cadiz.get("source_assertion_ids", []))
        self.assertIn("ast_na_380_origin_place_mapping", cadiz.get("source_assertion_ids", []))

    def test_nostra_seniora_ship_and_person_resolution(self):
        """Nostra Seniora Concepcion and Antonio de Witte must resolve separate occurrences via probable_match."""
        ship_occs = {o["id"]: o for o in self.entities["ship_occurrences"]}
        self.assertIn("occ_ship_nostra_seniora_380", ship_occs)
        self.assertIn("occ_ship_nostra_seniora_391", ship_occs)
        occ_380 = ship_occs["occ_ship_nostra_seniora_380"]
        self.assertEqual(occ_380["raw_name"], "Nostra Seniora Concepcion y St Joseph")
        self.assertEqual(ship_occs["occ_ship_nostra_seniora_391"]["raw_name"], "Nostra Seniora Concepcion y St Joseph")
        self.assertIsNone(occ_380.get("recorded_voyage_origin"), "Cádiz must not be stored as recorded_voyage_origin")
        self.assertEqual(occ_380.get("recorded_origin_descriptor_raw"), "van Cadiz")
        self.assertEqual(occ_380.get("recorded_origin_place_id"), "place_cadiz")

        ships_by_id = {s["id"]: s for s in self.entities["ships"]}
        self.assertIn("ship_nostra_seniora_concepcion_1666", ships_by_id)
        ship = ships_by_id["ship_nostra_seniora_concepcion_1666"]
        self.assertEqual(ship["canonical_name"], "Nostra Seniora Concepcion y St Joseph")
        self.assertEqual(ship["master_display"], "Antonio de Witte")
        self.assertEqual(ship["evidence_state"], "probable_match")
        self.assertNotIn("Second Anglo-Dutch War", ship["capture_display"])
        self.assertEqual(len(ship["occurrence_ids"]), 2)

        # Check ship resolution edges
        edges = self.entities["entity_resolution_edges"]
        ship_edges = [e for e in edges if e["target_entity_id"] == "ship_nostra_seniora_concepcion_1666"]
        self.assertEqual(len(ship_edges), 2)
        for edge in ship_edges:
            self.assertEqual(edge["resolution_state"], "probable_match")

        # Check person occurrences and entity
        person_occs = {o["id"]: o for o in self.entities.get("person_occurrences", [])}
        self.assertIn("occ_person_antonio_de_witte_380", person_occs)
        self.assertIn("occ_person_antonio_de_witte_391", person_occs)

        persons_by_id = {p["id"]: p for p in self.entities.get("persons", [])}
        self.assertIn("person_antonio_de_witte_1666", persons_by_id)
        person = persons_by_id["person_antonio_de_witte_1666"]
        self.assertEqual(person["canonical_name"], "Antonio de Witte")
        self.assertEqual(person["evidence_state"], "probable_match")
        self.assertIn("master", person["roles"])
        self.assertEqual(len(person["occurrence_ids"]), 2)

        person_edges = [e for e in edges if e["target_entity_id"] == "person_antonio_de_witte_1666"]
        self.assertEqual(len(person_edges), 2)
        for edge in person_edges:
            self.assertEqual(edge["resolution_state"], "probable_match")

        person_edges = [e for e in edges if e["target_entity_id"] == "person_antonio_de_witte_1666"]
        self.assertEqual(len(person_edges), 2)
        for edge in person_edges:
            self.assertEqual(edge["resolution_state"], "probable_match")

    def test_no_local_facsimile_asset_and_visuals_count(self):
        """Facsimile asset must not exist locally; visuals collection must contain only period maps."""
        visuals_by_id = {v["id"]: v for v in self.entities["visuals"]}
        self.assertNotIn("vis_na_hca32_11_380_facsimile", visuals_by_id)
        self.assertEqual(len(visuals_by_id), 2)

        facsimile_path = os.path.join(self.repo_root, "public", "assets", "visuals", "na_hca32_11_380_facsimile.jpg")
        self.assertFalse(os.path.exists(facsimile_path), "Non-commercial facsimile scan must not be hosted locally")


if __name__ == "__main__":
    unittest.main()
