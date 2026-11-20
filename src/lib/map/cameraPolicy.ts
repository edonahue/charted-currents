import { LngLatBounds, type Map, type PaddingOptions } from "maplibre-gl";
import type { PublishedPortFeatureCollection, PublishedRouteFeatureCollection, Selection } from "../domain/types";
import { SELECTION_CAMERA } from "./config";

type Coordinate = [number, number];
export interface ScreenRect { left: number; top: number; right: number; bottom: number }

/** Intersect real surfaces. A dock outside the canvas must not be counted twice. */
export function visibleMapPadding(canvas: ScreenRect, inspector?: ScreenRect | null): Required<PaddingOptions> {
  const padding = { top: 82, right: 32, bottom: 78, left: 32 };
  const width = canvas.right - canvas.left;
  const height = canvas.bottom - canvas.top;
  if (inspector && inspector.right > canvas.left && inspector.left < canvas.right &&
      inspector.bottom > canvas.top && inspector.top < canvas.bottom) {
    const overlapWidth = Math.min(canvas.right, inspector.right) - Math.max(canvas.left, inspector.left);
    if (overlapWidth >= width * 0.6) padding.bottom = Math.max(padding.bottom, canvas.bottom - inspector.top + 24);
    else if (inspector.left > canvas.left) padding.right = Math.max(padding.right, canvas.right - inspector.left + 24);
  }
  // An expanded mobile folio can leave only a narrow strip. Keep valid bounds.
  const verticalScale = Math.min(1, Math.max(1, height - 64) / (padding.top + padding.bottom));
  const horizontalScale = Math.min(1, Math.max(1, width - 64) / (padding.left + padding.right));
  padding.top *= verticalScale;
  padding.bottom *= verticalScale;
  padding.left *= horizontalScale;
  padding.right *= horizontalScale;
  return padding;
}

/** Use every selected route group, including a vessel represented in several. */
export function selectionCoordinates(selection: Selection, ports: PublishedPortFeatureCollection | null,
  routes: PublishedRouteFeatureCollection | null): Coordinate[] {
  if (!selection) return [];
  if (selection.kind === "port") {
    const feature = ports?.features.find((port) => port.properties.id === selection.id);
    return feature ? [feature.geometry.coordinates as Coordinate] : [];
  }
  return (routes?.features ?? []).filter((route) => selection.kind === "ship"
    ? route.properties.constituent_vessel_ids.includes(selection.id)
    : selection.kind === "voyage" && (route.properties.route_group_id === selection.id || route.properties.id === selection.id))
    .flatMap((route) => route.geometry.coordinates as Coordinate[]);
}

/** No travel for a selection that is already visible in the unobscured map. */
export function revealSelection(map: Map, coordinates: Coordinate[], padding: Required<PaddingOptions>, reducedMotion: boolean): boolean {
  if (!coordinates.length) return false;
  const { width, height } = map.getContainer().getBoundingClientRect();
  const visible = coordinates.every((coordinate) => {
    if (map.getProjection()?.type === "globe") {
      const center = map.getCenter();
      const radians = Math.PI / 180;
      const facing = Math.sin(center.lat * radians) * Math.sin(coordinate[1] * radians) +
        Math.cos(center.lat * radians) * Math.cos(coordinate[1] * radians) * Math.cos((coordinate[0] - center.lng) * radians);
      if (facing <= 0) return false;
    }
    const point = map.project(coordinate);
    return Number.isFinite(point.x) && Number.isFinite(point.y) && point.x >= padding.left &&
      point.x <= width - padding.right && point.y >= padding.top && point.y <= height - padding.bottom;
  });
  if (visible) return false;
  map.stop();
  const duration = reducedMotion ? 0 : SELECTION_CAMERA.durationMs;
  if (coordinates.length === 1) {
    map.easeTo({ center: coordinates[0], offset: [(padding.left - padding.right) / 2, (padding.top - padding.bottom) / 2], duration });
  } else {
    const bounds = new LngLatBounds();
    for (const coordinate of coordinates) bounds.extend(coordinate);
    // Expand only as far as needed; never zoom in just because selection changed.
    map.fitBounds(bounds, { padding, maxZoom: map.getZoom(), duration, linear: true });
  }
  return true;
}
