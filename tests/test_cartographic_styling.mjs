#!/usr/bin/env node
/**
 * tests/test_cartographic_styling.mjs
 *
 * Verification suite for cartographic styling refinement:
 * 1. Policy constants integrity (A2 waterlines, C2 basin typography, palette)
 * 2. Semantic water source discovery and idempotent coastline layer injection
 * 3. Graceful fallback when water source is missing
 * 4. Point water-name orientation typography contract (Path C2)
 * 5. Period Map display coexistence (reversible coastline suppression)
 * 6. Evidence-panel double-rule framing token compliance
 * 7. Mobile SourceDrawer bottom sheet responsive contract
 * 8. Period Map epistemic note copy
 *
 * Usage: node tests/test_cartographic_styling.mjs
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { BASEMAP_VISUAL_POLICY } from "../src/lib/map/visualPolicy.ts";
import { applyBasemapVisualPolicy, syncPeriodMapComparisonStyling } from "../src/lib/map/applyVisualPolicy.ts";

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
// 4. Point water-name orientation typography contract (Path C2)
// ---------------------------------------------------------------------------
{
  const initialLayers = [
    {
      id: "water_name_sea_point",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "water_name",
      layout: { "symbol-placement": "point" },
    },
    {
      id: "water_name_ocean_point",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "water_name",
      // default placement is point (omitted)
    },
    {
      id: "water_name_strait_point",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "water_name",
      layout: { "symbol-placement": "point" },
    },
    {
      id: "water_name_river_line",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "water_name",
      layout: { "symbol-placement": "line" },
    },
    {
      id: "water_name_lake_line",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "water_name",
      layout: { "symbol-placement": "line-center" },
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

  const seaPoint = map.getLayer("water_name_sea_point");
  const oceanPoint = map.getLayer("water_name_ocean_point");
  const straitPoint = map.getLayer("water_name_strait_point");
  const riverLine = map.getLayer("water_name_river_line");
  const lakeLine = map.getLayer("water_name_lake_line");
  const placeCity = map.getLayer("place_city");

  assert(seaPoint.layout["text-transform"] === "uppercase", "Sea point label has uppercase text-transform");
  assert(seaPoint.layout["text-letter-spacing"] === 0.22, "Sea point label has 0.22 letter-spacing");
  assert(seaPoint.paint["text-color"] === "#3c484b", "Sea point label has #3c484b text-color");
  assert(seaPoint.paint["text-halo-color"] === "#f1eadc", "Sea point label has #f1eadc halo");
  assert(seaPoint.paint["text-halo-width"] === 1.5, "Sea point label has 1.5 halo width");
  assert(seaPoint.paint["text-opacity"] === 0.82, "Sea point label has 0.82 opacity");

  assert(oceanPoint.layout["text-transform"] === "uppercase", "Ocean point label (default placement) has uppercase text-transform");
  assert(oceanPoint.paint["text-color"] === "#3c484b", "Ocean point label has #3c484b text-color");

  assert(straitPoint.layout["text-transform"] === "uppercase", "High-zoom point strait label receives orientation styling");

  assert(riverLine.layout?.["text-transform"] === undefined, "River line-placement label is NOT coerced to uppercase");
  assert(lakeLine.layout?.["text-transform"] === undefined, "Lake line-center placement label is NOT coerced to uppercase");
  assert(placeCity.paint["text-color"] === "#565a56", "Place label retains orientationLabel color (#565a56)");
}

// ---------------------------------------------------------------------------
// 5. Period Map display coexistence (reversible coastline suppression)
// ---------------------------------------------------------------------------
{
  const initialLayers = [
    { id: "background", type: "background" },
    { id: "water_fill", type: "fill", source: "openmaptiles", "source-layer": "water" },
    { id: "waterway_line", type: "line", source: "openmaptiles", "source-layer": "waterway" },
  ];

  const map = createMockMap(initialLayers);
  applyBasemapVisualPolicy(map);

  const halo = map.getLayer("cc-coastline-halo");
  const ink = map.getLayer("cc-coastline-ink");
  assert(halo !== undefined && ink !== undefined, "Coastline layers exist before Period Map coexistence test");

  // Initial state: visibility is not hidden
  assert(halo.layout?.visibility !== "none", "Coastline halo is initially visible");
  assert(ink.layout?.visibility !== "none", "Coastline ink is initially visible");

  // Period Map ON -> suppress modern coastline emphasis
  syncPeriodMapComparisonStyling(map, true);
  assert(map.getLayer("cc-coastline-halo").layout?.visibility === "none", "Coastline halo hidden when Period Map ON");
  assert(map.getLayer("cc-coastline-ink").layout?.visibility === "none", "Coastline ink hidden when Period Map ON");

  // Period Map OFF -> restore modern coastline emphasis
  syncPeriodMapComparisonStyling(map, false);
  assert(map.getLayer("cc-coastline-halo").layout?.visibility === "visible", "Coastline halo restored when Period Map OFF");
  assert(map.getLayer("cc-coastline-ink").layout?.visibility === "visible", "Coastline ink restored when Period Map OFF");

  // Idempotency: repeated ON/OFF calls cause no drift or errors
  syncPeriodMapComparisonStyling(map, true);
  syncPeriodMapComparisonStyling(map, true);
  assert(map.getLayer("cc-coastline-halo").layout?.visibility === "none", "Repeated Period Map ON is idempotent");

  syncPeriodMapComparisonStyling(map, false);
  syncPeriodMapComparisonStyling(map, false);
  assert(map.getLayer("cc-coastline-halo").layout?.visibility === "visible", "Repeated Period Map OFF is idempotent");

  // Graceful degradation when coastline layers are missing
  const emptyMap = createMockMap([{ id: "background", type: "background" }]);
  let emptyThrew = false;
  try {
    syncPeriodMapComparisonStyling(emptyMap, true);
    syncPeriodMapComparisonStyling(emptyMap, false);
  } catch (err) {
    emptyThrew = true;
  }
  assert(!emptyThrew, "syncPeriodMapComparisonStyling degrades gracefully when coastline layers missing");
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

// ---------------------------------------------------------------------------
// 7. Mobile SourceDrawer bottom sheet responsive contract
// ---------------------------------------------------------------------------
{
  const sourceDrawerAstro = fs.readFileSync(path.resolve(process.cwd(), "src/components/evidence/SourceDrawer.astro"), "utf8");

  assert(sourceDrawerAstro.includes("align-items: flex-end"), "Mobile SourceDrawer aligns to flex-end for bottom-sheet presentation");
  assert(sourceDrawerAstro.includes("height: auto"), "Mobile SourceDrawer panel height is auto");

  // Fallback order: max-height: 85vh must precede max-height: 85dvh
  const idxVh = sourceDrawerAstro.indexOf("max-height: 85vh");
  const idxDvh = sourceDrawerAstro.indexOf("max-height: 85dvh");
  assert(idxVh !== -1, "Mobile SourceDrawer specifies max-height: 85vh fallback");
  assert(idxDvh !== -1, "Mobile SourceDrawer specifies max-height: 85dvh");
  assert(idxVh < idxDvh, "Fallback order preserved: max-height: 85vh precedes max-height: 85dvh");

  assert(sourceDrawerAstro.includes("border-top: 3px double var(--cc-line-strong)"), "Mobile SourceDrawer has 3px double top border");
  assert(sourceDrawerAstro.includes("border-radius: var(--cc-radius-lg) var(--cc-radius-lg) 0 0"), "Mobile SourceDrawer has rounded top corners");
  assert(sourceDrawerAstro.includes("env(safe-area-inset-bottom"), "Mobile SourceDrawer accounts for safe-area-inset-bottom");
}

// ---------------------------------------------------------------------------
// 8. Period Map epistemic note copy
// ---------------------------------------------------------------------------
{
  const mapViewportAstro = fs.readFileSync(path.resolve(process.cwd(), "src/components/map/MapViewport.astro"), "utf8");
  const expectedNote = "18th-century chart aligned via affine transformation; historical and modern coastlines will not align perfectly. Not observed ground truth.";
  assert(mapViewportAstro.includes(expectedNote), "MapViewport contains updated Period Map epistemic note text");
}

console.log(`\nResults: ${passedTests} passed, ${failedTests} failed.`);
if (failedTests > 0) {
  process.exit(1);
}
console.log("All cartographic styling tests PASSED.\n");
