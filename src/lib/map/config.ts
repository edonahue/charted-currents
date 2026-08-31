export const INITIAL_MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

export const INITIAL_MAP_VIEW = {
  center: [-76.5, 18.0] as [number, number],
  zoom: 4.2,
} as const;

/**
 * Packet 1 camera posture: preserve geographic continuity rather than create
 * cinematic movement. Implementations may adapt padding to the actual dock /
 * bottom-sheet size, but should not introduce dramatic zoom, pitch or bearing.
 */
export const SELECTION_CAMERA = {
  durationMs: 650,
  maxZoomDelta: 0.75,
  bearing: 0,
  pitch: 0,
} as const;

/**
 * This is modern map-interface configuration, not historical evidence.
 * See docs/BASEMAP_RUNTIME.md and docs/PACKET1_DIRECTION.md before changing
 * provider, style, camera, or historical-meaning assumptions.
 */
