import type { LayerSpecification, TransformStyleFunction } from "maplibre-gl";
import { BASEMAP_VISUAL_POLICY, BASEMAP_WATER_LABEL_LAYER_ID } from "./visualPolicy";

function includesValue(values: readonly string[], value: string | undefined): boolean {
  return Boolean(value && values.includes(value));
}

function transformBasemapLayer(layer: LayerSpecification): LayerSpecification {
  const sourceLayer = "source-layer" in layer ? layer["source-layer"] : undefined;
  const policy = BASEMAP_VISUAL_POLICY;

  if (includesValue(policy.hideSourceLayers, sourceLayer)) {
    return { ...layer, layout: { ...layer.layout, visibility: "none" } };
  }

  if (layer.type === "background") {
    return { ...layer, paint: { ...layer.paint, "background-color": policy.palette.background } };
  }

  if (sourceLayer === "water" && layer.type === "fill") {
    return { ...layer, paint: { ...layer.paint, "fill-color": policy.palette.water } };
  }

  if (sourceLayer === "landcover" && layer.type === "fill") {
    return { ...layer, paint: { ...layer.paint, "fill-color": policy.palette.land, "fill-opacity": 0.14 } };
  }

  if (sourceLayer === "waterway" && layer.type === "line") {
    return { ...layer, paint: { ...layer.paint, "line-color": policy.palette.waterLine, "line-opacity": 0.6 } };
  }

  if (sourceLayer === "boundary" && layer.type === "line") {
    return { ...layer, paint: { ...layer.paint, "line-color": policy.palette.boundaryInk, "line-opacity": policy.opacity.modernBoundary } };
  }

  if (sourceLayer === "water_name" && layer.type === "symbol"
    && layer.id === BASEMAP_WATER_LABEL_LAYER_ID
    && (layer.layout?.["symbol-placement"] ?? "point") === "point") {
    // Only the verified provider point layer receives atlas orientation type.
    // Lake centerlines and actual river/line labels retain their own hierarchy.
    return {
      ...layer,
      layout: {
        ...layer.layout,
        "text-font": [policy.waterLabel.font],
        "text-transform": "uppercase",
        "text-letter-spacing": policy.waterLabel.letterSpacing,
        "text-max-width": policy.waterLabel.maxWidth,
        "text-size": ["interpolate", ["linear"], ["zoom"], 0, 10, 3, 12, 6, 16, 10, 19],
      },
      paint: {
        ...layer.paint,
        "text-color": policy.palette.waterLabel,
        "text-opacity": policy.opacity.waterLabels,
        "text-halo-color": policy.palette.water,
        "text-halo-width": 1,
      },
    };
  }

  if (sourceLayer === "place" && layer.type === "symbol") {
    // Contemporary labels orient the reader; they are not historical evidence.
    const countryLabel = layer.id.includes("country") || layer.id.includes("continent");
    return {
      ...layer,
      ...(countryLabel ? {
        layout: {
          ...layer.layout,
          "text-size": ["interpolate", ["linear"], ["zoom"], 1, 10, 5, 13, 9, 16],
        },
      } : {}),
      paint: {
        ...layer.paint,
        "text-color": policy.palette.orientationLabel,
        "text-halo-color": policy.palette.orientationHalo,
        "text-halo-width": 1,
        "text-opacity": countryLabel ? 0.25 : ["interpolate", ["linear"], ["zoom"], 2, 0, 5, 0.2, 8, policy.opacity.orientationLabels],
        "icon-opacity": 0.35,
      },
    };
  }

  if (includesValue(policy.stronglyMuteSourceLayers, sourceLayer)) {
    if (layer.type === "line") {
      const opacity = sourceLayer === "transportation"
        ? policy.opacity.modernTransport
        : policy.opacity.modernBoundary;
      return { ...layer, paint: { ...layer.paint, "line-opacity": opacity } };
    }
    if (layer.type === "fill") {
      return { ...layer, paint: { ...layer.paint, "fill-opacity": policy.opacity.modernLandUse } };
    }
    if (layer.type === "symbol") {
      return { ...layer, paint: { ...layer.paint, "text-opacity": 0.18, "icon-opacity": 0.08 } };
    }
  }

  // Upstream can introduce new layer types or semantics. Preserve them for
  // browser review rather than guessing how they should be restyled.
  return layer;
}

/**
 * Apply the editorial-atlas policy before MapLibre commits the fetched style.
 *
 * This is a pure StyleSwapOptions.transformStyle callback. Only known layer
 * paint/layout properties change; provider sources, attribution, glyph/sprite
 * URLs, filters, zoom ranges and other style metadata remain intact. Previous
 * project overlays are deliberately not copied into a new provider style.
 */
export const transformBasemapStyle: TransformStyleFunction = (_previous, next) => ({
  ...next,
  layers: next.layers.map(transformBasemapLayer),
});
