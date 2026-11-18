#!/usr/bin/env node
/**
 * Repeatable lab observation of a built static route in headless Chromium.
 * This is a diagnostic review tool; it is not a field Core Web Vitals report.
 */

import fs from "node:fs";
import { createHash } from "node:crypto";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { spawn } from "node:child_process";

const DEFAULT_RUNS = 5;
const DEFAULT_OBSERVE_MS = 20_000;
const CDP_TIMEOUT_MS = 10_000;
const BROWSER_START_TIMEOUT_MS = 20_000;
const PROFILE = {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  cpuSlowdownRate: 4,
  latencyMs: 150,
  downloadBytesPerSecond: 1_600_000 / 8,
  uploadBytesPerSecond: 750_000 / 8,
};

const MIME_TYPES = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".geojson": "application/geo+json",
  ".gif": "image/gif",
  ".htm": "text/html; charset=utf-8",
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
const COMPRESSIBLE = /^(text\/|application\/(javascript|json|geo\+json|xml|wasm)|image\/svg\+xml)/;

function usage() {
  console.log(`Usage: node scripts/review-performance.mjs [options]

Options:
  --dist <directory>       Built static directory (default: dist)
  --output <file>          JSON report path (default: test-results/performance-audit.json)
  --runs <count>           Cold-load runs, positive integer (default: ${DEFAULT_RUNS})
  --observe-ms <duration>  Per-run observation window in ms (default: ${DEFAULT_OBSERVE_MS})
  --help                   Show this help

The default profile is 390x844, DPR 2, 4x CPU slowdown, 1.6 Mbps down,
750 Kbps up, 150 ms latency, cache disabled, local gzip HTTP, and software WebGL.
`);
}

function parseArgs(argv) {
  const options = {
    dist: "dist",
    output: path.join("test-results", "performance-audit.json"),
    runs: DEFAULT_RUNS,
    observeMs: DEFAULT_OBSERVE_MS,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    }
    if (!["--dist", "--output", "--runs", "--observe-ms"].includes(arg)) {
      throw new Error(`Unknown argument: ${arg}`);
    }
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) throw new Error(`Expected a value after ${arg}`);
    i += 1;
    if (arg === "--dist") options.dist = value;
    else if (arg === "--output") options.output = value;
    else if (arg === "--runs") options.runs = positiveInteger(value, "--runs");
    else if (arg === "--observe-ms") options.observeMs = positiveInteger(value, "--observe-ms");
  }
  return options;
}

function positiveInteger(value, flag) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`${flag} must be a positive integer`);
  return parsed;
}

function findBrowserExecutable() {
  const customBin = process.env.CHROME_BIN || process.env.BROWSER_PATH;
  if (customBin && fs.existsSync(customBin)) return customBin;

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

  const playwrightCache = path.join(os.homedir(), ".cache", "ms-playwright");
  if (fs.existsSync(playwrightCache)) {
    try {
      for (const entry of fs.readdirSync(playwrightCache)) {
        if (!entry.startsWith("chromium-")) continue;
        const linux = path.join(playwrightCache, entry, "chrome-linux64", "chrome");
        const mac = path.join(playwrightCache, entry, "chrome-mac", "Chromium.app", "Contents", "MacOS", "Chromium");
        if (fs.existsSync(linux)) return linux;
        if (fs.existsSync(mac)) return mac;
      }
    } catch {
      // Ignore an unavailable browser cache and report the ordinary discovery error below.
    }
  }
  throw new Error("No Chromium/Chrome executable found. Set CHROME_BIN or BROWSER_PATH.");
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });
}

function safeStaticServer(distDirectory) {
  const root = fs.realpathSync(distDirectory);
  const server = http.createServer((request, response) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url || "/", "http://127.0.0.1").pathname);
    } catch {
      response.writeHead(400).end("Bad request");
      return;
    }

    if (pathname === "/" || pathname === "") pathname = "/index.html";
    const filePath = path.resolve(root, `.${pathname}`);
    const relative = path.relative(root, filePath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      response.writeHead(403).end("Forbidden");
      return;
    }

    let realFile;
    let stat;
    try {
      realFile = fs.realpathSync(filePath);
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

    const body = fs.readFileSync(realFile);
    const contentType = MIME_TYPES[path.extname(realFile).toLowerCase()] || "application/octet-stream";
    const acceptsGzip = /(?:^|,)\s*gzip\s*(?:,|$)/i.test(request.headers["accept-encoding"] || "");
    const shouldCompress = acceptsGzip && COMPRESSIBLE.test(contentType);
    const payload = shouldCompress ? gzipSync(body, { level: 6 }) : body;
    const headers = {
      "Cache-Control": "no-store",
      "Content-Length": payload.byteLength,
      "Content-Type": contentType,
      "Vary": "Accept-Encoding",
      "X-Content-Type-Options": "nosniff",
    };
    if (shouldCompress) headers["Content-Encoding"] = "gzip";
    response.writeHead(200, headers).end(payload);
  });
  return server;
}

