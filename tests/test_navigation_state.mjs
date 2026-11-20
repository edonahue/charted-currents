import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createSelectionStore } from "../src/lib/state/selection.ts";
import { TimeFilterStore } from "../src/lib/state/timeFilter.ts";
import { publishedSelectionIds, publishedSelectionValidator, readNavigationState, selectionValidatorFromIds, startNavigationState, writeNavigationState } from "../src/lib/state/navigation.ts";

// Exercise the published corpus boundary rather than duplicating historical IDs.
const published = (name) => JSON.parse(readFileSync(new URL(`../public/data/${name}`, import.meta.url), "utf8"));
const entities = published("entities.json");
const eventData = published("events.json");
const events = Array.isArray(eventData) ? eventData : eventData.events;
const routes = published("routes.geojson");
const isSupported = publishedSelectionValidator(entities, events, routes);
const port = { kind: "port", id: entities.places[0].id };
const ship = { kind: "ship", id: entities.ships[0].id };

function browserAt(href) {
  const listeners = new Set();
  const entries = [href];
  let position = 0;
  const browser = {
    location: { href },
    history: {
      state: { preserved: "host-state" },
      pushState(state, _title, url) {
        assert.deepEqual(state, this.state);
        entries.splice(++position);
        entries.push(String(url));
        browser.location.href = String(url);
      },
    },
    addEventListener(type, callback) { assert.equal(type, "popstate"); listeners.add(callback); },
    removeEventListener(type, callback) { assert.equal(type, "popstate"); listeners.delete(callback); },
    go(delta) {
      position += delta;
      browser.location.href = entries[position];
      for (const listener of listeners) listener();
    },
    entries,
    listeners,
  };
  return browser;
}

test("all inspector selection kinds validate published IDs and reject cross-kind IDs", () => {
  const serializedIndex = JSON.stringify(publishedSelectionIds(entities, events, routes));
  const isIndexed = selectionValidatorFromIds(JSON.parse(serializedIndex));
  const selections = [
    ...entities.places.map(({ id }) => ({ kind: "port", id })),
    ...entities.ships.map(({ id }) => ({ kind: "ship", id })),
    ...events.map(({ id }) => ({ kind: "event", id })),
    ...(entities.persons || []).map(({ id }) => ({ kind: "person", id })),
    ...routes.features.flatMap(({ properties }) =>
      [properties.id, properties.route_group_id].filter(Boolean).map((id) => ({ kind: "voyage", id }))),
  ];
  for (const selection of selections) {
    assert.equal(isSupported(selection), true);
    assert.equal(isIndexed(selection), true, "serialized build-time index retains every supported ID");
    const url = writeNavigationState(new URL("https://atlas.example/labs/atlas/"), { selection, period: "all" });
    assert.deepEqual(readNavigationState(url, isSupported).selection, selection);
  }
  assert.equal(isSupported({ kind: "port", id: ship.id }), false);
  assert.equal(isSupported({ kind: "ship", id: "__development_only_absent__" }), false);
});

test("malformed, ambiguous, unknown and prototype-like URL values are safe defaults", () => {
  for (const query of [
    "select=ship", "select=unknown:any", "select=port:", "select=ship:__missing__",
    "select=__proto__:anything", "select=port:%3Cscript%3E", "select=a&select=b",
    "period=toString", "period=__proto__", "period=1684-1695&period=1702-1712",
  ]) {
    assert.deepEqual(readNavigationState(new URL(`https://atlas.example/?${query}`), isSupported), {
      selection: null, period: "all",
    });
  }
});

test("serialization preserves base path, repeated foreign parameters, camera state, and fragment", () => {
  const url = new URL("https://atlas.example/labs/atlas/?tag=a&tag=b&center=-78,20&mode=globe#chart");
  const next = writeNavigationState(url, { selection: port, period: "1684-1695" });
  assert.equal(next.pathname, "/labs/atlas/");
  assert.deepEqual(next.searchParams.getAll("tag"), ["a", "b"]);
  assert.equal(next.searchParams.get("center"), "-78,20");
  assert.equal(next.searchParams.get("mode"), "globe");
  assert.equal(next.hash, "#chart");
  assert.deepEqual(readNavigationState(next, isSupported), { selection: port, period: "1684-1695" });
  const cleared = writeNavigationState(next, { selection: null, period: "all" });
  assert.equal(cleared.searchParams.has("select"), false);
  assert.equal(cleared.searchParams.has("period"), false);
  assert.equal(url.searchParams.has("select"), false, "source URL stays unchanged");
});

