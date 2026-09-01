#!/usr/bin/env node
/**
 * scripts/validate-published-data.mjs
 *
 * Deterministic JSON/GeoJSON schema and publication validator for Charted Currents.
 * Runs in CI and local verification to enforce publication contracts.
 *
 * Usage: node scripts/validate-published-data.mjs
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const dataDir = path.resolve(process.cwd(), "public", "data");

const REQUIRED_FILES = [
  "manifest.json",
  "ports.geojson",
  "routes.geojson",
  "entities.json",
  "events.json",
  "sources.json",
];

console.log("=== Validating Published Historical Data ===");

let errorCount = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`[ERROR] ${message}`);
    errorCount++;
  }
}

// Check file existence
for (const file of REQUIRED_FILES) {
  const filePath = path.join(dataDir, file);
  assert(fs.existsSync(filePath), `Required published artifact missing: ${file}`);
}

if (errorCount > 0) {
  process.exit(1);
}

// 1. Manifest
const manifest = JSON.parse(fs.readFileSync(path.join(dataDir, "manifest.json"), "utf8"));
assert(typeof manifest.version === "string", "manifest.json missing version string");
assert(typeof manifest.corpusId === "string", "manifest.json missing corpusId");
assert(manifest.counts && typeof manifest.counts.ships === "number", "manifest.json missing valid counts");

// 2. Ports GeoJSON
const ports = JSON.parse(fs.readFileSync(path.join(dataDir, "ports.geojson"), "utf8"));
assert(ports.type === "FeatureCollection", "ports.geojson must be a FeatureCollection");
assert(Array.isArray(ports.features) && ports.features.length > 0, "ports.geojson has no features");

for (const f of ports.features) {
  assert(f.type === "Feature", `Port ${f.id} is not a Feature`);
  assert(f.geometry && f.geometry.type === "Point", `Port ${f.id} geometry must be Point`);
  assert(Array.isArray(f.geometry.coordinates) && f.geometry.coordinates.length === 2, `Port ${f.id} must have [lng, lat] coordinates`);
  assert(typeof f.properties.canonical_name === "string", `Port ${f.id} missing canonical_name`);
  assert(typeof f.properties.geographic_precision === "string", `Port ${f.id} missing geographic_precision`);
}

// 3. Routes GeoJSON
const routes = JSON.parse(fs.readFileSync(path.join(dataDir, "routes.geojson"), "utf8"));
assert(routes.type === "FeatureCollection", "routes.geojson must be a FeatureCollection");
assert(Array.isArray(routes.features) && routes.features.length > 0, "routes.geojson has no features");

for (const f of routes.features) {
  assert(f.type === "Feature", `Route ${f.id} is not a Feature`);
  assert(f.geometry && f.geometry.type === "LineString", `Route ${f.id} geometry must be LineString`);
  assert(f.properties.geometry_kind === "endpoints_only", `Route ${f.id} geometry_kind must be 'endpoints_only'`);
  assert(f.properties.evidence_state === "documented", `Route ${f.id} evidence_state must be 'documented'`);
  assert(f.properties.is_track_observed === false, `Route ${f.id} is_track_observed must be false`);
}

// 4. Entities JSON
const entities = JSON.parse(fs.readFileSync(path.join(dataDir, "entities.json"), "utf8"));
assert(Array.isArray(entities.ships) && entities.ships.length > 0, "entities.json missing ships array");
assert(Array.isArray(entities.places) && entities.places.length > 0, "entities.json missing places array");

for (const s of entities.ships) {
  assert(typeof s.id === "string", "Ship missing id");
  assert(typeof s.canonical_name === "string", `Ship ${s.id} missing canonical_name`);
  assert(typeof s.raw_tonnage === "string", `Ship ${s.id} missing raw_tonnage`);
  assert(typeof s.primary_source_id === "string", `Ship ${s.id} missing primary_source_id`);
  assert(s.evidence_state === "documented", `Ship ${s.id} evidence_state must be 'documented'`);
}

// 5. Events JSON
const events = JSON.parse(fs.readFileSync(path.join(dataDir, "events.json"), "utf8"));
assert(Array.isArray(events.events) && events.events.length > 0, "events.json missing events array");

for (const e of events.events) {
  assert(typeof e.id === "string", "Event missing id");
  assert(typeof e.title === "string", `Event ${e.id} missing title`);
  assert(typeof e.date === "string", `Event ${e.id} missing date`);
  assert(Array.isArray(e.sources) && e.sources.length > 0, `Event ${e.id} must have at least one source`);
}

// 6. Sources JSON
const sources = JSON.parse(fs.readFileSync(path.join(dataDir, "sources.json"), "utf8"));
assert(Array.isArray(sources.sources) && sources.sources.length > 0, "sources.json missing sources array");

for (const src of sources.sources) {
  assert(typeof src.id === "string", "Source missing id");
  assert(typeof src.title === "string", `Source ${src.id} missing title`);
  assert(typeof src.holding_institution === "string", `Source ${src.id} missing holding_institution`);
  assert(typeof src.rights_posture === "string", `Source ${src.id} missing rights_posture`);
  assert(src.rights_posture !== "unknown_review_required", `Source ${src.id} cannot be unknown_review_required`);
}

console.log(`[PASS] All ${REQUIRED_FILES.length} published artifacts validated successfully with 0 errors.`);
process.exit(0);
