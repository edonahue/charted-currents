#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

function git(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" }).trim();
  } catch {
    return "UNAVAILABLE";
  }
}

function readJson(path, fallback = null) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function argsValue(prefix) {
  const arg = process.argv.find((v) => v.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
}

const jsonMode = process.argv.includes("--json");
const sourceFilter = argsValue("--source=");
const factsArg = argsValue("--facts=");
const qualityArg = argsValue("--quality=");

const qualityPath = qualityArg || (existsSync("test-results/quality-audit.json") ? "test-results/quality-audit.json" : null);
const qualityData = qualityPath ? readJson(qualityPath, null) : null;

const factsPath = factsArg || null;
const factsData = factsPath ? readJson(factsPath, null) : null;

const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]);
const head = git(["rev-parse", "HEAD"]);
const statusRaw = git(["status", "--porcelain"]);
const workingTree = statusRaw === "UNAVAILABLE" ? "unknown" : statusRaw ? "dirty" : "clean";

const manifest = readJson("public/data/manifest.json", {});
const entities = readJson("public/data/entities.json", {});
const eventsObj = readJson("public/data/events.json", {});
const routes = readJson("public/data/routes.geojson", {});
const sources = readJson("public/data/sources.json", {});
const coverage = readJson("public/data/coverage.json", []);
const datasetContext = readJson("public/data/dataset_context.json", null);
const activePacket = readJson(".agent/active-packet.json", null);

const sourceRecords = Array.isArray(sources.source_records) ? sources.source_records : [];
const sourceContainers = Array.isArray(sources.sources) ? sources.sources : [];
const assertions = Array.isArray(sources.assertions) ? sources.assertions : [];

const sourceCounts = sourceRecords.reduce((acc, record) => {
  const id = record.source_id || "unknown";
  acc[id] = (acc[id] || 0) + 1;
  return acc;
}, {});

const filteredRecords = sourceFilter
  ? sourceRecords.filter((r) => String(r.source_id || "").toLowerCase().includes(sourceFilter.toLowerCase()) || String(r.id || "").toLowerCase().includes(sourceFilter.toLowerCase()))
  : [];

const report = {
  state: "SELF_VERIFIED_REQUIRES_EXTERNAL_REVIEW",
  git: {
    branch,
    head,
    working_tree: workingTree,
  },
  active_packet: activePacket,
  corpus: {
    version: manifest.version ?? null,
    corpus_id: manifest.corpusId ?? null,
    title: manifest.corpusTitle ?? null,
    review_status: manifest.reviewStatus ?? null,
    published_at: manifest.publishedAt ?? null,
    counts: manifest.counts ?? {
      ships: Array.isArray(entities.ships) ? entities.ships.length : null,
      ship_occurrences: Array.isArray(entities.ship_occurrences) ? entities.ship_occurrences.length : null,
      crew_occurrences: Array.isArray(entities.crew_occurrences) ? entities.crew_occurrences.length : null,
      places: Array.isArray(entities.places) ? entities.places.length : null,
      routes: Array.isArray(entities.routes) ? entities.routes.length : null,
      display_edges: Array.isArray(routes.features) ? routes.features.length : null,
      events: Array.isArray(eventsObj.events) ? eventsObj.events.length : null,
    },
  },
  evidence_graph: {
    sources: sourceContainers.length,
    source_records: sourceRecords.length,
    assertions: assertions.length,
    source_record_counts: sourceCounts,
    coverage_entries: Array.isArray(coverage) ? coverage.length : 0,
  },
  source_filter: sourceFilter
    ? {
        query: sourceFilter,
        records: filteredRecords.map((r) => ({
          id: r.id,
          source_id: r.source_id,
          native_identifier: r.native_identifier ?? r.native_id ?? null,
          title: r.title ?? r.record_title ?? null,
          inspection_state: r.inspection_state ?? null,
          upstream_archive_reference: r.upstream_archive_reference ?? null,
        })),
      }
    : null,
  dataset_context: datasetContext
    ? {
        baseline_period: datasetContext.metadata?.baseline_period ?? null,
        total_records_in_baseline: datasetContext.metadata?.total_records_in_baseline ?? null,
        counting_unit: datasetContext.metadata?.counting_unit ?? null,
        total_places: Object.keys(datasetContext.places || {}).length,
        mapped_places: Object.values(datasetContext.places || {}).filter((p) => p.status === "mapped").length,
        unrecorded_places: Object.values(datasetContext.places || {}).filter((p) => p.status === "unrecorded").length,
      }
    : null,
  quality_audit: qualityData
    ? {
        path: qualityPath,
        mode: qualityData.mode ?? null,
        timestamp: qualityData.timestamp ?? null,
        summary: qualityData.summary ?? null,
        journeys_passed: qualityData.summary?.journeys_passed ?? null,
        journeys_total: Array.isArray(qualityData.journeys) ? qualityData.journeys.length : null,
      }
    : null,
  machine_derived_facts: factsData
    ? {
        path: factsPath,
        facts: factsData,
      }
    : null,
  caveat: "This report is data-derived. It does not assert that tests, CI, preview, production deployment, source URLs, or external services were verified in this run.",
};

