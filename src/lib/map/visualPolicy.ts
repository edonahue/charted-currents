export const BASEMAP_SEED_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

// Verified against the provider's point-only water_name layer. Keep this ID
// available to comparison mode so modern orientation type can be suppressed.
export const BASEMAP_WATER_LABEL_LAYER_ID = "water_name_point_label";

/**
 * Packet 1 visual posture for the modern basemap.
 *
 * This is interface/cartography policy, NOT historical evidence. It exists so
 * map styling does not drift into ad-hoc per-layer choices while the product is
 * being built. Implement the policy against the loaded OpenFreeMap style; do
 * not assume every upstream layer id is permanently stable.
 */
export const BASEMAP_VISUAL_POLICY = {
  preserveSourceLayers: ["water", "waterway", "water_name", "place", "boundary"] as const,
  stronglyMuteSourceLayers: [
    "transportation",
    "transportation_name",
    "landuse",
    "landcover",
    "park",
  ] as const,
  hideSourceLayers: [
    "poi",
    "housenumber",
    "building",
    "aeroway",
    "transit",
  ] as const,
  palette: {
    background: "#eee8dc",
    land: "#eee8dc",
    water: "#b8d1d0",
    waterLine: "#709da3",
    coastlineInk: "#627b76",
    boundaryInk: "#83908a",
    orientationLabel: "#586f6f",
    orientationHalo: "#eee8dc",
    waterLabel: "#4b7375",
  },
  opacity: {
    modernTransport: 0.12,
    modernLandUse: 0.16,
    modernBoundary: 0.14,
    orientationLabels: 0.48,
    waterLabels: 0.78,
  },
  waterLabel: {
    font: "Noto Sans Regular",
    letterSpacing: 0.24,
    maxWidth: 12,
  },
} as const;

/**
 * Project features should look like Charted Currents, not default web-map pins.
 * Packet 1 can tune these values in browser inspection while preserving the
 * concentric-ring / fine-cartographic-marker concept.
 */
export const PROJECT_MARKER_VISUAL_POLICY = {
  radiusPx: 4,
  selectedRadiusPx: 5.5,
  outerRingRadiusPx: 9,
  selectedOuterRingRadiusPx: 13,
  strokeWidthPx: 1.25,
  selectedStrokeWidthPx: 2,
  colors: {
    core: "#243f48",
    coreSelected: "#6c3634",
    ring: "#92743d",
    ringSelected: "#92743d",
    halo: "#f8f3e9",
    labelText: "#172126",
    labelHalo: "#f8f3e9",
  },
} as const;

export const MAP_STYLE_DESIGN_RULES = {
  defaultMarkerPinsAllowed: false,
  decorativeNauticalIconsAllowed: false,
  buildings3dAllowed: false,
  terrainPitchAllowed: false,
  mapRotationAllowed: false,
  historicalSourceImageryAsAnonymousTextureAllowed: false,
} as const;
