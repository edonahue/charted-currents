import type { Map } from "maplibre-gl";
import { MAP_VIEWS, globeOrientationZoom } from "./config";

export interface GeographicView {
  center: [number, number];
  zoom: number;
  mode: "mercator" | "globe";
}

/** A selection-only URL has no geographic restoration instruction. */
export function readGeographicView(url: URL): GeographicView | null {
  const views = url.searchParams.getAll("view");
  const modes = url.searchParams.getAll("mode");
  if (views.length > 1 || modes.length > 1 || (modes.length && !["2d", "globe"].includes(modes[0]))) return null;
  const mode = modes[0] === "globe" ? "globe" : "mercator";
  if (!views.length) return modes.length ? { ...MAP_VIEWS[mode === "globe" ? "globe" : "caribbean"], mode } : null;
  const parts = views[0].split(",");
  if (parts.length !== 3 || parts.some((part) => !/^-?\d+(?:\.\d+)?$/.test(part))) return null;
  const [lng, lat, zoom] = parts.map(Number);
  if (!Number.isFinite(lng + lat + zoom) || lng < -180 || lng > 180 || lat < -90 || lat > 90 || zoom < 0.7 || zoom > 9) return null;
  return { center: [lng, lat], zoom, mode };
}

export function writeGeographicView(url: URL, view: GeographicView): URL {
  const next = new URL(url);
  next.searchParams.set("view", [...view.center.map((value) => value.toFixed(4)), view.zoom.toFixed(2)].join(","));
  next.searchParams.set("mode", view.mode === "globe" ? "globe" : "2d");
  return next;
}

/** Save only settled user navigation. Selection-driven camera corrections do
 * not add geography to a selection-only deep link or create history entries. */
export function startViewNavigation(map: Map, { cancelSelectionCamera, onMode }: {
  cancelSelectionCamera: () => void;
  onMode: (mode: GeographicView["mode"]) => void;
}): { userInput: () => void; explicitView: () => void; selectionChanged: () => void; dispose: () => void } {
  let pending: "replace" | "push" | null = null;
  let restoring = false;
  let disposed = false;
  let frame = 0;
  const restore = () => {
    pending = null;
    const url = new URL(window.location.href);
    const view = readGeographicView(url);
    if (!view) return;
    restoring = true;
    cancelSelectionCamera();
    onMode(view.mode);
    const rect = map.getContainer().getBoundingClientRect();
    const zoom = view.mode === "globe" && !url.searchParams.has("view") ? globeOrientationZoom(rect.width, rect.height) : view.zoom;
    map.jumpTo({ center: view.center, zoom, bearing: 0, pitch: 0 });
    restoring = false;
  };
  const onPopState = () => {
    // The selection controller restores synchronously. Apply an explicitly
    // encoded geographic view after that, regardless of listener order.
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => { if (!disposed) restore(); });
  };
  const settle = () => {
    if (restoring || !pending || disposed) return;
    const operation = pending;
    pending = null;
    const center = map.getCenter().wrap();
    const view: GeographicView = { center: [center.lng, center.lat], zoom: map.getZoom(), mode: map.getProjection()?.type === "globe" ? "globe" : "mercator" };
    const next = writeGeographicView(new URL(window.location.href), view);
    if (next.href === window.location.href) return;
    if (operation === "push") window.history.pushState(window.history.state, "", next);
    else window.history.replaceState(window.history.state, "", next);
  };
  restore();
  map.on("moveend", settle);
  window.addEventListener("popstate", onPopState);
  window.addEventListener("cc:navigation-restored", onPopState);
  return {
    userInput() { pending = "replace"; },
    explicitView() { pending = "push"; },
    selectionChanged() { pending = null; },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      map.off("moveend", settle);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("cc:navigation-restored", onPopState);
    },
  };
}