test("hydrate without writes; selection, period, close and browser history round-trip once", () => {
  const initial = writeNavigationState(new URL("https://atlas.example/?foreign=yes#chart"), { selection: port, period: "1684-1695" });
  const browser = browserAt(initial.href);
  const selection = createSelectionStore();
  const timeFilter = new TimeFilterStore();
  let notifications = 0;
  timeFilter.subscribe(() => notifications++);
  const stop = startNavigationState({ browser, selection, timeFilter, isSupported });
  assert.deepEqual(selection.get(), port);
  assert.equal(timeFilter.get().id, "1684-1695");
  assert.equal(browser.entries.length, 1, "hydration creates no history");
  assert.equal(notifications, 2, "one initial callback plus one period change");
  selection.set(ship);
  selection.set({ ...ship });
  assert.equal(browser.entries.length, 2);
  timeFilter.set("1702-1712");
  timeFilter.set("1702-1712");
  timeFilter.set({ ...timeFilter.get() });
  assert.equal(notifications, 3, "identical period values do not notify");
  assert.equal(browser.entries.length, 3);
  selection.clear();
  assert.equal(browser.entries.length, 4);
  browser.go(-1);
  assert.deepEqual(selection.get(), ship);
  assert.equal(timeFilter.get().id, "1702-1712");
  browser.go(-1);
  assert.equal(timeFilter.get().id, "1684-1695");
  browser.go(-1);
  assert.deepEqual(selection.get(), port);
  browser.go(1);
  assert.deepEqual(selection.get(), ship);
  assert.equal(browser.entries.length, 4, "popstate never appends history");
  assert.equal(new URL(browser.location.href).searchParams.get("foreign"), "yes");
  stop();
  assert.equal(browser.listeners.size, 0);
  selection.clear();
  timeFilter.set("all");
  assert.equal(browser.entries.length, 4, "cleanup removes store subscribers");
});

test("invalid deep links remain readable and later valid interactions replace only owned state", () => {
  const browser = browserAt("https://atlas.example/?select=port:missing&period=__proto__&other=yes");
  const selection = createSelectionStore();
  const timeFilter = new TimeFilterStore();
  const stop = startNavigationState({ browser, selection, timeFilter, isSupported });
  assert.equal(browser.entries.length, 1);
  assert.equal(selection.get(), null);
  assert.equal(timeFilter.get().id, "all");
  selection.set(ship);
  assert.equal(browser.entries.length, 2);
  browser.go(-1);
  assert.equal(selection.get(), null, "an invalid history target clears stale selection");
  assert.equal(new URL(browser.location.href).searchParams.get("other"), "yes");
  stop();
});

test("real input during published-data loading wins over initial URL hydration once", () => {
  const original = writeNavigationState(new URL("https://atlas.example/?foreign=yes"), { selection: port, period: "1684-1695" });
  const browser = browserAt(original.href);
  const selection = createSelectionStore(ship);
  const timeFilter = new TimeFilterStore();
  timeFilter.set("1702-1712");
  const restored = [];
  const stop = startNavigationState({ browser, selection, timeFilter, isSupported,
    pendingState: { selection: ship, period: "1702-1712" },
    onRestore: () => restored.push({ selection: selection.get(), period: timeFilter.get().id }),
  });
  assert.deepEqual(selection.get(), ship);
  assert.equal(timeFilter.get().id, "1702-1712");
  assert.equal(browser.entries.length, 2, "pending actions form one meaningful entry");
  assert.deepEqual(readNavigationState(new URL(browser.location.href), isSupported), { selection: ship, period: "1702-1712" });
  browser.go(-1);
  assert.deepEqual(selection.get(), port);
  assert.equal(timeFilter.get().id, "1684-1695");
  assert.deepEqual(restored, [
    { selection: ship, period: "1702-1712" },
    { selection: port, period: "1684-1695" },
  ], "restore callback observes complete state for initial and history restores");
  stop();
});