function openWebSocket(url, timeoutMs = CDP_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error("Timed out opening browser debugging connection"));
    }, timeoutMs);
    ws.addEventListener("open", () => {
      clearTimeout(timer);
      resolve(ws);
    }, { once: true });
    ws.addEventListener("error", () => {
      clearTimeout(timer);
      reject(new Error("Could not open browser debugging connection"));
    }, { once: true });
  });
}

function createCdpClient(ws) {
  let nextId = 0;
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }
    if (!message.id || !pending.has(message.id)) return;
    const request = pending.get(message.id);
    pending.delete(message.id);
    clearTimeout(request.timer);
    if (message.error) request.reject(new Error(message.error.message || "CDP request failed"));
    else request.resolve(message.result || {});
  });
  ws.addEventListener("close", () => {
    for (const request of pending.values()) {
      clearTimeout(request.timer);
      request.reject(new Error("Browser debugging connection closed"));
    }
    pending.clear();
  });

  return (method, params = {}) => new Promise((resolve, reject) => {
    if (ws.readyState !== WebSocket.OPEN) {
      reject(new Error("Browser debugging connection is not open"));
      return;
    }
    const id = ++nextId;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP request timed out: ${method}`));
    }, CDP_TIMEOUT_MS);
    pending.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function waitForBrowser(profileDir, processHandle) {
  const activePortFile = path.join(profileDir, "DevToolsActivePort");
  const startedAt = Date.now();
  while (Date.now() - startedAt < BROWSER_START_TIMEOUT_MS) {
    if (processHandle.exitCode !== null) throw new Error(`Browser exited during startup (code ${processHandle.exitCode})`);
    try {
      const port = Number(fs.readFileSync(activePortFile, "utf8").split(/\r?\n/)[0]);
      if (Number.isInteger(port) && port > 0) {
        const response = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(1_000) });
        if (response.ok) {
          const targets = await response.json();
          const page = targets.find((target) => target.type === "page");
          if (page?.webSocketDebuggerUrl) return { port, page };
        }
      }
    } catch {
      // Retry while Chromium starts its local debugging endpoint.
    }
    await delay(100);
  }
  throw new Error("Timed out waiting for Chromium debugging endpoint");
}

const OBSERVER_SCRIPT = `(() => {
  const state = { lcpMs: null, clsSessionWindow: 0, clsSessionCurrent: 0, clsSessionStart: null, clsLastShift: null,
    longTaskCount: 0, longTaskTotalMs: 0, longTaskMaxMs: 0, mapReadyMs: null, shifts: [] };
  Object.defineProperty(window, "__ccPerformanceReview", { value: state, configurable: false });
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) state.lcpMs = entry.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch {}
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.hadRecentInput) continue;
        if (state.shifts.length < 30) state.shifts.push({time_ms:entry.startTime,value:entry.value,
          sources:entry.sources.map(source=>({tag:source.node?.tagName,id:source.node?.id,
            class_name:typeof source.node?.className==='string'?source.node.className:null,
            previous:source.previousRect.toJSON(),current:source.currentRect.toJSON()}))});
        if (state.clsSessionStart === null || entry.startTime - state.clsLastShift >= 1000 || entry.startTime - state.clsSessionStart >= 5000) {
          state.clsSessionStart = entry.startTime;
          state.clsSessionCurrent = 0;
        }
        state.clsSessionCurrent += entry.value;
        state.clsSessionWindow = Math.max(state.clsSessionWindow, state.clsSessionCurrent);
        state.clsLastShift = entry.startTime;
      }
    }).observe({ type: "layout-shift", buffered: true });
  } catch {}
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        state.longTaskCount += 1;
        state.longTaskTotalMs += entry.duration;
        state.longTaskMaxMs = Math.max(state.longTaskMaxMs, entry.duration);
      }
    }).observe({ type: "longtask", buffered: true });
  } catch {}
  const checkReady = () => {
    if (state.mapReadyMs !== null) return;
    const map = document.getElementById("charted-currents-map");
    if (map?.dataset.mapReady === "true") state.mapReadyMs = performance.now();
  };
  new MutationObserver(checkReady).observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-map-ready"] });
  setInterval(checkReady, 100);
})();`;

function classifyResource(entry, sameOrigin) {
  let extension = "other";
  try {
    const pathname = new URL(entry.name).pathname.toLowerCase();
    const suffix = pathname.match(/\.([a-z0-9]+)$/)?.[1];
    if (["js", "mjs"].includes(suffix)) extension = "javascript";
    else if (suffix === "css") extension = "css";
    else if (["woff", "woff2", "ttf", "otf"].includes(suffix)) extension = "font";
    else if (["json", "geojson"].includes(suffix)) extension = "data";
    else if (["png", "jpg", "jpeg", "webp", "avif", "gif", "svg"].includes(suffix)) extension = "image";
    else if (["html", "htm"].includes(suffix)) extension = "document";
  } catch {
    // Keep the coarse category when a browser entry has an unusual URL.
  }
  return { category: extension, sameOrigin };
}

function summarizeResources(entries, localOrigin) {
  const categories = {};
  let timingUnavailable = 0;
  let incompleteEntries = 0;
  let resourceCount = 0;
  for (const entry of entries) {
    let sameOrigin = false;
    try {
      sameOrigin = new URL(entry.name).origin === localOrigin;
    } catch {}
    const { category } = classifyResource(entry, sameOrigin);
    const group = (categories[category] ||= {
      entries: 0,
      same_origin_entries: 0,
      cross_origin_entries: 0,
      transfer_bytes: 0,
      encoded_body_bytes: 0,
      decoded_body_bytes: 0,
      timing_unavailable_entries: 0,
      incomplete_entries: 0,
    });
    group.entries += 1;
    resourceCount += 1;
    if (sameOrigin) group.same_origin_entries += 1;
    else group.cross_origin_entries += 1;
    if (!entry.complete) {
      group.incomplete_entries += 1;
      incompleteEntries += 1;
      continue;
    }
    const timingKnown = sameOrigin || entry.transfer_size > 0 || entry.encoded_body_size > 0 || entry.decoded_body_size > 0;
    if (!timingKnown) {
      group.timing_unavailable_entries += 1;
      timingUnavailable += 1;
      continue;
    }
    group.transfer_bytes += entry.transfer_size || 0;
    group.encoded_body_bytes += entry.encoded_body_size || 0;
    group.decoded_body_bytes += entry.decoded_body_size || 0;
  }
  return {
    resource_count: resourceCount,
    incomplete_entries: incompleteEntries,
    timing_unavailable_entries: timingUnavailable,
    by_category: categories,
  };
}

function sanitizeNavigationError(text) {
  if (!text) return null;
  return String(text).replace(/https?:\/\/[^\s]+/g, "[url]").slice(0, 240);
}

function median(values) {
  if (values.length === 0) return null;
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
}

async function collectRun(send, baseUrl, localOrigin, runNumber, observeMs) {
  await send("Network.clearBrowserCache");
  const navigation = await send("Page.navigate", { url: baseUrl });
  await delay(observeMs);
  const evaluation = await send("Runtime.evaluate", {
    expression: `(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      const state = window.__ccPerformanceReview || {};
      return {
        page: {
          lcp_ms: state.lcpMs,
          cls_session_window: state.clsSessionWindow || 0,
          map_ready_ms: state.mapReadyMs,
          long_task_count: state.longTaskCount || 0,
          long_task_total_ms: state.longTaskTotalMs || 0,
          long_task_max_ms: state.longTaskMaxMs || 0
        },
        layout_shifts: state.shifts || [],
        navigation: nav ? {
          complete: nav.loadEventEnd > 0,
          dom_content_loaded_ms: nav.domContentLoadedEventEnd || null,
          load_event_ms: nav.loadEventEnd || null,
          response_start_ms: nav.responseStart,
          transfer_size: nav.transferSize,
          encoded_body_size: nav.encodedBodySize,
          decoded_body_size: nav.decodedBodySize
        } : null,
        resources: performance.getEntriesByType("resource").map((entry) => ({
          name: entry.name,
          initiator_type: entry.initiatorType,
          transfer_size: entry.transferSize,
          encoded_body_size: entry.encodedBodySize,
          decoded_body_size: entry.decodedBodySize,
          complete: entry.responseEnd > 0
        }))
      };
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  const value = evaluation?.result?.value;
  if (!value) throw new Error(`No performance data returned for run ${runNumber}`);
  return {
    run: runNumber,
    observed_ms: observeMs,
    navigation_error: sanitizeNavigationError(navigation.errorText),
    metrics: value.page,
    navigation: value.navigation,
    resources: summarizeResources(value.resources || [], localOrigin),
    layout_shifts: value.layout_shifts,
  };
}

