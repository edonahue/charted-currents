#!/usr/bin/env node
/**
 * scripts/validate-published-data.mjs
 *
 * Deterministic relational schema and referential integrity validator for Charted Currents.
 * Runs in CI and local verification to enforce publication contracts.
 *
 * Usage: node scripts/validate-published-data.mjs [customDataDir]
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const targetDir = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(process.cwd(), "public", "data");

const REQUIRED_FILES = [
  "manifest.json",
  "ports.geojson",
  "routes.geojson",
  "entities.json",
  "events.json",
  "sources.json",
];

export function validatePublishedData(dataDir = targetDir, isSilent = false) {
  let errorCount = 0;

  function log(msg) {
    if (!isSilent) console.log(msg);
  }

  function assert(condition, message) {
    if (!condition) {
      if (!isSilent) console.error(`[ERROR] ${message}`);
      errorCount++;
    }
  }

  log(`=== Validating Published Historical Data (${dataDir}) ===`);

  // Check file existence
  for (const file of REQUIRED_FILES) {
    const filePath = path.join(dataDir, file);
    assert(fs.existsSync(filePath), `Required published artifact missing: ${file}`);
  }

  if (errorCount > 0) {
    return { valid: false, errorCount };
  }

  // 1. Sources JSON
  const sourcesData = JSON.parse(fs.readFileSync(path.join(dataDir, "sources.json"), "utf8"));
  assert(Array.isArray(sourcesData.sources) && sourcesData.sources.length > 0, "sources.json missing sources array");
  assert(Array.isArray(sourcesData.source_records) && sourcesData.source_records.length > 0, "sources.json missing source_records array");
  assert(Array.isArray(sourcesData.assertions) && sourcesData.assertions.length > 0, "sources.json missing assertions array");

  const sourceIds = new Set();
  for (const src of sourcesData.sources || []) {
    assert(typeof src.id === "string", "Source missing id");
    sourceIds.add(src.id);
    assert(typeof src.title === "string", `Source ${src.id} missing title`);
    assert(typeof src.holding_institution === "string", `Source ${src.id} missing holding_institution`);
    assert(typeof src.rights_posture === "string", `Source ${src.id} missing rights_posture`);
    assert(src.rights_posture !== "unknown_review_required", `Source ${src.id} cannot be unknown_review_required`);
    assert(typeof src.directly_inspected === "boolean", `Source ${src.id} must declare boolean directly_inspected`);
  }

  const sourceRecordIds = new Set();
  for (const sr of sourcesData.source_records || []) {
    assert(typeof sr.id === "string", "Source record missing id");
    sourceRecordIds.add(sr.id);
    assert(sourceIds.has(sr.source_id), `Source record ${sr.id} references nonexistent source_id ${sr.source_id}`);
    assert(typeof sr.record_type === "string", `Source record ${sr.id} missing record_type`);
    assert(typeof sr.native_identifier === "string", `Source record ${sr.id} missing native_identifier`);
  }

  const assertionIds = new Set();
  for (const ast of sourcesData.assertions || []) {
    assert(typeof ast.id === "string", "Assertion missing id");
    assertionIds.add(ast.id);
    assert(sourceRecordIds.has(ast.source_record_id), `Assertion ${ast.id} references nonexistent source_record_id ${ast.source_record_id}`);
    assert(typeof ast.field === "string", `Assertion ${ast.id} missing field`);
  }

  // 2. Manifest
  const manifest = JSON.parse(fs.readFileSync(path.join(dataDir, "manifest.json"), "utf8"));
  assert(typeof manifest.version === "string", "manifest.json missing version string");
  assert(typeof manifest.corpusId === "string", "manifest.json missing corpusId");
  assert(typeof manifest.publishedAt === "string", "manifest.json missing publishedAt");
  assert(manifest.counts && typeof manifest.counts.ships === "number", "manifest.json missing valid counts");

  // 3. Ports GeoJSON
  const ports = JSON.parse(fs.readFileSync(path.join(dataDir, "ports.geojson"), "utf8"));
  assert(ports.type === "FeatureCollection", "ports.geojson must be a FeatureCollection");
  assert(Array.isArray(ports.features) && ports.features.length > 0, "ports.geojson has no features");

  for (const f of ports.features || []) {
    assert(f.type === "Feature", `Port ${f.id} is not a Feature`);
    assert(f.geometry && f.geometry.type === "Point", `Port ${f.id} geometry must be Point`);
    assert(Array.isArray(f.geometry.coordinates) && f.geometry.coordinates.length === 2, `Port ${f.id} coordinates must be [lng, lat]`);
    assert(typeof f.properties.canonical_name === "string", `Port ${f.id} missing canonical_name`);
    assert(typeof f.properties.geographic_precision === "string", `Port ${f.id} missing geographic_precision`);
    assert(Array.isArray(f.properties.source_assertion_ids), `Port ${f.id} missing source_assertion_ids array`);
    for (const astId of f.properties.source_assertion_ids || []) {
      assert(assertionIds.has(astId), `Port ${f.id} references nonexistent assertion ${astId}`);
    }
  }

  // 4. Routes GeoJSON
  const routes = JSON.parse(fs.readFileSync(path.join(dataDir, "routes.geojson"), "utf8"));
  assert(routes.type === "FeatureCollection", "routes.geojson must be a FeatureCollection");
  assert(Array.isArray(routes.features) && routes.features.length > 0, "routes.geojson has no features");

  for (const f of routes.features || []) {
    assert(f.type === "Feature", `Route ${f.id} is not a Feature`);
    assert(f.geometry && f.geometry.type === "LineString", `Route ${f.id} geometry must be LineString`);
    assert(f.geometry.coordinates.length === 2, `Route ${f.id} endpoints_only LineString must contain exactly 2 coordinates`);
    assert(f.properties.geometry_kind === "endpoints_only", `Route ${f.id} geometry_kind must be 'endpoints_only'`);
    assert(f.properties.evidence_state === "documented", `Route ${f.id} evidence_state must be 'documented'`);
    assert(f.properties.is_track_observed === false, `Route ${f.id} is_track_observed must be false`);
    assert(Array.isArray(f.properties.source_assertion_ids) && f.properties.source_assertion_ids.length > 0, `Route ${f.id} missing source_assertion_ids`);
    for (const astId of f.properties.source_assertion_ids || []) {
      assert(assertionIds.has(astId), `Route ${f.id} references nonexistent assertion ${astId}`);
    }
  }

  // 5. Entities JSON
  const entities = JSON.parse(fs.readFileSync(path.join(dataDir, "entities.json"), "utf8"));
  assert(Array.isArray(entities.ship_occurrences) && entities.ship_occurrences.length > 0, "entities.json missing ship_occurrences");
  assert(Array.isArray(entities.crew_occurrences) && entities.crew_occurrences.length > 0, "entities.json missing crew_occurrences");
  assert(Array.isArray(entities.ships) && entities.ships.length > 0, "entities.json missing ships array");
  assert(Array.isArray(entities.entity_resolution_edges) && entities.entity_resolution_edges.length > 0, "entities.json missing entity_resolution_edges");
  assert(Array.isArray(entities.places) && entities.places.length > 0, "entities.json missing places array");

  const shipOccIds = new Set();
  for (const occ of entities.ship_occurrences || []) {
    assert(typeof occ.id === "string", "Ship occurrence missing id");
    shipOccIds.add(occ.id);
    assert(sourceRecordIds.has(occ.source_record_id), `Ship occurrence ${occ.id} references nonexistent source_record_id ${occ.source_record_id}`);
    assert(Array.isArray(occ.assertion_ids) && occ.assertion_ids.length > 0, `Ship occurrence ${occ.id} missing assertion_ids`);
    for (const astId of occ.assertion_ids || []) {
      assert(assertionIds.has(astId), `Ship occurrence ${occ.id} references nonexistent assertion ${astId}`);
    }
  }

  for (const occ of entities.crew_occurrences || []) {
    assert(typeof occ.id === "string", "Crew occurrence missing id");
    assert(sourceRecordIds.has(occ.source_record_id), `Crew occurrence ${occ.id} references nonexistent source_record_id ${occ.source_record_id}`);
    assert(shipOccIds.has(occ.ship_occurrence_id), `Crew occurrence ${occ.id} references nonexistent ship_occurrence_id ${occ.ship_occurrence_id}`);
  }

  const shipIds = new Set();
  for (const s of entities.ships || []) {
    assert(typeof s.id === "string", "Ship missing id");
    shipIds.add(s.id);
    assert(typeof s.canonical_name === "string", `Ship ${s.id} missing canonical_name`);
    assert(s.evidence_state === "documented", `Ship ${s.id} evidence_state must be 'documented'`);
    assert(Array.isArray(s.occurrence_ids) && s.occurrence_ids.length > 0, `Ship ${s.id} missing occurrence_ids`);
    for (const occId of s.occurrence_ids || []) {
      assert(shipOccIds.has(occId), `Ship ${s.id} references nonexistent occurrence_id ${occId}`);
    }
  }

  for (const edge of entities.entity_resolution_edges || []) {
    assert(shipOccIds.has(edge.occurrence_id), `Resolution edge references nonexistent occurrence_id ${edge.occurrence_id}`);
    assert(shipIds.has(edge.target_entity_id), `Resolution edge references nonexistent target_entity_id ${edge.target_entity_id}`);
    assert(typeof edge.resolution_state === "string", `Resolution edge missing resolution_state`);
  }

  for (const vis of entities.visuals || []) {
    assert(typeof vis.id === "string", "Visual missing id");
    assert(sourceIds.has(vis.source_id), `Visual ${vis.id} references nonexistent source_id ${vis.source_id}`);
    assert(vis.rights_state !== "unknown_review_required", `Visual ${vis.id} rights cannot be unknown_review_required`);
  }

  // 6. Events JSON
  const events = JSON.parse(fs.readFileSync(path.join(dataDir, "events.json"), "utf8"));
  assert(Array.isArray(events.events) && events.events.length > 0, "events.json missing events array");

  for (const e of events.events || []) {
    assert(typeof e.id === "string", "Event missing id");
    assert(typeof e.title === "string", `Event ${e.id} missing title`);
    assert(typeof e.date === "string", `Event ${e.id} missing date`);
    assert(Array.isArray(e.sources) && e.sources.length > 0, `Event ${e.id} must have at least one source`);
    for (const srcId of e.sources || []) {
      assert(sourceIds.has(srcId), `Event ${e.id} references nonexistent source ${srcId}`);
    }
    assert(Array.isArray(e.assertion_ids) && e.assertion_ids.length > 0, `Event ${e.id} missing assertion_ids`);
    for (const astId of e.assertion_ids || []) {
      assert(assertionIds.has(astId), `Event ${e.id} references nonexistent assertion ${astId}`);
    }
  }

  if (errorCount > 0) {
    log(`\n[FAIL] Published data validation failed with ${errorCount} error(s).`);
    return { valid: false, errorCount };
  } else {
    log(`\n[PASS] All ${REQUIRED_FILES.length} published artifacts validated successfully with 0 errors.`);
    return { valid: true, errorCount: 0 };
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const result = validatePublishedData();
  process.exit(result.valid ? 0 : 1);
}
