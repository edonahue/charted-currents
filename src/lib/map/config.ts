import { BASEMAP_SEED_STYLE_URL } from "./visualPolicy";

export const INITIAL_MAP_STYLE_URL = BASEMAP_SEED_STYLE_URL;

export const INITIAL_MAP_VIEW = {
  center: [-72, 20] as [number, number],
  zoom: 4,
} as const;

/** Modern orientation views; these do not imply historical coverage. */
export const MAP_VIEWS = {
  caribbean: { ...INITIAL_MAP_VIEW, projection: "mercator" },
  atlantic: { center: [-40, 25] as [number, number], zoom: 2.3, projection: "mercator" },
  globe: { center: [-42, 23] as [number, number], zoom: 1.8, projection: "globe" },
} as const;

/** Keep the whole Atlantic hemisphere prominent on desktop and inside a phone. */
export function globeOrientationZoom(width: number, height: number): number {
  return Math.max(0.7, Math.min(2.4, Math.log2(Math.max(180, Math.min(width, height)) * 0.88 * Math.PI / 512)));
}

/**
 * Selection motion preserves continuity. Explicit orientation views may change
 * scale/projection; selection never changes the user's chosen projection.
 */
export const SELECTION_CAMERA = {
  durationMs: 650,
  maxZoomDelta: 0.75,
  bearing: 0,
  pitch: 0,
} as const;

/**
 * This is modern map-interface configuration, not historical evidence.
 * See docs/BASEMAP_RUNTIME.md, docs/PACKET1_DIRECTION.md, and
 * docs/VISUAL_QUALITY_CONTRACT.md before changing provider, style, camera,
 * or historical-meaning assumptions.
 */