// Separate cold navigations keep on-demand record requests out of initial-load
// accounting. Read projected geometry, then use native pointer input to prove
// that a visible published feature actually selects and its record renders.
async function collectSelectableRun(send, baseUrl, runNumber) {
  await send("Network.clearBrowserCache");
  await send("Page.navigate", { url: baseUrl });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true });
    if (result.exceptionDetails) throw new Error("Selectable-map probe evaluation failed");
    return result.result.value;
  };
  const started = Date.now();
  let target = null;
  while (Date.now() - started < 30_000 && !target) {
    target = await evaluate(`(() => {
      const map = window.__CC_MAP__;
      if (!map?.getLayer('historical-ports-core')) return null;
      const canvas = map.getCanvas(), bounds = canvas.getBoundingClientRect();
      for (const feature of map.queryRenderedFeatures({layers:['historical-ports-core']})) {
        if (feature.geometry.type !== 'Point') continue;
        const point = map.project(feature.geometry.coordinates);
        const x = bounds.x + point.x, y = bounds.y + point.y;
        if (document.elementFromPoint(x,y) !== canvas) continue;
        const hit = map.queryRenderedFeatures(point,{layers:['historical-ports-hit-target']})[0];
        if (!hit) continue;
        return {x,y,id:String(hit.properties.id),available_ms:performance.now()};
      }
      return null;
    })()`);
    if (!target) await delay(50);
  }
  if (!target) return { run: runNumber, selected_ms: null, record_ready_ms: null, failure: "No unobscured rendered port within 30 seconds" };
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: target.x, y: target.y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: target.x, y: target.y, button: "left", clickCount: 1 });
  let selectedMs = null;
  let recordReadyMs = null;
  while (Date.now() - started < 45_000) {
    const state = await evaluate(`(() => {
      const selected = window.__CC_SELECTION_STORE__?.get();
      const content = document.getElementById('inspector-content');
      return {matches:selected?.kind==='port' && selected.id===${JSON.stringify(target.id)},
        ready:content?.getAttribute('aria-busy')!=='true' && !document.querySelector('[data-view-place]')?.hidden,
        now:performance.now()};
    })()`);
    if (state.matches && selectedMs === null) selectedMs = state.now;
    if (state.matches && state.ready) { recordReadyMs = state.now; break; }
    await delay(50);
  }
  return { run: runNumber, feature_available_ms: target.available_ms, selected_ms: selectedMs,
    record_ready_ms: recordReadyMs, failure: recordReadyMs === null ? "Native selection or record rendering timed out" : null,
    ...(recordReadyMs === null ? {observed_selection:await evaluate('window.__CC_SELECTION_STORE__?.get() || null')} : {}) };
}

