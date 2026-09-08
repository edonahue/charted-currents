import json
import os
import unittest

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ENTITIES_PATH = os.path.join(REPO_ROOT, "public/data/entities.json")
SOURCES_PATH = os.path.join(REPO_ROOT, "public/data/sources.json")
REPORT_PATH = os.path.join(REPO_ROOT, "data/source_acquisitions/loc_gm71005442/georeference_report.json")
METADATA_PATH = os.path.join(REPO_ROOT, "data/source_acquisitions/loc_gm71005442/metadata.json")
GCP_AUDIT_PATH = os.path.join(REPO_ROOT, "data/source_acquisitions/loc_gm71005442/gcp_audit.json")
GRATICULE_AUDIT_PATH = os.path.join(REPO_ROOT, "data/source_acquisitions/loc_gm71005442/graticule_audit.json")
BENCHMARK_PATH = os.path.join(REPO_ROOT, "data/source_acquisitions/loc_gm71005442/candidate_benchmark.json")


class TestPeriodMapLayerInvariants(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(ENTITIES_PATH, "r", encoding="utf-8") as f:
            cls.entities = json.load(f)
        with open(SOURCES_PATH, "r", encoding="utf-8") as f:
            cls.sources = json.load(f)
        with open(REPORT_PATH, "r", encoding="utf-8") as f:
            cls.georef_report = json.load(f)
        with open(METADATA_PATH, "r", encoding="utf-8") as f:
            cls.acquisition_meta = json.load(f)
        with open(GCP_AUDIT_PATH, "r", encoding="utf-8") as f:
            cls.gcp_audit = json.load(f)
        with open(GRATICULE_AUDIT_PATH, "r", encoding="utf-8") as f:
            cls.graticule_audit = json.load(f)
        with open(BENCHMARK_PATH, "r", encoding="utf-8") as f:
            cls.benchmark = json.load(f)

    def test_loc_source_provenance_and_rights(self):
        """Herman Moll 1715 source must preserve LOC holding, call number, and open public domain rights."""
        sources_by_id = {s["id"]: s for s in self.sources["sources"]}
        self.assertIn("src_loc_g4390_1715", sources_by_id)
        src = sources_by_id["src_loc_g4390_1715"]
        self.assertIn("Herman Moll", src["creator"])
        self.assertIn("Library of Congress", src["holding_institution"])
        self.assertIn("G4390 1715 .M6", src["stable_identifier"])
        self.assertEqual(src["rights_posture"], "open_public_domain")
        self.assertEqual(src["credit_line"], "Library of Congress, Geography and Map Division")
        self.assertEqual(src["item_url"], "https://www.loc.gov/item/gm71005442/")

    def test_source_record_and_inspection_state(self):
        """Source record for Moll 1715 must be digital_content_inspected."""
        records_by_id = {r["id"]: r for r in self.sources["source_records"]}
        self.assertIn("sr_loc_ct003986", records_by_id)
        sr = records_by_id["sr_loc_ct003986"]
        self.assertEqual(sr["source_id"], "src_loc_g4390_1715")
        self.assertEqual(sr["inspection_state"], "digital_content_inspected")
        self.assertEqual(sr["record_type"], "historical_map")

    def test_visual_entity_attributes(self):
        """Published visual entity must contain georeferencing coordinates and valid asset paths."""
        visuals = {v["id"]: v for v in self.entities.get("visuals", [])}
        self.assertIn("visual_moll_west_indies_1715", visuals)
        vis = visuals["visual_moll_west_indies_1715"]
        self.assertEqual(vis["date_display"], "[1715?]")
        self.assertEqual(vis["year_recorded"], 1715)
        self.assertTrue(vis["is_uncertain"])
        self.assertEqual(vis["call_number"], "G4390 1715 .M6")
        self.assertEqual(vis["digital_id"], "g4390.ct003986")

        # Check asset files exist on disk
        asset_full = os.path.join(REPO_ROOT, "public", vis["asset_path"])
        self.assertTrue(os.path.exists(asset_full), f"Missing asset: {asset_full}")
        rect_full = os.path.join(REPO_ROOT, "public", vis["rectified_asset_path"])
        self.assertTrue(os.path.exists(rect_full), f"Missing rectified asset: {rect_full}")

        # Check WebP size constraint (<= 1.5 MB)
        size_bytes = os.path.getsize(rect_full)
        self.assertLessEqual(size_bytes, 1572864, f"Derivative too large: {size_bytes} bytes")

    def test_georeferencing_deterministic_reproduction(self):
        """Georeferencing report must have 13 main-chart GCPs, valid affine derivation, and pinned report values."""
        rep = self.georef_report
        self.assertEqual(rep["gcp_count"], 13)
        self.assertEqual(len(rep["gcps"]), 13)
        self.assertEqual(rep["projection"], "EPSG:3857")
        self.assertEqual(rep["method"], "gdalwarp_affine_order_1")
        self.assertEqual(rep.get("residual_distance_metric"), "great_circle_haversine_km")
        self.assertEqual(rep.get("derivative_dimensions"), [2560, 1422])
        self.assertEqual(rep.get("intermediate_warped_dimensions"), [5832, 3241])

        coords = rep["coordinates"]
        self.assertEqual(len(coords), 4)
        # Top-left, top-right, bottom-right, bottom-left
        tl, tr, br, bl = coords
        self.assertLess(tl[0], -100)
        self.assertGreater(tl[1], 30)
        self.assertGreater(tr[0], -60)
        self.assertLess(tr[0], -50)
        self.assertGreater(tr[1], 30)
        self.assertGreater(br[0], -60)
        self.assertLess(br[0], -50)
        self.assertLess(br[1], 15)
        self.assertLess(bl[0], -100)
        self.assertLess(bl[1], 15)

    def test_georeferencing_quality_acceptance_thresholds(self):
        """Quality acceptance gate: LOOCV RMSE <= 130 km, in-sample RMSE <= 100 km, beating baseline."""
        rep = self.georef_report

        # Global quality thresholds
        self.assertLessEqual(rep["rmse_loocv_km"], 130.0, f"LOOCV RMSE too high: {rep['rmse_loocv_km']} km")
        self.assertLessEqual(rep["rmse_in_sample_km"], 100.0, f"In-sample RMSE too high: {rep['rmse_in_sample_km']} km")
        self.assertLessEqual(rep.get("loocv_max_km", 999.0), 190.0, f"Max LOOCV error too high: {rep.get('loocv_max_km')} km")

        # Significant improvement over Packet 8 baseline (was 209.65 km LOOCV)
        self.assertLess(rep["rmse_loocv_km"], 150.0, "Corrected LOOCV RMSE must materially improve over Packet 8 baseline")

    def test_individual_port_tolerances(self):
        """Enforces individual port error gates including R11 Willemstad pinpoint gate (<= 190 km)."""
        rep = self.georef_report
        gcp_map = {g["name"]: g for g in rep["gcps"]}

        self.assertIn("Havana, Cuba", gcp_map)
        self.assertLessEqual(gcp_map["Havana, Cuba"]["residual_loocv_km"], 160.0)

        self.assertIn("Port Royal, Jamaica", gcp_map)
        self.assertLessEqual(gcp_map["Port Royal, Jamaica"]["residual_loocv_km"], 160.0)

        self.assertIn("San Juan, Puerto Rico", gcp_map)
        self.assertLessEqual(gcp_map["San Juan, Puerto Rico"]["residual_loocv_km"], 120.0)

        self.assertIn("Santo Domingo, Hispaniola", gcp_map)
        self.assertLessEqual(gcp_map["Santo Domingo, Hispaniola"]["residual_loocv_km"], 80.0)

        self.assertIn("Portobelo, Panama", gcp_map)
        self.assertLessEqual(gcp_map["Portobelo, Panama"]["residual_loocv_km"], 100.0)

        self.assertIn("Cartagena, Colombia", gcp_map)
        self.assertLessEqual(gcp_map["Cartagena, Colombia"]["residual_loocv_km"], 200.0)

        # R11 Willemstad Pinpoint Gate
        self.assertIn("Willemstad, Curacao", gcp_map)
        self.assertLessEqual(
            gcp_map["Willemstad, Curacao"]["residual_loocv_km"],
            190.0,
            f"Willemstad LOOCV error {gcp_map['Willemstad, Curacao']['residual_loocv_km']} km exceeds 190 km gate"
        )

    def test_loc_inset_exclusion_and_bermuda_invariants(self):
        """Verifies exactly 6 LOC catalogued insets, 5 masked inside crop, 1 outside crop, and Bermuda preserved (R8, R15)."""
        rep = self.georef_report
        grat = self.graticule_audit

        self.assertEqual(rep.get("catalogued_insets_count"), 6)
        self.assertEqual(rep.get("insets_inside_crop"), 5)
        self.assertEqual(rep.get("insets_outside_crop"), 1)
        self.assertEqual(rep.get("bermuda_status"), "preserved_in_main_chart_unmasked")

        # 3 masked inset boxes documented
        self.assertEqual(len(rep.get("masked_inset_boxes", [])), 3)

        # Verify Bermuda is not an inset in graticule audit
        self.assertFalse(grat["bermuda_status"]["is_loc_catalogue_inset"])
        self.assertEqual(grat["bermuda_status"]["treatment"], "preserved_unmasked_in_main_chart")

        # Verify exactly 6 insets in graticule audit catalogued list
        self.assertEqual(len(grat["catalogued_insets"]), 6)
        insets_order = [ins["title"] for ins in grat["catalogued_insets"]]
        self.assertEqual(insets_order[0], "La Vera Cruz")
        self.assertEqual(insets_order[1], "A draught of ye bay & citty of Havana")
        self.assertEqual(insets_order[2], "The bay of Porto Bella")
        self.assertEqual(insets_order[3], "A draught of St. Augustin and its harbour")
        self.assertEqual(insets_order[4], "A draught of ye citty of Cartagena its harbour & forts")
        self.assertEqual(insets_order[5], "The city of Mexico in New Spain")

    def test_georeferencing_epistemic_honesty(self):
        """Epistemic disclaimer must be honest regarding affine alignment and source-map cartographic limitations."""
        disclaimer = self.georef_report.get("epistemic_disclaimer", "")
        self.assertIn("affine", disclaimer)
        self.assertIn("13 historical coastal and harbor ground control points", disclaimer)
        self.assertIn("residual disagreement", disclaimer)
        self.assertIn("five catalogued harbor and city inset panels inside the neatline are excluded", disclaimer)
        self.assertIn("Bermuda is preserved as continuous main-chart geography", disclaimer)
        self.assertNotIn("pre-chronometer", disclaimer)

    def test_cartographic_assertions(self):
        """Map features (trade winds, flota tracks, and georeference) must be published assertions."""
        asts_by_id = {a["id"]: a for a in self.sources["assertions"]}
        self.assertIn("ast_loc_moll_map_title", asts_by_id)
        self.assertIn("ast_loc_moll_map_date", asts_by_id)
        self.assertIn("ast_loc_moll_map_trade_winds", asts_by_id)
        self.assertIn("ast_loc_moll_map_flota_tracks", asts_by_id)
        self.assertIn("ast_loc_moll_georeference", asts_by_id)

        self.assertEqual(asts_by_id["ast_loc_moll_map_trade_winds"]["raw_value"], "also ye trade winds")
        self.assertEqual(
            asts_by_id["ast_loc_moll_map_flota_tracks"]["raw_value"],
            "and ye several tracts made by ye galeons and flota from place to place",
        )

        georef_ast = asts_by_id["ast_loc_moll_georeference"]
        self.assertEqual(georef_ast["derivation_method"], "gdalwarp_affine_order_1")
        self.assertEqual(georef_ast["source_assertion_id"], "ast_loc_moll_map_title")
        self.assertEqual(georef_ast["epistemic_class"], "F")
        self.assertEqual(georef_ast["risk_class"], "F")
        self.assertEqual(georef_ast["rmse_in_sample_km"], 79.57)
        self.assertEqual(georef_ast["rmse_loocv_km"], 107.68)

    def test_acquisition_metadata_invariants(self):
        """Acquisition metadata must preserve [1715?] uncertainty and verified Bowles imprint."""
        meta = self.acquisition_meta
        self.assertEqual(meta["item_id"], "gm71005442")
        self.assertEqual(meta["date_display"], "[1715?]")
        self.assertTrue(meta["is_uncertain"])
        self.assertEqual(
            meta["imprint"],
            "Printed for Tho: Bowles in St. Pauls Church Yard and Iohn Bowles at the Black Horse in Cornhill.",
        )
        self.assertEqual(meta["rights_state"], "open_public_domain")

    def test_candidate_benchmark_and_common_core_invariants(self):
        """Verifies Candidate C vs F1 benchmark and common-core evaluation (R16, R16B, R19)."""
        bm = self.benchmark
        self.assertIn("candidate_c_full_scope", bm)
        self.assertIn("candidate_f1_full_scope", bm)
        self.assertIn("common_core_comparison", bm)

        c_full = bm["candidate_c_full_scope"]
        f1_full = bm["candidate_f1_full_scope"]
        core = bm["common_core_comparison"]

        # Scope counts
        self.assertEqual(c_full["gcp_count"], 13)
        self.assertEqual(f1_full["gcp_count"], 10)
        self.assertEqual(core["common_core_gcp_count"], 10)

        # Candidate C full scope metrics
        self.assertAlmostEqual(c_full["rmse_in_sample_km"], 79.57, places=2)
        self.assertAlmostEqual(c_full["rmse_loocv_km"], 107.68, places=2)
        self.assertAlmostEqual(c_full["loocv_median_km"], 86.99, places=2)
        self.assertEqual(c_full["loocv_max_feature"], "Bridgetown, Barbados")

        # Candidate F1 full scope metrics
        self.assertAlmostEqual(f1_full["rmse_in_sample_km"], 69.80, places=2)
        self.assertAlmostEqual(f1_full["rmse_loocv_km"], 101.16, places=2)
        self.assertAlmostEqual(f1_full["loocv_median_km"], 97.94, places=2)
        self.assertEqual(f1_full["loocv_max_feature"], "Veracruz, Mexico")

        # Common core evaluation
        expected_core_ids = [
            "gcp_moll_havana",
            "gcp_moll_port_royal",
            "gcp_moll_veracruz",
            "gcp_moll_cartagena",
            "gcp_moll_portobelo",
            "gcp_moll_san_juan",
            "gcp_moll_santo_domingo",
            "gcp_moll_willemstad",
            "gcp_moll_cabo_san_antonio",
            "gcp_moll_cabo_maisi",
        ]
        self.assertEqual(core["common_core_ids"], expected_core_ids)

        c_core = core["candidate_c"]
        f1_core = core["candidate_f1"]

        self.assertAlmostEqual(c_core["loocv_rmse_km"], 102.07, places=2)
        self.assertAlmostEqual(f1_core["loocv_rmse_km"], 101.16, places=2)
        self.assertAlmostEqual(core["delta_rmse_loocv_km"], 0.91, places=2)

        # Mathematical recomputation consistency
        self.assertAlmostEqual(core["delta_rmse_loocv_km"], c_core["loocv_rmse_km"] - f1_core["loocv_rmse_km"], places=2)
        self.assertAlmostEqual(core["delta_mean_loocv_km"], c_core["loocv_mean_km"] - f1_core["loocv_mean_km"], places=2)
        self.assertAlmostEqual(core["delta_median_loocv_km"], c_core["loocv_median_km"] - f1_core["loocv_median_km"], places=3)

        # Candidate C has lower mean and median error on the common core
        self.assertLess(c_core["loocv_mean_km"], f1_core["loocv_mean_km"])
        self.assertLess(c_core["loocv_median_km"], f1_core["loocv_median_km"])
        self.assertAlmostEqual(c_core["loocv_mean_km"], 93.14, places=2)
        self.assertAlmostEqual(f1_core["loocv_mean_km"], 96.50, places=2)
        self.assertAlmostEqual(c_core["loocv_median_km"], 83.105, places=2)
        self.assertAlmostEqual(f1_core["loocv_median_km"], 97.94, places=2)

        # F1 review asset exists in working directory outside public/
        f1_asset_path = os.path.join(REPO_ROOT, f1_full["asset_path"])
        self.assertTrue(os.path.exists(f1_asset_path), f"F1 review asset missing: {f1_asset_path}")
        self.assertEqual(f1_full["derivative_dimensions"], [2560, 1562])
        self.assertLessEqual(os.path.getsize(f1_asset_path), 1000000)

        # Public asset hygiene: public/assets/visuals/review must NOT exist
        public_review_dir = os.path.join(REPO_ROOT, "public/assets/visuals/review")
        self.assertFalse(os.path.exists(public_review_dir), "Review visuals must never be stored in public/ production assets")

        # Selection rationale sanity check: no forbidden phrases
        sel = json.dumps(bm["selection_analysis"])
        self.assertNotIn("route to Europe", sel)
        self.assertNotIn("route to Spain", sel)
        self.assertNotIn("116.45", json.dumps(bm))
        self.assertNotIn("pre-chronometer", json.dumps(bm))
        self.assertNotIn("marine chronometer", json.dumps(bm))
        self.assertNotIn("degrees of freedom", sel.lower())
        self.assertNotIn("clipped", sel.lower())
        self.assertNotIn("truncated", sel.lower())


if __name__ == "__main__":
    unittest.main()
