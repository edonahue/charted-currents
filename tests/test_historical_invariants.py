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
from pathlib import Path

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
        """Every canonical ship and person entity must be linked via an explicit resolution edge."""
        ship_occ_ids = {occ["id"] for occ in self.entities["ship_occurrences"]}
        canonical_ship_ids = {s["id"] for s in self.entities["ships"]}
        person_occ_ids = {occ["id"] for occ in self.entities.get("person_occurrences", [])}
        canonical_person_ids = {p["id"] for p in self.entities.get("persons", [])}

        ship_edge_occurrences = set()
        person_edge_occurrences = set()

        for edge in self.entities["entity_resolution_edges"]:
            if edge["occurrence_id"] in ship_occ_ids:
                self.assertIn(edge["target_entity_id"], canonical_ship_ids)
                self.assertEqual(edge["resolution_state"], "documented_identity")
                ship_edge_occurrences.add(edge["occurrence_id"])
            elif edge["occurrence_id"] in person_occ_ids:
                self.assertIn(edge["target_entity_id"], canonical_person_ids)
                self.assertIn(edge["resolution_state"], ["documented_identity", "probable_match", "possible_match", "unresolved_ambiguity"])
                person_edge_occurrences.add(edge["occurrence_id"])
            else:
                self.fail(f"Resolution edge occurrence {edge['occurrence_id']} is neither a ship nor person occurrence")

        for occ_id in ship_occ_ids:
            self.assertIn(occ_id, ship_edge_occurrences, f"Ship occurrence {occ_id} lacks an explicit resolution edge")
        for occ_id in person_occ_ids:
            self.assertIn(occ_id, person_edge_occurrences, f"Person occurrence {occ_id} lacks an explicit resolution edge")

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
        """Every display edge and archival route must link to supporting relationship assertion IDs."""
        assertion_ids = {ast["id"] for ast in self.sources["assertions"]}
        for feature in self.routes_geojson["features"]:
            ast_ids = feature["properties"].get("constituent_assertion_ids", [])
            self.assertTrue(len(ast_ids) > 0, f"Display edge {feature['id']} missing constituent_assertion_ids")
            for ast_id in ast_ids:
                self.assertIn(ast_id, assertion_ids)

        for route in self.entities.get("routes", []):
            ast_ids = route.get("source_assertion_ids", [])
            self.assertTrue(len(ast_ids) > 0, f"Archival route {route['id']} missing source_assertion_ids")
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

    def test_vessels_in_public_corpus(self):
        """Corpus must contain exactly 21 verified vessels (18 baseline + 3 Packet 6) and 21 archival routes across 16 display edges."""
        ships = self.entities["ships"]
        self.assertEqual(len(ships), 21, f"Expected 21 vessels, found {len(ships)}")
        archival_routes = self.entities.get("routes", [])
        self.assertEqual(len(archival_routes), 21, f"Expected 21 archival routes, found {len(archival_routes)}")
        display_edges = self.routes_geojson["features"]
        self.assertEqual(len(display_edges), 16, f"Expected 16 display edges, found {len(display_edges)}")

    def test_packet6_recorded_goods_invariants(self):
        """Packet 6 Recorded Goods occurrences must preserve exact counts, provenance, and ethical boundaries."""
        goods = self.entities.get("goods_occurrences", [])
        self.assertEqual(len(goods), 160, f"Expected exactly 160 goods occurrences, found {len(goods)}")

        # Vessel 5890: 135 lines of Cacao, 86 distinct nonblank consignees
        v5890_goods = [g for g in goods if g["ship_occurrence_id"] == "occ_ship_crespo_5890"]
        self.assertEqual(len(v5890_goods), 135)
        self.assertTrue(all(g["recorded_commodity_label"] == "Cacao" for g in v5890_goods))
        consignees_5890 = {g["recorded_consignee"] for g in v5890_goods if g.get("recorded_consignee")}
        self.assertEqual(len(consignees_5890), 86, f"Expected 86 distinct nonblank consignees on 5890, got {len(consignees_5890)}")

        # Vessel 4493: 16 lines across 9 distinct commodities
        v4493_goods = [g for g in goods if g["ship_occurrence_id"] == "occ_ship_crespo_4493"]
        self.assertEqual(len(v4493_goods), 16)
        commodities_4493 = {g["recorded_commodity_label"] for g in v4493_goods}
        self.assertEqual(len(commodities_4493), 9)

        # Vessel 4501: 9 lines across 9 commodities with prize valuation on vessel
        v4501_goods = [g for g in goods if g["ship_occurrence_id"] == "occ_ship_crespo_4501"]
        self.assertEqual(len(v4501_goods), 9)
        self.assertTrue(all(g["raw_quantity"] == 0 for g in v4501_goods))
        self.assertTrue(all(g["parsed_quantity"] is None for g in v4501_goods))

        # Ethical invariant: no commercial goods occurrence may represent enslaved persons
        for g in goods:
            self.assertNotEqual(g["commodity_ref_key"], 11)
            self.assertNotIn("esclavo", g["recorded_commodity_label"].lower())

        # Relational Class A/C/B assertion integrity
        ast_by_id = {a["id"]: a for a in self.sources["assertions"]}
        for g in goods:
            # Must reference at least one Class A and one Class C assertion
            risk_classes = {ast_by_id[aid].get("risk_class") for aid in g["assertion_ids"] if aid in ast_by_id}
            self.assertIn("A", risk_classes, f"Goods {g['id']} missing Class A assertion")
            self.assertIn("C", risk_classes, f"Goods {g['id']} missing Class C relational assertion")

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
        """Every display edge feature must include integer associated_record_year and temporal_extent."""
        for feature in self.routes_geojson["features"]:
            props = feature["properties"]
            self.assertIn("associated_record_year", props)
            self.assertIsInstance(props["associated_record_year"], int)
            self.assertTrue(1680 <= props["associated_record_year"] <= 1715)
            self.assertIn(props["temporal_extent"]["temporal_basis"], ["capture_record", "historical_record"])
            self.assertIn("record_count", props)
            self.assertIsInstance(props["record_count"], int)
            self.assertTrue(props["record_count"] >= 1)

    def test_route_aggregation_metadata(self):
        """Jamaica -> London, Hispaniola -> La Rochelle, and Cádiz -> Havana display edges must declare aggregate counts."""
        edges_by_id = {f["id"]: f["properties"] for f in self.routes_geojson["features"]}
        self.assertIn("display_edge_place_jamaica_place_london", edges_by_id)
        jl = edges_by_id["display_edge_place_jamaica_place_london"]
        self.assertEqual(jl["record_count"], 2)
        self.assertEqual(len(jl["constituent_vessel_ids"]), 2)
        self.assertEqual(len(jl["constituent_route_ids"]), 2)

        self.assertIn("display_edge_place_st_domingo_place_rochelle", edges_by_id)
        sr = edges_by_id["display_edge_place_st_domingo_place_rochelle"]
        self.assertEqual(sr["record_count"], 2)
        self.assertEqual(len(sr["constituent_vessel_ids"]), 2)
        self.assertEqual(len(sr["constituent_route_ids"]), 2)

        self.assertIn("display_edge_place_cadiz_place_havana", edges_by_id)
        ch = edges_by_id["display_edge_place_cadiz_place_havana"]
        self.assertEqual(ch["record_count"], 3)
        self.assertEqual(len(ch["constituent_vessel_ids"]), 3)
        self.assertEqual(len(ch["constituent_route_ids"]), 3)
        self.assertEqual(ch["member_years"], [1684, 1695, 1706])

    def test_crespo_garrote_recurring_master_depth(self):
        """Garrote entity resolution must maintain evidence chain, probable_match state, and member occurrence years."""
        persons = {p["id"]: p for p in self.entities.get("persons", [])}
        self.assertIn("person_bartolome_antonio_garrote", persons)
        garrote = persons["person_bartolome_antonio_garrote"]

        self.assertEqual(garrote["evidence_state"], "probable_match")
        self.assertEqual(garrote["recorded_year_range"], [1688, 1706])
        self.assertEqual(garrote["member_occurrence_years"], [1688, 1693, 1701, 1706])

        # Prohibit continuous career overstatement in published person data
        notes = garrote.get("notes", "").lower()
        self.assertNotIn("career span", notes)
        self.assertNotIn("18-year career", notes)

        # Verify four constituent person occurrences
        person_occs = {po["id"]: po for po in self.entities.get("person_occurrences", [])}
        expected_occ_ids = [
            "occ_person_crespo_6627_master",
            "occ_person_crespo_6906_master",
            "occ_person_crespo_6890_master",
            "occ_person_crespo_6825_master",
        ]
        for occ_id in expected_occ_ids:
            self.assertIn(occ_id, person_occs)

        # Verify each constituent occurrence resolves specifically as probable_match to Garrote
        edges = {
            e["occurrence_id"]: e
            for e in self.entities.get("entity_resolution_edges", [])
            if e["occurrence_id"] in expected_occ_ids
        }
        self.assertEqual(len(edges), 4)
        for occ_id, edge in edges.items():
            self.assertEqual(edge["target_entity_id"], "person_bartolome_antonio_garrote")
            self.assertEqual(edge["resolution_state"], "probable_match")

        # Verify negative evidence 6820 exists in source records for reconciliation dossier traceability
        source_recs = {sr["id"]: sr for sr in self.sources.get("source_records", [])}
        self.assertIn("sr_crespo_navio_6820", source_recs)
        sr_6820 = source_recs["sr_crespo_navio_6820"]
        self.assertEqual(sr_6820["native_identifier"], "6820")

        # Verify Francisco Antonio Garrote does NOT exist as a canonical person
        for p in persons.values():
            self.assertNotIn("francisco", p["canonical_name"].lower())

    def test_packet6_review_bundle_cohort_derivation(self):
        """Review bundle cohort dossiers must be mechanically derived from authoritative records without hardcoded constants."""
        bundle_path = Path(__file__).resolve().parent.parent / "data" / "review" / "bundles" / "packet6" / "review_bundle.json"
        self.assertTrue(bundle_path.exists(), "review_bundle.json must exist")

        with open(bundle_path, encoding="utf-8") as f:
            bundle = json.load(f)

        # Bundle must not claim its own commit SHA or contain fluctuating build timestamps
        self.assertNotIn("head_ref", bundle.get("comparison", {}))
        self.assertNotIn("generated_at", bundle)
        self.assertEqual(bundle.get("comparison", {}).get("base_ref"), "origin/main")

        cohort = {d["navio_id"]: d for d in bundle.get("cohort_dossiers", [])}
        self.assertEqual(set(cohort.keys()), {5890, 4493, 4501})

        # Vessel 4493: West Indische Gally (1706), NOT De Jonge Margaretha (1708)
        d4493 = cohort[4493]
        self.assertEqual(d4493["vessel_name"], "West Indische Gally")
        self.assertEqual(d4493["year"], 1706)
        self.assertEqual(d4493["route"], "Curaçao -> Amsterdam")
        self.assertEqual(d4493["goods_lines_count"], 16)
        self.assertEqual(d4493["reconciliation_status"], "REFERENCE_TABLE_REPRESENTATION_CONFLICT")

        # Vessel 4501: La Provincia de Zeelanda (1700), NOT De Jonge Jacob (1708)
        d4501 = cohort[4501]
        self.assertEqual(d4501["vessel_name"], "La Provincia de Zeelanda")
        self.assertEqual(d4501["year"], 1700)
        self.assertEqual(d4501["route"], "Curaçao -> Amsterdam")
        self.assertEqual(d4501["goods_lines_count"], 9)
        self.assertEqual(d4501["reconciliation_status"], "MATCH")
        self.assertIn("10491 pesos", d4501.get("goods_valuation_finding", ""))

        # Vessel 5890: Nuestra Señora de la Estrella (1694), Venezuela -> Sevilla ?
        d5890 = cohort[5890]
        self.assertEqual(d5890["vessel_name"], "Nuestra Señora de la Estrella")
        self.assertEqual(d5890["year"], 1694)
        self.assertEqual(d5890["route"], "Venezuela -> Sevilla ?")
        self.assertNotIn("La Guaira", d5890["route"])
        self.assertEqual(d5890["goods_lines_count"], 135)
        self.assertEqual(d5890["distinct_consignees_count"], 86)
        self.assertEqual(d5890["reconciliation_status"], "PARTIAL_MATCH_WITH_UNEXPLAINED_QUANTITY_DIFFERENCE")

    def test_packet6_places_precision_and_provenance(self):
        """Packet 6 place entities must declare source-bounded precision and navigation coordinate provenance."""
        places = {p["id"]: p for p in self.entities.get("places", [])}
        self.assertIn("place_venezuela", places)
        self.assertIn("place_curacao", places)
        self.assertIn("place_puerto_rico", places)
        self.assertIn("place_amsterdam", places)
        self.assertIn("place_seville", places)

        # Venezuela: broad province/region precision, generalized coordinate, no spurious La Guaira resolution
        vz = places["place_venezuela"]
        self.assertEqual(vz["canonical_name"], "Venezuela")
        self.assertEqual(vz["geographic_precision"], "province_or_region")
        self.assertEqual(vz["geometry_provenance"], "modern_generalized_navigation_reference")
        self.assertNotIn("La Guaira", vz.get("notes", ""))

        # Curaçao and Puerto Rico: colony_or_island
        cur = places["place_curacao"]
        self.assertEqual(cur["geographic_precision"], "colony_or_island")
        self.assertEqual(cur["geometry_provenance"], "modern_navigation_reference_coordinate")

        pr = places["place_puerto_rico"]
        self.assertEqual(pr["geographic_precision"], "colony_or_island")
        self.assertEqual(pr["geometry_provenance"], "modern_navigation_reference_coordinate")

        # Amsterdam and Sevilla: port_city, evidence-description notes without unsupported institutional overclaims
        ams = places["place_amsterdam"]
        self.assertEqual(ams["geographic_precision"], "port_city")
        self.assertNotIn("Primary", ams.get("notes", ""))

        sev = places["place_seville"]
        self.assertEqual(sev["geographic_precision"], "port_city")
        self.assertNotIn("Casa de la Contratación", sev.get("notes", ""))

if __name__ == "__main__":
    unittest.main()
