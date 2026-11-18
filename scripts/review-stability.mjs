#!/usr/bin/env node
/**
 * Long-session interaction and runtime diagnostic for the Charted Currents atlas.
 * Uses native Chromium DevTools Protocol input; no app APIs or extra packages.
 */

import fs from "node:fs";
import { createHash } from "node:crypto";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const DEFAULT_MINUTES = 30;
const VIEWPORT = { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false };
const CDP_TIMEOUT_MS = 12_000;
const STARTUP_TIMEOUT_MS = 25_000;
const MAP_READY_TIMEOUT_MS = 90_000;
const METRICS_INTERVAL_MS = 60_000;
const FORCED_GC_INTERVAL_MS = 5 * 60_000;
const CYCLE_INTERVAL_MS = 30_000;
const ERROR_LIMIT = 500;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".geojson": "application/geo+json",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function usage() {
  console.log(`Usage: node scripts/review-stability.mjs [options]

Options:
  --minutes <number>   Session length in minutes (default: ${DEFAULT_MINUTES})
  --dist <directory>  Built static site directory for a local session (default: dist)
  --base-url <url>    Inspect an existing HTTP(S) site with browser-only interactions
  --output <file>     Local JSON report (default: test-results/stability-audit.json)
  --help              Show this help

The default session is 30 minutes. Use a short --minutes value only for a smoke run.
The browser uses 1440x900 and software WebGL; this is not real-device or thermal proof.
`);
}

function parseArgs(argv) {
  const options = {
    minutes: DEFAULT_MINUTES,
    dist: "dist",
    baseUrl: null,
    output: path.join("test-results", "stability-audit.json"),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === "--help" || flag === "-h") {
      usage();
      process.exit(0);
    }
    if (!["--minutes", "--dist", "--base-url", "--output"].includes(flag)) throw new Error(`Unknown argument: ${flag}`);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) throw new Error(`Expected a value after ${flag}`);
    i += 1;
    if (flag === "--minutes") {
      options.minutes = Number(value);
      if (!Number.isFinite(options.minutes) || options.minutes <= 0 || options.minutes > 24 * 60) {
        throw new Error("--minutes must be greater than 0 and at most 1440");
      }
    } else if (flag === "--dist") options.dist = value;
    else if (flag === "--output") options.output = value;
    else {
      const parsed = new URL(value);
      if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) {
        throw new Error("--base-url must be an HTTP(S) URL without embedded credentials");
      }
      options.baseUrl = parsed.href;
    }
  }
  return options;
}

function findBrowserExecutable() {
  const custom = process.env.CHROME_BIN || process.env.BROWSER_PATH;
  if (custom && fs.existsSync(custom)) return custom;
  const candidates = [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/chrome",
    "/snap/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ];
  for (const candidate of candidates) if (fs.existsSync(candidate)) return candidate;

  const cache = path.join(os.homedir(), ".cache", "ms-playwright");
  if (fs.existsSync(cache)) {
    try {
      for (const entry of fs.readdirSync(cache)) {
        if (!entry.startsWith("chromium-")) continue;
        const linux = path.join(cache, entry, "chrome-linux64", "chrome");
        const mac = path.join(cache, entry, "chrome-mac", "Chromium.app", "Contents", "MacOS", "Chromium");
        if (fs.existsSync(linux)) return linux;
        if (fs.existsSync(mac)) return mac;
      }
    } catch {
      // Fall through to the actionable message.
    }
  }
  throw new Error("No Chromium/Chrome executable found. Set CHROME_BIN or BROWSER_PATH.");
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createStaticServer(directory) {
  const root = fs.realpathSync(directory);
  return http.createServer((request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" }).end("Method not allowed");
      return;
    }
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url || "/", "http://127.0.0.1").pathname);
    } catch {
      response.writeHead(400).end("Bad request");
      return;
    }
    if (pathname === "/" || pathname === "") pathname = "/index.html";
    const file = path.resolve(root, `.${pathname}`);
    const relative = path.relative(root, file);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    let realFile;
    let stat;
    try {
      realFile = fs.realpathSync(file);
      stat = fs.statSync(realFile);
    } catch {
      response.writeHead(404).end("Not found");
      return;
    }
    const realRelative = path.relative(root, realFile);
    if (realRelative.startsWith("..") || path.isAbsolute(realRelative) || !stat.isFile()) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Length": stat.size,
      "Content-Type": MIME_TYPES[path.extname(realFile).toLowerCase()] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    if (request.method === "HEAD") response.end();
    else fs.createReadStream(realFile).pipe(response);
  });
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
}

