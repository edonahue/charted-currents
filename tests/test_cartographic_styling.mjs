#!/usr/bin/env node
/**
 * tests/test_cartographic_styling.mjs
 *
 * Verification suite for cartographic styling refinement:
 * 1. Policy constants integrity (A2 waterlines, C2 basin typography, palette)
 * 2. Semantic water source discovery and idempotent coastline layer injection
 * 3. Graceful fallback when water source is missing
 * 4. Semantic marine-basin typography transformation (Path C2)
 * 5. Evidence-panel double-rule framing token compliance
 *
 * Usage: node tests/test_cartographic_styling.mjs
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { BASEMAP_VISUAL_POLICY } from "../src/lib/map/visualPolicy.ts";
import { applyBasemapVisualPolicy } from "../src/lib/map/applyVisualPolicy.ts";

console.log("=== Running Cartographic Styling Refinement Tests ===");

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName}`);
    failedTests++;
  }
}

/**
 * Creates a minimal mock MapLibre map instance for testing applyBasemapVisualPolicy.
 */
function createMockMap(initialLayers) {
  const layers = JSON.parse(JSON.stringify(initialLayers));
  const layoutProps = {};
  const paintProps = {};

  return {
    getStyle() {
      return { layers };
    },
    getLayer(id) {
      return layers.find((l) => l.id === id);
    },
    addLayer(layer, beforeId) {
      if (layers.find((l) => l.id === layer.id)) {
        throw new Error(`Layer with id "${layer.id}" already exists on the map.`);
      }
      if (beforeId) {
        const index = layers.findIndex((l) => l.id === beforeId);
        if (index !== -1) {
          layers.splice(index, 0, layer);
          return;
        }
      }
      layers.push(layer);
    },
    setLayoutProperty(layerId, name, value) {
      if (!layoutProps[layerId]) layoutProps[layerId] = {};
      layoutProps[layerId][name] = value;
      const layer = layers.find((l) => l.id === layerId);
      if (layer) {
        if (!layer.layout) layer.layout = {};
        layer.layout[name] = value;
      }
    },
    setPaintProperty(layerId, name, value) {
      if (!paintProps[layerId]) paintProps[layerId] = {};
      paintProps[layerId][name] = value;
      const layer = layers.find((l) => l.id === layerId);
      if (layer) {
        if (!layer.paint) layer.paint = {};
        layer.paint[name] = value;
      }
    },
    _getLayoutProps: () => layoutProps,
    _getPaintProps: () => paintProps,
    _getLayers: () => layers,
  };
}

// ---------------------------------------------------------------------------
// 1. Policy constants integrity
// ---------------------------------------------------------------------------
{
  const policy = BASEMAP_VISUAL_POLICY;
  assert(policy.coastline !== undefined, "Policy has coastline configuration");
  assert(policy.coastline.inkWidthPx === 1.2, "Coastline ink width is 1.2px");
  assert(policy.coastline.inkColor === "#57605d", "Coastline ink color matches calibrated value");
  assert(policy.coastline.inkOpacity === 0.70, "Coastline ink opacity is 0.70");
  assert(policy.coastline.haloWidthPx === 4.5, "Coastline halo width is 4.5px");
  assert(policy.coastline.haloColor === "#8ba3a0", "Coastline halo color matches calibrated value");
  assert(policy.coastline.haloOpacity === 0.25, "Coastline halo opacity is 0.25");

  assert(policy.palette.basinInk === "#3c484b", "Palette has basinInk #3c484b");
  assert(policy.palette.waterLine === "#8ba3a0", "Palette waterLine is #8ba3a0");
  assert(policy.palette.coastlineInk === "#57605d", "Palette coastlineInk is #57605d");

  assert(policy.typography.basinTextTransform === "uppercase", "Typography basinTextTransform is uppercase");
  assert(policy.typography.basinLetterSpacing === 0.22, "Typography basinLetterSpacing is 0.22");
  assert(policy.typography.basinHaloWidth === 1.5, "Typography basinHaloWidth is 1.5");
  assert(policy.opacity.basinLabels === 0.82, "Opacity basinLabels is 0.82");
  assert(policy.preserveSourceLayers.includes("water_name"), "preserveSourceLayers includes water_name");
}

