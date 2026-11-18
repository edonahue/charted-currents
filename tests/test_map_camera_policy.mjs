import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import * as maplibre from "maplibre-gl";

const require = createRequire(import.meta.url);
function loadTypeScript(relativePath, overrides = {}) {
  const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const module = { exports: {} };
  new Function("require", "module", "exports", compiled.outputText)(
    (name) => overrides[name] ?? require(name), module, module.exports);
  return module.exports;
}
const config = loadTypeScript("../src/lib/map/config.ts", { "./visualPolicy": {} });
const { selectionCoordinates, visibleMapPadding, revealSelection } = loadTypeScript("../src/lib/map/cameraPolicy.ts", { "./config": config, "maplibre-gl": maplibre });

// A separate desktop dock is already outside the canvas. A sheet overlaps it.
const canvas = { left: 0, top: 0, right: 1000, bottom: 700 };
const clear = visibleMapPadding(canvas);
assert.deepEqual(visibleMapPadding(canvas, { left: 1000, top: 0, right: 1400, bottom: 700 }), clear);
assert.ok(visibleMapPadding(canvas, { left: 0, top: 450, right: 1000, bottom: 700 }).bottom >= 250);
const expanded = visibleMapPadding({ left: 0, top: 0, right: 390, bottom: 500 }, { left: 0, top: 20, right: 390, bottom: 500 });
assert.ok(expanded.top + expanded.bottom < 500, "expanded sheet must leave a valid viewport");

// Reuse published geometry with explicitly synthetic membership to exercise a
// vessel with multiple route groups, a condition the current corpus lacks.
const routes = JSON.parse(readFileSync(new URL("../public/data/routes.geojson", import.meta.url), "utf8"));
for (const route of routes.features.slice(0, 2)) route.properties.constituent_vessel_ids.push("synthetic_camera_test_vessel");
const vesselCounts = new Map();
for (const route of routes.features) for (const vesselId of route.properties.constituent_vessel_ids) {
  const coordinates = vesselCounts.get(vesselId) ?? [];
  coordinates.push(...route.geometry.coordinates);
  vesselCounts.set(vesselId, coordinates);
}
const repeated = [...vesselCounts].find(([id]) => routes.features.filter((route) => route.properties.constituent_vessel_ids.includes(id)).length > 1);
assert.ok(repeated, "corpus should exercise a vessel in multiple route groups");
assert.deepEqual(selectionCoordinates({ kind: "ship", id: repeated[0] }, null, routes), repeated[1]);
assert.deepEqual(selectionCoordinates(null, null, routes), []);

const calls = [];
const map = {
  getContainer: () => ({ getBoundingClientRect: () => ({ width: 1000, height: 700 }) }),
  getProjection: () => ({ type: "mercator" }), getCenter: () => ({ lng: 0, lat: 0 }), getZoom: () => 4,
  project: ([x, y]) => ({ x, y }), stop: () => calls.push(["stop"]),
  easeTo: (options) => calls.push(["ease", options]), fitBounds: (bounds, options) => calls.push(["fit", options, bounds]),
};
assert.equal(revealSelection(map, [[400, 300]], clear, false), false);
assert.equal(calls.length, 0, "visible target must preserve user's camera");
map.getProjection = () => undefined;
assert.equal(revealSelection(map, [[400, 300]], clear, false), false, "seed style without explicit projection defaults to mercator");
assert.equal(revealSelection(map, [[990, 300]], clear, true), true);
assert.equal(calls.at(-1)[1].duration, 0, "reduced motion must remove camera travel");
calls.length = 0;
assert.equal(revealSelection(map, [[-80, 20], [0, 50]], clear, false), true);
assert.equal(calls.at(-1)[0], "fit");
assert.equal(calls.at(-1)[1].maxZoom, 4, "selection must not gratuitously zoom in");
assert.equal(calls.at(-1)[1].linear, true, "route reveal must ease rather than fly");
map.getProjection = () => ({ type: "globe" });
map.project = () => ({ x: 500, y: 350 });
calls.length = 0;
assert.equal(revealSelection(map, [[180, 0]], clear, false), true, "back hemisphere must not count as visible");
console.log("Map camera policy: occlusion, continuity, all vessel routes, globe visibility, and reduced motion passed.");

