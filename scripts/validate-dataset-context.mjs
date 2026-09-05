#!/usr/bin/env node
/**
 * scripts/validate-dataset-context.mjs
 *
 * Deterministic publication validation for public/data/dataset_context.json.
 * Does NOT require DuckDB or local research database mirror.
 *
 * Enforces:
 * 1. Pinned source fingerprint matching tracked authoritative manifest (data/acquisition/crespo.json).
 * 2. Input provenance SHA-256 validation (crespo_places.yml, build-dataset-context.py).
 * 3. Place mapping source-QA audit validation (place_mapping_audit.json).
 * 4. Mapped vs unmapped invariants (unmapped must have null periods; mapped may have 0 records).
 * 5. Endpoint union arithmetic: total_records == records_with_origin + records_with_destination - both_endpoint_records.
 * 6. Self-counterpart exclusion: place never appears in its own counterparts.
 * 7. Prohibited terminology blacklist (no same_port_return, traffic volume, imperial partition, etc.).
 * 8. Explicit fixtures: Cádiz (both-endpoint overlap = 24), London (mapped zero), Port Royal (unmapped), Saint-Domingue (unmapped), Havana.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

function assert(condition, message) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
}

const DATASET_CONTEXT_PATH = "public/data/dataset_context.json";
const MAPPING_PATH = "data/mapping/crespo_places.yml";
const GENERATOR_PATH = "scripts/build-dataset-context.py";
const ACQUISITION_PATH = "data/acquisition/crespo.json";
const AUDIT_PATH = "data/review/crespo/place_mapping_audit.json";

console.log("=== Validating Dataset Context Publication & Provenance ===");

// 1. Check file existence
assert(existsSync(DATASET_CONTEXT_PATH), `${DATASET_CONTEXT_PATH} must exist`);
assert(existsSync(MAPPING_PATH), `${MAPPING_PATH} must exist`);
assert(existsSync(GENERATOR_PATH), `${GENERATOR_PATH} must exist`);
assert(existsSync(ACQUISITION_PATH), `${ACQUISITION_PATH} must exist`);
assert(existsSync(AUDIT_PATH), `${AUDIT_PATH} must exist`);

const datasetContext = JSON.parse(readFileSync(DATASET_CONTEXT_PATH, "utf8"));
const acquisition = JSON.parse(readFileSync(ACQUISITION_PATH, "utf8"));
const audit = JSON.parse(readFileSync(AUDIT_PATH, "utf8"));

const meta = datasetContext.metadata;
assert(Boolean(meta), "metadata object must exist in dataset_context.json");

// 2. Authoritative Pinned Fingerprint Check
const trackedMdbSha = acquisition.files?.[0]?.sha256;
assert(Boolean(trackedMdbSha), "Tracked MDB SHA256 must exist in data/acquisition/crespo.json");
assert(
  meta.source_mdb_sha256 === trackedMdbSha,
  `Artifact source_mdb_sha256 (${meta.source_mdb_sha256}) must match tracked acquisition SHA256 (${trackedMdbSha})`
);
console.log(`[PASS] Pinned source MDB fingerprint verified against tracked acquisition manifest: ${meta.source_mdb_sha256.slice(0, 16)}...`);

// 3. Pinned Input Provenance Validation
const mappingContent = readFileSync(MAPPING_PATH);
const expectedMappingSha = sha256(mappingContent);
assert(
  meta.mapping_file_sha256 === expectedMappingSha,
  `Artifact mapping_file_sha256 (${meta.mapping_file_sha256}) must match computed hash of ${MAPPING_PATH} (${expectedMappingSha})`
);

const generatorContent = readFileSync(GENERATOR_PATH);
const expectedGeneratorSha = sha256(generatorContent);
assert(
  meta.generator_sha256 === expectedGeneratorSha,
  `Artifact generator_sha256 (${meta.generator_sha256}) must match computed hash of ${GENERATOR_PATH} (${expectedGeneratorSha})`
);
console.log(`[PASS] Input provenance hashes verified for mapping (${meta.mapping_file_sha256.slice(0, 16)}...) and generator (${meta.generator_sha256.slice(0, 16)}...)`);

// 4. Validate against Place Mapping Audit & Exact Inputs
assert(audit.all_mapped_ids_verified === true, "place_mapping_audit.json must confirm all_mapped_ids_verified");
assert(audit.all_labels_verified === true, "place_mapping_audit.json must confirm all_labels_verified");
assert(audit.mapped_places_count === 19, `Audit must report exactly 19 mapped places (got ${audit.mapped_places_count})`);
assert(audit.unmapped_places_count === 10, `Audit must report exactly 10 unmapped places (got ${audit.unmapped_places_count})`);

// Bind audit to exact inputs
assert(
  audit.source_mdb_sha256 === trackedMdbSha,
  `Audit source_mdb_sha256 (${audit.source_mdb_sha256}) must match tracked acquisition SHA256 (${trackedMdbSha})`
);
assert(
  audit.mapping_file_sha256 === expectedMappingSha,
  `Audit mapping_file_sha256 (${audit.mapping_file_sha256}) must match computed SHA256 of current ${MAPPING_PATH} (${expectedMappingSha})`
);
assert(
  audit.mapping_version === meta.mapping_version,
  `Audit mapping_version (${audit.mapping_version}) must match artifact mapping_version (${meta.mapping_version})`
);
console.log(`[PASS] Place mapping source-QA audit verified: 19 mapped, 10 unmapped, bound to exact inputs.`);

// 5. Mapped vs. Unmapped & Arithmetic Validation
const places = datasetContext.places || {};
const placeIds = Object.keys(places);
assert(placeIds.length === 29, `Exactly 29 canonical places must be present (got ${placeIds.length})`);

let mappedCount = 0;
let unmappedCount = 0;

for (const [canId, place] of Object.entries(places)) {
  assert(place.canonical_place_id === canId, `Place ID key mismatch: ${canId}`);
  assert(place.status === "mapped" || place.status === "unmapped", `Place ${canId} has invalid status '${place.status}' (must be 'mapped' or 'unmapped')`);

  if (place.status === "unmapped") {
    unmappedCount++;
    assert(place.crespo_lugar_id === null, `Unmapped place ${canId} must have crespo_lugar_id: null`);
    assert(place.source_native_label === null, `Unmapped place ${canId} must have source_native_label: null`);
    assert(place.periods === null, `Unmapped place ${canId} must have periods: null (no synthetic numeric zeroes)`);
    assert(
      place.coverage_caveat.includes("No reviewed Crespo place mapping is currently established for this place"),
      `Unmapped place ${canId} must use neutral unmapped copy`
    );
  } else {
    mappedCount++;
    assert(typeof place.crespo_lugar_id === "number" && place.crespo_lugar_id > 0, `Mapped place ${canId} must have positive numeric crespo_lugar_id`);
    assert(typeof place.source_native_label === "string" && place.source_native_label.length > 0, `Mapped place ${canId} must have non-empty source_native_label`);
    assert(place.periods !== null && typeof place.periods === "object", `Mapped place ${canId} must have non-null periods object`);

    for (const presetId of ["all", "1684-1695", "1702-1712"]) {
      const per = place.periods[presetId];
      assert(Boolean(per), `Mapped place ${canId} missing period preset '${presetId}'`);

      const total = per.total_records;
      const orig = per.records_with_origin;
      const dest = per.records_with_destination;
      const both = per.both_endpoint_records;

      assert(typeof total === "number" && total >= 0, `Place ${canId} (${presetId}) total_records must be non-negative integer`);
      assert(typeof orig === "number" && orig >= 0, `Place ${canId} (${presetId}) records_with_origin must be non-negative integer`);
      assert(typeof dest === "number" && dest >= 0, `Place ${canId} (${presetId}) records_with_destination must be non-negative integer`);
      assert(typeof both === "number" && both >= 0, `Place ${canId} (${presetId}) both_endpoint_records must be non-negative integer`);

      // Union arithmetic invariant: total == orig + dest - both
      assert(
        total === orig + dest - both,
        `Place ${canId} (${presetId}) arithmetic mismatch: total (${total}) != orig (${orig}) + dest (${dest}) - both (${both})`
      );

      // Self-counterpart exclusion invariant
      for (const cp of per.top_counterparts) {
        assert(
          cp.crespo_lugar_id !== place.crespo_lugar_id,
          `Place ${canId} (${presetId}) contains itself in counterparts list (lugar_id: ${cp.crespo_lugar_id})`
        );
        assert(cp.same_port_return === undefined, `Counterpart in ${canId} contains obsolete 'same_port_return' field`);
      }
    }
  }
}

assert(mappedCount === 19, `Must have exactly 19 mapped places (got ${mappedCount})`);
assert(unmappedCount === 10, `Must have exactly 10 unmapped places (got ${unmappedCount})`);
console.log(`[PASS] All 29 places verified for mapped/unmapped semantics and union arithmetic.`);

// 6. Prohibited Lexicon Check across entire published artifact
const rawJson = JSON.stringify(datasetContext);
const forbiddenPhrases = [
  "same_port_return",
  "ships sailed",
  "distinct physical vessels",
  "voyages used",
  "traffic volume",
  "market share",
  "handled 28 voyages",
  "imperial archival partition",
  "archival partition",
  "unrecorded",
  "Prize Papers Sample",
  "Early / Disaster Context"
];

for (const phrase of forbiddenPhrases) {
  assert(!rawJson.includes(phrase), `Prohibited phrase '${phrase}' detected in published dataset_context.json`);
}
console.log(`[PASS] Prohibited phrase check passed (zero forbidden terminology occurrences).`);

// Verify period labels across mapped places
for (const [canId, place] of Object.entries(places)) {
  if (place.periods) {
    for (const [presetId, per] of Object.entries(place.periods)) {
      const expectedLabel = presetId === "all" ? "1650–1730" : presetId === "1684-1695" ? "1684–1695" : "1702–1712";
      assert(
        per.period_label === expectedLabel,
        `Place ${canId} preset ${presetId} must have neutral date label '${expectedLabel}' (got '${per.period_label}')`
      );
    }
  }
}
console.log(`[PASS] Period labels verified as neutral date spans without thematic qualifiers.`);

// 7. Explicit Fixtures Verification
// A. Cádiz: large counts, both_endpoint_records = 24
const cadizAll = places.place_cadiz.periods.all;
assert(cadizAll.total_records === 1093, `Cádiz baseline total_records must be 1,093 (got ${cadizAll.total_records})`);
assert(cadizAll.records_with_origin === 985, `Cádiz baseline records_with_origin must be 985 (got ${cadizAll.records_with_origin})`);
assert(cadizAll.records_with_destination === 132, `Cádiz baseline records_with_destination must be 132 (got ${cadizAll.records_with_destination})`);
assert(cadizAll.both_endpoint_records === 24, `Cádiz baseline both_endpoint_records must be 24 (got ${cadizAll.both_endpoint_records})`);
assert(!cadizAll.top_counterparts.some(c => c.crespo_lugar_id === 195 || c.source_label === "Cádiz"), "Cádiz must not appear in its own counterparts list");
console.log(`[PASS] Fixture Cádiz verified: 1093 total (985 origin, 132 dest, 24 both endpoints overlap).`);

// B. London: mapped-zero
const london = places.place_london;
assert(london.status === "mapped", "London must be status 'mapped'");
assert(london.periods.all.total_records === 0, "London baseline total_records must be 0");
assert(london.periods.all.top_counterparts.length === 0, "London baseline top_counterparts must be empty");
assert(london.coverage_caveat.includes("No Crespo vessel records record London as an endpoint in 1650–1730."), "London must use mapped-zero caveat");
console.log(`[PASS] Fixture London (mapped-zero) verified.`);

// C. Port Royal: unmapped
const portRoyal = places.place_port_royal;
assert(portRoyal.status === "unmapped", "Port Royal must be status 'unmapped'");
assert(portRoyal.periods === null, "Port Royal periods must be null");
console.log(`[PASS] Fixture Port Royal (unmapped, null periods) verified.`);

// D. Saint-Domingue: unmapped (resolution required)
const stDomingue = places.place_st_domingo;
assert(stDomingue.status === "unmapped", "Saint-Domingue must be status 'unmapped'");
assert(stDomingue.periods === null, "Saint-Domingue periods must be null");
console.log(`[PASS] Fixture Saint-Domingue (unmapped, resolution required) verified.`);

// E. Havana: sentinel counts
const havanaAll = places.place_havana.periods.all;
assert(havanaAll.total_records === 28, `Havana baseline total must be 28 (got ${havanaAll.total_records})`);
assert(havanaAll.records_with_origin === 7, `Havana baseline origin must be 7 (got ${havanaAll.records_with_origin})`);
assert(havanaAll.records_with_destination === 21, `Havana baseline dest must be 21 (got ${havanaAll.records_with_destination})`);
const havanaEarly = places.place_havana.periods["1684-1695"];
assert(havanaEarly.total_records === 5, `Havana 1684-1695 total must be 5 (got ${havanaEarly.total_records})`);
assert(havanaEarly.top_counterparts.some(c => c.source_label === "Cádiz" && c.total_records === 3), "Havana 1684-1695 Cádiz counterpart must be 3 records");
console.log(`[PASS] Fixture Havana verified (28 baseline, 5 early focus, 3 Cádiz counterparts).`);

console.log("\n[SUCCESS] All Dataset Context publication and provenance invariants verified successfully.\n");