// ---------------------------------------------------------------------------
// 2. Semantic water source discovery and coastline layer injection
// ---------------------------------------------------------------------------
{
  const initialLayers = [
    { id: "background", type: "background" },
    { id: "water_fill", type: "fill", source: "openmaptiles", "source-layer": "water" },
    { id: "waterway_line", type: "line", source: "openmaptiles", "source-layer": "waterway" },
    { id: "place_label", type: "symbol", source: "openmaptiles", "source-layer": "place" },
  ];

  const map = createMockMap(initialLayers);
  applyBasemapVisualPolicy(map);

  const haloLayer = map.getLayer("cc-coastline-halo");
  const inkLayer = map.getLayer("cc-coastline-ink");

  assert(haloLayer !== undefined, "cc-coastline-halo layer is created");
  assert(haloLayer?.type === "line", "cc-coastline-halo is a line layer");
  assert(haloLayer?.source === "openmaptiles", "cc-coastline-halo dynamically inherited water source");
  assert(haloLayer?.["source-layer"] === "water", "cc-coastline-halo targets water source-layer");
  assert(haloLayer?.metadata?.["cc:purpose"] === "NON_SEMANTIC_VISUAL_STYLE", "cc-coastline-halo explicitly marked NON_SEMANTIC_VISUAL_STYLE");
  assert(haloLayer?.paint?.["line-width"] === 4.5, "cc-coastline-halo has 4.5px width");
  assert(haloLayer?.paint?.["line-color"] === "#8ba3a0", "cc-coastline-halo has #8ba3a0 color");
  assert(haloLayer?.paint?.["line-opacity"] === 0.25, "cc-coastline-halo has 0.25 opacity");

  assert(inkLayer !== undefined, "cc-coastline-ink layer is created");
  assert(inkLayer?.type === "line", "cc-coastline-ink is a line layer");
  assert(inkLayer?.source === "openmaptiles", "cc-coastline-ink dynamically inherited water source");
  assert(inkLayer?.["source-layer"] === "water", "cc-coastline-ink targets water source-layer");
  assert(inkLayer?.metadata?.["cc:purpose"] === "NON_SEMANTIC_VISUAL_STYLE", "cc-coastline-ink explicitly marked NON_SEMANTIC_VISUAL_STYLE");
  assert(inkLayer?.paint?.["line-width"] === 1.2, "cc-coastline-ink has 1.2px width");
  assert(inkLayer?.paint?.["line-color"] === "#57605d", "cc-coastline-ink has #57605d color");
  assert(inkLayer?.paint?.["line-opacity"] === 0.70, "cc-coastline-ink has 0.70 opacity");

  // Verify layer order: halo and ink should precede waterway_line
  const allLayers = map._getLayers();
  const haloIdx = allLayers.findIndex((l) => l.id === "cc-coastline-halo");
  const inkIdx = allLayers.findIndex((l) => l.id === "cc-coastline-ink");
  const waterwayIdx = allLayers.findIndex((l) => l.id === "waterway_line");

  assert(haloIdx < inkIdx, "cc-coastline-halo renders below cc-coastline-ink");
  assert(inkIdx < waterwayIdx, "cc-coastline-ink renders below waterway_line");
}

// ---------------------------------------------------------------------------
// 3. Idempotent re-application of policy
// ---------------------------------------------------------------------------
{
  const initialLayers = [
    { id: "background", type: "background" },
    { id: "water_fill", type: "fill", source: "openmaptiles", "source-layer": "water" },
    { id: "waterway_line", type: "line", source: "openmaptiles", "source-layer": "waterway" },
  ];

  const map = createMockMap(initialLayers);
  // Call once
  applyBasemapVisualPolicy(map);
  const countAfterFirst = map._getLayers().length;

  // Call second time - must NOT throw "already exists" and must NOT duplicate layers
  let secondCallThrew = false;
  try {
    applyBasemapVisualPolicy(map);
  } catch (err) {
    secondCallThrew = true;
  }
  const countAfterSecond = map._getLayers().length;

  assert(!secondCallThrew, "Re-applying policy does not throw error");
  assert(countAfterFirst === countAfterSecond, "Re-applying policy is idempotent (no duplicate layers)");
}