async function waitForTarget(profileDirectory, processHandle) {
  const activePortFile = path.join(profileDirectory, "DevToolsActivePort");
  const start = Date.now();
  while (Date.now() - start < STARTUP_TIMEOUT_MS) {
    if (processHandle.exitCode !== null) throw new Error(`Browser exited during startup (code ${processHandle.exitCode})`);
    try {
      const port = Number(fs.readFileSync(activePortFile, "utf8").split(/\r?\n/)[0]);
      if (Number.isInteger(port) && port > 0) {
        const response = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(1000) });
        if (response.ok) {
          const page = (await response.json()).find((target) => target.type === "page");
          if (page?.webSocketDebuggerUrl) return page;
        }
      }
    } catch {
      // Chromium may still be opening its loopback debugging endpoint.
    }
    await delay(120);
  }
  throw new Error("Timed out waiting for browser debugging endpoint");
}

function openWebSocket(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error("Timed out opening CDP WebSocket"));
    }, CDP_TIMEOUT_MS);
    ws.addEventListener("open", () => {
      clearTimeout(timer);
      resolve(ws);
    }, { once: true });
    ws.addEventListener("error", () => {
      clearTimeout(timer);
      reject(new Error("Could not open CDP WebSocket"));
    }, { once: true });
  });
}

function safeMessage(value) {
  return String(value || "Unknown browser error")
    .replace(/https?:\/\/[^\s)]+/g, "[url]")
    .replace(/file:\/\/[^\s)]+/g, "[file]")
    .slice(0, 500);
}

function createCdpClient(ws, report, startedAt) {
  let id = 0;
  const pending = new Map();
  const record = (kind, message, details = {}) => {
    if (report.errors.length >= ERROR_LIMIT) {
      report.error_recording_truncated = true;
      return;
    }
    report.errors.push({
      elapsed_ms: Math.max(0, Date.now() - startedAt),
      kind,
      message: safeMessage(message),
      ...details,
    });
  };
  ws.addEventListener("message", ({ data }) => {
    let message;
    try { message = JSON.parse(data); } catch { return; }
    if (message.id && pending.has(message.id)) {
      const request = pending.get(message.id);
      pending.delete(message.id);
      clearTimeout(request.timer);
      message.error ? request.reject(new Error(message.error.message || "CDP request failed")) : request.resolve(message.result || {});
      return;
    }
    if (message.method === "Runtime.exceptionThrown") {
      const details = message.params?.exceptionDetails || {};
      record("runtime.exceptionThrown", details.exception?.description || details.text || "Uncaught runtime exception", {
        line: Number.isFinite(details.lineNumber) ? details.lineNumber + 1 : null,
        column: Number.isFinite(details.columnNumber) ? details.columnNumber + 1 : null,
      });
    } else if (message.method === "Runtime.consoleAPICalled" && message.params?.type === "error") {
      // Console arguments can contain credentials, private endpoints or arbitrary
      // user data. The occurrence is enough to fail this diagnostic; retain no
      // argument values, descriptions, stack URLs or remote object identifiers.
      record("runtime.console.error", "Application console.error invoked (arguments withheld)", {
        argument_count: message.params.args?.length || 0,
      });
    } else if (message.method === "Log.entryAdded") {
      const entry = message.params?.entry;
      let resourcePath = null;
      try { resourcePath = new URL(entry?.url).pathname; } catch { /* No resource URL. */ }
      if (entry?.level === "error") record("console.error", entry.text || entry.args?.[0]?.description || "Console error", { resource_path: resourcePath });
    } else if (message.method === "Inspector.targetCrashed" || message.method === "Target.targetCrashed") {
      report.browser_crashes += 1;
      record("browser.crash", "Renderer target crashed");
    }
  });
  ws.addEventListener("close", () => {
    for (const request of pending.values()) {
      clearTimeout(request.timer);
      request.reject(new Error("CDP WebSocket closed"));
    }
    pending.clear();
  });

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    if (ws.readyState !== WebSocket.OPEN) {
      reject(new Error("CDP connection is not open"));
      return;
    }
    const requestId = ++id;
    const timer = setTimeout(() => {
      pending.delete(requestId);
      reject(new Error(`CDP request timed out: ${method}`));
    }, CDP_TIMEOUT_MS);
    pending.set(requestId, { resolve, reject, timer });
    try {
      ws.send(JSON.stringify({ id: requestId, method, params }));
    } catch (error) {
      clearTimeout(timer);
      pending.delete(requestId);
      reject(error);
    }
  });
  return { send, record };
}

