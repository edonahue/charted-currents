#!/usr/bin/env python3
"""
tests/test_packet_report_integrity.py

Unit and regression tests verifying that scripts/packet-report.mjs outputs
machine-derived facts and quality audit metrics directly from committed/generated
JSON artifacts without manual reconstruction drift.
"""

import json
import os
import subprocess
import unittest

class TestPacketReportIntegrity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        cls.script_path = os.path.join(cls.repo_root, "scripts", "packet-report.mjs")
        cls.benchmark_path = os.path.join(
            cls.repo_root,
            "data",
            "source_acquisitions",
            "loc_gm71005442",
            "candidate_benchmark.json"
        )
        cls.quality_path = os.path.join(
            cls.repo_root,
            "test-results",
            "quality-audit.json"
        )
        cls.manifest_path = os.path.join(
            cls.repo_root,
            "public",
            "data",
            "manifest.json"
        )

    def run_report(self, *extra_args):
        cmd = ["node", self.script_path, "--json", *extra_args]
        result = subprocess.run(
            cmd,
            cwd=self.repo_root,
            capture_output=True,
            text=True,
            check=True
        )
        return json.loads(result.stdout)

    def test_json_validity_and_schema_keys(self):
        """packet-report.mjs --json must produce valid JSON with required lifecycle keys."""
        report = self.run_report()
        self.assertIn("state", report)
        self.assertEqual(report["state"], "NO_ACTIVE_PACKET")
        self.assertIn("git", report)
        self.assertIn("corpus", report)
        self.assertIn("evidence_graph", report)
        self.assertIn("caveat", report)

    def test_explicit_state_override(self):
        """Passing --state=<STATE> explicitly must override default state."""
        report_self_verified = self.run_report("--state=SELF_VERIFIED_REQUIRES_EXTERNAL_REVIEW")
        self.assertEqual(report_self_verified["state"], "SELF_VERIFIED_REQUIRES_EXTERNAL_REVIEW")

        report_accepted = self.run_report("--state=ACCEPTED")
        self.assertEqual(report_accepted["state"], "ACCEPTED")

    def test_active_packet_lifecycle_state(self):
        """When an active packet contract is present, its lifecycle state must be reported."""
        import tempfile
        sample_packet = {
            "packet_id": "packet12_mock",
            "lifecycle_state": "IMPLEMENTING"
        }
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as tf:
            json.dump(sample_packet, tf)
            tf_path = tf.name

        try:
            report = self.run_report(f"--packet={tf_path}")
            self.assertEqual(report["state"], "IMPLEMENTING")
            self.assertIsNotNone(report.get("active_packet"))
            self.assertEqual(report["active_packet"]["packet_id"], "packet12_mock")
        finally:
            if os.path.exists(tf_path):
                os.unlink(tf_path)

    def test_state_precedence_explicit_over_packet(self):
        """Explicit --state must take precedence over active packet contract state."""
        import tempfile
        sample_packet = {
            "packet_id": "packet12_mock",
            "lifecycle_state": "IMPLEMENTING"
        }
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as tf:
            json.dump(sample_packet, tf)
            tf_path = tf.name

        try:
            report = self.run_report(f"--packet={tf_path}", "--state=ACCEPTED")
            self.assertEqual(report["state"], "ACCEPTED")
        finally:
            if os.path.exists(tf_path):
                os.unlink(tf_path)

    def test_corpus_counts_match_manifest(self):
        """Reported corpus counts must match public/data/manifest.json exactly."""
        with open(self.manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)

        report = self.run_report()
        manifest_counts = manifest.get("counts", {})
        report_counts = report["corpus"]["counts"]

        for key, expected_val in manifest_counts.items():
            self.assertEqual(
                report_counts.get(key),
                expected_val,
                f"Count mismatch for {key}: report={report_counts.get(key)} manifest={expected_val}"
            )

    def test_facts_omitted_when_not_passed(self):
        """When --facts is not provided, machine_derived_facts must be null (no hardcoded fallback)."""
        report = self.run_report()
        self.assertIsNone(report.get("machine_derived_facts"))

    def test_generic_facts_passthrough(self):
        """When --facts points to any arbitrary JSON, packet-report must pass it through faithfully."""
        import tempfile
        sample_facts = {
            "test_key": "test_value",
            "number_val": 42,
            "nested": {"inner_key": "inner_val"}
        }
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as tf:
            json.dump(sample_facts, tf)
            tf_path = tf.name

        try:
            report = self.run_report(f"--facts={tf_path}")
            self.assertIsNotNone(report.get("machine_derived_facts"))
            self.assertEqual(report["machine_derived_facts"]["facts"], sample_facts)
        finally:
            if os.path.exists(tf_path):
                os.unlink(tf_path)

    def test_facts_integrity_with_benchmark_artifact(self):
        """Facts passed via --facts must match candidate_benchmark.json exact metrics."""
        if not os.path.exists(self.benchmark_path):
            self.skipTest("candidate_benchmark.json not present on this checkout")

        with open(self.benchmark_path, "r", encoding="utf-8") as f:
            bench = json.load(f)

        report = self.run_report(f"--facts={self.benchmark_path}")
        self.assertIsNotNone(report.get("machine_derived_facts"))
        reported_facts = report["machine_derived_facts"]["facts"]

        c_expected = bench["candidate_c_full_scope"]
        c_actual = reported_facts["candidate_c_full_scope"]

        self.assertEqual(c_actual["gcp_count"], c_expected["gcp_count"])
        self.assertAlmostEqual(c_actual["rmse_in_sample_km"], c_expected["rmse_in_sample_km"], places=2)
        self.assertAlmostEqual(c_actual["rmse_loocv_km"], c_expected["rmse_loocv_km"], places=2)
        self.assertAlmostEqual(c_actual["loocv_mean_km"], c_expected["loocv_mean_km"], places=2)
        self.assertAlmostEqual(c_actual["loocv_median_km"], c_expected["loocv_median_km"], places=2)
        self.assertAlmostEqual(c_actual["loocv_max_km"], c_expected["loocv_max_km"], places=2)
        self.assertEqual(c_actual["loocv_max_feature"], c_expected["loocv_max_feature"])

    def test_quality_audit_integrity(self):
        """Quality audit metrics passed via --quality must match test-results/quality-audit.json."""
        if not os.path.exists(self.quality_path):
            self.skipTest("test-results/quality-audit.json not present; run npm run review:quality first")

        with open(self.quality_path, "r", encoding="utf-8") as f:
            quality = json.load(f)

        report = self.run_report(f"--quality={self.quality_path}")
        self.assertIsNotNone(report.get("quality_audit"))
        qa = report["quality_audit"]
        self.assertEqual(qa["summary"]["critical_a11y"], 0)
        self.assertEqual(qa["summary"]["unallowed_serious_a11y"], 0)
        total_journeys = len(quality.get("journeys", []))
        self.assertGreaterEqual(total_journeys, 4)
        self.assertEqual(qa["journeys_passed"], total_journeys)
        self.assertEqual(qa["journeys_total"], total_journeys)
        self.assertEqual(qa["summary"]["layout_failures"], 0)

if __name__ == "__main__":
    unittest.main()
