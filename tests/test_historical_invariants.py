#!/usr/bin/env python3
"""
tests/test_historical_invariants.py

Automated relational invariant and provenance integrity tests for Charted Currents Packet 2.
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

    def test_referential_integrity_sources_and_records(self):
        """Every source_record must point to an existing source in sources[]."""
        source_ids = {s["id"] for s in self.sources["sources"]}
        for sr in self.sources["source_records"]:
            self.assertIn(sr["source_id"], source_ids, f"Source record {sr['id']} points to nonexistent source {sr['source_id']}")

    def test_referential_integrity_records_and_assertions(self):
        """Every assertion must point to an existing source_record."""
        record_ids = {sr["id"] for sr in self.sources["source_records"]}
        for ast in self.sources["assertions"]:
            self.assertIn(ast["source_record_id"], record_ids, f"Assertion {ast['id']} points to nonexistent record {ast['source_record_id']}")

    def test_referential_integrity_occurrences_and_assertions(self):
        """Every occurrence must reference valid assertions."""
        assertion_ids = {ast["id"] for ast in self.sources["assertions"]}
        for occ in self.entities["ship_occurrences"]:
            for ast_id in occ["assertion_ids"]:
                self.assertIn(ast_id, assertion_ids, f"Occurrence {occ['id']} references nonexistent assertion {ast_id}")

    def test_explicit_entity_resolution_edges(self):
        """Every canonical ship entity must be linked via an explicit resolution edge."""
        ship_occ_ids = {occ["id"] for occ in self.entities["ship_occurrences"]}
        canonical_ship_ids = {s["id"] for s in self.entities["ships"]}
        edge_occurrences = set()

        for edge in self.entities["entity_resolution_edges"]:
            self.assertIn(edge["occurrence_id"], ship_occ_ids)
            self.assertIn(edge["target_entity_id"], canonical_ship_ids)
            self.assertEqual(edge["resolution_state"], "documented_identity")
            edge_occurrences.add(edge["occurrence_id"])

        for occ_id in ship_occ_ids:
            self.assertIn(occ_id, edge_occurrences, f"Occurrence {occ_id} lacks an explicit resolution edge")

    def test_inspection_states_declared_honestly(self):
        """Source records must declare specific inspection states matching actual research actions."""
        records_by_id = {r["id"]: r for r in self.sources["source_records"]}
        self.assertEqual(records_by_id["sr_imlm_ship_2052"]["inspection_state"], "dataset_record_inspected")
        self.assertEqual(records_by_id["sr_imlm_ship_2228"]["inspection_state"], "dataset_record_inspected")
        self.assertEqual(records_by_id["sr_rs_el_l5_117"]["inspection_state"], "metadata_only")
        self.assertEqual(records_by_id["sr_rs_phil_trans_209"]["inspection_state"], "digital_content_inspected")
        self.assertEqual(records_by_id["sr_loc_ct008911"]["inspection_state"], "digital_content_inspected")

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

    def test_routes_reference_relationship_assertions(self):
        """Every route feature must link to supporting relationship assertion IDs."""
        assertion_ids = {ast["id"] for ast in self.sources["assertions"]}
        for feature in self.routes_geojson["features"]:
            ast_ids = feature["properties"].get("source_assertion_ids", [])
            self.assertTrue(len(ast_ids) > 0, f"Route {feature['id']} missing source_assertion_ids")
            for ast_id in ast_ids:
                self.assertIn(ast_id, assertion_ids)

    def test_capture_locations_decoupled_from_voyage_routes(self):
        """Capture roadsteads (Dartmouth, Plymouth) must not be inserted into transatlantic route lines."""
        places_by_id = {p["id"]: p for p in self.entities["places"]}
        dartmouth_coords = places_by_id["place_dartmouth"]["coordinates"]
        plymouth_coords = places_by_id["place_plymouth"]["coordinates"]

        for feature in self.routes_geojson["features"]:
            coords = feature["geometry"]["coordinates"]
            self.assertNotIn(dartmouth_coords, coords)
            self.assertNotIn(plymouth_coords, coords)

    def test_tonnage_and_construction_values_preserved(self):
        """Raw metrics match source documentation and canonical displays avoid unmodeled inferences."""
        ship_occs = {occ["id"]: occ for occ in self.entities["ship_occurrences"]}
        self.assertEqual(ship_occs["occ_ship_imlm_2052"]["raw_tonnage"], "300")
        self.assertEqual(ship_occs["occ_ship_imlm_2228"]["raw_tonnage"], "60")

        ships_by_id = {s["id"]: s for s in self.entities["ships"]}
        # Verify no ~1685 embedded in Richard & Sarah canonical display
        self.assertNotIn("~1685", ships_by_id["ship_richard_and_sarah_1705"]["construction_display"])
        self.assertEqual(ships_by_id["ship_richard_and_sarah_1705"]["construction_display"], "English built · reported age 20 at capture")

    def test_earthquake_provenance_split(self):
        """1692 Port Royal Earthquake must reference split Royal Society manuscript (T L) and Phil. Trans. records."""
        events_by_id = {e["id"]: e for e in self.events["events"]}
        self.assertIn("event_port_royal_earthquake_1692", events_by_id)
        eq = events_by_id["event_port_royal_earthquake_1692"]
        self.assertEqual(eq["date"], "1692-06-07")
        self.assertEqual(eq["calendar_system"], "Julian (Old Style)")
        self.assertEqual(eq["evidence_state"], "contextual")
        self.assertIn("src_royal_society_el_l5_117", eq["sources"])
        self.assertIn("src_royal_society_phil_trans_1694", eq["sources"])

        # Check creator of EL/L5/117 is T L
        sources_by_id = {s["id"]: s for s in self.sources["sources"]}
        self.assertEqual(sources_by_id["src_royal_society_el_l5_117"]["creator"], "T L")

    def test_port_royal_map_assertion_linked(self):
        """Port Royal place entity must link to explicit cartographic label assertion on 1684 map."""
        places_by_id = {p["id"]: p for p in self.entities["places"]}
        port_royal = places_by_id["place_port_royal"]
        self.assertIn("ast_loc_map_port_royal", port_royal["source_assertion_ids"])

        assertions_by_id = {a["id"]: a for a in self.sources["assertions"]}
        self.assertIn("ast_loc_map_port_royal", assertions_by_id)
        self.assertEqual(assertions_by_id["ast_loc_map_port_royal"]["raw_value"], "Port Royall")

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

    def test_fifteen_vessels_in_public_corpus(self):
        """Packet 3 corpus must contain exactly 15 verified vessels."""
        ships = self.entities["ships"]
        self.assertEqual(len(ships), 15, f"Expected 15 vessels, found {len(ships)}")
        routes = self.routes_geojson["features"]
        self.assertEqual(len(routes), 15, f"Expected 15 routes, found {len(routes)}")

    def test_vessel_events_bidirectional_link(self):
        """Capture events must declare valid vessel_id linking to ships[]."""
        canonical_ship_ids = {s["id"] for s in self.entities["ships"]}
        for ev in self.events["events"]:
            if ev.get("kind") == "capture":
                self.assertIn("vessel_id", ev, f"Capture event {ev['id']} missing vessel_id")
                self.assertIn(ev["vessel_id"], canonical_ship_ids, f"Capture event {ev['id']} points to nonexistent vessel {ev['vessel_id']}")

    def test_dexlford_raw_spelling_preserved(self):
        """Robert Ashworth raw source birthplace and residence must preserve Dexlford."""
        crew_by_id = {c["id"]: c for c in self.entities["crew_occurrences"]}
        self.assertIn("occ_crew_5036", crew_by_id)
        ashworth = crew_by_id["occ_crew_5036"]
        self.assertEqual(ashworth["birthplace_as_recorded"], "Dexlford")
        self.assertEqual(ashworth["residence_as_recorded"], "Dexlford")

        assertions_by_id = {a["id"]: a for a in self.sources["assertions"]}
        self.assertIn("ast_crew_5036", assertions_by_id)
        self.assertEqual(assertions_by_id["ast_crew_5036"]["birthplace"], "Dexlford")
        self.assertEqual(assertions_by_id["ast_crew_5036"]["residence"], "Dexlford")

    def test_routes_have_machine_readable_temporal_metadata(self):
        """Every route feature must include integer associated_record_year and temporal_basis."""
        for feature in self.routes_geojson["features"]:
            props = feature["properties"]
            self.assertIn("associated_record_year", props)
            self.assertIsInstance(props["associated_record_year"], int)
            self.assertTrue(1700 <= props["associated_record_year"] <= 1715)
            self.assertEqual(props["temporal_basis"], "capture_record")
            self.assertIn("record_count", props)
            self.assertIsInstance(props["record_count"], int)
            self.assertTrue(props["record_count"] >= 1)

    def test_route_aggregation_metadata(self):
        """Jamaica -> London and Hispaniola -> La Rochelle routes must declare aggregate count of 2."""
        routes_by_pair = {}
        for feature in self.routes_geojson["features"]:
            props = feature["properties"]
            pair = f"{props['origin_place_id']}->{props['destination_place_id']}"
            if pair not in routes_by_pair:
                routes_by_pair[pair] = []
            routes_by_pair[pair].append(props)

        self.assertEqual(len(routes_by_pair["place_jamaica->place_london"]), 2)
        for r in routes_by_pair["place_jamaica->place_london"]:
            self.assertEqual(r["record_count"], 2)
            self.assertEqual(len(r["constituent_vessel_ids"]), 2)

if __name__ == "__main__":
    unittest.main()