const INSTRUMENTATION = `(() => {
  const state = { unhandledRejections: [], windowErrors: [], eventTimingEntries: [], eventTimingSupported: false };
  Object.defineProperty(window, "__ccStabilityReview", { value: state });
  const scrub = (value) => String(value || "Unknown page error").replace(/https?:\\/\\/[^\\s)]+/g, "[url]").slice(0, 500);
  addEventListener("unhandledrejection", (event) => {
    state.unhandledRejections.push({ message: scrub(event.reason?.stack || event.reason?.message || event.reason), time: performance.now() });
  });
  addEventListener("error", (event) => {
    const javascriptError = event instanceof ErrorEvent;
    state.windowErrors.push({
      kind: javascriptError ? "javascript_error" : "resource_load_error",
      message: scrub(event.message || event.target?.tagName || "Resource failed to load"),
      time: performance.now(),
      line: event.lineno || null,
      column: event.colno || null,
    });
  }, true);
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.interactionId > 0) state.eventTimingEntries.push({ interactionId: entry.interactionId, duration: entry.duration, startTime: entry.startTime });
      }
    }).observe({ type: "event", buffered: true, durationThreshold: 16 });
    state.eventTimingSupported = true;
  } catch {}
})();`;

async function evaluate(send, expression) {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(safeMessage(result.exceptionDetails.text || "In-page observation failed"));
  return result.result?.value;
}

async function waitFor(send, expression, label, timeoutMs = 8000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await evaluate(send, expression)) return;
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function click(send, selector) {
  // Scrolling may invalidate the previous rendered hit-test region. Observe a
  // painted frame before measuring and sending native input, as in navigation review.
  await evaluate(send, `document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" })`);
  await evaluate(send, "new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
  const point = await evaluate(send, `(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element || element.disabled || element.hidden || !element.getClientRects().length) return null;
    const rect = element.getBoundingClientRect();
    const left = Math.max(0, rect.left), right = Math.min(innerWidth, rect.right);
    const top = Math.max(0, rect.top), bottom = Math.min(innerHeight, rect.bottom);
    if (right <= left || bottom <= top) return null;
    const x = (left + right) / 2, y = (top + bottom) / 2;
    const hit = document.elementFromPoint(x, y);
    return { x, y, onTarget: hit === element || element.contains(hit) };
  })()`);
  if (!point || point.x < 0 || point.y < 0 || point.x > VIEWPORT.width || point.y > VIEWPORT.height) {
    throw new Error(`Native pointer target unavailable: ${selector}`);
  }
  if (!point.onTarget) throw new Error(`Native pointer target occluded: ${selector}`);
  const { x, y } = point;
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
  await delay(100);
}

async function key(send, keyName, code, windowsVirtualKeyCode) {
  const text = keyName === "Enter" ? "\r" : keyName === " " ? " " : undefined;
  await send("Input.dispatchKeyEvent", {
    type: text ? "keyDown" : "rawKeyDown",
    key: keyName,
    code,
    windowsVirtualKeyCode,
    ...(text ? { text, unmodifiedText: text } : {}),
  });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: keyName, code, windowsVirtualKeyCode });
}

async function nativeFrameSample(send, sampleMs = 800) {
  return evaluate(send, `new Promise((resolve) => {
    const times = [];
    let previous = null;
    let start = null;
    const sample = (time) => {
      if (start === null) start = time;
      if (previous !== null) times.push(time - previous);
      previous = time;
      if (time - start >= ${sampleMs}) resolve(times);
      else requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  })`);
}

function percentile(values, fraction) {
  if (!values?.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return Number(sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)].toFixed(2));
}

