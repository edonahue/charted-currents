#!/usr/bin/env node
/**
 * scripts/check-research-access.mjs
 *
 * Local research-workstation diagnostic for Charted Currents.
 * Tests connectivity for configured research credentials without emitting secrets.
 *
 * Usage: npm run research:check-access
 *
 * Safety rules:
 * - Loads .env only when explicitly invoked.
 * - Never emits tokens, keys, usernames, or authenticated URLs.
 * - Never runs during CI, Astro build, or Cloudflare deployment.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

// Helper to load .env if present
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnv();

console.log("=== Charted Currents Research Access Diagnostic ===");
console.log("(Local workstation verification only — zero secrets logged)\n");

const results = [];

async function checkWHG() {
  const token = process.env.WHG_API_TOKEN?.trim();
  if (!token) {
    results.push({ service: "World Historical Gazetteer (WHG)", status: "MISSING", note: "WHG_API_TOKEN not set in .env" });
    return;
  }
  try {
    const res = await fetch("https://whgazetteer.org/api/index/?name=Jamaica", {
      headers: {
        "Authorization": `Token ${token}`,
        "User-Agent": "ChartedCurrentsResearch/0.1 (https://github.com/edonahue/charted-currents)"
      }
    });
    if (res.ok) {
      const data = await res.json();
      const count = data?.features?.length ?? 0;
      results.push({ service: "World Historical Gazetteer (WHG)", status: "PASS", note: `HTTP ${res.status} (${count} features returned)` });
    } else {
      results.push({ service: "World Historical Gazetteer (WHG)", status: "WARN", note: `HTTP ${res.status} (Authentication failed or token invalid)` });
    }
  } catch (err) {
    results.push({ service: "World Historical Gazetteer (WHG)", status: "ERR", note: `Network error: ${err.message}` });
  }
}

async function checkGeoNames() {
  const username = process.env.GEONAMES_USERNAME?.trim();
  if (!username) {
    results.push({ service: "GeoNames", status: "MISSING", note: "GEONAMES_USERNAME not set in .env" });
    return;
  }
  try {
    const res = await fetch(`https://secure.geonames.org/searchJSON?q=Port+Royal&country=JM&maxRows=1&username=${encodeURIComponent(username)}`);
    const data = await res.json();
    if (data?.geonames && data.geonames.length > 0) {
      results.push({ service: "GeoNames", status: "PASS", note: `HTTP ${res.status} (Found ${data.totalResultsCount} results)` });
    } else if (data?.status?.value === 10 || data?.status?.message?.includes("user does not exist")) {
      results.push({ service: "GeoNames", status: "WARN", note: `HTTP ${res.status} (Account exists but free web services are disabled. Enable at geonames.org/manageaccount)` });
    } else {
      results.push({ service: "GeoNames", status: "WARN", note: `HTTP ${res.status} (${data?.status?.message || "No results returned"})` });
    }
  } catch (err) {
    results.push({ service: "GeoNames", status: "ERR", note: `Network error: ${err.message}` });
  }
}

async function checkEuropeana() {
  const key = process.env.EUROPEANA_API_KEY?.trim();
  if (!key) {
    results.push({ service: "Europeana", status: "MISSING", note: "EUROPEANA_API_KEY not set in .env" });
    return;
  }
  try {
    const res = await fetch(`https://api.europeana.eu/record/v2/search.json?query=Jamaica&rows=1&wskey=${encodeURIComponent(key)}`);
    const data = await res.json();
    if (data?.success) {
      results.push({ service: "Europeana", status: "PASS", note: `HTTP ${res.status} (API key accepted; ${data.totalResults} results)` });
    } else {
      results.push({ service: "Europeana", status: "WARN", note: `HTTP ${res.status} (Authentication failed: ${data?.error || "Unknown error"})` });
    }
  } catch (err) {
    results.push({ service: "Europeana", status: "ERR", note: `Network error: ${err.message}` });
  }
}

async function checkSmithsonian() {
  const key = process.env.SMITHSONIAN_API_KEY?.trim();
  if (!key) {
    results.push({ service: "Smithsonian Open Access", status: "MISSING", note: "SMITHSONIAN_API_KEY not set in .env" });
    return;
  }
  try {
    const res = await fetch(`https://api.si.edu/openaccess/api/v1.0/search?q=Jamaica&rows=1&api_key=${encodeURIComponent(key)}`);
    const data = await res.json();
    if (data?.status === 200) {
      results.push({ service: "Smithsonian Open Access", status: "PASS", note: `HTTP ${res.status} (API key accepted; ${data.response?.rowCount} results)` });
    } else {
      results.push({ service: "Smithsonian Open Access", status: "WARN", note: `HTTP ${res.status} (${data?.message || "Invalid API key"})` });
    }
  } catch (err) {
    results.push({ service: "Smithsonian Open Access", status: "ERR", note: `Network error: ${err.message}` });
  }
}

async function checkDPLA() {
  const key = process.env.DPLA_API_KEY?.trim();
  if (!key) {
    results.push({ service: "DPLA", status: "MISSING", note: "DPLA_API_KEY not set in .env" });
    return;
  }
  try {
    const res = await fetch(`https://api.dp.la/v2/items?q=Jamaica&page_size=1&api_key=${encodeURIComponent(key)}`);
    const data = await res.json();
    if (data?.count !== undefined) {
      results.push({ service: "DPLA", status: "PASS", note: `HTTP ${res.status} (API key accepted; ${data.count} results)` });
    } else {
      results.push({ service: "DPLA", status: "WARN", note: `HTTP ${res.status} (${data?.message || "Invalid API key"})` });
    }
  } catch (err) {
    results.push({ service: "DPLA", status: "ERR", note: `Network error: ${err.message}` });
  }
}

async function run() {
  await Promise.all([checkWHG(), checkGeoNames(), checkEuropeana(), checkSmithsonian(), checkDPLA()]);

  for (const r of results) {
    const prefix = r.status === "PASS" ? "[PASS]" : r.status === "WARN" ? "[WARN]" : r.status === "MISSING" ? "[SKIP]" : "[FAIL]";
    console.log(`${prefix.padEnd(7)} ${r.service.padEnd(34)} : ${r.note}`);
  }

  console.log("\nDiagnostic complete.");
  const hasFatal = results.some((r) => r.status === "ERR");
  process.exit(hasFatal ? 1 : 0);
}

run();
