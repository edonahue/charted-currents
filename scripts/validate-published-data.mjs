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
  "coverage.json",
  "dataset_context.json",
];

const VALID_INSPECTION_STATES = new Set([
  "dataset_record_inspected",
  "digital_content_inspected",
  "metadata_only",
  "upstream_cited_only",
]);

const VALID_EVIDENCE_LAYERS = new Set([
  "historical_document_text",
  "archival_catalogue_metadata",
  "scholarly_dataset_value",
  "historical_map_label",
  "modern_authority_label",
  "project_editorial_label",
]);

const VALID_ATTESTATION_LANGUAGES = new Set([
  "en",
  "es",
  "fr",
  "nl",
  "la",
  "mul",
  "und",
]);

const VALID_ATTESTATION_RELATIONSHIPS = new Set([
  "source_transcription",
  "editorial_normalization",
  "modern_preferred_label",
  "historical_variant",
  "catalogue_title_variant",
]);

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
    assert(!sourceIds.has(src.id), `Duplicate source ID: ${src.id}`);
    sourceIds.add(src.id);
    assert(typeof src.title === "string", `Source ${src.id} missing title`);
    assert(typeof src.holding_institution === "string", `Source ${src.id} missing holding_institution`);
    assert(typeof src.rights_posture === "string", `Source ${src.id} missing rights_posture`);
    assert(src.rights_posture !== "unknown_review_required", `Source ${src.id} cannot be unknown_review_required`);
  }

  const sourceRecordIds = new Set();
  for (const sr of sourcesData.source_records || []) {
    assert(typeof sr.id === "string", "Source record missing id");
    assert(!sourceRecordIds.has(sr.id), `Duplicate source record ID: ${sr.id}`);
    sourceRecordIds.add(sr.id);
    assert(sourceIds.has(sr.source_id), `Source record ${sr.id} references nonexistent source_id ${sr.source_id}`);
    assert(typeof sr.record_type === "string", `Source record ${sr.id} missing record_type`);
    assert(typeof sr.native_identifier === "string", `Source record ${sr.id} missing native_identifier`);
    assert(VALID_INSPECTION_STATES.has(sr.inspection_state), `Source record ${sr.id} has invalid inspection_state: ${sr.inspection_state}`);

    if (sr.upstream_archive_source_id) {
      assert(sourceIds.has(sr.upstream_archive_source_id), `Source record ${sr.id} references nonexistent upstream_archive_source_id ${sr.upstream_archive_source_id}`);
    }
  }

  for (const sr of sourcesData.source_records || []) {
    if (sr.parent_ship_record_id) {
      assert(sourceRecordIds.has(sr.parent_ship_record_id), `Source record ${sr.id} references nonexistent parent_ship_record_id ${sr.parent_ship_record_id}`);
    }
  }

  const assertionIds = new Set();
  for (const ast of sourcesData.assertions || []) {
    assert(typeof ast.id === "string", "Assertion missing id");
    assert(!assertionIds.has(ast.id), `Duplicate assertion ID: ${ast.id}`);
    assertionIds.add(ast.id);
    assert(sourceRecordIds.has(ast.source_record_id), `Assertion ${ast.id} references nonexistent source_record_id ${ast.source_record_id}`);
    assert(typeof ast.field === "string", `Assertion ${ast.id} missing field`);
  }

  for (const ast of sourcesData.assertions || []) {
    if (ast.derived_value !== undefined) {
      assert(typeof ast.derived_value === "string", `Derived assertion ${ast.id} derived_value must be string`);
      assert(ast.raw_value === undefined, `Derived assertion ${ast.id} cannot contain raw_value (cannot masquerade as raw transcription)`);
      assert(typeof ast.derivation_method === "string" && ast.derivation_method.length > 0, `Derived assertion ${ast.id} missing derivation_method`);
      assert(typeof ast.source_assertion_id === "string" && ast.source_assertion_id.length > 0, `Derived assertion ${ast.id} missing source_assertion_id`);
      assert(assertionIds.has(ast.source_assertion_id), `Derived assertion ${ast.id} references nonexistent source_assertion_id: ${ast.source_assertion_id}`);
    }
  }

  // 2. Entities JSON
  const entities = JSON.parse(fs.readFileSync(path.join(dataDir, "entities.json"), "utf8"));
  assert(Array.isArray(entities.ship_occurrences) && entities.ship_occurrences.length > 0, "entities.json missing ship_occurrences");
  assert(Array.isArray(entities.crew_occurrences) && entities.crew_occurrences.length > 0, "entities.json missing crew_occurrences");
  assert(Array.isArray(entities.ships) && entities.ships.length > 0, "entities.json missing ships array");
  assert(Array.isArray(entities.entity_resolution_edges) && entities.entity_resolution_edges.length > 0, "entities.json missing entity_resolution_edges");
  assert(Array.isArray(entities.places) && entities.places.length > 0, "entities.json missing places array");

  function validateAttestations(parentType, parentId, attestations) {
    if (!attestations) return;
    assert(Array.isArray(attestations), `${parentType} ${parentId} attestations must be an array`);
    for (const att of attestations) {
      assert(typeof att.raw_name === "string" && att.raw_name.trim().length > 0, `${parentType} ${parentId} attestation missing raw_name`);
      assert(VALID_EVIDENCE_LAYERS.has(att.evidence_layer), `${parentType} ${parentId} attestation has invalid evidence_layer: ${att.evidence_layer}`);
      assert(VALID_ATTESTATION_LANGUAGES.has(att.language), `${parentType} ${parentId} attestation has invalid language: ${att.language}`);
      assert(VALID_ATTESTATION_RELATIONSHIPS.has(att.attestation_relationship), `${parentType} ${parentId} attestation has invalid relationship: ${att.attestation_relationship}`);
      assert(sourceRecordIds.has(att.source_record_id), `${parentType} ${parentId} attestation references nonexistent source_record_id ${att.source_record_id}`);
    }
  }

  const placeIds = new Set();
  for (const p of entities.places || []) {
    assert(typeof p.id === "string", "Place missing id");
    assert(!placeIds.has(p.id), `Duplicate place ID: ${p.id}`);
    placeIds.add(p.id);
    assert(typeof p.canonical_name === "string", `Place ${p.id} missing canonical_name`);
    assert(Array.isArray(p.coordinates) && p.coordinates.length === 2, `Place ${p.id} invalid coordinates`);
    validateAttestations("Place", p.id, p.attestations);
    for (const astId of p.source_assertion_ids || []) {
      assert(assertionIds.has(astId), `Place ${p.id} references nonexistent assertion ${astId}`);
    }
  }

  const shipOccIds = new Set();
  for (const occ of entities.ship_occurrences || []) {
    assert(typeof occ.id === "string", "Ship occurrence missing id");
    assert(!shipOccIds.has(occ.id), `Duplicate ship occurrence ID: ${occ.id}`);
    shipOccIds.add(occ.id);
    assert(sourceRecordIds.has(occ.source_record_id), `Ship occurrence ${occ.id} references nonexistent source_record_id ${occ.source_record_id}`);
    assert(occ.raw_construction_place !== "Unknown", `Ship occurrence ${occ.id} contains synthetic sentinel 'Unknown' for raw_construction_place`);
    assert(Array.isArray(occ.assertion_ids) && occ.assertion_ids.length > 0, `Ship occurrence ${occ.id} missing assertion_ids`);
    validateAttestations("ShipOccurrence", occ.id, occ.attestations);
    for (const astId of occ.assertion_ids || []) {
      assert(assertionIds.has(astId), `Ship occurrence ${occ.id} references nonexistent assertion ${astId}`);
    }

    // Validate structured fleet convoy context if present
    if (occ.fleet_convoy) {
      const fc = occ.fleet_convoy;
      assert(typeof fc.native_fleet_id === "number", `Ship occurrence ${occ.id} fleet_convoy missing native_fleet_id`);
      assert(sourceRecordIds.has(fc.source_record_id), `Ship occurrence ${occ.id} fleet_convoy references nonexistent source_record_id ${fc.source_record_id}`);
      assert(Array.isArray(fc.assertion_ids) && fc.assertion_ids.length > 0, `Ship occurrence ${occ.id} fleet_convoy missing assertion_ids`);
      for (const astId of fc.assertion_ids || []) {
        assert(assertionIds.has(astId), `Ship occurrence ${occ.id} fleet_convoy references nonexistent assertion ${astId}`);
      }
      assert(typeof fc.fleet_title === "string", `Ship occurrence ${occ.id} fleet_convoy missing fleet_title`);
      assert(typeof fc.commander_display === "string", `Ship occurrence ${occ.id} fleet_convoy missing commander_display`);
      assert(typeof fc.fleet_origin === "string", `Ship occurrence ${occ.id} fleet_convoy missing fleet_origin`);
      assert(typeof fc.fleet_destination === "string", `Ship occurrence ${occ.id} fleet_convoy missing fleet_destination`);
      assert(typeof fc.year === "number", `Ship occurrence ${occ.id} fleet_convoy missing year`);
    }
  }

  const crewOccIds = new Set();
  for (const occ of entities.crew_occurrences || []) {
    assert(typeof occ.id === "string", "Crew occurrence missing id");
    assert(!crewOccIds.has(occ.id), `Duplicate crew occurrence ID: ${occ.id}`);
    crewOccIds.add(occ.id);
    assert(sourceRecordIds.has(occ.source_record_id), `Crew occurrence ${occ.id} references nonexistent source_record_id ${occ.source_record_id}`);
    assert(shipOccIds.has(occ.ship_occurrence_id), `Crew occurrence ${occ.id} references nonexistent ship_occurrence_id ${occ.ship_occurrence_id}`);
    for (const astId of occ.assertion_ids || []) {
      assert(assertionIds.has(astId), `Crew occurrence ${occ.id} references nonexistent assertion ${astId}`);
    }
  }

  const personOccIds = new Set();
  for (const occ of entities.person_occurrences || []) {
    assert(typeof occ.id === "string", "Person occurrence missing id");
    assert(!personOccIds.has(occ.id), `Duplicate person occurrence ID: ${occ.id}`);
    personOccIds.add(occ.id);
    assert(sourceRecordIds.has(occ.source_record_id), `Person occurrence ${occ.id} references nonexistent source_record_id ${occ.source_record_id}`);
    if (occ.ship_occurrence_id) {
      assert(shipOccIds.has(occ.ship_occurrence_id), `Person occurrence ${occ.id} references nonexistent ship_occurrence_id ${occ.ship_occurrence_id}`);
    }
    assert(Array.isArray(occ.assertion_ids) && occ.assertion_ids.length > 0, `Person occurrence ${occ.id} missing assertion_ids`);
    for (const astId of occ.assertion_ids || []) {
      assert(assertionIds.has(astId), `Person occurrence ${occ.id} references nonexistent assertion ${astId}`);
    }
  }

  const VALID_COMMODITY_FACETS = new Set([
    "cacao", "indigo", "tobacco", "sugar", "cotton", "copper", "tortoiseshell", "specie"
  ]);

  const goodsOccIds = new Set();
  for (const occ of entities.goods_occurrences || []) {
    assert(typeof occ.id === "string", "Goods occurrence missing id");
    assert(!goodsOccIds.has(occ.id), `Duplicate goods occurrence ID: ${occ.id}`);
    goodsOccIds.add(occ.id);
    assert(sourceRecordIds.has(occ.source_record_id), `Goods occurrence ${occ.id} references nonexistent source_record_id ${occ.source_record_id}`);
    assert(shipOccIds.has(occ.ship_occurrence_id), `Goods occurrence ${occ.id} references nonexistent ship_occurrence_id ${occ.ship_occurrence_id}`);
    assert(typeof occ.commodity_ref_key === "number", `Goods occurrence ${occ.id} missing commodity_ref_key`);
    assert(typeof occ.recorded_commodity_label === "string" && occ.recorded_commodity_label.length > 0, `Goods occurrence ${occ.id} missing recorded_commodity_label`);
    assert(typeof occ.raw_quantity === "number", `Goods occurrence ${occ.id} missing raw_quantity`);
    assert(occ.parsed_quantity === null || typeof occ.parsed_quantity === "number", `Goods occurrence ${occ.id} invalid parsed_quantity`);
    assert(typeof occ.measure_ref_key === "number", `Goods occurrence ${occ.id} missing measure_ref_key`);
    assert(occ.recorded_measure_label === null || typeof occ.recorded_measure_label === "string", `Goods occurrence ${occ.id} invalid recorded_measure_label`);
    if (occ.commodity_facet) {
      assert(VALID_COMMODITY_FACETS.has(occ.commodity_facet), `Goods occurrence ${occ.id} has invalid commodity_facet: ${occ.commodity_facet}`);
    }
    // Ethical boundary: no commercial commodity record may represent enslaved human beings
    assert(occ.commodity_ref_key !== 11 && !occ.recorded_commodity_label.toLowerCase().includes("esclavo"), `Ethical violation: enslaved person represented as commercial goods occurrence in ${occ.id}`);
    assert(Array.isArray(occ.assertion_ids) && occ.assertion_ids.length > 0, `Goods occurrence ${occ.id} missing assertion_ids`);
    for (const astId of occ.assertion_ids || []) {
      assert(assertionIds.has(astId), `Goods occurrence ${occ.id} references nonexistent assertion ${astId}`);
    }
  }

  const shipIds = new Set();
  for (const s of entities.ships || []) {
    assert(typeof s.id === "string", "Ship missing id");
    assert(!shipIds.has(s.id), `Duplicate ship ID: ${s.id}`);
    shipIds.add(s.id);
    assert(typeof s.canonical_name === "string", `Ship ${s.id} missing canonical_name`);
    assert(s.evidence_state === "documented", `Ship ${s.id} evidence_state must be 'documented'`);
    assert(s.construction_display !== "Unknown", `Ship ${s.id} contains synthetic sentinel 'Unknown' for construction_display`);
    assert(Array.isArray(s.occurrence_ids) && s.occurrence_ids.length > 0, `Ship ${s.id} missing occurrence_ids`);
    validateAttestations("Ship", s.id, s.attestations);
    for (const occId of s.occurrence_ids || []) {
      assert(shipOccIds.has(occId), `Ship ${s.id} references nonexistent occurrence_id ${occId}`);
    }
  }

  const personIds = new Set();
  for (const p of entities.persons || []) {
    assert(typeof p.id === "string", "Person missing id");
    assert(!personIds.has(p.id), `Duplicate person ID: ${p.id}`);
    personIds.add(p.id);
    assert(typeof p.canonical_name === "string", `Person ${p.id} missing canonical_name`);
    assert(typeof p.evidence_state === "string", `Person ${p.id} missing evidence_state`);
    assert(Array.isArray(p.occurrence_ids) && p.occurrence_ids.length > 0, `Person ${p.id} missing occurrence_ids`);
    for (const occId of p.occurrence_ids || []) {
      assert(personOccIds.has(occId), `Person ${p.id} references nonexistent occurrence_id ${occId}`);
    }
    for (const srId of p.source_record_ids || []) {
      assert(sourceRecordIds.has(srId), `Person ${p.id} references nonexistent source_record_id ${srId}`);
    }
    validateAttestations("Person", p.id, p.attestations);
  }

  for (const edge of entities.entity_resolution_edges || []) {
    const isShipEdge = shipOccIds.has(edge.occurrence_id);
    const isPersonEdge = personOccIds.has(edge.occurrence_id);
    assert(isShipEdge || isPersonEdge, `Resolution edge references nonexistent occurrence_id ${edge.occurrence_id}`);
    if (isShipEdge) {
      assert(shipIds.has(edge.target_entity_id), `Resolution edge references nonexistent target ship ${edge.target_entity_id}`);
    } else if (isPersonEdge) {
      assert(personIds.has(edge.target_entity_id), `Resolution edge references nonexistent target person ${edge.target_entity_id}`);
    }
    assert(typeof edge.resolution_state === "string", `Resolution edge missing resolution_state`);
    for (const astId of edge.evidence_assertions || []) {
      assert(assertionIds.has(astId), `Resolution edge references nonexistent assertion ${astId}`);
    }
  }

  for (const vis of entities.visuals || []) {
    assert(typeof vis.id === "string", "Visual missing id");
    assert(sourceIds.has(vis.source_id), `Visual ${vis.id} references nonexistent source_id ${vis.source_id}`);
    assert(vis.rights_state !== "unknown_review_required", `Visual ${vis.id} rights cannot be unknown_review_required`);
    for (const astId of vis.assertion_ids || []) {
      assert(assertionIds.has(astId), `Visual ${vis.id} references nonexistent assertion ${astId}`);
    }
  }

  // 3. Ports GeoJSON
  const ports = JSON.parse(fs.readFileSync(path.join(dataDir, "ports.geojson"), "utf8"));
  assert(ports.type === "FeatureCollection", "ports.geojson must be a FeatureCollection");
  assert(Array.isArray(ports.features) && ports.features.length > 0, "ports.geojson has no features");

  for (const f of ports.features || []) {
    assert(f.type === "Feature", `Port ${f.id} is not a Feature`);
    assert(f.geometry && f.geometry.type === "Point", `Port ${f.id} geometry must be Point`);
    assert(Array.isArray(f.geometry.coordinates) && f.geometry.coordinates.length === 2, `Port ${f.id} coordinates must be [lng, lat]`);
    assert(placeIds.has(f.id), `Port feature ${f.id} does not match any place ID`);
    assert(typeof f.properties.canonical_name === "string", `Port ${f.id} missing canonical_name`);
    assert(typeof f.properties.geographic_precision === "string", `Port ${f.id} missing geographic_precision`);
  }

  // 4. Routes GeoJSON
  const routes = JSON.parse(fs.readFileSync(path.join(dataDir, "routes.geojson"), "utf8"));
  assert(routes.type === "FeatureCollection", "routes.geojson must be a FeatureCollection");
  assert(Array.isArray(routes.features) && routes.features.length > 0, "routes.geojson has no features");

  for (const f of routes.features || []) {
    assert(f.type === "Feature", `Display edge ${f.id} is not a Feature`);
    assert(f.geometry && f.geometry.type === "LineString", `Display edge ${f.id} geometry must be LineString`);
    assert(f.geometry.coordinates.length === 2, `Display edge ${f.id} endpoints_only LineString must contain exactly 2 coordinates`);
    assert(f.properties.geometry_kind === "endpoints_only", `Display edge ${f.id} geometry_kind must be 'endpoints_only'`);
    assert(f.properties.evidence_state === "documented", `Display edge ${f.id} evidence_state must be 'documented'`);
    assert(f.properties.is_track_observed === false, `Display edge ${f.id} is_track_observed must be false`);
    assert(placeIds.has(f.properties.origin_place_id), `Display edge ${f.id} references nonexistent origin_place_id ${f.properties.origin_place_id}`);
    assert(placeIds.has(f.properties.destination_place_id), `Display edge ${f.id} references nonexistent destination_place_id ${f.properties.destination_place_id}`);
    assert(Array.isArray(f.properties.constituent_vessel_ids) && f.properties.constituent_vessel_ids.length > 0, `Display edge ${f.id} missing constituent_vessel_ids`);
    for (const vid of f.properties.constituent_vessel_ids || []) {
      assert(shipIds.has(vid), `Display edge ${f.id} references nonexistent vessel_id ${vid}`);
    }
    assert(Array.isArray(f.properties.constituent_assertion_ids) && f.properties.constituent_assertion_ids.length > 0, `Display edge ${f.id} missing constituent_assertion_ids`);
    for (const astId of f.properties.constituent_assertion_ids || []) {
      assert(assertionIds.has(astId), `Display edge ${f.id} references nonexistent assertion ${astId}`);
    }
    assert(f.properties.record_count === f.properties.constituent_route_ids.length, `Display edge ${f.id} record_count mismatch`);
  }

  // Archival routes validation (in entities.json or routes.geojson)
  const archivalRoutes = entities.routes || routes.archival_routes || [];
  assert(Array.isArray(archivalRoutes) && archivalRoutes.length > 0, "Missing archival routes collection");
  for (const ar of archivalRoutes) {
    assert(typeof ar.id === "string", "Archival route missing id");
    assert(shipIds.has(ar.vessel_id), `Archival route ${ar.id} references nonexistent vessel_id ${ar.vessel_id}`);
    assert(placeIds.has(ar.origin_place_id), `Archival route ${ar.id} references nonexistent origin_place_id ${ar.origin_place_id}`);
    assert(placeIds.has(ar.destination_place_id), `Archival route ${ar.id} references nonexistent destination_place_id ${ar.destination_place_id}`);
    assert(Array.isArray(ar.source_assertion_ids) && ar.source_assertion_ids.length > 0, `Archival route ${ar.id} missing source_assertion_ids`);
    for (const astId of ar.source_assertion_ids || []) {
      assert(assertionIds.has(astId), `Archival route ${ar.id} references nonexistent assertion ${astId}`);
    }
  }

  // 5. Events JSON
  const events = JSON.parse(fs.readFileSync(path.join(dataDir, "events.json"), "utf8"));
  assert(Array.isArray(events.events) && events.events.length > 0, "events.json missing events array");

  for (const e of events.events || []) {
    assert(typeof e.id === "string", "Event missing id");
    assert(typeof e.title === "string", `Event ${e.id} missing title`);
    assert(typeof e.date === "string", `Event ${e.id} missing date`);
    assert(placeIds.has(e.place_id), `Event ${e.id} references nonexistent place_id ${e.place_id}`);
    assert(Array.isArray(e.sources) && e.sources.length > 0, `Event ${e.id} must have at least one source`);
    for (const srcId of e.sources || []) {
      assert(sourceIds.has(srcId), `Event ${e.id} references nonexistent source ${srcId}`);
    }
    assert(Array.isArray(e.assertion_ids) && e.assertion_ids.length > 0, `Event ${e.id} missing assertion_ids`);
    for (const astId of e.assertion_ids || []) {
      assert(assertionIds.has(astId), `Event ${e.id} references nonexistent assertion ${astId}`);
    }
  }

  // 6. Coverage JSON
  const coverage = JSON.parse(fs.readFileSync(path.join(dataDir, "coverage.json"), "utf8"));
  assert(Array.isArray(coverage) && coverage.length > 0, "coverage.json must be a non-empty array");
  for (const cov of coverage) {
    assert(typeof cov.source_id === "string", "Coverage entry missing source_id");
    assert(sourceIds.has(cov.source_id), `Coverage entry references nonexistent source_id ${cov.source_id}`);
    assert(typeof cov.short_label === "string", `Coverage ${cov.source_id} missing short_label`);
    assert(cov.source_declared_scope && typeof cov.source_declared_scope.start_year === "number", `Coverage ${cov.source_id} missing source_declared_scope`);
    assert(cov.project_reviewed_sample && typeof cov.project_reviewed_sample.start_year === "number", `Coverage ${cov.source_id} missing project_reviewed_sample`);
  }

  // 7. Dataset Context JSON
  const datasetContext = JSON.parse(fs.readFileSync(path.join(dataDir, "dataset_context.json"), "utf8"));
  assert(datasetContext.metadata && typeof datasetContext.metadata.version === "string", "dataset_context.json missing metadata.version");
  assert(datasetContext.metadata.counting_unit === "one Crespo TODOSNAVIOS row / Crespo vessel record", `dataset_context.json invalid counting_unit: ${datasetContext.metadata.counting_unit}`);
  assert(datasetContext.metadata.baseline_period === "1650-1730", `dataset_context.json invalid baseline_period: ${datasetContext.metadata.baseline_period}`);
  assert(datasetContext.metadata.total_records_in_baseline === 1928, `dataset_context.json baseline total mismatch (expected 1928, got ${datasetContext.metadata.total_records_in_baseline})`);
  assert(Array.isArray(datasetContext.metadata.period_presets) && datasetContext.metadata.period_presets.length === 3, "dataset_context.json missing period_presets");
  assert(typeof datasetContext.metadata.source_mdb_sha256 === "string", "dataset_context.json missing source_mdb_sha256");
  assert(typeof datasetContext.metadata.mapping_file_sha256 === "string", "dataset_context.json missing mapping_file_sha256");
  assert(typeof datasetContext.metadata.generator_sha256 === "string", "dataset_context.json missing generator_sha256");
  assert(datasetContext.places && typeof datasetContext.places === "object", "dataset_context.json missing places object");

  const rawContextString = fs.readFileSync(path.join(dataDir, "dataset_context.json"), "utf8").toLowerCase();
  for (const forbidden of [
    "same_port_return",
    "ships sailed",
    "distinct physical vessels",
    "voyages used",
    "traffic volume",
    "market share",
    "handled 28 voyages",
    "imperial archival partition",
    "archival partition",
    "unrecorded"
  ]) {
    assert(!rawContextString.includes(forbidden), `dataset_context.json contains forbidden semantic phrase: '${forbidden}'`);
  }

  for (const [placeId, ctx] of Object.entries(datasetContext.places)) {
    assert(placeIds.has(placeId), `dataset_context.json references nonexistent canonical place: ${placeId}`);
    assert(typeof ctx.canonical_name === "string", `dataset_context for ${placeId} missing canonical_name`);
    assert(ctx.status === "mapped" || ctx.status === "unmapped", `dataset_context for ${placeId} invalid status: ${ctx.status}`);
    assert(typeof ctx.coverage_caveat === "string", `dataset_context for ${placeId} missing coverage_caveat`);
    if (ctx.status === "unmapped") {
      assert(ctx.crespo_lugar_id === null, `Unmapped place ${placeId} must have null crespo_lugar_id`);
      assert(ctx.source_native_label === null, `Unmapped place ${placeId} must have null source_native_label`);
      assert(ctx.periods === null, `Unmapped place ${placeId} must have null periods`);
    } else if (ctx.status === "mapped") {
      assert(typeof ctx.crespo_lugar_id === "number" && ctx.crespo_lugar_id > 0, `Mapped place ${placeId} missing valid crespo_lugar_id`);
      assert(typeof ctx.source_native_label === "string" && ctx.source_native_label.length > 0, `Mapped place ${placeId} missing source_native_label`);
      assert(ctx.periods && typeof ctx.periods === "object", `dataset_context for ${placeId} missing periods object`);
      if (ctx.periods) {
        for (const presetId of ["all", "1684-1695", "1702-1712"]) {
          const pData = ctx.periods[presetId];
          assert(pData, `dataset_context for ${placeId} missing period ${presetId}`);
          if (!pData) continue;
        assert(typeof pData.total_records === "number" && pData.total_records >= 0, `dataset_context for ${placeId} period ${presetId} invalid total_records`);
        assert(typeof pData.records_with_origin === "number" && pData.records_with_origin >= 0, `dataset_context for ${placeId} period ${presetId} invalid records_with_origin`);
        assert(typeof pData.records_with_destination === "number" && pData.records_with_destination >= 0, `dataset_context for ${placeId} period ${presetId} invalid records_with_destination`);
        assert(typeof pData.both_endpoint_records === "number" && pData.both_endpoint_records >= 0, `dataset_context for ${placeId} period ${presetId} invalid both_endpoint_records`);
        assert(
          pData.total_records === pData.records_with_origin + pData.records_with_destination - pData.both_endpoint_records,
          `dataset_context for ${placeId} period ${presetId} union arithmetic mismatch: ${pData.total_records} != ${pData.records_with_origin} + ${pData.records_with_destination} - ${pData.both_endpoint_records}`
        );
        assert(Array.isArray(pData.top_counterparts), `dataset_context for ${placeId} period ${presetId} top_counterparts must be an array`);
        for (const cp of pData.top_counterparts) {
          assert(typeof cp.source_label === "string", `Counterpart for ${placeId} missing source_label`);
          assert(typeof cp.total_records === "number" && cp.total_records > 0, `Counterpart for ${placeId} invalid total_records`);
          assert(cp.crespo_lugar_id !== ctx.crespo_lugar_id, `Counterpart for ${placeId} includes self (lugar_id ${cp.crespo_lugar_id})`);
        }
      }
    }
  }
  }

  // 8. Manifest
  const manifest = JSON.parse(fs.readFileSync(path.join(dataDir, "manifest.json"), "utf8"));
  assert(typeof manifest.version === "string", "manifest.json missing version string");
  assert(typeof manifest.corpusId === "string", "manifest.json missing corpusId");
  assert(typeof manifest.publishedAt === "string", "manifest.json missing publishedAt");
  assert(manifest.counts && typeof manifest.counts.ships === "number", "manifest.json missing valid counts");
  assert(manifest.counts.sources === sourcesData.sources.length, "Manifest sources count mismatch");
  assert(manifest.counts.source_records === sourcesData.source_records.length, "Manifest source_records count mismatch");
  assert(manifest.counts.assertions === sourcesData.assertions.length, "Manifest assertions count mismatch");
  assert(manifest.counts.goods_occurrences === (entities.goods_occurrences || []).length, "Manifest goods_occurrences count mismatch");
  assert(manifest.counts.ships === entities.ships.length, "Manifest ships count mismatch");
  assert(manifest.counts.routes === archivalRoutes.length, "Manifest routes count mismatch");
  assert(manifest.counts.display_edges === routes.features.length, "Manifest display_edges count mismatch");
  assert(manifest.counts.events === events.events.length, "Manifest events count mismatch");
  assert(manifest.counts.dataset_context_places === Object.keys(datasetContext.places).length, "Manifest dataset_context_places count mismatch");

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
