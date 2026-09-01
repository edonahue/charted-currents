#!/usr/bin/env python3
"""
tests/test_historical_invariants.py

Automated invariant tests for Charted Currents Packet 2 published historical corpus.
Enforces constitutional rules around historical assertions, provenance, rights, and geometry.
"""

import json
import os
import unittest
import yaml

class TestHistoricalInvariants(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        cls.reviewed_path = os.path.join(cls.repo_root, "data", "reviewed_corpus.yml")
        cls.public_data_dir = os.path.join(cls.repo_root, "public", "data")

        with open(cls.reviewed_path, "r", encoding="utf-8") as f:
            cls.reviewed = yaml.safe_load(f)

        with open(os.path.join(cls.public_data_dir, "ports.geojson"), "r", encoding="utf-8") as f:
            cls.ports_geojson = json.load(f)

        with open(os.path.join(cls.public_data_dir, "routes.geojson"), "r", encoding="utf-8") as f:
            cls.routes_geojson = json.load(f)

        with open(os.path.join(cls.public_data_dir, "entities.json"), "r", encoding="utf-8") as f:
            cls.entities = json.load(f)

        with open(os.path.join(cls.public_data_dir, "events.json"), "r", encoding="utf-8") as f:
            cls.events = json.load(f)

        with open(os.path.join(cls.public_data_dir, "sources.json"), "r", encoding="utf-8") as f:
            cls.sources = json.load(f)

    def test_no_jamaica_to_port_royal_conflation(self):
        """Jamaica (island/colony) must never be silently converted into Port Royal."""
        places_by_id = {p["id"]: p for p in self.entities["places"]}
        self.assertIn("place_jamaica", places_by_id)
        self.assertIn("place_port_royal", places_by_id)

        jamaica = places_by_id["place_jamaica"]
        port_royal = places_by_id["place_port_royal"]

        self.assertEqual(jamaica["raw_source_name"], "Jamaica")
        self.assertEqual(jamaica["geographic_precision"], "colony_or_island")
        self.assertNotEqual(jamaica["canonical_name"], "Port Royal")
        self.assertNotEqual(jamaica["coordinates"], port_royal["coordinates"])

    def test_routes_are_endpoints_only_and_schematic(self):
        """Routes must be endpoints_only and explicitly declare track is not observed."""
        for feature in self.routes_geojson["features"]:
            props = feature["properties"]
            self.assertEqual(props["geometry_kind"], "endpoints_only")
            self.assertEqual(props["evidence_state"], "documented")
            self.assertFalse(props["is_track_observed"])
            coords = feature["geometry"]["coordinates"]
            self.assertEqual(len(coords), 2, "Endpoints-only line must contain exactly 2 coordinate points")

    def test_capture_locations_decoupled_from_voyage_routes(self):
        """Capture roadsteads (Dartmouth, Plymouth) must not be inserted into transatlantic route lines."""
        places_by_id = {p["id"]: p for p in self.entities["places"]}
        dartmouth_coords = places_by_id["place_dartmouth"]["coordinates"]
        plymouth_coords = places_by_id["place_plymouth"]["coordinates"]

        for feature in self.routes_geojson["features"]:
            coords = feature["geometry"]["coordinates"]
            self.assertNotIn(dartmouth_coords, coords)
            self.assertNotIn(plymouth_coords, coords)

    def test_tonnage_values_preserved_accurately(self):
        """Raw tonnage numbers must match source documentation faithfully."""
        ships_by_id = {s["id"]: s for s in self.entities["ships"]}
        self.assertEqual(ships_by_id["ship_richard_and_sarah_1705"]["raw_tonnage"], "300")
        self.assertEqual(ships_by_id["ship_william_1702"]["raw_tonnage"], "60")

    def test_earthquake_event_provenance_and_date(self):
        """1692 Port Royal Earthquake must have exact date, calendar, and Royal Society source."""
        events_by_id = {e["id"]: e for e in self.events["events"]}
        self.assertIn("event_port_royal_earthquake_1692", events_by_id)
        eq = events_by_id["event_port_royal_earthquake_1692"]
        self.assertEqual(eq["date"], "1692-06-07")
        self.assertEqual(eq["calendar_system"], "Julian (Old Style)")
        self.assertEqual(eq["evidence_state"], "contextual")
        self.assertIn("src_royal_society_1692", eq["sources"])

    def test_visual_asset_uncertainty_and_loc_source(self):
        """The Bochart & Knollis chart must preserve date uncertainty [1684?] and LOC attribution."""
        visuals = self.entities.get("visuals", [])
        self.assertTrue(len(visuals) >= 1)
        vis = visuals[0]
        self.assertEqual(vis["id"], "visual_bochart_knollis_jamaica_1684")
        self.assertEqual(vis["date_display"], "[1684?]")
        self.assertTrue(vis["is_uncertain"])
        self.assertEqual(vis["rights_state"], "open_public_domain")
        self.assertIn("Library of Congress", vis["holding_institution"])

    def test_every_entity_points_to_valid_source(self):
        """All published ships and events must reference source IDs present in sources.json."""
        source_ids = {s["id"] for s in self.sources["sources"]}
        for ship in self.entities["ships"]:
            self.assertIn(ship["primary_source_id"], source_ids)
            self.assertIn(ship["dataset_source_id"], source_ids)
        for event in self.events["events"]:
            for src_id in event["sources"]:
                self.assertIn(src_id, source_ids)

    def test_zero_unknown_rights(self):
        """No published source record may be classified as unknown_review_required."""
        for src in self.sources["sources"]:
            self.assertNotEqual(src.get("rights_posture"), "unknown_review_required")
            self.assertNotEqual(src.get("public_use_basis"), "unknown_review_required")

if __name__ == "__main__":
    unittest.main()
