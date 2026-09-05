import json
import os
import unittest

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ENTITIES_PATH = os.path.join(REPO_ROOT, "public/data/entities.json")
SOURCES_PATH = os.path.join(REPO_ROOT, "public/data/sources.json")
REPORT_PATH = os.path.join(REPO_ROOT, "data/source_acquisitions/loc_gm71005442/georeference_report.json")
METADATA_PATH = os.path.join(REPO_ROOT, "data/source_acquisitions/loc_gm71005442/metadata.json")


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

    def test_georeferencing_mathematics_and_epistemic_honesty(self):
        """Georeferencing report must have 14 GCPs, valid 4-corner coordinates, and non-empty disclaimer."""
        rep = self.georef_report
        self.assertEqual(rep["gcp_count"], 14)
        self.assertEqual(len(rep["gcps"]), 14)
        self.assertEqual(rep["projection"], "EPSG:3857")
        self.assertEqual(rep["method"], "gdalwarp_polynomial_order_2")
        self.assertEqual(rep["rmse_in_sample_km"], 94.35)
        self.assertEqual(rep["rmse_loocv_km"], 237.89)

        coords = rep["coordinates"]
        self.assertEqual(len(coords), 4)
        # Top-left, top-right, bottom-right, bottom-left
        tl, tr, br, bl = coords
        self.assertLess(tl[0], -100)
        self.assertGreater(tl[1], 40)
        self.assertGreater(tr[0], -45)
        self.assertGreater(tr[1], 40)
        self.assertGreater(br[0], -45)
        self.assertLess(br[1], 5)
        self.assertLess(bl[0], -100)
        self.assertLess(bl[1], 5)

        disclaimer = rep["epistemic_disclaimer"]
        self.assertNotIn("pre-chronometer", disclaimer)
        self.assertIn("second-order polynomial", disclaimer)
        self.assertIn("historical evidence", disclaimer)

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
        self.assertEqual(georef_ast["derivation_method"], "gdalwarp_polynomial_order_2")
        self.assertEqual(georef_ast["source_assertion_id"], "ast_loc_moll_map_title")
        self.assertEqual(georef_ast["epistemic_class"], "F")
        self.assertEqual(georef_ast["risk_class"], "F")
        self.assertEqual(georef_ast["rmse_in_sample_km"], 94.35)
        self.assertEqual(georef_ast["rmse_loocv_km"], 237.89)


if __name__ == "__main__":
    unittest.main()
