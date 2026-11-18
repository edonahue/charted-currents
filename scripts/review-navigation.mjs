/** Native Chromium/CDP navigation proof against an existing build. No rebuild. */
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const dist = path.resolve("dist");
const report = { timestamp: new Date().toISOString(), evidence: "local Chromium native pointer/keyboard and browser history", observations: [], runtimeExceptions: 0 };
const read = (name) => JSON.parse(fs.readFileSync(path.join(dist, "data", name), "utf8"));
const entities = read("entities.json");
const sources = read("sources.json");
const eventData = read("events.json");
const events = Array.isArray(eventData) ? eventData : eventData.events;
const [firstPlace, secondPlace] = entities.places;
let delayEntities = false;
let failSources = false;
let firstDelayedSourceAttempt = null;
let delayedCoreResponse = null;
const requestedPaths = [];
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  requestedPaths.push(pathname);
  if (delayEntities && pathname === "/data/sources.json") firstDelayedSourceAttempt ??= performance.now();
  if (failSources && pathname === "/data/sources.json") { res.writeHead(503).end("Source unavailable for retry proof"); return; }
  const file = path.resolve(dist, `.${pathname === "/" ? "/index.html" : pathname}`);
  if (!file.startsWith(`${dist}${path.sep}`) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404).end(); return;
  }
  const mime = { ".js": "application/javascript", ".html": "text/html", ".css": "text/css", ".json": "application/json", ".geojson": "application/geo+json", ".woff2": "font/woff2", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg" };
  const serve = () => {
    res.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  };
  if (delayEntities && pathname === "/data/entities.json") setTimeout(() => {
    delayedCoreResponse = performance.now();
    serve();
  }, 1800);
  else serve();
});
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const listen = (server) => new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => resolve(server.address().port));
});
const chromeCandidates = [process.env.CHROME_BIN, process.env.BROWSER_PATH, "/usr/bin/chromium", "/usr/bin/google-chrome", "/usr/bin/chromium-browser", "/usr/bin/google-chrome-stable"];
const cache = path.join(os.homedir(), ".cache", "ms-playwright");
if (fs.existsSync(cache)) for (const entry of fs.readdirSync(cache)) chromeCandidates.push(path.join(cache, entry, "chrome-linux64", "chrome"));
const chrome = chromeCandidates.find((candidate) => candidate && fs.existsSync(candidate));
assert.ok(chrome, "Chromium executable available");
let proc;
let ws;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cc-navigation-"));
const output = path.resolve("test-results/navigation-review.json");
try {
  const port = await listen(server);
  const debugServer = http.createServer();
  const debugPort = await listen(debugServer);
  await new Promise((resolve) => debugServer.close(resolve));
  proc = spawn(chrome, ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", `--user-data-dir=${profile}`, `--remote-debugging-port=${debugPort}`, "--remote-debugging-address=127.0.0.1", "about:blank"], { stdio: "ignore" });
  let target;
  for (let i = 0; i < 100 && !target; i++) {
    try { target = (await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find(({ type }) => type === "page"); } catch {}
    if (!target) await wait(100);
  }
  assert.ok(target, "Browser debugging target is ready");
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let nextId = 0;
  ws.addEventListener("message", ({ data }) => {
    if (JSON.parse(data).method === "Runtime.exceptionThrown") report.runtimeExceptions++;
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timeout = setTimeout(() => reject(new Error(`CDP timeout: ${method}`)), 12000);
    const handler = ({ data }) => {
      const reply = JSON.parse(data);
      if (reply.id !== id) return;
      ws.removeEventListener("message", handler); clearTimeout(timeout);
      reply.error ? reject(new Error(reply.error.message)) : resolve(reply.result);
    };
    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    assert.ok(!result.exceptionDetails, "In-page observation evaluates without exception");
    return result.result.value;
  };
  const until = async (expression, description) => {
    for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await wait(75); }
    throw new Error(`Timed out: ${description}`);
  };
  const click = async (selector) => {
    await evaluate(`document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block:'nearest'})`);
    await evaluate("new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))");
    const point = await evaluate(`(() => { const e=document.querySelector(${JSON.stringify(selector)}); if(!e || e.hidden) return null; const r=e.getBoundingClientRect(); const left=Math.max(0,r.left),right=Math.min(innerWidth,r.right),top=Math.max(0,r.top),bottom=Math.min(innerHeight,r.bottom);if(right<=left||bottom<=top)return null; const p={x:(left+right)/2,y:(top+bottom)/2};const hit=document.elementFromPoint(p.x,p.y);return {...p,hit:hit?.tagName,onTarget:hit===e||e.contains(hit)}; })()`);
    assert.ok(point && point.x >= 0 && point.y >= 0, `Native target available: ${selector}`);
    assert.equal(point.onTarget, true, `Native hit target matches ${selector}; got ${point.hit}`);
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.x, y: point.y });
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button: "left", clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x, y: point.y, button: "left", clickCount: 1 });
    await wait(100);
  };
  const key = async (key, code, windowsVirtualKeyCode, modifiers = 0) => {
    const text = key === "Enter" ? "\r" : key === " " ? " " : undefined;
    await send("Input.dispatchKeyEvent", { type: text ? "keyDown" : "rawKeyDown", key, code, windowsVirtualKeyCode, modifiers, text, unmodifiedText: text });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode, modifiers });
    await wait(100);
  };
  const observe = async (label, expectedSelection, expectedPeriod) => {
    await until(`window.__CC_SELECTION_STORE__?.get()?.id === ${JSON.stringify(expectedSelection.id)} && window.__CC_TIME_FILTER_STORE__?.get()?.id === ${JSON.stringify(expectedPeriod)} && !document.querySelector('#inspector-content')?.hasAttribute('aria-busy') && !/^(Loading record|Record unavailable)/.test(document.querySelector('[data-inspector-title]')?.textContent || '')`, label);
    const state = await evaluate(`(() => {const u=new URL(location.href);return {selection:window.__CC_SELECTION_STORE__.get(),period:window.__CC_TIME_FILTER_STORE__.get().id,title:document.querySelector('[data-inspector-title]')?.textContent,inspectorOpen:!document.querySelector('#entity-inspector')?.hidden,urlSelection:u.searchParams.get('select'),urlPeriod:u.searchParams.get('period')||'all',foreign:u.searchParams.getAll('foreign'),hash:u.hash,historyLength:history.length};})()`);
    assert.deepEqual(state.selection, expectedSelection);
    assert.equal(state.urlSelection, `${expectedSelection.kind}:${expectedSelection.id}`);
    assert.equal(state.urlPeriod, expectedPeriod);
    assert.equal(state.inspectorOpen, true);
    assert.deepEqual(state.foreign, ["a", "b"]);
    assert.equal(state.hash, "#chart");
    report.observations.push({ label, ...state });
    console.log(`PASS ${label}`);
    return state;
  };
  await send("Page.enable"); await send("Runtime.enable");
  await send("Page.bringToFront");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const url = new URL(`http://127.0.0.1:${port}/?foreign=a&foreign=b#chart`);
  url.searchParams.set("select", `port:${firstPlace.id}`); url.searchParams.set("period", "1684-1695");
  await send("Page.navigate", { url: url.href });
  const initial = await observe("direct published place URL hydrates", { kind: "port", id: firstPlace.id }, "1684-1695");
  assert.equal(initial.historyLength, 2, "initial direct-link hydration does not add to the fresh browser history");
  await click("[data-locator-toggle]");
  await click(`[data-place-id="${secondPlace.id}"]`);
  const selected = await observe("native place selection replaces current record", { kind: "port", id: secondPlace.id }, "1684-1695");
  assert.equal(selected.historyLength, initial.historyLength + 1);
  await click('[data-time-filter="1702-1712"]');
  const filtered = await observe("native period focus adds one history entry", { kind: "port", id: secondPlace.id }, "1702-1712");
  assert.equal(filtered.historyLength, selected.historyLength + 1);
  await click('[data-time-filter="1702-1712"]');
  assert.equal(await evaluate("history.length"), filtered.historyLength, "repeated period creates no history");
  const historyBack = async (delta) => {
    const history = await send("Page.getNavigationHistory");
    await send("Page.navigateToHistoryEntry", { entryId: history.entries[history.currentIndex + delta].id });
  };
  await historyBack(-1);
  await observe("browser Back restores period", { kind: "port", id: secondPlace.id }, "1684-1695");
  await historyBack(-1);
  await observe("browser Back restores initial place", { kind: "port", id: firstPlace.id }, "1684-1695");
  await historyBack(1);
  await observe("browser Forward restores replacement place", { kind: "port", id: secondPlace.id }, "1684-1695");
  await click("[data-place-evidence-btn]");
  await until("document.querySelector('#source-drawer')?.getAttribute('data-state') === 'open'", "source evidence opens");
  report.observations.push({ label: "native source evidence opens", passed: true });
  await key("Escape", "Escape", 27);
  await until("document.querySelector('#source-drawer')?.getAttribute('data-state') !== 'open'", "source evidence closes");
  await observe("Escape returns to selected record", { kind: "port", id: secondPlace.id }, "1684-1695");

  const typeQuery = async (query) => {
    await click("#atlas-search-input");
    await key("a", "KeyA", 65, 2);
    await send("Input.insertText", { text: query });
    if (await evaluate("document.querySelector('#atlas-search-results').hidden")) {
      report.observations.push({ label: "search input failure diagnostics", state: await evaluate("(()=>{const i=document.querySelector('#atlas-search-input');const r=i.getBoundingClientRect();return{active:document.activeElement?.outerHTML?.slice(0,220),value:i.value,inputRect:{x:r.x,y:r.y,width:r.width,height:r.height},hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.outerHTML?.slice(0,220),viewport:{width:innerWidth,height:innerHeight,scrollY},drawer:document.querySelector('#source-drawer').dataset.state};})()") });
      const screenshot = await send("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(path.resolve("test-results/navigation-input-failure.png"), Buffer.from(screenshot.data, "base64"));
    }
    await until("!document.querySelector('#atlas-search-results').hidden", "search results become visible");
  };
  const activeSearchId = () => evaluate("document.activeElement?.dataset.searchId");
  const beforeSameSelection = await evaluate("history.length");
  await typeQuery(secondPlace.canonical_name);
  await key("ArrowDown", "ArrowDown", 40);
  assert.equal(await activeSearchId(), secondPlace.id);
  await key("Enter", "Enter", 13);
  await observe("native same-selection search refreshes focus without history", { kind: "port", id: secondPlace.id }, "1684-1695");
  assert.equal(await evaluate("history.length"), beforeSameSelection);
  await key("Escape", "Escape", 27);
  assert.equal(await evaluate("document.activeElement?.id"), "atlas-search-input", "same-selection close returns to the latest search trigger");
  await historyBack(-1);
  await observe("browser Back restores record after same-selection close", { kind: "port", id: secondPlace.id }, "1684-1695");
  await typeQuery("a");
  const rankedIds = await evaluate("Array.from(document.querySelectorAll('[data-search-entry]:not([hidden]) a')).map(a=>a.dataset.searchId)");
  assert.ok(rankedIds.length > 1);
  await key("ArrowDown", "ArrowDown", 40);
  assert.equal(await activeSearchId(), rankedIds[0], "first arrow follows visible rank");
  await key("ArrowDown", "ArrowDown", 40);
  assert.equal(await activeSearchId(), rankedIds[1], "second arrow follows visible rank");
  await key("Escape", "Escape", 27);
  assert.equal(await evaluate("document.querySelector('#atlas-search-results').hidden"), true);
  assert.equal(await evaluate("document.activeElement?.id"), "atlas-search-input");
  assert.equal(await evaluate("window.__CC_SELECTION_STORE__.get().id"), secondPlace.id, "search Escape leaves current selection intact");
  report.observations.push({ label: "native search arrows follow ranked DOM; Escape returns to input", passed: true });

  const accented = entities.places.find(({ canonical_name }) => canonical_name.normalize("NFKD").replace(/\p{M}/gu, "") !== canonical_name);
  assert.ok(accented, "published corpus contains an accent-search case");
  await typeQuery(accented.canonical_name.normalize("NFKD").replace(/\p{M}/gu, ""));
  assert.equal(await evaluate(`!document.querySelector('[data-search-id="${accented.id}"]').closest('li').hidden`), true);
  await typeQuery("__development_only_absent_query__");
  assert.equal(await evaluate("document.querySelectorAll('[data-search-entry]:not([hidden])').length"), 0);
  assert.match(await evaluate("document.querySelector('[data-search-count]').textContent"), /No published records/);
  report.observations.push({ label: "accent-insensitive published-name search and no-results state", passed: true });

  const vessel = entities.ships.find((candidate) => entities.ships.filter(({ canonical_name }) => canonical_name === candidate.canonical_name).length === 1);
  await typeQuery(vessel.canonical_name);
  await key("ArrowDown", "ArrowDown", 40);
  assert.equal(await activeSearchId(), vessel.id);
  await key("Enter", "Enter", 13);
  await observe("native search keyboard opens vessel", { kind: "ship", id: vessel.id }, "1684-1695");
  assert.equal(await evaluate("document.activeElement?.id"), "inspector-heading");
  await evaluate("new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))");
  // Native Page Down establishes an actual reading position before the pointer
  // switches records. This does not set scrollTop through page JavaScript.
  await key("PageDown", "PageDown", 34);
  await until("document.querySelector('#entity-inspector').scrollTop + document.querySelector('#inspector-content').scrollTop > 100", "native keyboard scrolls long vessel record");
  await click('[data-time-filter="1702-1712"]');
  assert.ok(await evaluate("document.querySelector('#entity-inspector').scrollTop + document.querySelector('#inspector-content').scrollTop") > 100, "period refresh preserves inspector reading position");
  await click('[data-time-filter="1684-1695"]');
  await typeQuery(secondPlace.canonical_name);
  await click(`[data-search-id="${secondPlace.id}"]`);
  await observe("native pointer record switch resets prior inspector scroll", { kind: "port", id: secondPlace.id }, "1684-1695");
  const switchedHeading = await evaluate("(()=>{const i=document.querySelector('#entity-inspector');const c=document.querySelector('#inspector-content');const h=document.querySelector('[data-inspector-title]').getBoundingClientRect();const r=i.getBoundingClientRect();return{scroll:i.scrollTop+c.scrollTop,visible:h.top>=r.top&&h.bottom<=r.bottom};})()");
  assert.deepEqual(switchedHeading, { scroll: 0, visible: true });
  await typeQuery(vessel.canonical_name);
  await click(`[data-search-id="${vessel.id}"]`);
  await observe("native pointer search restores vessel after scroll proof", { kind: "ship", id: vessel.id }, "1684-1695");
  const discovery = await evaluate(`document.querySelector('[data-discovery-id="${vessel.id}"]')?.dataset.discoveryKind || null`);
  assert.equal(discovery, "ship", "reviewed vessel is available in current discovery suggestions");
  const beforeDiscovery = await evaluate("history.length");
  await click(".app-discovery__suggestions summary");
  await evaluate(`document.querySelector('[data-discovery-id="${vessel.id}"]').focus()`);
  await key("Enter", "Enter", 13);
  assert.equal(await evaluate("history.length"), beforeDiscovery);
  assert.equal(await evaluate("document.activeElement.id"), "inspector-heading");
  await key("Escape", "Escape", 27);
  assert.equal(await evaluate("document.activeElement === document.querySelector('.app-discovery__suggestions summary')"), true, "current discovery same-selection close returns to disclosure");
  await historyBack(-1);
  await observe("browser Back restores vessel after discovery focus proof", { kind: "ship", id: vessel.id }, "1684-1695");
  await typeQuery(vessel.canonical_name);
  await key("ArrowDown", "ArrowDown", 40);
  await key("Enter", "Enter", 13);
  await key("Escape", "Escape", 27);
  assert.equal(await evaluate("document.activeElement?.id"), "atlas-search-input", "closing selected record returns keyboard focus to search");
  await historyBack(-1);
  await observe("browser Back restores searched vessel after close", { kind: "ship", id: vessel.id }, "1684-1695");
  await historyBack(-1);
  await observe("browser Back restores record before search", { kind: "port", id: secondPlace.id }, "1684-1695");
  await historyBack(1);
  await observe("browser Forward restores searched vessel", { kind: "ship", id: vessel.id }, "1684-1695");
  const person = entities.persons[0];
  await typeQuery(person.canonical_name);
  await key("ArrowDown", "ArrowDown", 40);
  assert.equal(await activeSearchId(), person.id);
  await key("Enter", "Enter", 13);
  await observe("native search replaces vessel with person", { kind: "person", id: person.id }, "1684-1695");

  await click('[data-time-filter="1702-1712"]');
  assert.equal(await evaluate("window.__CC_TIME_FILTER_STORE__.get().id"), "1702-1712", "timeline keyboard setup uses requested native period focus");
  const markers = await evaluate("Array.from(document.querySelectorAll('[data-timeline-event]')).map(e=>({id:e.dataset.selectionId,disabled:e.disabled}))");
  assert.ok(markers.some(({ disabled }) => disabled), "outside-period events are natively disabled");
  const firstEnabled = markers.find(({ disabled }) => !disabled);
  await key("Tab", "Tab", 9);
  assert.equal(await evaluate("document.activeElement?.dataset.selectionId"), firstEnabled.id, "native Tab skips disabled outside-period events");
  const beforeEnter = await evaluate("history.length");
  await key("Enter", "Enter", 13);
  report.observations.push({ label: "native timeline activation observed state", state: await evaluate("({selection:window.__CC_SELECTION_STORE__.get(),period:window.__CC_TIME_FILTER_STORE__.get().id,focus:document.activeElement?.id,focusedSelection:document.activeElement?.dataset.selectionId})") });
  const eventSelection = await observe("native timeline keyboard selects in-period event once", { kind: "event", id: firstEnabled.id }, "1702-1712");
  assert.equal(eventSelection.historyLength, beforeEnter + 1);

  // A source-wide request is test setup; grouping is checked against the actual
  // published artifact, while details expansion and focus use native keyboard.
  const source = sources.sources.find(({ id }) => sources.source_records.filter((record) => record.source_id === id).length > 1);
  assert.ok(source);
  const related = sources.source_records.filter(({ source_id }) => source_id === source.id);
  await evaluate(`window.dispatchEvent(new CustomEvent('cc:open-source',{detail:{sourceId:${JSON.stringify(source.id)},triggerEl:document.querySelector('[data-event-evidence-btn]')}}))`);
  await until(`document.querySelectorAll('[data-source-record-id]').length === ${related.length}`, "source records rendered separately");
  const cards = await evaluate("Array.from(document.querySelectorAll('[data-source-record-id]')).map(card=>({id:card.dataset.sourceRecordId,inspection:card.querySelector('[data-source-inspection-state]')?.dataset.sourceInspectionState,assertions:Array.from(card.querySelectorAll('[data-assertion-id]')).map(row=>row.dataset.assertionId),identifier:card.querySelector('.source-card__subtitle')?.textContent}))");
  for (const record of related) {
    const card = cards.find(({ id }) => id === record.id);
    assert.ok(card);
    assert.equal(card.inspection, record.inspection_state);
    assert.ok(card.identifier.includes(record.native_identifier));
    assert.deepEqual(card.assertions, sources.assertions.filter(({ source_record_id }) => source_record_id === record.id).map(({ id }) => id));
  }
  assert.equal(await evaluate("document.querySelector('.source-drawer-panel').getAttribute('aria-modal')"), "false");
  assert.equal(await evaluate("document.querySelector('#entity-inspector').inert"), true);
  await evaluate("document.querySelector('.source-record-entry summary').focus()");
  await key("Enter", "Enter", 13);
  assert.equal(await evaluate("document.querySelector('.source-record-entry').open"), true);
  await evaluate("Array.from(document.querySelectorAll('.source-record-entry summary')).at(-1).focus()");
  await key("Tab", "Tab", 9);
  assert.equal(await evaluate("document.querySelector('.source-drawer-panel').contains(document.activeElement)"), false, "desktop reading view permits focus to leave for map/timeline");
  report.observations.push({ label: "source-wide records preserve exact assertion IDs, identifiers and inspection states; native summaries work; desktop is modeless", sourceId: source.id, records: related.length, passed: true });
  const selectedEvent = events.find(({ id }) => id === firstEnabled.id);
  assert.ok(selectedEvent);
  const readingHistoryLength = await evaluate("history.length");
  await typeQuery(selectedEvent.title);
  await key("ArrowDown", "ArrowDown", 40);
  assert.equal(await activeSearchId(), selectedEvent.id);
  await key("Enter", "Enter", 13);
  await until("document.querySelector('#source-drawer').getAttribute('data-state') === 'closed'", "same-selection search returns from source reading");
  await observe("native same-selection search returns from provenance", { kind: "event", id: selectedEvent.id }, "1702-1712");
  assert.equal(await evaluate("document.activeElement.id"), "inspector-heading");
  assert.equal(await evaluate("history.length"), readingHistoryLength, "return from provenance does not duplicate history");
  await evaluate(`window.dispatchEvent(new CustomEvent('cc:open-source',{detail:{sourceId:${JSON.stringify(source.id)},triggerEl:document.querySelector('[data-event-evidence-btn]')}}))`);
  await until(`document.querySelectorAll('[data-source-record-id]').length === ${related.length}`, "source reading reopens for compact focus proof");
  await evaluate("document.querySelector('#charted-currents-map canvas').focus()");
  assert.equal(await evaluate("document.activeElement === document.querySelector('#charted-currents-map canvas')"), true);

  // Compact reading view and search remain usable with reduced motion enabled.
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  report.observations.push({ label: "compact viewport geometry", intendedWidth: 390, state: await evaluate("(()=>{const r=e=>{const b=e.getBoundingClientRect();return{x:b.x,width:b.width,right:b.right}};return{innerWidth,visualWidth:visualViewport.width,scale:visualViewport.scale,documentWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,body:r(document.body),shell:r(document.querySelector('.app-shell')),overflow:Array.from(document.querySelectorAll('body *')).filter(e=>{const b=e.getBoundingClientRect();return e.getClientRects().length&&b.right>390.5&&b.width>0&&!e.closest('[hidden]')}).slice(0,20).map(e=>({tag:e.tagName,class:e.className,rect:r(e)}))};})()") });
  assert.equal(await evaluate("innerWidth"), 390, "layout viewport matches intended phone width");
  assert.ok(await evaluate("document.documentElement.scrollWidth") <= 390, "no hidden horizontal overflow expands phone layout");
  await until("document.querySelector('.source-drawer-panel').getAttribute('aria-modal') === 'true' && document.querySelector('.source-drawer-panel').contains(document.activeElement)", "desktop reading focus enters modal when viewport becomes compact");
  report.observations.push({ label: "desktop source stays open while native viewport resize brings map focus into compact modal", passed: true });
  assert.equal(await evaluate("document.querySelector('.source-drawer-panel').getAttribute('aria-modal')"), "true");
  await evaluate("Array.from(document.querySelectorAll('.source-record-entry summary')).at(-1).focus()");
  await key("Tab", "Tab", 9);
  report.observations.push({ label: "mobile reading focus observation", state: await evaluate("({active:document.activeElement?.outerHTML?.slice(0,250),lastFocusable:Array.from(document.querySelector('.source-drawer-panel').querySelectorAll('button:not([disabled]),summary,[href],[tabindex]:not([tabindex=\"-1\"])')).filter(e=>e.getClientRects().length>0).at(-1)?.outerHTML?.slice(0,250),modal:document.querySelector('.source-drawer-panel').getAttribute('aria-modal')})") });
  assert.equal(await evaluate("document.activeElement.hasAttribute('data-source-drawer-close')"), true, "mobile focus wraps to close");
  await key("Tab", "Tab", 9, 8);
  assert.equal(await evaluate("document.activeElement === Array.from(document.querySelectorAll('.source-record-entry summary')).at(-1)"), true, "mobile reverse focus wraps to last summary");
  await key("Escape", "Escape", 27);
  await typeQuery(vessel.canonical_name);
  await key("ArrowDown", "ArrowDown", 40);
  await key("Enter", "Enter", 13);
  await observe("mobile reduced-motion native search opens vessel", { kind: "ship", id: vessel.id }, "1702-1712");
  report.observations.push({ label: "compact source reading traps native Tab both ways and Escape restores record; reduced-motion search remains usable", passed: true });
  // On a compact viewport the open record sheet can cover the chronology.
  // Use its native dismissal before tapping a control behind it.
  await key("Escape", "Escape", 27);
  await until("document.getElementById('entity-inspector')?.hidden", "compact record dismissed before chronology");
  await click(".timeline-event-list summary");
  assert.equal(await evaluate("document.querySelector('.timeline-event-list').open"), true);
  const visibleListIds = () => evaluate("Array.from(document.querySelectorAll('.timeline-event-list li:not([hidden]) [data-timeline-list-event]')).map(button=>button.dataset.selectionId)");
  const expectedPeriodIds = (start, end) => events.filter(({ date }) => Number(date.slice(0, 4)) >= start && Number(date.slice(0, 4)) <= end).map(({ id }) => id).sort();
  const focusedIds = await visibleListIds();
  assert.deepEqual([...focusedIds].sort(), expectedPeriodIds(1702, 1712));
  const listEvent = events.find(({ id }) => id === focusedIds[0]);
  assert.ok(listEvent);
  await evaluate(`document.querySelector('[data-timeline-list-event][data-selection-id="${listEvent.id}"]').focus()`);
  await key("Enter", "Enter", 13);
  await observe("narrow native dated-event list selects published event", { kind: "event", id: listEvent.id }, "1702-1712");
  assert.equal(await evaluate("document.activeElement.id"), "inspector-heading");
  await typeQuery(listEvent.title);
  await key("ArrowDown", "ArrowDown", 40);
  await key("Enter", "Enter", 13);
  const beforeListReselection = await evaluate("history.length");
  await evaluate(`document.querySelector('[data-timeline-list-event][data-selection-id="${listEvent.id}"]').focus()`);
  await key("Enter", "Enter", 13);
  assert.equal(await evaluate("history.length"), beforeListReselection);
  assert.equal(await evaluate("document.activeElement.id"), "inspector-heading");
  await key("Escape", "Escape", 27);
  assert.equal(await evaluate("document.activeElement.hasAttribute('data-timeline-list-event')"), true, "same-event keyboard reselect returns to latest dated-event trigger");
  await click('[data-time-filter="1684-1695"]');
  assert.deepEqual((await visibleListIds()).sort(), expectedPeriodIds(1684, 1695));
  await click('[data-time-filter="1702-1712"]');
  await click(".timeline-event-list summary");
  report.observations.push({ label: "narrow disclosure filters exact published events and same-event native keyboard preserves history/focus", passed: true });

  await send("Network.enable");
  await send("Network.setCacheDisabled", { cacheDisabled: true });
  delayEntities = true;
  const startupRequestStart = requestedPaths.length;
  await send("Page.navigate", { url: `http://127.0.0.1:${port}/?foreign=a&foreign=b#chart` });
  await until("Boolean(window.__CC_SELECTION_STORE__ && document.querySelector('#atlas-search-input'))", "search available before delayed corpus");
  await wait(250);
  const initialResources = requestedPaths.slice(startupRequestStart);
  assert.equal(initialResources.some((resource) => /\/controller\.[^/]+\.js$/.test(resource)), false, "record controller chunk is deferred until selection");
  assert.equal(initialResources.some((resource) => /\/renderSourceRecords\.[^/]+\.js$/.test(resource)), false, "evidence renderer is deferred until the folio opens");
  for (const artifact of ["entities.json", "events.json", "sources.json", "dataset_context.json"]) {
    assert.equal(initialResources.some((resource) => resource.endsWith(`/data/${artifact}`)), false, `${artifact} is deferred until inspection`);
  }
  report.observations.push({ label: "fresh exploration defers controller and all inspector-only artifacts", passed: true });
  failSources = true;
  await typeQuery(vessel.canonical_name);
  await key("ArrowDown", "ArrowDown", 40);
  await key("Enter", "Enter", 13);
  await until(`new URL(location.href).searchParams.get('select') === ${JSON.stringify(`ship:${vessel.id}`)}`, "early selection reaches URL after delayed corpus");
  await until("document.querySelector('[data-inspector-retry]')?.hidden === false", "failed source metadata exposes honest retry");
  assert.equal(await evaluate("window.__CC_SELECTION_STORE__.get().id"), vessel.id, "early selection survives while sources are unavailable");
  assert.equal(await evaluate("document.querySelector('[data-view-ship]').hidden"), true, "unavailable metadata does not show stale or fallback source claims");
  failSources = false;
  await click("[data-inspector-retry]");
  await observe("native search during delayed corpus survives hydration and source retry", { kind: "ship", id: vessel.id }, "all");
  assert.ok(firstDelayedSourceAttempt !== null && delayedCoreResponse !== null &&
    firstDelayedSourceAttempt < delayedCoreResponse, "cold vessel source lookup starts before delayed core response");
  assert.equal(requestedPaths.slice(startupRequestStart).some((resource) => /\/renderSourceRecords\.[^/]+\.js$/.test(resource)), false,
    "selecting a vessel does not fetch the evidence renderer");
  report.observations.push({ label: "cold vessel overlaps source and core data while deferring evidence rendering", passed: true });
  delayEntities = false;
  await send("Page.navigate", { url: `http://127.0.0.1:${port}/?select=port%3A__unknown__&period=__proto__&foreign=kept` });
  await until("Boolean(window.__CC_SELECTION_STORE__ && window.__CC_TIME_FILTER_STORE__)", "invalid URL page initializes");
  await wait(500);
  assert.equal(await evaluate("window.__CC_SELECTION_STORE__.get()"), null);
  assert.equal(await evaluate("window.__CC_TIME_FILTER_STORE__.get().id"), "all");
  assert.equal(await evaluate("document.querySelector('#entity-inspector').hidden"), true);
  assert.equal(report.runtimeExceptions, 0);
  report.observations.push({ label: "unknown ID and prototype period ignored without runtime exception", passed: true });
  report.passed = true;
} catch (error) {
  report.passed = false;
  report.failure = error.message;
  process.exitCode = 1;
  console.error(error.message);
} finally {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  ws?.close(); proc?.kill(); server.close();
  await wait(150);
  fs.rmSync(profile, { recursive: true, force: true });
}
