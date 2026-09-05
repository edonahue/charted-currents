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

// Test 10: Invalid evidence_layer on attestation fails
{
  const tmpDir = createTempDataCopy();
  const entities = JSON.parse(fs.readFileSync(path.join(tmpDir, "entities.json"), "utf8"));
  entities.places[0].attestations = [
    {
      raw_name: "Fake Name",
      evidence_layer: "synthetic_conjecture",
      language: "es",
      attestation_relationship: "source_transcription",
      source_record_id: entities.ship_occurrences[0].source_record_id
    }
  ];
  fs.writeFileSync(path.join(tmpDir, "entities.json"), JSON.stringify(entities));
  const result = validatePublishedData(tmpDir, true);
  assert(result.valid === false && result.errorCount > 0, "Validator fails when attestation has invalid evidence_layer");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Test 11: Person occurrence referencing nonexistent source_record_id fails
{
  const tmpDir = createTempDataCopy();
  const entities = JSON.parse(fs.readFileSync(path.join(tmpDir, "entities.json"), "utf8"));
  entities.person_occurrences[0].source_record_id = "sr_nonexistent_person_record";
  fs.writeFileSync(path.join(tmpDir, "entities.json"), JSON.stringify(entities));
  const result = validatePublishedData(tmpDir, true);
  assert(result.valid === false && result.errorCount > 0, "Validator fails when person occurrence references nonexistent source_record_id");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Test 12: Fleet convoy referencing nonexistent source_record_id fails
{
  const tmpDir = createTempDataCopy();
  const entities = JSON.parse(fs.readFileSync(path.join(tmpDir, "entities.json"), "utf8"));
  const crespoOcc = entities.ship_occurrences.find(o => o.fleet_convoy);
  crespoOcc.fleet_convoy.source_record_id = "sr_nonexistent_fleet_record";
  fs.writeFileSync(path.join(tmpDir, "entities.json"), JSON.stringify(entities));
  const result = validatePublishedData(tmpDir, true);
  assert(result.valid === false && result.errorCount > 0, "Validator fails when fleet_convoy references nonexistent source_record_id");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Test 13: Person resolution edge referencing nonexistent person fails
{
  const tmpDir = createTempDataCopy();
  const entities = JSON.parse(fs.readFileSync(path.join(tmpDir, "entities.json"), "utf8"));
  const pEdge = entities.entity_resolution_edges.find(e => e.target_entity_id.startsWith("person_"));
  pEdge.target_entity_id = "person_nonexistent_target";
  fs.writeFileSync(path.join(tmpDir, "entities.json"), JSON.stringify(entities));
  const result = validatePublishedData(tmpDir, true);
  assert(result.valid === false && result.errorCount > 0, "Validator fails when person resolution edge references nonexistent person target");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Test 14: Ship occurrence containing synthetic raw_construction_place Unknown fails
{
  const tmpDir = createTempDataCopy();
  const entities = JSON.parse(fs.readFileSync(path.join(tmpDir, "entities.json"), "utf8"));
  entities.ship_occurrences[0].raw_construction_place = "Unknown";
  fs.writeFileSync(path.join(tmpDir, "entities.json"), JSON.stringify(entities));
  const result = validatePublishedData(tmpDir, true);
  assert(result.valid === false && result.errorCount > 0, "Validator fails when ship occurrence contains synthetic 'Unknown' construction place");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Test 15: Person referencing nonexistent occurrence ID fails
{
  const tmpDir = createTempDataCopy();
  const entities = JSON.parse(fs.readFileSync(path.join(tmpDir, "entities.json"), "utf8"));
  entities.persons[0].occurrence_ids.push("occ_person_fake_nonexistent");
  fs.writeFileSync(path.join(tmpDir, "entities.json"), JSON.stringify(entities));
  const result = validatePublishedData(tmpDir, true);
  assert(result.valid === false && result.errorCount > 0, "Validator fails when person references nonexistent occurrence ID");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Test 16: Invalid attestation_relationship on attestation fails
{
  const tmpDir = createTempDataCopy();
  const entities = JSON.parse(fs.readFileSync(path.join(tmpDir, "entities.json"), "utf8"));
  entities.places[0].attestations = [
    {
      raw_name: "Fake Name",
      evidence_layer: "scholarly_dataset_value",
      language: "es",
      attestation_relationship: "fabricated_relationship",
      source_record_id: entities.ship_occurrences[0].source_record_id
    }
  ];
  fs.writeFileSync(path.join(tmpDir, "entities.json"), JSON.stringify(entities));
  const result = validatePublishedData(tmpDir, true);
  assert(result.valid === false && result.errorCount > 0, "Validator fails when attestation has invalid attestation_relationship");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Test 17: Derived assertion missing source_assertion_id fails
{
  const tmpDir = createTempDataCopy();
  const sources = JSON.parse(fs.readFileSync(path.join(tmpDir, "sources.json"), "utf8"));
  const derivedAst = sources.assertions.find(a => a.derived_value !== undefined);
  delete derivedAst.source_assertion_id;
  fs.writeFileSync(path.join(tmpDir, "sources.json"), JSON.stringify(sources));
  const result = validatePublishedData(tmpDir, true);
  assert(result.valid === false && result.errorCount > 0, "Validator fails when derived assertion lacks source_assertion_id");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Test 18: Derived assertion containing raw_value fails
{
  const tmpDir = createTempDataCopy();
  const sources = JSON.parse(fs.readFileSync(path.join(tmpDir, "sources.json"), "utf8"));
  const derivedAst = sources.assertions.find(a => a.derived_value !== undefined);
  derivedAst.raw_value = "Masquerading raw value";
  fs.writeFileSync(path.join(tmpDir, "sources.json"), JSON.stringify(sources));
  const result = validatePublishedData(tmpDir, true);
  assert(result.valid === false && result.errorCount > 0, "Validator fails when derived assertion contains raw_value");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Test 19: Goods occurrence referencing nonexistent ship_occurrence_id fails
{
  const tmpDir = createTempDataCopy();
  const entities = JSON.parse(fs.readFileSync(path.join(tmpDir, "entities.json"), "utf8"));
  entities.goods_occurrences[0].ship_occurrence_id = "occ_ship_fake_nonexistent";
  fs.writeFileSync(path.join(tmpDir, "entities.json"), JSON.stringify(entities));
  const result = validatePublishedData(tmpDir, true);
  assert(result.valid === false && result.errorCount > 0, "Validator fails when goods occurrence references nonexistent ship_occurrence_id");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Test 20: Ethical boundary: representation of enslaved persons as commercial goods fails validator
{
  const tmpDir = createTempDataCopy();
  const entities = JSON.parse(fs.readFileSync(path.join(tmpDir, "entities.json"), "utf8"));
  entities.goods_occurrences[0].commodity_ref_key = 11;
  entities.goods_occurrences[0].recorded_commodity_label = "Esclavo";
  fs.writeFileSync(path.join(tmpDir, "entities.json"), JSON.stringify(entities));
  const result = validatePublishedData(tmpDir, true);
  assert(result.valid === false && result.errorCount > 0, "Validator fails on ethical boundary violation when goods represent enslaved persons");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Test 21: Missing dataset_context.json fails
{
  const tmpDir = createTempDataCopy();
  fs.unlinkSync(path.join(tmpDir, "dataset_context.json"));
  const result = validatePublishedData(tmpDir, true);
  assert(result.valid === false && result.errorCount > 0, "Validator fails on missing required file (dataset_context.json)");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Test 22: Dataset context containing forbidden semantic phrase (e.g. 'ships sailed') fails validator
{
  const tmpDir = createTempDataCopy();
  const dsContext = JSON.parse(fs.readFileSync(path.join(tmpDir, "dataset_context.json"), "utf8"));
  dsContext.places["place_havana"].coverage_caveat = "28 ships sailed through Havana in 1650-1730";
  fs.writeFileSync(path.join(tmpDir, "dataset_context.json"), JSON.stringify(dsContext));
  const result = validatePublishedData(tmpDir, true);
  assert(result.valid === false && result.errorCount > 0, "Validator fails when dataset context contains forbidden phrase ('ships sailed')");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Test 23: Dataset context referencing nonexistent canonical place fails validator
{
  const tmpDir = createTempDataCopy();
  const dsContext = JSON.parse(fs.readFileSync(path.join(tmpDir, "dataset_context.json"), "utf8"));
  dsContext.places["place_nonexistent_fake"] = { ...dsContext.places["place_havana"] };
  fs.writeFileSync(path.join(tmpDir, "dataset_context.json"), JSON.stringify(dsContext));
  const result = validatePublishedData(tmpDir, true);
  assert(result.valid === false && result.errorCount > 0, "Validator fails when dataset context references nonexistent canonical place");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Test 24: Dataset context place with invalid status ('unrecorded') fails validator
{
  const tmpDir = createTempDataCopy();
  const dsContext = JSON.parse(fs.readFileSync(path.join(tmpDir, "dataset_context.json"), "utf8"));
  dsContext.places["place_port_royal"].status = "unrecorded";
  fs.writeFileSync(path.join(tmpDir, "dataset_context.json"), JSON.stringify(dsContext));
  const result = validatePublishedData(tmpDir, true);
  assert(result.valid === false && result.errorCount > 0, "Validator fails when dataset context place has obsolete status ('unrecorded')");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Test 25: Unmapped place with non-null periods fails validator
{
  const tmpDir = createTempDataCopy();
  const dsContext = JSON.parse(fs.readFileSync(path.join(tmpDir, "dataset_context.json"), "utf8"));
  dsContext.places["place_port_royal"].periods = { ...dsContext.places["place_havana"].periods };
  fs.writeFileSync(path.join(tmpDir, "dataset_context.json"), JSON.stringify(dsContext));
  const result = validatePublishedData(tmpDir, true);
  assert(result.valid === false && result.errorCount > 0, "Validator fails when unmapped place has non-null periods object");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Test 26: Mapped place with union arithmetic mismatch fails validator
{
  const tmpDir = createTempDataCopy();
  const dsContext = JSON.parse(fs.readFileSync(path.join(tmpDir, "dataset_context.json"), "utf8"));
  // Break arithmetic: total = 29 instead of 28
  dsContext.places["place_havana"].periods["all"].total_records = 29;
  fs.writeFileSync(path.join(tmpDir, "dataset_context.json"), JSON.stringify(dsContext));
  const result = validatePublishedData(tmpDir, true);
  assert(result.valid === false && result.errorCount > 0, "Validator fails when mapped place violates union arithmetic");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Test 27: Mapped place with counterpart self-reference fails validator
{
  const tmpDir = createTempDataCopy();
  const dsContext = JSON.parse(fs.readFileSync(path.join(tmpDir, "dataset_context.json"), "utf8"));
  dsContext.places["place_havana"].periods["all"].top_counterparts.push({
    crespo_lugar_id: 498,
    source_label: "La Habana",
    total_records: 1,
    recorded_as_destination: 1,
    recorded_as_origin: 0,
  });
  fs.writeFileSync(path.join(tmpDir, "dataset_context.json"), JSON.stringify(dsContext));
  const result = validatePublishedData(tmpDir, true);
  assert(result.valid === false && result.errorCount > 0, "Validator fails when counterpart references the place itself");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Test 28: Prohibited phrase ('same_port_return') fails validator
{
  const tmpDir = createTempDataCopy();
  const dsContext = JSON.parse(fs.readFileSync(path.join(tmpDir, "dataset_context.json"), "utf8"));
  dsContext.places["place_havana"].coverage_caveat = "Same_port_return observed.";
  fs.writeFileSync(path.join(tmpDir, "dataset_context.json"), JSON.stringify(dsContext));
  const result = validatePublishedData(tmpDir, true);
  assert(result.valid === false && result.errorCount > 0, "Validator fails when prohibited phrase ('same_port_return') is present");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

console.log(`\nNegative Test Summary: ${passedTests} passed, ${failedTests} failed.`);
process.exit(failedTests > 0 ? 1 : 0);
