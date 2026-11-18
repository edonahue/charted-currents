import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

function loadTypeScript(relativePath, imports = {}) {
  const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const module = { exports: {} };
  new Function("require", "module", "exports", compiled.outputText)(
    (name) => {
      assert.ok(name in imports, `unexpected runtime import: ${name}`);
      return imports[name];
    }, module, module.exports);
  return module.exports;
}
const policy = loadTypeScript("../src/lib/map/visualPolicy.ts");
const { transformBasemapStyle } = loadTypeScript("../src/lib/map/applyVisualPolicy.ts", { "./visualPolicy": policy });

// Synthetic provider configuration exercises preservation without historical data.
const next = {
  version: 8,
  name: "Synthetic provider fixture",
  metadata: { fixture: "basemap-transform-preservation" },
  glyphs: "https://example.invalid/glyphs/{fontstack}/{range}.pbf",
  sprite: "https://example.invalid/sprite",
  sources: { fixture: { type: "vector", url: "https://example.invalid/tiles.json", attribution: "Synthetic attribution retained" } },
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#ffffff", "background-opacity": 0.75 } },
    { id: "water", type: "fill", source: "fixture", "source-layer": "water", filter: ["==", "class", "ocean"], minzoom: 2, maxzoom: 20, paint: { "fill-color": "#ffffff", "fill-antialias": false } },
    { id: "landcover", type: "fill", source: "fixture", "source-layer": "landcover" },
    { id: "river", type: "line", source: "fixture", "source-layer": "waterway", paint: { "line-width": 2 } },
    { id: "boundary", type: "line", source: "fixture", "source-layer": "boundary" },
    { id: "country-label", type: "symbol", source: "fixture", "source-layer": "place", layout: { "text-field": "{name}", "text-font": ["Noto Sans Regular"], "text-size": 22, "text-anchor": "left" } },
    { id: "town-label", type: "symbol", source: "fixture", "source-layer": "place", layout: { "text-field": "{name}", "text-size": 13 } },
    { id: "roads", type: "line", source: "fixture", "source-layer": "transportation" },
    { id: "road-labels", type: "symbol", source: "fixture", "source-layer": "transportation_name" },
    { id: "park", type: "fill", source: "fixture", "source-layer": "park" },
    { id: "building", type: "fill-extrusion", source: "fixture", "source-layer": "building", layout: { visibility: "visible" }, paint: { "fill-extrusion-height": 8 } },
    { id: "water_name_point_label", type: "symbol", source: "fixture", "source-layer": "water_name", filter: ["==", "$type", "Point"], layout: { "text-field": ["get", "name"], "text-font": ["Noto Sans Italic"] } },
    { id: "water_name_line_label", type: "symbol", source: "fixture", "source-layer": "water_name", layout: { "symbol-placement": "line", "text-font": ["Noto Sans Italic"], "text-field": ["get", "name"] } },
    { id: "waterway_line_label", type: "symbol", source: "fixture", "source-layer": "waterway", layout: { "symbol-placement": "line", "text-font": ["Noto Sans Italic"] } },
    { id: "future-water-name", type: "symbol", source: "fixture", "source-layer": "water_name", layout: { "text-field": ["get", "name"] } },
    { id: "future-layer", type: "line", source: "fixture", "source-layer": "future-provider-layer", paint: { "line-color": "#abcdef" }, metadata: { retained: true } },
    { id: "future-type", type: "future-provider-type", source: "fixture", "source-layer": "future-provider-layer", extension: { retained: true } },
  ],
};
function deepFreeze(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
const original = structuredClone(next);
const previous = deepFreeze({ version: 8, sources: { project: { type: "geojson", data: { type: "FeatureCollection", features: [] } } }, layers: [] });
deepFreeze(next);
const result = transformBasemapStyle(previous, next);
assert.deepEqual(next, original, "transform must not mutate the provider input");
assert.notEqual(result, next);
assert.notEqual(result.layers, next.layers);
assert.deepEqual({ ...result, layers: [] }, { ...next, layers: [] }, "only provider layers may change; source attribution and URLs must survive");
assert.deepEqual(result.layers.map(({ id }) => id), next.layers.map(({ id }) => id), "preserve provider ordering and every layer");
assert.equal(result.sources.project, undefined, "previous project overlays must not leak into the provider style");
const byId = (id) => result.layers.find((layer) => layer.id === id);
assert.equal(byId("background").paint["background-opacity"], 0.75);
assert.equal(byId("water").paint["fill-antialias"], false);
for (const property of ["filter", "minzoom", "maxzoom", "source", "source-layer"]) assert.deepEqual(byId("water")[property], next.layers[1][property]);
assert.notEqual(byId("water").paint["fill-color"], "#ffffff", "known water layer must receive policy");
assert.equal(byId("river").paint["line-width"], 2);
assert.equal(byId("country-label").layout["text-anchor"], "left");
assert.deepEqual(byId("country-label").layout["text-font"], ["Noto Sans Regular"], "keep provider-compatible glyph stack");
assert.deepEqual(byId("country-label").layout["text-size"].slice(0, 3), ["interpolate", ["linear"], ["zoom"]], "zoom expression remains at the root");
assert.equal(byId("town-label").layout["text-size"], 13, "do not enlarge contemporary town labels");
assert.equal(byId("building").layout.visibility, "none");
assert.equal(byId("building").paint["fill-extrusion-height"], 8);
assert.equal(byId("water_name_point_label").layout["text-transform"], "uppercase");
assert.deepEqual(byId("water_name_point_label").layout["text-font"], ["Noto Sans Regular"]);
assert.deepEqual(byId("water_name_point_label").layout["text-field"], ["get", "name"], "retain provider language/name selection");
assert.deepEqual(byId("water_name_point_label").filter, ["==", "$type", "Point"], "water labeling must retain point-only geometry filter");
for (const id of ["water_name_line_label", "waterway_line_label", "future-water-name"]) {
  assert.equal(byId(id), next.layers.find((layer) => layer.id === id), `${id} must retain the provider policy`);
}
const changedPlacement = { ...next, layers: [{ ...next.layers.find((layer) => layer.id === "water_name_point_label"), layout: { "symbol-placement": "line" } }] };
assert.equal(transformBasemapStyle(undefined, changedPlacement).layers[0], changedPlacement.layers[0], "provider point layer changing to line placement must be left for review");
assert.equal(byId("future-layer"), next.layers.at(-2));
assert.equal(byId("future-type"), next.layers.at(-1), "unknown future layer types must survive untouched");
assert.deepEqual(transformBasemapStyle(undefined, result), result, "repeated style transforms must be idempotent");
console.log("Basemap transform: immutable input, provider preservation, typed-policy paths and idempotence passed.");
