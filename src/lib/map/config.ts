export const INITIAL_MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

export const INITIAL_MAP_VIEW = {
  center: [-76.5, 18.0] as [number, number],
  zoom: 4.2,
} as const;

/**
 * This is modern map-interface configuration, not historical evidence.
 * See docs/BASEMAP_RUNTIME.md before changing provider/style assumptions.
 */