if (jsonMode) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

console.log("==========================================");
console.log("CHARTED CURRENTS · PACKET REPORT");
console.log("==========================================");
console.log(`State:        ${report.state}`);
console.log(`Branch:       ${branch}`);
console.log(`HEAD:         ${head}`);
console.log(`Working tree: ${workingTree}`);
if (activePacket) {
  console.log(`Packet:       ${activePacket.packet ?? "unknown"} · ${activePacket.title ?? "untitled"}`);
  console.log(`Packet state: ${activePacket.state ?? activePacket.status ?? "unknown"}`);
}
console.log("------------------------------------------");
console.log(`Corpus:       ${manifest.version ?? "unknown"} · ${manifest.corpusTitle ?? "unknown"}`);
console.log(`Review:       ${manifest.reviewStatus ?? "unknown"}`);
for (const [key, value] of Object.entries(manifest.counts || {})) {
  console.log(`${key.padEnd(22)} ${value}`);
}
if (datasetContext) {
  console.log("------------------------------------------");
  console.log(`Dataset Context:       ${datasetContext.metadata?.total_records_in_baseline} baseline records (${datasetContext.metadata?.baseline_period}) across ${Object.keys(datasetContext.places || {}).length} places`);
  console.log(`Counting unit:         ${datasetContext.metadata?.counting_unit}`);
}
console.log("------------------------------------------");
console.log("Source records by source:");
for (const [key, value] of Object.entries(sourceCounts).sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`  ${key}: ${value}`);
}
if (sourceFilter) {
  console.log("------------------------------------------");
  console.log(`Source filter: ${sourceFilter}`);
  for (const record of report.source_filter.records) {
    console.log(`  ${record.id} | native=${record.native_identifier ?? "—"} | inspection=${record.inspection_state ?? "—"} | ${record.title ?? ""}`);
  }
}
if (report.quality_audit && report.quality_audit.summary) {
  const qa = report.quality_audit;
  console.log("------------------------------------------");
  console.log(`Quality & Accessibility Audit (${qa.path}):`);
  console.log(`  Critical A11y Violations: ${qa.summary.critical_a11y ?? 0}`);
  console.log(`  Serious A11y Violations:  ${qa.summary.serious_a11y ?? 0} (${qa.summary.allowed_serious_a11y ?? 0} allowed baseline, ${qa.summary.unallowed_serious_a11y ?? 0} unallowed)`);
  console.log(`  Moderate A11y Violations: ${qa.summary.moderate_a11y ?? 0}`);
  console.log(`  Minor A11y Violations:    ${qa.summary.minor_a11y ?? 0}`);
  console.log(`  Layout Failures:          ${qa.summary.layout_failures ?? 0}`);
  console.log(`  User Journeys:            ${qa.journeys_passed ?? 0} / ${qa.journeys_total ?? 0} passed`);
}
if (report.machine_derived_facts && report.machine_derived_facts.facts) {
  const mf = report.machine_derived_facts;
  console.log("------------------------------------------");
  console.log(`Machine-Derived Facts (${mf.path}):`);
  const fd = mf.facts;
  function printFacts(obj, indent = "  ") {
    for (const [k, v] of Object.entries(obj)) {
      if (v !== null && typeof v === "object" && !Array.isArray(v)) {
        console.log(`${indent}${k}:`);
        printFacts(v, indent + "  ");
      } else if (Array.isArray(v)) {
        console.log(`${indent}${k.padEnd(24)} [${v.length} items]`);
      } else if (v !== null && v !== undefined) {
        console.log(`${indent}${k.padEnd(24)} ${v}`);
      }
    }
  }
  printFacts(fd);
}
console.log("------------------------------------------");
console.log("NOTE: This report does not prove tests, CI, preview, hosted deployment, source-link health, or external service status.");
console.log("External review is required before packet acceptance.");
