import type { Map as MapLibreMap } from "maplibre-gl";
import { BASEMAP_VISUAL_POLICY } from "./visualPolicy.ts";

function includesValue(values: readonly string[], value: string | undefined): boolean {
  return Boolean(value && values.includes(value));
}

function sourceLayerOf(layer: Record<string, unknown>): string | undefined {
  const value = layer["source-layer"];
  return typeof value === "string" ? value : undefined;
}

/**
 * Distinguishes basin point symbol layers (e.g. ocean, sea, bay names)
 * from line-following waterway/river labels.
 */
function isBasinWaterLabel(layer: Record<string, unknown>): boolean {
  const sourceLayer = sourceLayerOf(layer);
  if (sourceLayer !== "water_name" || layer.type !== "symbol") {
    return false;
  }
  const layout = (layer.layout as Record<string, unknown> | undefined) ?? {};
  const placement = layout["symbol-placement"];
  return placement !== "line" && placement !== "line-center";
}

/**
 * Apply the editorial-atlas posture to the loaded modern basemap.
 *
 * OpenFreeMap can evolve its upstream style, so this works from source-layer
 * semantics and layer types where possible. Unknown/new layers are left alone
 * for browser review rather than silently guessed at.
 *
 * Coastline stepping (Variant A2) and marine basin typography (Variant C2)
 * are applied semantically without hard-coding brittle layer assumptions.
 */
export function applyBasemapVisualPolicy(map: MapLibreMap): void {
  const style = map.getStyle();
  const layers = style.layers ?? [];
  const policy = BASEMAP_VISUAL_POLICY;

  let waterSource: string | undefined;
  let waterSourceLayer: string | undefined;
  let insertionBeforeId: string | undefined;

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
      if (typeof layerRecord.source === "string") {
        waterSource = layerRecord.source;
        waterSourceLayer = sourceLayer;
      }
      continue;
    }

    if (sourceLayer === "waterway" && layer.type === "line") {
      map.setPaintProperty(layer.id, "line-color", policy.palette.waterLine);
      map.setPaintProperty(layer.id, "line-opacity", 0.6);
      if (!insertionBeforeId) {
        insertionBeforeId = layer.id;
      }
      continue;
    }

    if (sourceLayer === "boundary" && layer.type === "line") {
      map.setPaintProperty(layer.id, "line-color", policy.palette.boundaryInk);
      map.setPaintProperty(layer.id, "line-opacity", policy.opacity.modernBoundary);
      continue;
    }

    // Semantic marine-basin typography (Path C2)
    if (isBasinWaterLabel(layerRecord)) {
      map.setLayoutProperty(layer.id, "text-transform", policy.typography.basinTextTransform);
      map.setLayoutProperty(layer.id, "text-letter-spacing", policy.typography.basinLetterSpacing);
      map.setPaintProperty(layer.id, "text-color", policy.palette.basinInk);
      map.setPaintProperty(layer.id, "text-halo-color", policy.palette.orientationHalo);
      map.setPaintProperty(layer.id, "text-halo-width", policy.typography.basinHaloWidth);
      map.setPaintProperty(layer.id, "text-opacity", policy.opacity.basinLabels);
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

  // Idempotent stepped waterline hierarchy (Variant A2)
  // NON_SEMANTIC_VISUAL_STYLE: Provides cartographic legibility for island chains.
  // Not an assertion of historical shoreline geometry or bathymetry.
  if (waterSource && waterSourceLayer) {
    const candidateBeforeId = insertionBeforeId ?? "waterway";
    const beforeId = map.getLayer(candidateBeforeId) ? candidateBeforeId : undefined;

    if (map.getLayer("cc-coastline-halo")) {
      map.setPaintProperty("cc-coastline-halo", "line-color", policy.coastline.haloColor);
      map.setPaintProperty("cc-coastline-halo", "line-width", policy.coastline.haloWidthPx);
      map.setPaintProperty("cc-coastline-halo", "line-opacity", policy.coastline.haloOpacity);
    } else {
      map.addLayer(
        {
          id: "cc-coastline-halo",
          type: "line",
          source: waterSource,
          "source-layer": waterSourceLayer,
          metadata: {
            "cc:purpose": "NON_SEMANTIC_VISUAL_STYLE",
            "cc:description": "Modern basemap coastline halo for visual legibility; not historical shoreline geometry",
          },
          paint: {
            "line-color": policy.coastline.haloColor,
            "line-width": policy.coastline.haloWidthPx,
            "line-opacity": policy.coastline.haloOpacity,
          },
        },
        beforeId
      );
    }

    if (map.getLayer("cc-coastline-ink")) {
      map.setPaintProperty("cc-coastline-ink", "line-color", policy.coastline.inkColor);
      map.setPaintProperty("cc-coastline-ink", "line-width", policy.coastline.inkWidthPx);
      map.setPaintProperty("cc-coastline-ink", "line-opacity", policy.coastline.inkOpacity);
    } else {
      map.addLayer(
        {
          id: "cc-coastline-ink",
          type: "line",
          source: waterSource,
          "source-layer": waterSourceLayer,
          metadata: {
            "cc:purpose": "NON_SEMANTIC_VISUAL_STYLE",
            "cc:description": "Modern basemap crisp coastline ink rule for cartographic definition; not historical shoreline geometry",
          },
          paint: {
            "line-color": policy.coastline.inkColor,
            "line-width": policy.coastline.inkWidthPx,
            "line-opacity": policy.coastline.inkOpacity,
          },
        },
        beforeId
      );
    }
  }
}
