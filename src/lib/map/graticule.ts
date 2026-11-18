import type { FeatureCollection, LineString, Position } from "geojson";
import type { Map } from "maplibre-gl";

const GRID = "cc-coordinate-grid";
const WIDE_VIEW_MAX_ZOOM = 3.4;

/** A coarse modern coordinate reference for Atlantic and global orientation. */
function createGrid(): FeatureCollection<LineString> {
  const features: FeatureCollection<LineString>["features"] = [];
  const addLine = (coordinates: Position[]) => features.push({
    type: "Feature", properties: {}, geometry: { type: "LineString", coordinates },
  });

  // Sample curves so parallels stay parallel in the globe projection. Stop
  // the meridians short of the poles, where the grid would converge into ink.
  for (let longitude = -180; longitude < 180; longitude += 30) {
    addLine(Array.from({ length: 33 }, (_, i) => [longitude, -80 + i * 5]));
  }
  for (let latitude = -60; latitude <= 60; latitude += 30) {
    addLine(Array.from({ length: 73 }, (_, i) => [-180 + i * 5, latitude]));
  }
  return { type: "FeatureCollection", features };
}

export function syncCoordinateGrid(map: Map, comparingChart: boolean): void {
  const visible = !comparingChart && map.getZoom() < WIDE_VIEW_MAX_ZOOM;
  if (!map.getLayer(GRID)) {
    const style = map.getStyle();
    if (!visible || !style) return;
    const firstLabel = style.layers.find(layer => layer.type === "symbol")?.id;
    map.addSource(GRID, { type: "geojson", data: createGrid(), tolerance: 0 });
    map.addLayer({
      id: GRID,
      type: "line",
      source: GRID,
      maxzoom: WIDE_VIEW_MAX_ZOOM,
      layout: { visibility: "visible" },
      paint: {
        "line-color": "#557f7f",
        "line-width": 0.65,
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 0.7, 0.24, 2.7, 0.18, WIDE_VIEW_MAX_ZOOM, 0],
      },
    }, firstLabel);
    return;
  }
  const visibility = comparingChart ? "none" : "visible";
  if (map.getLayoutProperty(GRID, "visibility") !== visibility) {
    map.setLayoutProperty(GRID, "visibility", visibility);
  }
}
