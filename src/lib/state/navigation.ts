import { ENTITY_KINDS } from "../domain/types.ts";
import type { EntityKind, PublishedEntities, PublishedEvent, PublishedRouteFeatureCollection, Selection } from "../domain/types.ts";
import type { SelectionStore } from "./selection.ts";
import { TIME_FILTER_PRESETS } from "./timeFilter.ts";
import type { TimeFilterState, TimeFilterStore } from "./timeFilter.ts";

/** Only durable record selection and period focus belong here. Camera and hover
 * have independent lifecycles; their query parameters, if any, are preserved. */
export interface NavigationState {
  selection: Selection;
  period: TimeFilterState["id"];
}

export type SelectionValidator = (selection: NonNullable<Selection>) => boolean;
export type PublishedSelectionIds = Record<EntityKind, string[]>;

/** A small build-time index, derived from the published inspector inputs. */
export function publishedSelectionIds(
  entities: Pick<PublishedEntities, "ships" | "places" | "persons">,
  events: PublishedEvent[],
  routes: PublishedRouteFeatureCollection,
): PublishedSelectionIds {
  return {
    ship: entities.ships.map(({ id }) => id),
    port: entities.places.map(({ id }) => id),
    person: (entities.persons || []).map(({ id }) => id),
    event: events.map(({ id }) => id),
    voyage: [...new Set(routes.features.flatMap(({ properties }) =>
      [properties.id, properties.route_group_id].filter((id): id is string => Boolean(id))))],
  };
}

export function selectionValidatorFromIds(index: PublishedSelectionIds): SelectionValidator {
  const ids = Object.fromEntries(ENTITY_KINDS.map((kind) => [kind, new Set(index[kind])])) as Record<EntityKind, Set<string>>;
  return (selection) => ids[selection.kind]?.has(selection.id) ?? false;
}

/** Validate against the same published IDs the inspector can actually render. */
export function publishedSelectionValidator(
  entities: Pick<PublishedEntities, "ships" | "places" | "persons">,
  events: PublishedEvent[],
  routes: PublishedRouteFeatureCollection,
): SelectionValidator {
  return selectionValidatorFromIds(publishedSelectionIds(entities, events, routes));
}

export function readNavigationState(url: URL, isSupported: SelectionValidator): NavigationState {
  const selections = url.searchParams.getAll("select");
  const match = selections.length === 1 ? /^([^:]+):(.+)$/.exec(selections[0]) : null;
  let selection: Selection = null;
  if (match && (ENTITY_KINDS as readonly string[]).includes(match[1])) {
    const candidate = { kind: match[1] as EntityKind, id: match[2] };
    if (isSupported(candidate)) selection = candidate;
  }
  const periods = url.searchParams.getAll("period");
  const period = periods.length === 1 && Object.hasOwn(TIME_FILTER_PRESETS, periods[0])
    ? TIME_FILTER_PRESETS[periods[0]].id
    : "all";
  return { selection, period };
}

/** Copy, never rebuild the URL: base paths, unrelated parameters and hash survive. */
export function writeNavigationState(url: URL, state: NavigationState): URL {
  const next = new URL(url);
  next.searchParams.delete("select");
  next.searchParams.delete("period");
  if (state.selection) next.searchParams.set("select", `${state.selection.kind}:${state.selection.id}`);
  if (state.period !== "all") next.searchParams.set("period", state.period);
  return next;
}

interface NavigationBrowser {
  location: { href: string };
  history: Pick<History, "pushState" | "state">;
  addEventListener(type: "popstate", listener: () => void): void;
  removeEventListener(type: "popstate", listener: () => void): void;
}

/** Start once published data is available. Hydration/history restoration never
 * writes history, while each meaningful user selection/period change pushes once. */
export function startNavigationState({ browser, selection, timeFilter, isSupported, onRestore, pendingState }: {
  browser: NavigationBrowser;
  selection: SelectionStore;
  timeFilter: Pick<TimeFilterStore, "get" | "set" | "subscribe">;
  isSupported: SelectionValidator;
  onRestore?: () => void;
  /** User input that arrived while the published-ID index was loading. */
  pendingState?: Partial<NavigationState>;
}): () => void {
  let restoring = true;
  let disposed = false;
  const apply = (state: NavigationState) => {
    restoring = true;
    try {
      // Period first so the restored record renders with the right context.
      timeFilter.set(state.period);
      selection.set(state.selection);
    } finally {
      restoring = false;
    }
    onRestore?.();
  };
  const restore = () => apply(readNavigationState(new URL(browser.location.href), isSupported));
  const initial = readNavigationState(new URL(browser.location.href), isSupported);
  if (pendingState?.selection !== undefined) {
    const candidate = pendingState.selection;
    initial.selection = candidate && isSupported(candidate) ? candidate : null;
  }
  if (pendingState?.period !== undefined) initial.period = pendingState.period;
  apply(initial);
  restoring = true;
  const publish = () => {
    if (restoring || disposed) return;
    const current = selection.get();
    const state: NavigationState = {
      selection: current && isSupported(current) ? current : null,
      period: timeFilter.get().id,
    };
    const url = new URL(browser.location.href);
    // Semantic comparison avoids duplicate entries for defaults or URL encoding.
    const previous = readNavigationState(url, isSupported);
    if (previous.selection?.kind === state.selection?.kind &&
        previous.selection?.id === state.selection?.id && previous.period === state.period) return;
    browser.history.pushState(browser.history.state, "", writeNavigationState(url, state));
  };
  const stopSelection = selection.subscribe(publish);
  const stopTime = timeFilter.subscribe(publish);
  browser.addEventListener("popstate", restore);
  restoring = false;
  // Initial URL hydration stays silent. A real action made during data loading
  // earns one entry, with the final validated selection and period together.
  if (pendingState) publish();
  return () => {
    disposed = true;
    stopSelection();
    stopTime();
    browser.removeEventListener("popstate", restore);
  };
}
