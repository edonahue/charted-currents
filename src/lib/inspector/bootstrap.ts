import type { Selection } from "../domain/types";
import { CURRENT_SELECTION_FOCUS_EVENT, getSelectionTrigger } from "../map/interactionState";
import { selectionStore } from "../state/selection";
import { timeFilterStore } from "../state/timeFilter";
import { selectionValidatorFromIds, startNavigationState } from "../state/navigation";
import type { PublishedSelectionIds } from "../state/navigation";

/** Keep URL/history and a usable shell eager; load record rendering on demand. */
const inspector = document.getElementById("entity-inspector");
const title = inspector?.querySelector<HTMLElement>("[data-inspector-title]");
const status = inspector?.querySelector<HTMLElement>("[data-inspector-status]");
const retry = inspector?.querySelector<HTMLButtonElement>("[data-inspector-retry]");
const content = document.getElementById("inspector-content");
const shell = document.querySelector(".app-shell");
const lifecycle = new AbortController();
const { signal } = lifecycle;
let controllerReady = false;
let controllerRequest: Promise<void> | null = null;
let pendingReturnTarget: HTMLElement | null = null;

function showPendingSelection(selection: Selection): void {
  if (controllerReady || !inspector) return;
  inspector.hidden = !selection;
  inspector.dataset.state = selection ? "open" : "closed";
  inspector.dataset.sheetState = selection ? "open" : "closed";
  shell?.setAttribute("data-inspector-open", String(Boolean(selection)));
  if (!selection) {
    content?.removeAttribute("aria-busy");
    if (pendingReturnTarget?.isConnected) pendingReturnTarget.focus();
    pendingReturnTarget = null;
    return;
  }
  const trigger = getSelectionTrigger();
  pendingReturnTarget = trigger.returnTarget || null;
  if (title) title.textContent = "Loading record…";
  if (status) { status.hidden = false; status.textContent = "Loading the published record…"; }
  if (retry) retry.hidden = true;
  content?.setAttribute("aria-busy", "true");
  if (trigger.modality === "keyboard") title?.focus();
}

function loadController(): void {
  if (controllerReady || controllerRequest || !selectionStore.get()) return;
  controllerRequest = import("./controller").then(({ initializeInspector }) => {
    if (signal.aborted) return;
    initializeInspector();
    controllerReady = true;
  }).catch(() => {
    controllerRequest = null;
    if (!selectionStore.get() || signal.aborted) return;
    content?.removeAttribute("aria-busy");
    if (title) title.textContent = "Record unavailable";
    if (status) { status.hidden = false; status.textContent = "The record view could not be loaded. You can try again."; }
    if (retry) retry.hidden = false;
  });
}

const stopSelection = selectionStore.subscribe((selection) => {
  showPendingSelection(selection);
  if (selection) loadController();
});
window.addEventListener(CURRENT_SELECTION_FOCUS_EVENT, () => showPendingSelection(selectionStore.get()), { signal });
retry?.addEventListener("click", () => { if (!controllerReady) loadController(); }, { signal });
inspector?.querySelector("[data-inspector-close]")?.addEventListener("click", () => selectionStore.clear(), { signal });
const sheetHandle = inspector?.querySelector<HTMLButtonElement>("[data-sheet-handle]");
sheetHandle?.addEventListener("click", () => {
  if (!inspector) return;
  const next = inspector.dataset.sheetState === "expanded" ? "open" : "expanded";
  inspector.dataset.sheetState = next;
  sheetHandle.setAttribute("aria-expanded", String(next === "expanded"));
}, { signal });
window.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || inspector?.hidden || inspector?.dataset.state !== "open") return;
  const drawer = document.getElementById("source-drawer");
  if (!drawer || drawer.hidden || drawer.dataset.state !== "open") selectionStore.clear();
}, { signal });

// Existing review hooks share the exact same stores as native interactions.
(window as any).__CC_SELECTION_STORE__ = selectionStore;
(window as any).__CC_TIME_FILTER_STORE__ = timeFilterStore;
window.addEventListener("cc:test-select", ((event: CustomEvent<Selection>) => {
  if (event.detail) selectionStore.set(event.detail);
}) as EventListener, { signal });
window.addEventListener("cc:test-filter-time", ((event: CustomEvent<Parameters<typeof timeFilterStore.set>[0]>) => {
  if (event.detail) timeFilterStore.set(event.detail);
}) as EventListener, { signal });

const index = JSON.parse(document.querySelector("[data-published-selection-ids]")?.textContent || "{}") as PublishedSelectionIds;
const current = selectionStore.get();
const currentPeriod = timeFilterStore.get().id;
const stopNavigation = startNavigationState({
  browser: window,
  selection: selectionStore,
  timeFilter: timeFilterStore,
  isSupported: selectionValidatorFromIds(index),
  onRestore: () => window.dispatchEvent(new Event("cc:navigation-restored")),
  pendingState: current || currentPeriod !== "all" ? {
    ...(current ? { selection: current } : {}),
    ...(currentPeriod !== "all" ? { period: currentPeriod } : {}),
  } : undefined,
});
showPendingSelection(selectionStore.get());
loadController();

const cleanup = () => { lifecycle.abort(); stopSelection(); stopNavigation(); };
document.addEventListener("astro:before-swap", cleanup, { once: true });
window.addEventListener("pagehide", (event) => { if (!event.persisted) cleanup(); });
