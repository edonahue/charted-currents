#!/usr/bin/env node
/**
 * tests/test_validator_negative.mjs
 *
 * Negative tests proving that validatePublishedData detects and rejects
 * invalid schemas, missing files, broken referential links, and unauthorized rights states.
 *
 * Usage: node tests/test_validator_negative.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { validatePublishedData } from "../scripts/validate-published-data.mjs";

console.log("=== Running Publication Validator Negative Tests ===");

const sourceDataDir = path.resolve(process.cwd(), "public", "data");
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName}`);
    failedTests++;
  }
}

function createTempDataCopy() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cc-val-neg-"));
  for (const file of fs.readdirSync(sourceDataDir)) {
    fs.copyFileSync(path.join(sourceDataDir, file), path.join(tmpDir, file));
  }
  return tmpDir;
}

// Test 1: Missing manifest.json fails
{
  const tmpDir = createTempDataCopy();
  fs.unlinkSync(path.join(tmpDir, "manifest.json"));
  const result = validatePublishedData(tmpDir, true);
  assert(result.valid === false && result.errorCount > 0, "Validator fails on missing required file (manifest.json)");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Test 2: Source record referencing nonexistent source_id fails
{
  const tmpDir = createTempDataCopy();
  const sources = JSON.parse(fs.readFileSync(path.join(tmpDir, "sources.json"), "utf8"));
  sources.source_records[0].source_id = "src_nonexistent_fake_source";
  fs.writeFileSync(path.join(tmpDir, "sources.json"), JSON.stringify(sources));
  const result = validatePublishedData(tmpDir, true);
  assert(result.valid === false && result.errorCount > 0, "Validator fails when source_record references nonexistent source_id");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Test 3: Assertion referencing nonexistent source_record_id fails
{
  const tmpDir = createTempDataCopy();
  const sources = JSON.parse(fs.readFileSync(path.join(tmpDir, "sources.json"), "utf8"));
  sources.assertions[0].source_record_id = "sr_nonexistent_record";
  fs.writeFileSync(path.join(tmpDir, "sources.json"), JSON.stringify(sources));
  const result = validatePublishedData(tmpDir, true);
  assert(result.valid === false && result.errorCount > 0, "Validator fails when assertion references nonexistent source_record_id");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Test 4: Ship occurrence referencing nonexistent assertion ID fails
{
  const tmpDir = createTempDataCopy();
  const entities = JSON.parse(fs.readFileSync(path.join(tmpDir, "entities.json"), "utf8"));
  entities.ship_occurrences[0].assertion_ids.push("ast_fake_nonexistent");
  fs.writeFileSync(path.join(tmpDir, "entities.json"), JSON.stringify(entities));
  const result = validatePublishedData(tmpDir, true);
  assert(result.valid === false && result.errorCount > 0, "Validator fails when ship occurrence references nonexistent assertion ID");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Test 5: Source with unknown_review_required rights posture fails
{
  const tmpDir = createTempDataCopy();
  const sources = JSON.parse(fs.readFileSync(path.join(tmpDir, "sources.json"), "utf8"));
  sources.sources[0].rights_posture = "unknown_review_required";
  fs.writeFileSync(path.join(tmpDir, "sources.json"), JSON.stringify(sources));
  const result = validatePublishedData(tmpDir, true);
  assert(result.valid === false && result.errorCount > 0, "Validator fails when a source has 'unknown_review_required' rights posture");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Test 6: Route claiming is_track_observed: true fails
{
  const tmpDir = createTempDataCopy();
  const routes = JSON.parse(fs.readFileSync(path.join(tmpDir, "routes.geojson"), "utf8"));
  routes.features[0].properties.is_track_observed = true;
  fs.writeFileSync(path.join(tmpDir, "routes.geojson"), JSON.stringify(routes));
  const result = validatePublishedData(tmpDir, true);
  assert(result.valid === false && result.errorCount > 0, "Validator fails when route feature claims is_track_observed === true");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Test 7: Invalid inspection_state on source record fails
{
  const tmpDir = createTempDataCopy();
  const sources = JSON.parse(fs.readFileSync(path.join(tmpDir, "sources.json"), "utf8"));
  sources.source_records[0].inspection_state = "unverified_speculation";
  fs.writeFileSync(path.join(tmpDir, "sources.json"), JSON.stringify(sources));
  const result = validatePublishedData(tmpDir, true);
  assert(result.valid === false && result.errorCount > 0, "Validator fails when source record has invalid inspection_state");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Test 8: Nonexistent upstream_archive_source_id fails
{
  const tmpDir = createTempDataCopy();
  const sources = JSON.parse(fs.readFileSync(path.join(tmpDir, "sources.json"), "utf8"));
  sources.source_records[0].upstream_archive_source_id = "src_fake_archive";
  fs.writeFileSync(path.join(tmpDir, "sources.json"), JSON.stringify(sources));
  const result = validatePublishedData(tmpDir, true);
  assert(result.valid === false && result.errorCount > 0, "Validator fails when upstream_archive_source_id does not exist");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Test 9: Attestation referencing nonexistent source_record_id fails
{
  const tmpDir = createTempDataCopy();
  const entities = JSON.parse(fs.readFileSync(path.join(tmpDir, "entities.json"), "utf8"));
  entities.places[0].attestations = [
    {
      raw_name: "Fake Name",
      evidence_layer: "scholarly_dataset_value",
      language: "es",
      attestation_relationship: "source_transcription",
      source_record_id: "sr_fake_nonexistent_record"
    }
  ];
  fs.writeFileSync(path.join(tmpDir, "entities.json"), JSON.stringify(entities));
  const result = validatePublishedData(tmpDir, true);
  assert(result.valid === false && result.errorCount > 0, "Validator fails when attestation references nonexistent source_record_id");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Test 10: Attestation with invalid evidence_layer fails
{
  const tmpDir = createTempDataCopy();
  const entities = JSON.parse(fs.readFileSync(path.join(tmpDir, "entities.json"), "utf8"));
  entities.places[0].attestations = [
    {
      raw_name: "Fake Name",
      evidence_layer: "unapproved_speculative_layer",
      language: "es",
      attestation_relationship: "source_transcription",
      source_record_id: "sr_crespo_navio_6156"
    }
  ];
  fs.writeFileSync(path.join(tmpDir, "entities.json"), JSON.stringify(entities));
  const result = validatePublishedData(tmpDir, true);
  assert(result.valid === false && result.errorCount > 0, "Validator fails when attestation has invalid evidence_layer");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

console.log(`\nNegative Test Summary: ${passedTests} passed, ${failedTests} failed.`);
process.exit(failedTests > 0 ? 1 : 0);