async function stopProcess(child) {
  if (!child || child.exitCode !== null || child.killed) return;
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    delay(2_000),
  ]);
  if (child.exitCode === null) child.kill("SIGKILL");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const distDirectory = path.resolve(options.dist);
  if (!fs.existsSync(distDirectory) || !fs.statSync(distDirectory).isDirectory()) {
    throw new Error(`Static build directory not found: ${options.dist}. Run 'npm run build' first.`);
  }
  const distRealPath = fs.realpathSync(distDirectory);
  const browserPath = findBrowserExecutable();
  const server = safeStaticServer(distRealPath);
  const serverPort = await getAvailablePort();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(serverPort, "127.0.0.1", resolve);
  });

  const baseUrl = `http://127.0.0.1:${serverPort}/`;
  const localOrigin = new URL(baseUrl).origin;
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "cc-performance-"));
  const browser = spawn(browserPath, [
    "--headless=new",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--remote-debugging-address=127.0.0.1",
    "--remote-debugging-port=0",
    `--user-data-dir=${profileDir}`,
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--enable-webgl",
    "about:blank",
  ], { stdio: "ignore" });
  let ws;

  try {
    const { page } = await waitForBrowser(profileDir, browser);
    ws = await openWebSocket(page.webSocketDebuggerUrl);
    const send = createCdpClient(ws);
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Network.enable");
    await send("Network.setCacheDisabled", { cacheDisabled: true });
    await send("Network.setBypassServiceWorker", { bypass: true });
    await send("Emulation.setDeviceMetricsOverride", {
      width: PROFILE.width,
      height: PROFILE.height,
      deviceScaleFactor: PROFILE.deviceScaleFactor,
      mobile: true,
    });
    await send("Emulation.setCPUThrottlingRate", { rate: PROFILE.cpuSlowdownRate });
    await send("Network.emulateNetworkConditions", {
      offline: false,
      latency: PROFILE.latencyMs,
      downloadThroughput: PROFILE.downloadBytesPerSecond,
      uploadThroughput: PROFILE.uploadBytesPerSecond,
    });
    await send("Page.addScriptToEvaluateOnNewDocument", { source: OBSERVER_SCRIPT });
    await send("Page.addScriptToEvaluateOnNewDocument", { source: "window.__ENABLE_MAP_TEST_HARNESS__=true" });

    const browserVersion = await send("Browser.getVersion");
    const runs = [];
    console.log(`Performance review: ${options.runs} cold run(s), ${options.observeMs} ms each; browser version recorded; URLs omitted from report.`);
    for (let runNumber = 1; runNumber <= options.runs; runNumber += 1) {
      const result = await collectRun(send, baseUrl, localOrigin, runNumber, options.observeMs);
      runs.push(result);
      console.log(`Run ${runNumber}/${options.runs}: LCP ${result.metrics.lcp_ms ?? "unavailable"} ms; CLS ${result.metrics.cls_session_window}; map-ready proxy ${result.metrics.map_ready_ms ?? "unavailable"} ms`);
    }

    const selectableRuns = [];
    for (let runNumber = 1; runNumber <= options.runs; runNumber += 1) {
      const result = await collectSelectableRun(send, baseUrl, runNumber);
      selectableRuns.push(result);
      console.log(`Native selection ${runNumber}/${options.runs}: selected ${result.selected_ms ?? "unavailable"} ms; record ${result.record_ready_ms ?? "unavailable"} ms`);
    }

    const numericMedian = (getter) => median(runs.map(getter).filter((value) => Number.isFinite(value)));

    const report = {
      generated_at: new Date().toISOString(),
      kind: "local_lab_diagnostic",
      browser: browserVersion.product,
      build_index_sha256: createHash("sha256").update(fs.readFileSync(path.join(distRealPath, "index.html"))).digest("hex"),
      profile: {
        ...PROFILE,
        viewport: `${PROFILE.width}x${PROFILE.height}`,
        cold_loads: true,
        browser_cache_disabled: true,
        service_worker_bypass: true,
        local_http_gzip: true,
        graphics: "software WebGL (SwiftShader)",
        observation_window_ms: options.observeMs,
      },
      definitions: {
        lcp_ms: "Largest Contentful Paint observed during the fixed per-run window; local lab metric, not a field Core Web Vital.",
        cls_session_window: "Maximum session-window CLS: shifts without recent input are grouped when gaps are under 1 second and the window is under 5 seconds.",
        map_ready_ms: "App-specific map-ready signal from #charted-currents-map[data-map-ready=true]; a readiness proxy, not proof that a user can select a feature.",
        selectable_map: "Separate cache-disabled navigations under the same profile: poll an unobscured rendered published port every 50 ms, dispatch native pointer input, then observe matching selection and a rendered place record. selected_ms includes probe/input transport and polling overhead; record_ready_ms also includes deferred record transfer/rendering. These navigations are excluded from initial payload and LCP accounting.",
        interaction_responsiveness: "Not measured by this script; no field INP claim is made.",
        resource_accounting: "Completed same-origin resources use Resource Timing transferSize, encodedBodySize, and decodedBodySize. transferSize includes response headers. In-flight resources are counted separately. Cross-origin timing may be unavailable unless the remote response permits Timing-Allow-Origin; unavailable entries are counted and their URLs are never written.",
      },
      summary: {
        lcp_median_ms: numericMedian((run) => run.metrics.lcp_ms),
        cls_session_window_median: numericMedian((run) => run.metrics.cls_session_window),
        map_ready_proxy_median_ms: numericMedian((run) => run.metrics.map_ready_ms),
        selectable_map_median_ms: median(selectableRuns.map(run => run.selected_ms).filter(Number.isFinite)),
        selected_record_ready_median_ms: median(selectableRuns.map(run => run.record_ready_ms).filter(Number.isFinite)),
      },
      runs,
      selectable_runs: selectableRuns,
    };
    const outputPath = path.resolve(options.output);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(`Wrote local performance report (${runs.length} run(s)).`);
  } finally {
    if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    await stopProcess(browser);
    await new Promise((resolve) => server.close(resolve));
    try { fs.rmSync(profileDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }); }
    catch { console.warn("Temporary browser profile cleanup incomplete; measurement report preserved."); }
  }
}

main().catch((error) => {
  console.error(`Performance review failed: ${error.message}`);
  process.exitCode = 1;
});
