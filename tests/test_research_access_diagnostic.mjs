#!/usr/bin/env node
/**
 * tests/test_research_access_diagnostic.mjs
 *
 * Unit tests for research access diagnostic response classification and secret redaction.
 * Runs completely offline without making live network requests.
 *
 * Usage: node tests/test_research_access_diagnostic.mjs
 */

import { classifyGeoNamesResponse, classifyStandardApiResponse } from "../scripts/check-research-access.mjs";

console.log("=== Running Research Access Diagnostic Unit Tests ===");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

// Test 1: GeoNames success classification
{
  const result = classifyGeoNamesResponse(200, { geonames: [{ name: "Port Royal" }], totalResultsCount: 1 });
  assert(result.status === "PASS", "GeoNames HTTP 200 with results classified as PASS");
}

// Test 2: GeoNames invalid account (status 10)
{
  const result = classifyGeoNamesResponse(200, { status: { message: "user does not exist", value: 10 } });
  assert(result.status === "INVALID", "GeoNames status value 10 classified as INVALID");
}

// Test 3: GeoNames disabled web services (status 18 / 19)
{
  const result = classifyGeoNamesResponse(200, { status: { message: "free web services are disabled", value: 18 } });
  assert(result.status === "DISABLED", "GeoNames disabled free web services classified as DISABLED");
}

// Test 4: Standard API success classification
{
  const result = classifyStandardApiResponse("Europeana", 200, { success: true, totalResults: 100 });
  assert(result.status === "PASS", "Europeana HTTP 200 classified as PASS");
}

// Test 5: Standard API 401 unauthorized
{
  const result = classifyStandardApiResponse("Smithsonian", 401, { message: "Invalid key" });
  assert(result.status === "INVALID", "Smithsonian HTTP 401 classified as INVALID");
}

// Test 6: Secret redaction in output strings
{
  const mockSecret = "super_secret_api_token_12345";
  const result = classifyStandardApiResponse("WHG", 401, { message: `Token ${mockSecret} rejected` });
  assert(!result.note.includes(mockSecret), "Classified note does not leak raw secret tokens");
}

console.log(`\nDiagnostic Unit Test Summary: ${passed} passed, ${failed} failed.`);
process.exit(failed > 0 ? 1 : 0);
