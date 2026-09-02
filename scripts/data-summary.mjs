#!/usr/bin/env node
/**
 * scripts/data-summary.mjs
 *
 * Deterministic corpus summary reporter for Charted Currents.
 * Derives published entity counts, vessel names, places, and events directly from generated artifacts.
 */

import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve("public/data");
const manifest = JSON.parse(fs.readFileSync(path.join(dataDir, "manifest.json"), "utf8"));
const entities = JSON.parse(fs.readFileSync(path.join(dataDir, "entities.json"), "utf8"));
const routes = JSON.parse(fs.readFileSync(path.join(dataDir, "routes.geojson"), "utf8"));
const events = JSON.parse(fs.readFileSync(path.join(dataDir, "events.json"), "utf8"));

console.log("==========================================");
console.log(`CHARTED CURRENTS · CORPUS SUMMARY (${manifest.version})`);
console.log(`Review Status: ${manifest.reviewStatus}`);
console.log(`Published At:  ${manifest.publishedAt}`);
console.log("==========================================");
console.log(`- Ships (Canonical):    ${entities.ships.length}`);
console.log(`- Ship Occurrences:     ${entities.ship_occurrences.length}`);
console.log(`- Crew Depositions:     ${entities.crew_occurrences.length}`);
console.log(`- Places (Resolved):    ${entities.places.length}`);
console.log(`- Archival Routes:      ${(entities.routes || routes.archival_routes || []).length}`);
console.log(`- Map Display Edges:    ${routes.features.length}`);
console.log(`- Historical Events:    ${(events.events || events).length}`);
console.log(`- Visual References:    ${entities.visuals.length}`);
console.log("------------------------------------------");
console.log("CANONICAL VESSELS IN CORPUS:");
entities.ships.forEach((s, idx) => {
  console.log(`  ${String(idx + 1).padStart(2, " ")}. [${s.id}] ${s.canonical_name} (${s.reported_burden_display})`);
});
console.log("==========================================");
