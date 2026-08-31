import type { Map as MapLibreMap } from "maplibre-gl";
import { BASEMAP_VISUAL_POLICY } from "./visualPolicy";

function includesValue(values: readonly string[], value: string | undefined): boolean {
  return Boolean(value && values.includes(value));
}

function sourceLayerOf(layer: Record<string, unknown>): string | undefined {
  const value = layer["source-layer"];
  return typeof value === "string" ? value : undefined;
}

/**
 * Apply the Packet 1 editorial-atlas posture to the loaded modern basemap.
 *
 * OpenFreeMap can evolve its upstream style, so this works from source-layer
 * semantics and layer types where possible. Unknown/new layers are left alone
 * for browser review rather than silently guessed at.
 */
export function applyBasemapVisualPolicy(map: MapLibreMap): void {
  const style = map.getStyle();
  const layers = style.layers ?? [];
  const policy = BASEMAP_VISUAL_POLICY;

  for (const layer of layers) {
    const layerRecord = layer as unknown as Record<string, unknown>;
    const sourceLayer = sourceLayerOf(layerRecord);

    if (includesValue(policy.hideSourceLayers, sourceLayer)) {
      map.setLayoutProperty(layer.id, "visibility", "none");
      continue;
    }

    if (layer.type === "background") {
      map.setPaintProperty(layer.id, "background-color", policy.palette.background);
      continue;
    }

    if (sourceLayer === "water" && layer.type === "fill") {
      map.setPaintProperty(layer.id, "fill-color", policy.palette.water);
      continue;
    }

    if (sourceLayer === "waterway" && layer.type === "line") {
      map.setPaintProperty(layer.id, "line-color", policy.palette.waterLine);
      map.setPaintProperty(layer.id, "line-opacity", 0.6);
      continue;
    }

    if (sourceLayer === "boundary" && layer.type === "line") {
      map.setPaintProperty(layer.id, "line-color", policy.palette.boundaryInk);
      map.setPaintProperty(layer.id, "line-opacity", policy.opacity.modernBoundary);
      continue;
    }

    if (sourceLayer === "place" && layer.type === "symbol") {
      map.setPaintProperty(layer.id, "text-color", policy.palette.orientationLabel);
      map.setPaintProperty(layer.id, "text-halo-color", policy.palette.orientationHalo);
      map.setPaintProperty(layer.id, "text-halo-width", 1);
      map.setPaintProperty(layer.id, "text-opacity", policy.opacity.orientationLabels);
      map.setPaintProperty(layer.id, "icon-opacity", 0.35);
      continue;
    }

    if (includesValue(policy.stronglyMuteSourceLayers, sourceLayer)) {
      if (layer.type === "line") {
        const opacity = sourceLayer === "transportation"
          ? policy.opacity.modernTransport
          : policy.opacity.modernBoundary;
        map.setPaintProperty(layer.id, "line-opacity", opacity);
      } else if (layer.type === "fill") {
        map.setPaintProperty(layer.id, "fill-opacity", policy.opacity.modernLandUse);
      } else if (layer.type === "symbol") {
        map.setPaintProperty(layer.id, "text-opacity", 0.18);
        map.setPaintProperty(layer.id, "icon-opacity", 0.08);
      }
    }
  }
}