async function getMetrics(send, elapsedMs, reason, forcedGc) {
  if (forcedGc) await send("HeapProfiler.collectGarbage");
  const response = await send("Performance.getMetrics");
  const values = Object.fromEntries((response.metrics || []).map(({ name, value }) => [name, value]));
  return {
    elapsed_ms: elapsedMs,
    reason,
    gc: forcedGc ? "forcedGC diagnostic" : "not_forced",
    js_heap_used_bytes: values.JSHeapUsedSize ?? null,
    dom_nodes: values.Nodes ?? null,
    documents: values.Documents ?? null,
    frames: values.Frames ?? null,
    js_event_listeners: values.JSEventListeners ?? null,
    layout_count: values.LayoutCount ?? null,
    recalc_style_count: values.RecalcStyleCount ?? null,
    task_duration_seconds: values.TaskDuration ?? null,
    script_duration_seconds: values.ScriptDuration ?? null,
  };
}

function safeTarget(url, isLocal) {
  if (isLocal) return { kind: "local_dist" };
  const parsed = new URL(url);
  return { kind: "provided_base_url", scheme: parsed.protocol, host: parsed.hostname, path: "[redacted]", query: "[redacted]" };
}

async function stopBrowser(browser) {
  if (!browser?.pid || browser.exitCode !== null || browser.signalCode !== null) return;
  browser.kill("SIGTERM");
  await Promise.race([new Promise((resolve) => browser.once("exit", resolve)), delay(2000)]);
  if (browser.exitCode === null && browser.signalCode === null) {
    browser.kill("SIGKILL");
    await Promise.race([new Promise((resolve) => browser.once("exit", resolve)), delay(1000)]);
  }
}

