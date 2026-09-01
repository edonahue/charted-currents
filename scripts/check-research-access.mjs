#!/usr/bin/env node
/**
 * scripts/check-research-access.mjs
 *
 * Local research-workstation diagnostic for Charted Currents.
 * Tests connectivity and authorization for configured research credentials.
 *
 * Usage: npm run research:check-access
 *
 * Safety rules:
 * - Loads .env only when explicitly invoked locally.
 * - Never emits tokens, keys, usernames, or authenticated URLs.
 * - Never runs during CI, Astro build, or Cloudflare deployment.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

// Helper to load .env if present
export function loadEnv(envPath = path.resolve(process.cwd(), ".env")) {
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, "utf8");
  const parsed = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (key) {
      parsed[key] = val;
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
  return parsed;
}

export function classifyGeoNamesResponse(httpStatus, data) {
  if (httpStatus === 200 && data?.geonames && data.geonames.length > 0) {
    return { status: "PASS", note: `HTTP 200 (Found ${data.totalResultsCount || data.geonames.length} results)` };
  }
  const statusVal = data?.status?.value;
  const msg = (data?.status?.message || "").toLowerCase();

  if (statusVal === 10 || msg.includes("user does not exist") || msg.includes("invalid user")) {
    return { status: "INVALID", note: "Account username does not exist or is invalid" };
  }
  if (statusVal === 18 || statusVal === 19 || msg.includes("free web services") || msg.includes("daily limit")) {
    return { status: "DISABLED", note: "Account exists but free web services are disabled. Enable at geonames.org/manageaccount" };
  }
  if (httpStatus === 401 || httpStatus === 403) {
    return { status: "INVALID", note: `HTTP ${httpStatus} (Authentication failed)` };
  }
  return { status: "SERVICE_ERROR", note: `HTTP ${httpStatus} (${data?.status?.message || "Service error"})` };
}

export function classifyStandardApiResponse(_serviceName, httpStatus, data, totalCount) {
  if (httpStatus === 200 && (data?.success || data?.status === 200 || data?.count !== undefined || Array.isArray(data?.features))) {
    const count = totalCount ?? (data?.totalResults || data?.response?.rowCount || data?.count || data?.features?.length || 0);
    return { status: "PASS", note: `HTTP 200 (API key accepted; ${count} results)` };
  }
  if (httpStatus === 401 || httpStatus === 403) {
    return { status: "INVALID", note: `HTTP ${httpStatus} (Invalid API key or token rejected)` };
  }
  return { status: "SERVICE_ERROR", note: `HTTP ${httpStatus} (${data?.message || data?.error || "Service returned error"})` };
}

async function runDiagnostic() {
  loadEnv();

  console.log("=== Charted Currents Research Access Diagnostic ===");
  console.log("(Local workstation verification only — zero secrets logged)\n");

  const results = [];

  // 1. WHG
  const whgToken = process.env.WHG_API_TOKEN?.trim();
  if (!whgToken) {
    results.push({ service: "World Historical Gazetteer (WHG)", status: "MISSING", note: "WHG_API_TOKEN not set in .env" });
  } else {
    try {
      const res = await fetch("https://whgazetteer.org/api/index/?name=Jamaica", {
        headers: {
          "Authorization": `Token ${whgToken}`,
          "User-Agent": "ChartedCurrentsResearch/0.1 (https://github.com/edonahue/charted-currents)"
        }
      });
      const data = res.ok ? await res.json() : null;
      results.push({ service: "World Historical Gazetteer (WHG)", ...classifyStandardApiResponse("WHG", res.status, data, data?.features?.length) });
    } catch (err) {
      results.push({ service: "World Historical Gazetteer (WHG)", status: "SERVICE_ERROR", note: `Network connection error: ${err.message}` });
    }
  }

  // 2. GeoNames
  const geoUsername = process.env.GEONAMES_USERNAME?.trim();
  if (!geoUsername) {
    results.push({ service: "GeoNames", status: "MISSING", note: "GEONAMES_USERNAME not set in .env" });
  } else {
    try {
      const res = await fetch(`https://secure.geonames.org/searchJSON?q=Port+Royal&country=JM&maxRows=1&username=${encodeURIComponent(geoUsername)}`);
      const data = await res.json();
      results.push({ service: "GeoNames", ...classifyGeoNamesResponse(res.status, data) });
    } catch (err) {
      results.push({ service: "GeoNames", status: "SERVICE_ERROR", note: `Network connection error: ${err.message}` });
    }
  }

  // 3. Europeana
  const eurKey = process.env.EUROPEANA_API_KEY?.trim();
  if (!eurKey) {
    results.push({ service: "Europeana", status: "MISSING", note: "EUROPEANA_API_KEY not set in .env" });
  } else {
    try {
      const res = await fetch(`https://api.europeana.eu/record/v2/search.json?query=Jamaica&rows=1&wskey=${encodeURIComponent(eurKey)}`);
      const data = await res.json();
      results.push({ service: "Europeana", ...classifyStandardApiResponse("Europeana", res.status, data, data?.totalResults) });
    } catch (err) {
      results.push({ service: "Europeana", status: "SERVICE_ERROR", note: `Network connection error: ${err.message}` });
    }
  }

  // 4. Smithsonian
  const smithKey = process.env.SMITHSONIAN_API_KEY?.trim();
  if (!smithKey) {
    results.push({ service: "Smithsonian Open Access", status: "MISSING", note: "SMITHSONIAN_API_KEY not set in .env" });
  } else {
    try {
      const res = await fetch(`https://api.si.edu/openaccess/api/v1.0/search?q=Jamaica&rows=1&api_key=${encodeURIComponent(smithKey)}`);
      const data = await res.json();
      results.push({ service: "Smithsonian Open Access", ...classifyStandardApiResponse("Smithsonian", res.status, data, data?.response?.rowCount) });
    } catch (err) {
      results.push({ service: "Smithsonian Open Access", status: "SERVICE_ERROR", note: `Network connection error: ${err.message}` });
    }
  }

  // 5. DPLA
  const dplaKey = process.env.DPLA_API_KEY?.trim();
  if (!dplaKey) {
    results.push({ service: "DPLA", status: "MISSING", note: "DPLA_API_KEY not set in .env" });
  } else {
    try {
      const res = await fetch(`https://api.dp.la/v2/items?q=Jamaica&page_size=1&api_key=${encodeURIComponent(dplaKey)}`);
      const data = await res.json();
      results.push({ service: "DPLA", ...classifyStandardApiResponse("DPLA", res.status, data, data?.count) });
    } catch (err) {
      results.push({ service: "DPLA", status: "SERVICE_ERROR", note: `Network connection error: ${err.message}` });
    }
  }

  // Print results table
  for (const r of results) {
    const prefix = r.status === "PASS" ? "[PASS]" : r.status === "DISABLED" ? "[WARN]" : r.status === "MISSING" ? "[SKIP]" : "[FAIL]";
    console.log(`${prefix.padEnd(7)} ${r.service.padEnd(34)} : ${r.note}`);
  }

  console.log("\nDiagnostic complete.");

  const hasFatal = results.some((r) => r.status === "INVALID" || r.status === "SERVICE_ERROR");
  process.exit(hasFatal ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  runDiagnostic();
}