// ---------------------------------------------------------------------------
// 4. Graceful handling when water layer is missing
// ---------------------------------------------------------------------------
{
  const emptyMap = createMockMap([
    { id: "background", type: "background" },
    { id: "place_label", type: "symbol", source: "openmaptiles", "source-layer": "place" },
  ]);

  let missingWaterThrew = false;
  try {
    applyBasemapVisualPolicy(emptyMap);
  } catch (err) {
    missingWaterThrew = true;
  }

  assert(!missingWaterThrew, "Missing water fill layer degrades gracefully without throwing");
  assert(emptyMap.getLayer("cc-coastline-halo") === undefined, "No coastline layers created when water layer missing");
}

// ---------------------------------------------------------------------------
// 5. Semantic marine-basin typography (Path C2)
// ---------------------------------------------------------------------------
{
  const initialLayers = [
    {
      id: "water_name_point_label",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "water_name",
      layout: { "symbol-placement": "point" },
    },
    {
      id: "water_name_ocean_basin",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "water_name",
      // default placement is point (omitted)
    },
    {
      id: "water_name_river_line",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "water_name",
      layout: { "symbol-placement": "line" },
    },
    {
      id: "place_city",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
    },
  ];

  const map = createMockMap(initialLayers);
  applyBasemapVisualPolicy(map);

  const basinPoint = map.getLayer("water_name_point_label");
  const oceanBasin = map.getLayer("water_name_ocean_basin");
  const riverLine = map.getLayer("water_name_river_line");
  const placeCity = map.getLayer("place_city");

  assert(basinPoint.layout["text-transform"] === "uppercase", "Basin point label has uppercase text-transform");
  assert(basinPoint.layout["text-letter-spacing"] === 0.22, "Basin point label has 0.22 letter-spacing");
  assert(basinPoint.paint["text-color"] === "#3c484b", "Basin point label has #3c484b text-color");
  assert(basinPoint.paint["text-halo-color"] === "#f1eadc", "Basin point label has #f1eadc halo");
  assert(basinPoint.paint["text-halo-width"] === 1.5, "Basin point label has 1.5 halo width");
  assert(basinPoint.paint["text-opacity"] === 0.82, "Basin point label has 0.82 opacity");

  assert(oceanBasin.layout["text-transform"] === "uppercase", "Ocean basin default point label has uppercase text-transform");
  assert(oceanBasin.paint["text-color"] === "#3c484b", "Ocean basin default point label has #3c484b text-color");

  assert(riverLine.layout?.["text-transform"] === undefined, "River line-placement label is NOT coerced to basin uppercase");
  assert(placeCity.paint["text-color"] === "#565a56", "Place label retains orientationLabel color (#565a56)");
}

// ---------------------------------------------------------------------------
// 6. Evidence-panel double-rule framing token compliance
// ---------------------------------------------------------------------------
{
  const inspectorAstro = fs.readFileSync(path.resolve(process.cwd(), "src/components/inspector/EntityInspector.astro"), "utf8");
  const sourceDrawerAstro = fs.readFileSync(path.resolve(process.cwd(), "src/components/evidence/SourceDrawer.astro"), "utf8");

  assert(inspectorAstro.includes("border-left: 3px double var(--cc-line-strong)"), "EntityInspector .inspector-shell has 3px double left border");
  assert(inspectorAstro.includes("border-bottom: 3px double var(--cc-line-strong)"), "EntityInspector .inspector-header has 3px double bottom border");
  assert(inspectorAstro.includes(".inspector-header::after"), "EntityInspector .inspector-header has ::after hairline accent");

  assert(sourceDrawerAstro.includes("border-left: 3px double var(--cc-line-strong)"), "SourceDrawer .source-drawer-panel has 3px double left border");
  assert(sourceDrawerAstro.includes("border-bottom: 3px double var(--cc-line-strong)"), "SourceDrawer .source-drawer-header has 3px double bottom border");
  assert(sourceDrawerAstro.includes(".source-drawer-header::after"), "SourceDrawer .source-drawer-header has ::after hairline accent");

  // Negative checks: double rule must NOT be applied to buttons, cards, or inputs
  assert(!inspectorAstro.includes(".inspector-close { border: 3px double"), "No double rule on inspector close button");
  assert(!sourceDrawerAstro.includes(".source-drawer-close { border: 3px double"), "No double rule on source drawer close button");
  assert(!sourceDrawerAstro.includes(".source-card { border: 3px double"), "No double rule on source cards");
}

console.log(`\nResults: ${passedTests} passed, ${failedTests} failed.`);
if (failedTests > 0) {
  process.exit(1);
}
console.log("All cartographic styling tests PASSED.\n");