const { readGeographicView, writeGeographicView, startViewNavigation } = loadTypeScript("../src/lib/map/viewNavigation.ts", { "./config": config });
const original = new URL("https://example.test/atlas/?select=ship%3Avessel&period=1684-1695&other=keep#record");
assert.equal(readGeographicView(original), null, "selection-only link must not imply a stale geographic view");
for (const query of ["view=181,0,4", "view=0,91,4", "view=0,0,20", "view=0,,4", "view=0,0,4&view=1,1,4", "view=0,0,4&mode=unknown"]) {
  assert.equal(readGeographicView(new URL(`https://example.test/?${query}`)), null);
}
const geographic = writeGeographicView(original, { center: [-42.125, 23], zoom: 1.8, mode: "globe" });
assert.deepEqual(readGeographicView(geographic), { center: [-42.125, 23], zoom: 1.8, mode: "globe" });
assert.equal(geographic.searchParams.get("select"), "ship:vessel");
assert.equal(geographic.searchParams.get("other"), "keep");
assert.equal(geographic.hash, "#record");
assert.ok(config.globeOrientationZoom(1440, 650) > config.globeOrientationZoom(390, 650), "globe scale must adapt to available screen width");

// Lifecycle/history contract: no writes mid-motion or during restoration,
// explicit views push once, manual navigation replaces only after settling.
const windowListeners = new Map();
const frames = new Map();
let frameSerial = 0;
const savedGlobals = { window: globalThis.window, requestAnimationFrame: globalThis.requestAnimationFrame, cancelAnimationFrame: globalThis.cancelAnimationFrame };
const historyWrites = [];
globalThis.window = {
  location: { href: original.href },
  history: { state: {}, pushState(_state, _title, url) { historyWrites.push("push"); window.location.href = String(url); },
    replaceState(_state, _title, url) { historyWrites.push("replace"); window.location.href = String(url); } },
  addEventListener(type, handler) { const set = windowListeners.get(type) ?? new Set(); set.add(handler); windowListeners.set(type, set); },
  removeEventListener(type, handler) { windowListeners.get(type)?.delete(handler); },
};
globalThis.requestAnimationFrame = (callback) => { frames.set(++frameSerial, callback); return frameSerial; };
globalThis.cancelAnimationFrame = (id) => frames.delete(id);
const mapListeners = new Map();
let jumpCount = 0;
let mode = "mercator";
let center = [-72, 20];
let zoom = 4;
const navigationMap = {
  on(type, handler) { mapListeners.set(type, handler); }, off(type) { mapListeners.delete(type); },
  getContainer: () => ({ getBoundingClientRect: () => ({ width: 1440, height: 650 }) }),
  getCenter: () => ({ wrap: () => ({ lng: center[0], lat: center[1] }) }), getZoom: () => zoom,
  getProjection: () => ({ type: mode }), setProjection(value) { mode = value.type; },
  jumpTo(value) { jumpCount++; center = value.center; zoom = value.zoom; mapListeners.get("moveend")?.(); },
};
try {
  const controller = startViewNavigation(navigationMap, { cancelSelectionCamera() {}, onMode() {} });
  assert.equal(jumpCount, 0);
  controller.userInput();
  assert.equal(historyWrites.length, 0, "in-flight view must remain transient");
  mapListeners.get("moveend")();
  assert.deepEqual(historyWrites, ["replace"]);
  controller.selectionChanged();
  mapListeners.get("moveend")();
  assert.equal(historyWrites.length, 1, "selection correction must not write geography");
  controller.explicitView(); center = [-42, 23]; zoom = 1.8; mode = "globe";
  mapListeners.get("moveend")();
  assert.deepEqual(historyWrites, ["replace", "push"]);
  window.location.href = geographic.href;
  for (const handler of windowListeners.get("popstate")) handler();
  for (const callback of frames.values()) callback(); frames.clear();
  assert.deepEqual(center, [-42.125, 23]);
  assert.equal(mode, "globe");
  assert.equal(historyWrites.length, 2, "history restoration must not write another entry");
  const previousJumps = jumpCount;
  window.location.href = original.href;
  for (const handler of windowListeners.get("popstate")) handler();
  for (const callback of frames.values()) callback(); frames.clear();
  assert.equal(jumpCount, previousJumps, "selection-only history must not restore unrelated geography");
  controller.dispose();
  assert.equal(mapListeners.size, 0);
  assert.ok([...windowListeners.values()].every((set) => set.size === 0));
} finally {
  for (const [key, value] of Object.entries(savedGlobals)) {
    if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
  }
}
console.log("Map geographic navigation: validated deep links, settled history, restoration, and cleanup passed.");