async function runInteractionCycle(send, report) {
  const startedAt = Date.now();
  const actions = [];
  const step = async (name, action) => {
    try {
      await action();
      actions.push({ name, status: "passed" });
    } catch (error) {
      const message = safeMessage(error.message);
      actions.push({ name, status: "failed", message });
      report.interaction_failures.push({ elapsed_ms: Date.now() - report.started_epoch_ms, action: name, message });
    }
  };

  await step("select Port Royal through native place locator", async () => {
    const state = await evaluate(send, `(() => ({ map:document.getElementById("charted-currents-map")?.dataset.mapReady === "true", place:!!document.querySelector('[data-place-id="place_port_royal"]') }))()`);
    if (!state?.map || !state.place) throw new Error("Map or Port Royal locator is unavailable");
    const expanded = await evaluate(send, `document.querySelector('[data-locator-toggle]')?.getAttribute('aria-expanded') === 'true'`);
    if (!expanded) await click(send, "[data-locator-toggle]");
    await waitFor(send, `!document.querySelector('[data-locator-menu]')?.hidden`, "place locator menu");
    await click(send, '[data-place-id="place_port_royal"]');
    await waitFor(send, `document.querySelector('#entity-inspector') && !document.querySelector('#entity-inspector').hidden`, "place inspector");
    await waitFor(send, `(() => { const e=document.querySelector('[data-place-evidence-btn]'); return !!e && !e.hidden && !!e.getClientRects().length; })()`, "place evidence control");
  });

  await step("open and close place evidence using native input", async () => {
    await click(send, "[data-place-evidence-btn]");
    await waitFor(send, `document.querySelector('#source-drawer')?.getAttribute('data-state') === 'open'`, "source drawer open");
    await key(send, "Escape", "Escape", 27);
    await waitFor(send, `document.querySelector('#source-drawer')?.getAttribute('data-state') !== 'open'`, "source drawer close");
  });

  await step("change and reset period focus using native input", async () => {
    // Exercise the first usable moment after Escape closes the reading room.
    await click(send, '[data-time-filter="1684-1695"]');
    await waitFor(send, `window.__CC_TIME_FILTER_STORE__?.get()?.id === '1684-1695'`, "period focus");
    await click(send, '[data-time-filter="all"]');
    await waitFor(send, `window.__CC_TIME_FILTER_STORE__?.get()?.id === 'all'`, "period reset");
  });

  await step("cycle period-map comparison and visibility controls", async () => {
    const panelOpen = await evaluate(send, `!document.querySelector('[data-layer-panel]')?.hidden`);
    if (!panelOpen) await click(send, "[data-layer-toggle]");
    await waitFor(send, `!document.querySelector('[data-layer-panel]')?.hidden`, "period-map controls");
    const checkbox = await evaluate(send, `document.querySelector('[data-layer-visibility-checkbox]')?.checked === true`);
    if (!checkbox) await click(send, "[data-layer-visibility-checkbox]");
    for (const mode of ["blend", "chart", "modern"]) {
      await click(send, `[data-map-comparison="${mode}"]`);
      await waitFor(send, `document.querySelector('[data-map-comparison="${mode}"]')?.getAttribute('aria-pressed') === 'true'`, `map comparison ${mode}`);
    }
    await click(send, "[data-layer-inspect-btn]");
    await waitFor(send, `document.querySelector('#source-drawer')?.getAttribute('data-state') === 'open'`, "period-map source inspection");
    await key(send, "Escape", "Escape", 27);
    await waitFor(send, `document.querySelector('#source-drawer')?.getAttribute('data-state') !== 'open'`, "period-map source close");
    const stillVisible = await evaluate(send, `document.querySelector('[data-layer-visibility-checkbox]')?.checked === true`);
    if (stillVisible) await click(send, "[data-layer-visibility-checkbox]");
    await click(send, "[data-layer-panel-close]");
  });

  await step("alternate geographic views and restore north-up", async () => {
    for (const view of ["atlantic", "caribbean"]) {
      await click(send, `[data-map-view="${view}"]`);
      const target = view === "atlantic" ? [-40, 25, 2.3] : [-72, 20, 4];
      await waitFor(send, `(() => {
        const raw = new URL(location.href).searchParams.get('view');
        if (!raw) return false;
        const values = raw.split(',').map(Number);
        const target = ${JSON.stringify(target)};
        return values.length === 3 && values.every((value, index) => Math.abs(value - target[index]) < 0.02);
      })()`, `settled map view ${view}`, 5000);
    }
    await click(send, "[data-map-north]");
  });

  const frames = await nativeFrameSample(send, 800).catch((error) => {
    report.interaction_failures.push({ elapsed_ms: Date.now() - report.started_epoch_ms, action: "rAF frame sample", message: safeMessage(error.message) });
    return [];
  });
  const actionFailures = actions.filter(({ status }) => status === "failed").length;
  const cycle = {
    cycle: report.interaction_cycles.length + 1,
    elapsed_ms: Date.now() - report.started_epoch_ms,
    duration_ms: Date.now() - startedAt,
    action_failures: actionFailures,
    actions,
    renderer_cadence_proxy: {
      sample: "requestAnimationFrame interval; software WebGL browser; not GPU frame time or real-device frame time",
      frames_observed: frames.length,
      interval_p50_ms: percentile(frames, 0.5),
      interval_p95_ms: percentile(frames, 0.95),
      interval_max_ms: percentile(frames, 1),
    },
  };
  report.interaction_cycles.push(cycle);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  let server = null;
  let baseUrl = options.baseUrl;
  const localServer = !baseUrl;
  let profile = null;
  let browser = null;
  let ws;
  const start = Date.now();
  const output = path.resolve(options.output);
  const report = {
    generated_at: new Date().toISOString(),
    status: "running",
    error: null,
    started_at: new Date(start).toISOString(),
    target: safeTarget(baseUrl, localServer),
    build_index_sha256: null,
    requested_duration_minutes: options.minutes,
    viewport: VIEWPORT,
    runtime: {
      browser: "Chromium/Chrome discovered by CHROME_BIN, BROWSER_PATH, common install paths, or Playwright cache",
      graphics: "software WebGL (SwiftShader)",
      real_device: false,
      thermal_behavior: "not measured",
      gpu_frame_time: "not measured",
    },
    methods: {
      interactions: "Native CDP mouse/key input on map locator, timeline, evidence drawer, period-map comparison/source controls, view controls, and north-up control.",
      renderer_samples: "Short requestAnimationFrame interval samples after each interaction cycle; browser cadence proxy only, not GPU or physical-device frame time.",
      interaction_timing: "Lab Event Timing samples are observed during the existing native interaction cycle, entries below the 16 ms observer threshold are not recorded, and event durations are grouped by interactionId using the maximum duration per interaction. This is not field INP.",
      memory_samples: "Performance.getMetrics at checkpoints after HeapProfiler.collectGarbage; forced-GC post-collection heap trend is diagnostic and cannot establish natural memory retention, leak severity, or thermal stability.",
      hosted_mode: "--base-url performs browser-side inspection/interactions only; no deployment or write request is made by this tool. The viewed page's own behavior remains outside the tool's control.",
    },
    started_epoch_ms: start,
    interaction_cycles: [],
    interaction_failures: [],
    errors: [],
    browser_crashes: 0,
    memory_checkpoints: [],
    browser_errors: [],
    error_recording_truncated: false,
  };
  const deadline = start + options.minutes * 60_000;
  const writeReport = () => {
    // Keep the live timestamp for action diagnostics, but omit it from the file.
    const { started_epoch_ms, ...snapshot } = report;
    fs.writeFileSync(output, `${JSON.stringify(snapshot, null, 2)}\n`);
  };
  fs.mkdirSync(path.dirname(output), { recursive: true });
  // Overwrite any previous result before startup. A failed new run must never
  // leave an older successful report looking like the current observation.
  writeReport();

  try {
    const browserPath = findBrowserExecutable();
    if (localServer) {
      const dist = path.resolve(options.dist);
      if (!fs.existsSync(dist) || !fs.statSync(dist).isDirectory()) throw new Error("Build directory not found; run npm run build first");
      report.build_index_sha256 = createHash("sha256").update(fs.readFileSync(path.join(dist, "index.html"))).digest("hex");
      server = createStaticServer(dist);
      const port = await listen(server);
      baseUrl = `http://127.0.0.1:${port}/`;
    }
    profile = fs.mkdtempSync(path.join(os.tmpdir(), "cc-stability-"));
    browser = spawn(browserPath, [
      "--headless=new",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--remote-debugging-address=127.0.0.1",
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--enable-webgl",
      "about:blank",
    ], { stdio: "ignore" });
    await new Promise((resolve, reject) => {
      browser.once("spawn", resolve);
      browser.once("error", reject);
    });
    const target = await waitForTarget(profile, browser);
    ws = await openWebSocket(target.webSocketDebuggerUrl);
    const { send } = createCdpClient(ws, report, start);
    report.runtime.browser = (await send("Browser.getVersion")).product;
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Log.enable");
    await send("Inspector.enable");
    await send("HeapProfiler.enable");
    await send("Performance.enable");
    await send("Page.addScriptToEvaluateOnNewDocument", { source: INSTRUMENTATION });
    await send("Emulation.setDeviceMetricsOverride", VIEWPORT);
    await send("Page.navigate", { url: baseUrl });
    await waitFor(send, `document.getElementById('charted-currents-map')?.dataset.mapReady === 'true'`, "map ready", MAP_READY_TIMEOUT_MS);
    report.started_at = new Date(start).toISOString();
    report.map_ready_elapsed_ms = Date.now() - start;

    let nextMetrics = start;
    let nextCycle = start;
    let nextForcedGcAt = start;
    while (Date.now() < deadline) {
      const now = Date.now();
      if (now >= nextMetrics) {
        const forceGc = now >= nextForcedGcAt;
        const checkpoint = await getMetrics(send, now - start, forceGc ? "five_minute_forced_gc_checkpoint" : "minute_checkpoint", forceGc);
        report.memory_checkpoints.push(checkpoint);
        console.log(`Checkpoint ${(checkpoint.elapsed_ms / 60_000).toFixed(1)} min: ${report.interaction_cycles.length} cycles, ${report.interaction_failures.length} interaction failures, ${report.errors.length} browser errors; heap ${checkpoint.js_heap_used_bytes} bytes (${checkpoint.gc}).`);
        if (forceGc) nextForcedGcAt = now + FORCED_GC_INTERVAL_MS;
        nextMetrics = now + METRICS_INTERVAL_MS;
      }
      if (now >= nextCycle) {
        await runInteractionCycle(send, report);
        if (report.interaction_failures.length || report.errors.length || report.browser_crashes) {
          console.warn("Stopping early after a material failure; partial session evidence will be retained.");
          break;
        }
        nextCycle = Date.now() + CYCLE_INTERVAL_MS;
      }
      const nextWake = Math.min(deadline, nextMetrics, nextCycle, Date.now() + 1000);
      if (nextWake > Date.now()) await delay(nextWake - Date.now());
    }

    const elapsed = Date.now() - start;
    const finalCheckpoint = await getMetrics(send, elapsed, "final_non_forced_checkpoint", false);
    report.memory_checkpoints.push(finalCheckpoint);
    const forcedHeap = report.memory_checkpoints.filter((item) => item.gc.startsWith("forcedGC") && Number.isFinite(item.js_heap_used_bytes));
    const increases = forcedHeap.slice(1).filter((item, index) => item.js_heap_used_bytes > forcedHeap[index].js_heap_used_bytes).length;
    const monotonicSuffix = (() => {
      let count = 0;
      for (let i = forcedHeap.length - 1; i > 0; i -= 1) {
        if (forcedHeap[i].js_heap_used_bytes > forcedHeap[i - 1].js_heap_used_bytes) count += 1;
        else break;
      }
      return count;
    })();
    report.post_gc_heap_diagnostic = {
      forced_gc_samples: forcedHeap.length,
      increases_from_previous_sample: increases,
      trailing_consecutive_increases: monotonicSuffix,
      observed_bytes: forcedHeap.map(({ elapsed_ms, js_heap_used_bytes }) => ({ elapsed_ms, js_heap_used_bytes })),
      interpretation: "Diagnostic only: forced collection changes runtime conditions; increasing post-GC samples warrant investigation but alone do not prove a memory leak or real-device stability problem.",
    };
    report.finished_at = new Date().toISOString();
    report.actual_duration_ms = elapsed;
    report.elapsed_minutes = Number((elapsed / 60_000).toFixed(2));
    const pageState = await evaluate(send, "window.__ccStabilityReview || null");
    if (pageState) {
      report.browser_errors.push(...pageState.windowErrors);
      report.browser_errors.push(...pageState.unhandledRejections.map((item) => ({ ...item, kind: "unhandledrejection" })));
    }
    report.browser_errors = report.browser_errors.slice(0, ERROR_LIMIT);
    report.error_recording_truncated ||= (pageState?.windowErrors?.length || 0) + (pageState?.unhandledRejections?.length || 0) > ERROR_LIMIT;
    const eventDurations = new Map();
    for (const item of pageState?.eventTimingEntries || []) {
      eventDurations.set(item.interactionId, Math.max(eventDurations.get(item.interactionId) || 0, item.duration));
    }
    const interactionValues = [...eventDurations.values()];
    report.interaction_responsiveness = {
      observer_supported: pageState?.eventTimingSupported === true,
      observed_interactions: interactionValues.length,
      p75_duration_ms: percentile(interactionValues, 0.75),
      sample_threshold_ms: 16,
      method: "Event Timing duration grouped by interactionId (maximum event duration per interaction), observed only during this script's existing native UI cycles; entries under 16 ms are censored/not observed.",
      interpretation: "Lab-only interaction diagnostic; not field INP and not a standalone acceptance claim.",
    };
    report.summary = {
      interaction_cycles: report.interaction_cycles.length,
      interaction_failures: report.interaction_failures.length,
      cdp_runtime_or_console_errors: report.errors.length,
      page_unhandled_errors: report.browser_errors.filter(({ kind }) => kind === "javascript_error" || kind === "unhandledrejection").length,
      resource_load_errors: report.browser_errors.filter(({ kind }) => kind === "resource_load_error").length,
      event_timing_interactions_observed: interactionValues.length,
      browser_crashes: report.browser_crashes,
      post_gc_heap_trailing_increases: monotonicSuffix,
      renderer_sample_note: "Software WebGL requestAnimationFrame intervals only; do not compare as real-device frame p95 acceptance evidence.",
    };
    const unhandledPageErrors = report.browser_errors.filter(({ kind }) => kind === "javascript_error" || kind === "unhandledrejection").length;
    const failed = Boolean(report.browser_crashes || report.interaction_failures.length || report.errors.length || unhandledPageErrors);
    report.status = failed ? "failed" : "completed";
    writeReport();
    console.log(`Stability session finished: ${report.elapsed_minutes} min, ${report.interaction_cycles.length} interaction cycles, ${report.errors.length + report.browser_errors.length} recorded browser errors.`);
    console.log("Renderer cadence is software WebGL; forced-GC heap trend is diagnostic; no thermal/real-device pass is asserted.");
    console.log("Wrote local stability report.");
    if (failed) process.exitCode = 1;
  } catch (error) {
    report.status = "failed";
    report.error = safeMessage(error.message);
    report.finished_at = new Date().toISOString();
    report.actual_duration_ms = Date.now() - start;
    report.elapsed_minutes = Number((report.actual_duration_ms / 60_000).toFixed(2));
    writeReport();
    throw error;
  } finally {
    if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    await stopBrowser(browser);
    if (server) {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    try { if (profile) fs.rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }); }
    catch { console.warn("Temporary browser profile cleanup incomplete; review result preserved."); }
  }
}

main().catch((error) => {
  console.error(`Stability review failed: ${safeMessage(error.message)}`);
  process.exitCode = 1;
});
