#!/usr/bin/env node
/**
 * scripts/quality-audit.mjs
 *
 * Automated Product Quality, Accessibility, and Layout Geometry Audit Harness.
 * Leverages native Chrome DevTools Protocol (CDP) and injects axe-core in-page.
 *
 * Usage:
 *   node scripts/quality-audit.mjs --ci-mode       # Fast CI run (2 viewports, a11y, layout, journeys; <30s)
 *   node scripts/quality-audit.mjs --full          # Full review (5 viewports, a11y, layout, journeys, 7 screenshots)
 *   node scripts/quality-audit.mjs --a11y-only     # Targeted accessibility scan only
 */

import http from "node:http";
import net from "node:net";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, execSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(path.join(process.cwd(), "package.json"));

// Parse CLI flags
const args = process.argv.slice(2);
const isFullMode = args.includes("--full");
const isA11yOnly = args.includes("--a11y-only");

// Viewports configuration
const VIEWPORTS = isFullMode
  ? [
      { name: "mobile_compact", width: 390, height: 844, dsf: 2, mobile: true },
      { name: "mobile_standard", width: 430, height: 932, dsf: 2, mobile: true },
      { name: "tablet_small_desktop", width: 1024, height: 768, dsf: 1, mobile: false },
      { name: "standard_desktop", width: 1440, height: 900, dsf: 1, mobile: false },
      { name: "ultrawide", width: 3440, height: 1440, dsf: 1, mobile: false },
    ]
  : [
      { name: "standard_desktop", width: 1440, height: 900, dsf: 1, mobile: false },
      { name: "mobile_compact", width: 390, height: 844, dsf: 2, mobile: true },
    ];

function findBrowserExecutable() {
  const customBin = process.env.CHROME_BIN || process.env.BROWSER_PATH;
  if (customBin && fs.existsSync(customBin)) return customBin;

  const candidatePaths = [
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

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) return candidate;
  }

  const home = os.homedir();
  const playwrightCache = path.join(home, ".cache", "ms-playwright");
  if (fs.existsSync(playwrightCache)) {
    try {
      const entries = fs.readdirSync(playwrightCache);
      for (const entry of entries) {
        if (entry.startsWith("chromium-")) {
          const linuxChrome = path.join(playwrightCache, entry, "chrome-linux64", "chrome");
          if (fs.existsSync(linuxChrome)) return linuxChrome;
          const macChrome = path.join(playwrightCache, entry, "chrome-mac", "Chromium.app", "Contents", "MacOS", "Chromium");
          if (fs.existsSync(macChrome)) return macChrome;
        }
      }
    } catch {}
  }

  throw new Error("No Chromium/Chrome executable found on this system.");
}

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

const distDir = path.resolve("dist");
if (!fs.existsSync(distDir)) {
  throw new Error("dist directory does not exist. Run 'npm run build' first.");
}

const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".json": "application/json",
  ".geojson": "application/geo+json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
};

const server = http.createServer((req, res) => {
  let reqPath = (req.url || "/").split("?")[0];
  if (reqPath === "/" || reqPath === "") reqPath = "/index.html";
  const filePath = path.normalize(path.join(distDir, reqPath));
  const relative = path.relative(distDir, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(fs.readFileSync(filePath));
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

async function main() {
  const startTime = Date.now();
  console.log(`\n==================================================`);
  console.log(`CHARTED CURRENTS QUALITY AUDIT HARNESS`);
  console.log(`Mode: ${isFullMode ? "FULL REVIEW" : isA11yOnly ? "A11Y ONLY" : "FAST CI"}`);
  console.log(`Viewports: ${VIEWPORTS.map((v) => `${v.name} (${v.width}x${v.height})`).join(", ")}`);
  console.log(`==================================================\n`);

  // Load a11y baseline
  const baselinePath = path.resolve("tests", "a11y-baseline.json");
  let baseline = null;
  if (fs.existsSync(baselinePath)) {
    baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
    console.log(`Loaded baseline from tests/a11y-baseline.json (commit: ${baseline.baseline_commit?.slice(0, 8)})`);
  } else {
    console.warn(`[WARN] tests/a11y-baseline.json not found; defaulting to strict zero-tolerance.`);
  }

  let headCommitSha = "unknown";
  try {
    headCommitSha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {}

  const serverPort = await getAvailablePort();
  await new Promise((resolve) => server.listen(serverPort, "127.0.0.1", resolve));
  const baseUrl = `http://127.0.0.1:${serverPort}/`;

  const chromePath = findBrowserExecutable();
  const debugPort = await getAvailablePort();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cc-qa-"));
  const proc = spawn(chromePath, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    `--user-data-dir=${userDataDir}`,
    "--remote-debugging-address=127.0.0.1",
    `--remote-debugging-port=${debugPort}`,
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-webgl",
    "--hide-scrollbars",
    "about:blank",
  ]);

  let procExitCode = null;
  proc.on("exit", (code) => {
    procExitCode = code;
  });

  const auditReport = {
    timestamp: new Date().toISOString(),
    commit_sha: headCommitSha,
    mode: isFullMode ? "full" : isA11yOnly ? "a11y_only" : "ci_mode",
    summary: {
      critical_a11y: 0,
      serious_a11y: 0,
      allowed_serious_a11y: 0,
      unallowed_serious_a11y: 0,
      moderate_a11y: 0,
      minor_a11y: 0,
      layout_failures: 0,
      journeys_passed: 0,
      journeys_failed: 0,
    },
    viewports: [],
    a11y_states: [],
    layout_results: [],
    journeys: [],
  };

  let testFailures = 0;

  try {
    let targets = null;
    const connStart = Date.now();
    while (Date.now() - connStart < 20000) {
      if (procExitCode !== null) {
        throw new Error(`Chrome exited prematurely with code ${procExitCode}`);
      }
      try {
        const listRes = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
        if (listRes.ok) {
          targets = await listRes.json();
          if (Array.isArray(targets) && targets.length > 0) break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 150));
    }

    if (!targets || targets.length === 0) {
      throw new Error(`Unable to connect to Chrome debugging target on port ${debugPort}`);
    }

    const pageTarget = targets.find((t) => t.type === "page") || targets[0];
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((r) => (ws.onopen = r));

    const uncaughtExceptions = [];
    ws.addEventListener("message", (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.method === "Runtime.exceptionThrown") {
          const details = msg.params?.exceptionDetails;
          const text = details?.exception?.description || details?.text || "Unknown runtime exception";
          const url = details?.url || "";
          const line = details?.lineNumber || 0;
          console.error(`  [CDP UNCAUGHT EXCEPTION] ${text} at ${url}:${line}`);
          uncaughtExceptions.push({ text, url, line, details });
        }
      } catch {}
    });

    const send = (method, params = {}) =>
      new Promise((res, rej) => {
        const id = Math.floor(Math.random() * 1000000);
        const handler = (evt) => {
          const data = JSON.parse(evt.data);
          if (data.id === id) {
            ws.removeEventListener("message", handler);
            if (data.error) rej(new Error(data.error.message));
            else res(data.result);
          }
        };
        ws.addEventListener("message", handler);
        ws.send(JSON.stringify({ id, method, params }));
      });

    const sendKey = async (key, code, windowsVirtualKeyCode, shiftKey = false) => {
      const text = key === "Enter" ? "\r" : key === " " ? " " : undefined;
      await send("Input.dispatchKeyEvent", {
        type: "rawKeyDown",
        key,
        code,
        windowsVirtualKeyCode,
        modifiers: shiftKey ? 8 : 0,
        text,
        unmodifiedText: text,
      });
      await send("Input.dispatchKeyEvent", {
        type: "keyUp",
        key,
        code,
        windowsVirtualKeyCode,
        modifiers: shiftKey ? 8 : 0,
      });
      await new Promise((r) => setTimeout(r, 80));
    };

    await send("Page.enable");
    await send("Runtime.enable");
    await send("Page.addScriptToEvaluateOnNewDocument", {
      source: "window.__ENABLE_MAP_TEST_HARNESS__ = true;",
    });

    // Set standard viewport
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await send("Page.navigate", { url: baseUrl });

    // Wait for map ready
    const mapStart = Date.now();
    let mapReady = false;
    while (Date.now() - mapStart < 15000) {
      const evalRes = await send("Runtime.evaluate", {
        expression: `Boolean(document.getElementById("charted-currents-map")?.dataset.mapReady === "true" && document.getElementById("charted-currents-map")?.dataset.mapIdle === "true")`,
        returnByValue: true,
      });
      if (evalRes?.result?.value === true) {
        mapReady = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 150));
    }
    if (!mapReady) {
      throw new Error("MapLibre map failed to reach ready and idle state within timeout (15000ms)");
    }
    console.log(`Map loaded & idle: YES`);

    // Load axe-core source
    const axePath = require.resolve("axe-core/axe.min.js");
    const axeSource = fs.readFileSync(axePath, "utf8");

    // Screenshot helper
    const screenshotDir = path.resolve("test-results", "screenshots");
    if (isFullMode) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    async function captureScreenshot(filename) {
      if (!isFullMode) return;
      const res = await send("Page.captureScreenshot", { format: "png" });
      if (res?.data) {
        const outPath = path.join(screenshotDir, filename);
        fs.writeFileSync(outPath, Buffer.from(res.data, "base64"));
        console.log(`  [SCREENSHOT] Saved test-results/screenshots/${filename}`);
      }
    }

    // ----------------------------------------------------
    // 1. ACCESSIBILITY AUDIT (6 UI States)
    // ----------------------------------------------------
    console.log(`\n--- 1. Accessibility Scan (WCAG 2.1 AA via axe-core) ---`);

    async function runAxeScan(stateName, stateId) {
      await send("Runtime.evaluate", { expression: axeSource });
      const evalRes = await send("Runtime.evaluate", {
        expression: `
          axe.run(document, {
            runOnly: {
              type: 'tag',
              values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
            }
          }).then(r => JSON.stringify(r.violations))
        `,
        awaitPromise: true,
        returnByValue: true,
      });

      const violations = JSON.parse(evalRes.result.value || "[]");
      const summary = { critical: 0, serious: 0, moderate: 0, minor: 0 };
      const unallowedSerious = [];
      const allowedSerious = [];

      for (const v of violations) {
        summary[v.impact] = (summary[v.impact] || 0) + 1;
        if (v.impact === "serious") {
          // Check if matches baseline allowed rules
          const isAllowed = baseline?.allowed_serious_rules?.some((rule) => {
            if (rule.rule_id !== v.id) return false;
            const allowedStates = rule.allowed_states || rule.states;
            if (allowedStates && !allowedStates.includes(stateId)) return false;
            if (typeof rule.allowed_occurrences === "number" && v.nodes.length > rule.allowed_occurrences) return false;
            // Check if all nodes match the allowed selector pattern
            return v.nodes.every((node) =>
              node.target.some((sel) => sel.includes(rule.target_selector_pattern))
            );
          });
          if (isAllowed) {
            allowedSerious.push(v);
          } else {
            unallowedSerious.push(v);
          }
        }
      }

      auditReport.summary.critical_a11y += summary.critical;
      auditReport.summary.serious_a11y += summary.serious;
      auditReport.summary.allowed_serious_a11y += allowedSerious.length;
      auditReport.summary.unallowed_serious_a11y += unallowedSerious.length;
      auditReport.summary.moderate_a11y += summary.moderate;
      auditReport.summary.minor_a11y += summary.minor;

      const stateReport = {
        state_id: stateId,
        state_name: stateName,
        summary,
        violations: violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes_count: v.nodes.length,
          targets: v.nodes.map((n) => n.target.join(", ")),
        })),
        unallowed_serious: unallowedSerious.map((v) => v.id),
      };
      auditReport.a11y_states.push(stateReport);

      const passState = summary.critical === 0 && unallowedSerious.length === 0;
      if (!passState) testFailures++;

      console.log(
        `  ${passState ? "[PASS]" : "[FAIL]"} ${stateName}: Critical=${summary.critical}, Serious=${summary.serious} (${allowedSerious.length} allowed baseline, ${unallowedSerious.length} new), Moderate=${summary.moderate}, Minor=${summary.minor}`
      );
      if (unallowedSerious.length > 0) {
        for (const uv of unallowedSerious) {
          console.error(`    [NEW SERIOUS VIOLATION] ${uv.id}: ${uv.description}`);
          for (const n of uv.nodes) {
            console.error(`      Target: ${n.target.join(", ")}`);
          }
        }
      }
      return stateReport;
    }

    // State 1: Initial Application
    await runAxeScan("Initial application state", "state_1_initial");
    await captureScreenshot("initial-state-1440x900.png");

    // State 2: Place Locator open
    await send("Runtime.evaluate", {
      expression: `document.querySelector('[data-locator-toggle]')?.click()`,
    });
    await new Promise((r) => setTimeout(r, 400));
    await runAxeScan("Place Locator open", "state_2_locator");
    await captureScreenshot("place-locator-open-1440x900.png");

    // Close locator
    await send("Runtime.evaluate", {
      expression: `document.querySelector('[data-locator-toggle]')?.click()`,
    });
    await new Promise((r) => setTimeout(r, 250));

    // State 3: Entity Inspector open (select Jamaica)
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btn = document.querySelector('[data-locator-toggle]');
          btn?.click();
          setTimeout(() => {
            const item = document.querySelector('[data-place-id="place_jamaica"]');
            item?.click();
          }, 100);
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 600));
    await runAxeScan("Entity Inspector open", "state_3_inspector");
    await captureScreenshot("inspector-open-1440x900.png");

    // State 4: Source Drawer open
    await send("Runtime.evaluate", {
      expression: `document.querySelector('[data-place-evidence-btn]')?.click() || document.querySelector('[data-open-place-source]')?.click()`,
    });
    await new Promise((r) => setTimeout(r, 500));
    await runAxeScan("Source Drawer open", "state_4_drawer");
    await captureScreenshot("source-drawer-open-1440x900.png");

    // Close drawer via close button
    await send("Runtime.evaluate", {
      expression: `document.querySelector('[data-source-drawer-close]')?.click()`,
    });
    await new Promise((r) => setTimeout(r, 300));

    // State 5: Period Map Active
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btn = document.querySelector('[data-layer-toggle]');
          btn?.click();
          setTimeout(() => {
            const cb = document.querySelector('[data-layer-visibility-checkbox]');
            if (cb && !cb.checked) cb.click();
          }, 150);
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 700));
    await runAxeScan("Period Map Active", "state_5_period_map");
    await captureScreenshot("period-map-active-1440x900.png");

    // Turn off period map
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const cb = document.querySelector('[data-layer-visibility-checkbox]');
          if (cb && cb.checked) cb.click();
          const closeBtn = document.querySelector('[data-layer-panel-close]');
          closeBtn?.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 300));

    // State 6: Representative Mobile State (390x844)
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await new Promise((r) => setTimeout(r, 400));
    await captureScreenshot("mobile-overview-390x844.png");

    // Open mobile inspector for Port Royal
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btn = document.querySelector('[data-locator-toggle]');
          btn?.click();
          setTimeout(() => {
            const item = document.querySelector('[data-place-id="place_port_royal"]');
            item?.click();
          }, 100);
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 600));
    await runAxeScan("Representative Mobile State", "state_6_mobile");
    await captureScreenshot("mobile-inspector-390x844.png");

    // Close inspector
    await send("Runtime.evaluate", {
      expression: `document.querySelector('[data-inspector-close]')?.click()`,
    });
    await new Promise((r) => setTimeout(r, 250));
    await captureScreenshot("mobile-timeline-390x844.png");

    // Open locator menu on mobile
    await send("Runtime.evaluate", {
      expression: `document.querySelector('[data-locator-toggle]')?.click()`,
    });
    await new Promise((r) => setTimeout(r, 300));
    await captureScreenshot("mobile-locator-open-390x844.png");

    // Close locator, open period map on mobile
    await send("Runtime.evaluate", {
      expression: `
        document.querySelector('[data-locator-toggle]')?.click();
        document.querySelector('[data-layer-toggle]')?.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 300));
    await captureScreenshot("mobile-period-map-open-390x844.png");

    // Close period map
    await send("Runtime.evaluate", {
      expression: `document.querySelector('[data-layer-toggle]')?.click()`,
    });
    await new Promise((r) => setTimeout(r, 250));

    // Reset to desktop viewport for subsequent layout/journey tests
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await new Promise((r) => setTimeout(r, 300));

    // ----------------------------------------------------
    // 2. GENERIC LAYOUT & GEOMETRY AUDIT
    // ----------------------------------------------------
    if (!isA11yOnly) {
      console.log(`\n--- 2. Generic Layout & Geometry Audit (Multi-State Matrix) ---`);

      const evaluateLayoutInBrowser = `
        (() => {
          const findings = [];
          const winW = window.innerWidth;
          const winH = window.innerHeight;

          // a) Horizontal document overflow (2px tolerance)
          const scrollW = document.documentElement.scrollWidth;
          if (scrollW > winW + 2) {
            findings.push({
              type: "horizontal_overflow",
              detail: \`document scrollWidth (\${scrollW}px) exceeds window innerWidth (\${winW}px) by \${scrollW - winW}px\`
            });
          }

          // b) Major panel boundary clipping
          const panelSelectors = [
            ".app-masthead",
            "[data-component='place-locator']",
            "[data-locator-menu]",
            "[data-component='entity-inspector']",
            "[data-component='source-drawer']",
            ".source-drawer-panel",
            ".map-layer-control",
            "[data-layer-panel]",
            ".maplibregl-ctrl-attrib"
          ];

          for (const sel of panelSelectors) {
            const el = document.querySelector(sel);
            if (el && !el.hidden && getComputedStyle(el).display !== 'none' && el.offsetWidth > 0) {
              const rect = el.getBoundingClientRect();
              if (rect.left < -2) {
                findings.push({
                  type: "panel_bounds_left",
                  selector: sel,
                  detail: \`Panel extends \${Math.abs(rect.left)}px beyond left viewport bound\`
                });
              }
              if (rect.right > winW + 2) {
                findings.push({
                  type: "panel_bounds_right",
                  selector: sel,
                  detail: \`Panel extends \${rect.right - winW}px beyond right viewport bound\`
                });
              }
            }
          }

          // c) Primary controls occlusion check
          const primaryControls = [
            "[data-locator-toggle]",
            "[data-layer-toggle]"
          ];

          for (const sel of primaryControls) {
            const el = document.querySelector(sel);
            if (el && !el.hidden && getComputedStyle(el).display !== 'none' && el.offsetWidth > 0) {
              const rect = el.getBoundingClientRect();
              const cx = Math.floor(rect.left + rect.width / 2);
              const cy = Math.floor(rect.top + rect.height / 2);
              if (cx >= 0 && cx <= winW && cy >= 0 && cy <= winH) {
                const topEl = document.elementFromPoint(cx, cy);
                if (topEl && topEl !== el && !el.contains(topEl)) {
                  const isModalOverlay = Boolean(topEl.closest && topEl.closest("#source-drawer, .source-drawer-backdrop, .dialog-backdrop"));
                  if (!isModalOverlay) {
                    findings.push({
                      type: "control_occluded",
                      selector: sel,
                      detail: \`Control occluded by <\${topEl.tagName.toLowerCase()} class="\${topEl.className}">\`
                    });
                  }
                }
              }
            }
          }

          // d) Zero-size rendered interactive elements
          const interactiveEls = Array.from(document.querySelectorAll("button, a, input, select, textarea"));
          for (const el of interactiveEls) {
            if (el.offsetParent !== null && !el.hidden && !el.closest("[hidden]")) {
              const style = getComputedStyle(el);
              if (style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0") {
                const rect = el.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) {
                  findings.push({
                    type: "zero_size_interactive",
                    selector: el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (el.className ? "." + el.className.split(" ")[0] : ""),
                    detail: \`Interactive element rendered with 0 width or height (\${rect.width}x\${rect.height})\`
                  });
                }
              }
            }
          }

          // e) Unintended content clipping in scroll containers
          const scrollableEls = Array.from(document.querySelectorAll(".inspector-body, .source-drawer-body, .locator-results"));
          for (const el of scrollableEls) {
            if (el.offsetParent !== null) {
              const style = getComputedStyle(el);
              if (el.scrollHeight > el.clientHeight + 2 && (style.overflowY === "hidden" || style.overflowY === "clip")) {
                findings.push({
                  type: "unintended_content_clipping",
                  selector: el.className,
                  detail: \`Container scrollHeight (\${el.scrollHeight}px) exceeds clientHeight (\${el.clientHeight}px) but overflow-y is \${style.overflowY}\`
                });
              }
            }
          }

          return { findings, scrollW, winW };
        })()
      `;

      for (const vp of VIEWPORTS) {
        await send("Emulation.setDeviceMetricsOverride", {
          width: vp.width,
          height: vp.height,
          deviceScaleFactor: vp.dsf,
          mobile: vp.mobile,
        });
        await new Promise((r) => setTimeout(r, 250));

        const vpFindings = [];

        // State A: Initial baseline state
        const resInit = await send("Runtime.evaluate", {
          expression: evaluateLayoutInBrowser,
          returnByValue: true,
        });
        for (const f of resInit?.result?.value?.findings || []) {
          vpFindings.push({ state: "initial", ...f });
        }

        // State B: Entity Inspector open
        await send("Runtime.evaluate", {
          expression: `window.dispatchEvent(new CustomEvent("cc:test-select", { detail: { kind: "place", id: "place_port_royal" } }))`,
        });
        await new Promise((r) => setTimeout(r, 350));
        const resInspector = await send("Runtime.evaluate", {
          expression: evaluateLayoutInBrowser,
          returnByValue: true,
        });
        for (const f of resInspector?.result?.value?.findings || []) {
          vpFindings.push({ state: "inspector_open", ...f });
        }

        // State C: Source Drawer open
        await send("Runtime.evaluate", {
          expression: `document.querySelector('[data-open-ship-source]')?.click() || document.querySelector('[data-place-evidence-btn]')?.click()`,
        });
        await new Promise((r) => setTimeout(r, 350));
        const resDrawer = await send("Runtime.evaluate", {
          expression: evaluateLayoutInBrowser,
          returnByValue: true,
        });
        for (const f of resDrawer?.result?.value?.findings || []) {
          vpFindings.push({ state: "drawer_open", ...f });
        }

        // Close drawer and inspector to restore clean baseline
        await send("Runtime.evaluate", {
          expression: `
            document.querySelector('[data-source-drawer-close]')?.click();
            document.querySelector('[data-inspector-close]')?.click();
          `,
        });
        await new Promise((r) => setTimeout(r, 200));

        // State D: Place Locator open
        await send("Runtime.evaluate", {
          expression: `
            (() => {
              const menu = document.querySelector('[data-locator-menu]');
              if (!menu || menu.hidden) {
                document.querySelector('[data-locator-toggle]')?.click();
              }
            })()
          `,
        });
        await new Promise((r) => setTimeout(r, 250));
        const resLocator = await send("Runtime.evaluate", {
          expression: evaluateLayoutInBrowser,
          returnByValue: true,
        });
        for (const f of resLocator?.result?.value?.findings || []) {
          vpFindings.push({ state: "locator_open", ...f });
        }
        await send("Runtime.evaluate", {
          expression: `
            (() => {
              const menu = document.querySelector('[data-locator-menu]');
              if (menu && !menu.hidden) {
                document.querySelector('[data-locator-toggle]')?.click();
              }
            })()
          `,
        });
        await new Promise((r) => setTimeout(r, 200));

        // State E: Period Map open
        await send("Runtime.evaluate", {
          expression: `
            (() => {
              const panel = document.querySelector('[data-layer-panel]');
              if (!panel || panel.hidden) {
                document.querySelector('[data-layer-toggle]')?.click();
              }
            })()
          `,
        });
        await new Promise((r) => setTimeout(r, 250));
        const resPeriodMap = await send("Runtime.evaluate", {
          expression: evaluateLayoutInBrowser,
          returnByValue: true,
        });
        for (const f of resPeriodMap?.result?.value?.findings || []) {
          vpFindings.push({ state: "period_map_open", ...f });
        }
        await send("Runtime.evaluate", {
          expression: `
            (() => {
              const panel = document.querySelector('[data-layer-panel]');
              if (panel && !panel.hidden) {
                document.querySelector('[data-layer-toggle]')?.click();
              }
            })()
          `,
        });
        await new Promise((r) => setTimeout(r, 200));

        const passVp = vpFindings.length === 0;
        if (!passVp) {
          testFailures += vpFindings.length;
          auditReport.summary.layout_failures += vpFindings.length;
        }

        auditReport.layout_results.push({
          viewport: vp.name,
          dimensions: `${vp.width}x${vp.height}`,
          passed: passVp,
          findings: vpFindings,
        });

        console.log(
          `  ${passVp ? "[PASS]" : "[FAIL]"} Layout check on ${vp.name} (${vp.width}x${vp.height}) across 5 states: ${vpFindings.length} findings`
        );
        for (const f of vpFindings) {
          console.error(`    [LAYOUT FINDING] [${f.state}] [${f.type}] ${f.selector || ""} — ${f.detail}`);
        }
      }

      // Reset to desktop viewport for user journeys
      await send("Emulation.setDeviceMetricsOverride", {
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await new Promise((r) => setTimeout(r, 200));

      // ----------------------------------------------------
      // 3. USER-JOURNEY SMOKE TESTS (4 Journeys)
      // ----------------------------------------------------
      console.log(`\n--- 3. User-Journey Verification (4 Journeys) ---`);

      // Journey 1: Place to Provenance
      console.log("  Running Journey 1: Place to Provenance (Jamaica -> Richard & Sarah -> Source Drawer -> Esc)...");
      let j1Pass = false;
      let j1Error = null;
      try {
        // Open locator
        await send("Runtime.evaluate", { expression: `document.querySelector('[data-locator-toggle]')?.click()` });
        await new Promise((r) => setTimeout(r, 300));

        // Click Jamaica
        await send("Runtime.evaluate", { expression: `document.querySelector('[data-place-id="place_jamaica"]')?.click()` });
        await new Promise((r) => setTimeout(r, 500));

        // Verify Jamaica in inspector
        const checkJamaica = await send("Runtime.evaluate", {
          expression: `document.querySelector('[data-inspector-title]')?.textContent.includes("Jamaica")`,
          returnByValue: true,
        });
        if (!checkJamaica?.result?.value) throw new Error("Jamaica not rendered in inspector title");

        // Click Richard & Sarah in connections list
        const clickShip = await send("Runtime.evaluate", {
          expression: `
            (() => {
              const shipBtn = document.querySelector('[data-place-connections-list] [data-selection-id="ship_richard_and_sarah_1705"]') ||
                              document.querySelector('[data-selection-id="ship_richard_and_sarah_1705"]');
              if (shipBtn) {
                shipBtn.click();
                return true;
              }
              return false;
            })()
          `,
          returnByValue: true,
        });
        if (!clickShip?.result?.value) throw new Error("Could not find Richard & Sarah in Jamaica connections list");
        await new Promise((r) => setTimeout(r, 500));

        // Verify Richard & Sarah title and privateering section
        const checkShip = await send("Runtime.evaluate", {
          expression: `
            (() => {
              const title = document.querySelector('[data-inspector-title]')?.textContent || "";
              const privSec = document.querySelector('[data-ship-privateering-section]');
              const privVisible = privSec && !privSec.hidden && getComputedStyle(privSec).display !== 'none';
              const hasAction = Boolean(document.querySelector('[data-privateering-engagement]')?.textContent);
              const linkageState = document.querySelector('[data-privateering-linkage-state]')?.textContent || "";
              const hasProbable = linkageState.toLowerCase().includes("probable");
              return title.includes("Richard & Sarah") && privVisible && hasAction && hasProbable;
            })()
          `,
          returnByValue: true,
        });
        if (!checkShip?.result?.value) throw new Error("Richard & Sarah privateering details or probable-match linkage not rendered in inspector");

        // 1. First verification: Click privateering evidence button
        const clickPrivBtn = await send("Runtime.evaluate", {
          expression: `
            (() => {
              const btn = document.querySelector('[data-privateering-evidence-btn]');
              if (btn) {
                btn.click();
                return true;
              }
              return false;
            })()
          `,
          returnByValue: true,
        });
        if (!clickPrivBtn?.result?.value) throw new Error("Could not find or click [data-privateering-evidence-btn]");
        await new Promise((r) => setTimeout(r, 400));

        // Verify drawer open and contains CO 138/11 AND Calendar of State Papers
        const checkDrawerPriv = await send("Runtime.evaluate", {
          expression: `
            (() => {
              const drawer = document.getElementById("source-drawer");
              const isOpen = drawer && !drawer.hidden && drawer.getAttribute("data-state") === "open";
              const content = drawer?.textContent || "";
              const hasCO = content.includes("CO 138/11") || content.includes("CO 138");
              const hasCSP = content.includes("Calendar of State Papers") || content.includes("CSP Colonial");
              return { isOpen, hasCO, hasCSP };
            })()
          `,
          returnByValue: true,
        });
        const privRes = checkDrawerPriv?.result?.value;
        if (!privRes?.isOpen) throw new Error("Source drawer did not open from privateering evidence button");
        if (!privRes?.hasCO) throw new Error("Source drawer does not cite CO 138/11 for privateering encounter");
        if (!privRes?.hasCSP) throw new Error("Source drawer does not cite Calendar of State Papers for privateering encounter");

        // Close drawer with Escape
        await sendKey("Escape", "Escape", 27);
        await new Promise((r) => setTimeout(r, 300));
        const checkPrivClosed = await send("Runtime.evaluate", {
          expression: `Boolean(document.getElementById("source-drawer")?.hidden || document.getElementById("source-drawer")?.getAttribute("data-state") === "closed")`,
          returnByValue: true,
        });
        if (!checkPrivClosed?.result?.value) throw new Error("Source drawer did not close on Escape after privateering check");

        // 2. Second verification: Click ship evidence button
        const clickShipBtn = await send("Runtime.evaluate", {
          expression: `
            (() => {
              const btn = document.querySelector('[data-ship-evidence-btn]');
              if (btn) {
                btn.click();
                return true;
              }
              return false;
            })()
          `,
          returnByValue: true,
        });
        if (!clickShipBtn?.result?.value) throw new Error("Could not find or click [data-ship-evidence-btn]");
        await new Promise((r) => setTimeout(r, 400));

        // Verify drawer open and contains HCA 32/80 AND international maritime labour market
        const checkDrawerShip = await send("Runtime.evaluate", {
          expression: `
            (() => {
              const drawer = document.getElementById("source-drawer");
              const isOpen = drawer && !drawer.hidden && drawer.getAttribute("data-state") === "open";
              const content = drawer?.textContent || "";
              const hasHCA = content.includes("HCA 32/80") || content.includes("HCA 32");
              const hasIMLM = content.includes("international maritime labour market") || content.includes("SN 852135") || content.includes("IMLM");
              return { isOpen, hasHCA, hasIMLM };
            })()
          `,
          returnByValue: true,
        });
        const shipRes = checkDrawerShip?.result?.value;
        if (!shipRes?.isOpen) throw new Error("Source drawer did not open from ship evidence button");
        if (!shipRes?.hasHCA) throw new Error("Source drawer does not cite HCA 32/80 for ship provenance");
        if (!shipRes?.hasIMLM) throw new Error("Source drawer does not cite IMLM for ship provenance");

        // Close drawer with Escape
        await sendKey("Escape", "Escape", 27);
        await new Promise((r) => setTimeout(r, 300));
        const checkShipClosed = await send("Runtime.evaluate", {
          expression: `Boolean(document.getElementById("source-drawer")?.hidden || document.getElementById("source-drawer")?.getAttribute("data-state") === "closed")`,
          returnByValue: true,
        });
        if (!checkShipClosed?.result?.value) throw new Error("Source drawer did not close on Escape after ship provenance check");

        j1Pass = true;
      } catch (err) {
        j1Error = err.message;
      }

      if (j1Pass) {
        auditReport.summary.journeys_passed++;
        console.log("  [PASS] Journey 1: Place to Provenance passed.");
      } else {
        auditReport.summary.journeys_failed++;
        testFailures++;
        console.error(`  [FAIL] Journey 1: Place to Provenance failed: ${j1Error}`);
      }
      auditReport.journeys.push({ id: "journey_1_place_to_provenance", passed: j1Pass, error: j1Error });

      // Close inspector before Journey 2
      await send("Runtime.evaluate", { expression: `document.querySelector('[data-inspector-close]')?.click()` });
      await new Promise((r) => setTimeout(r, 200));

      // Journey 2: Temporal Filter & Entity Sync
      console.log("  Running Journey 2: Temporal Filter & Entity Sync...");
      let j2Pass = false;
      let j2Error = null;
      try {
        // Click 1684-1695 filter
        await send("Runtime.evaluate", {
          expression: `document.querySelector('[data-time-filter="1684-1695"]')?.click()`,
        });
        await new Promise((r) => setTimeout(r, 300));

        const checkActive = await send("Runtime.evaluate", {
          expression: `Boolean(document.querySelector('[data-time-filter="1684-1695"]')?.classList.contains("is-active"))`,
          returnByValue: true,
        });
        if (!checkActive?.result?.value) throw new Error("1684-1695 temporal filter did not receive .is-active class");

        // Select an active entity or event from this period
        await send("Runtime.evaluate", {
          expression: `
            (() => {
              const marker = document.querySelector('[data-selection-id="event_port_royal_earthquake_1692"]');
              marker?.click();
            })()
          `,
        });
        await new Promise((r) => setTimeout(r, 300));

        // Clear filter
        await send("Runtime.evaluate", {
          expression: `document.querySelector('[data-time-filter="all"]')?.click()`,
        });
        await new Promise((r) => setTimeout(r, 300));

        const checkAll = await send("Runtime.evaluate", {
          expression: `Boolean(document.querySelector('[data-time-filter="all"]')?.classList.contains("is-active"))`,
          returnByValue: true,
        });
        if (!checkAll?.result?.value) throw new Error("All (1650–1730) temporal filter did not restore .is-active class");

        j2Pass = true;
      } catch (err) {
        j2Error = err.message;
      }

      if (j2Pass) {
        auditReport.summary.journeys_passed++;
        console.log("  [PASS] Journey 2: Temporal Filter & Entity Sync passed.");
      } else {
        auditReport.summary.journeys_failed++;
        testFailures++;
        console.error(`  [FAIL] Journey 2: Temporal Filter & Entity Sync failed: ${j2Error}`);
      }
      auditReport.journeys.push({ id: "journey_2_temporal_filter_sync", passed: j2Pass, error: j2Error });

      // Close any open modals
      await send("Runtime.evaluate", { expression: `document.querySelector('[data-inspector-close]')?.click()` });
      await new Promise((r) => setTimeout(r, 200));

      // Journey 3: Period Map Lifecycle
      console.log("  Running Journey 3: Period Map Lifecycle...");
      let j3Pass = false;
      let j3Error = null;
      try {
        // Open Period Map Panel
        await send("Runtime.evaluate", { expression: `document.querySelector('[data-layer-toggle]')?.click()` });
        await new Promise((r) => setTimeout(r, 300));

        const checkPanelOpen = await send("Runtime.evaluate", {
          expression: `
            (() => {
              const panel = document.querySelector('[data-layer-panel]');
              return panel && !panel.hidden && getComputedStyle(panel).display !== 'none';
            })()
          `,
          returnByValue: true,
        });
        if (!checkPanelOpen?.result?.value) throw new Error("Period map panel did not open");

        // Toggle map ON
        await send("Runtime.evaluate", { expression: `document.querySelector('[data-layer-visibility-checkbox]')?.click()` });
        await new Promise((r) => setTimeout(r, 500));

        const checkLayerOn = await send("Runtime.evaluate", {
          expression: `Boolean(window.__CC_MAP__?.getLayer("historical-reference-moll-1715-layer"))`,
          returnByValue: true,
        });
        if (!checkLayerOn?.result?.value) throw new Error("MapLibre layer 'historical-reference-moll-1715-layer' not added to style");

        // Adjust opacity slider to 55%
        await send("Runtime.evaluate", {
          expression: `
            (() => {
              const slider = document.querySelector('[data-layer-opacity-slider]');
              if (slider) {
                slider.value = "55";
                slider.dispatchEvent(new Event("input", { bubbles: true }));
                slider.dispatchEvent(new Event("change", { bubbles: true }));
              }
            })()
          `,
        });
        await new Promise((r) => setTimeout(r, 200));

        const checkOpacity = await send("Runtime.evaluate", {
          expression: `window.__CC_MAP__?.getPaintProperty("historical-reference-moll-1715-layer", "raster-opacity")`,
          returnByValue: true,
        });
        if (Math.abs((checkOpacity?.result?.value || 0) - 0.55) > 0.01) {
          throw new Error(`Raster opacity did not update to 0.55 (got ${checkOpacity?.result?.value})`);
        }

        // Click inspect button
        await send("Runtime.evaluate", { expression: `document.querySelector('[data-layer-inspect-btn]')?.click()` });
        await new Promise((r) => setTimeout(r, 400));

        // Dismiss drawer via Escape
        await sendKey("Escape", "Escape", 27);
        await new Promise((r) => setTimeout(r, 300));

        // Toggle map OFF
        await send("Runtime.evaluate", { expression: `document.querySelector('[data-layer-visibility-checkbox]')?.click()` });
        await new Promise((r) => setTimeout(r, 300));

        const checkLayerOff = await send("Runtime.evaluate", {
          expression: `
            (() => {
              const m = window.__CC_MAP__;
              if (!m) return false;
              const hasLayer = Boolean(m.getLayer("historical-reference-moll-1715-layer"));
              const vis = m.getLayoutProperty("historical-reference-moll-1715-layer", "visibility");
              return !hasLayer || vis === "none";
            })()
          `,
          returnByValue: true,
        });
        if (!checkLayerOff?.result?.value) throw new Error("Period map layer was not removed or set to visibility: none");

        // Close panel
        await send("Runtime.evaluate", { expression: `document.querySelector('[data-layer-panel-close]')?.click()` });
        await new Promise((r) => setTimeout(r, 200));

        j3Pass = true;
      } catch (err) {
        j3Error = err.message;
      }

      if (j3Pass) {
        auditReport.summary.journeys_passed++;
        console.log("  [PASS] Journey 3: Period Map Lifecycle passed.");
      } else {
        auditReport.summary.journeys_failed++;
        testFailures++;
        console.error(`  [FAIL] Journey 3: Period Map Lifecycle failed: ${j3Error}`);
      }
      auditReport.journeys.push({ id: "journey_3_period_map_lifecycle", passed: j3Pass, error: j3Error });

      // Journey 4: Mobile Exploration Flow
      console.log("  Running Journey 4: Mobile Exploration Flow...");
      let j4Pass = false;
      let j4Error = null;
      try {
        await send("Emulation.setDeviceMetricsOverride", {
          width: 390,
          height: 844,
          deviceScaleFactor: 2,
          mobile: true,
        });
        await new Promise((r) => setTimeout(r, 300));

        // Open search locator if not already open
        await send("Runtime.evaluate", {
          expression: `
            (() => {
              const locator = document.querySelector('[data-component="place-locator"]');
              const isClosed = !locator || locator.hidden || getComputedStyle(locator).display === 'none' || locator.getAttribute('data-state') === 'closed';
              if (isClosed) {
                document.querySelector('[data-locator-toggle]')?.click();
              }
            })()
          `,
        });
        await new Promise((r) => setTimeout(r, 350));

        // Select Port Royal
        await send("Runtime.evaluate", {
          expression: `
            (() => {
              const item = document.querySelector('[data-place-id="place_port_royal"]') || document.querySelector('.locator-item');
              item?.click();
            })()
          `,
        });
        await new Promise((r) => setTimeout(r, 600));

        const checkMobileInspector = await send("Runtime.evaluate", {
          expression: `
            (() => {
              const insp = document.querySelector('[data-component="entity-inspector"]');
              const isOpen = insp && !insp.hidden && getComputedStyle(insp).display !== 'none';
              const state = insp?.getAttribute("data-sheet-state") || "";
              return isOpen && (state === "open" || state === "expanded");
            })()
          `,
          returnByValue: true,
        });
        if (!checkMobileInspector?.result?.value) throw new Error("Mobile bottom sheet inspector did not open");

        // Expand sheet handle
        await send("Runtime.evaluate", { expression: `document.querySelector('[data-sheet-handle]')?.click()` });
        await new Promise((r) => setTimeout(r, 300));

        const checkExpanded = await send("Runtime.evaluate", {
          expression: `document.querySelector('[data-component="entity-inspector"]')?.getAttribute("data-sheet-state") === "expanded"`,
          returnByValue: true,
        });
        if (!checkExpanded?.result?.value) throw new Error("Mobile inspector did not transition to 'expanded' sheet state");

        // Close inspector
        await send("Runtime.evaluate", { expression: `document.querySelector('[data-inspector-close]')?.click()` });
        await new Promise((r) => setTimeout(r, 300));

        // Check horizontal overflow (2px tolerance per B1)
        const checkScroll = await send("Runtime.evaluate", {
          expression: `document.documentElement.scrollWidth <= window.innerWidth + 2`,
          returnByValue: true,
        });
        if (!checkScroll?.result?.value) throw new Error("Horizontal overflow detected on mobile viewport after closing inspector");

        j4Pass = true;
      } catch (err) {
        j4Error = err.message;
      }

      if (j4Pass) {
        auditReport.summary.journeys_passed++;
        console.log("  [PASS] Journey 4: Mobile Exploration Flow passed.");
      } else {
        auditReport.summary.journeys_failed++;
        testFailures++;
        console.error(`  [FAIL] Journey 4: Mobile Exploration Flow failed: ${j4Error}`);
      }
      auditReport.journeys.push({ id: "journey_4_mobile_exploration", passed: j4Pass, error: j4Error });

      // ----------------------------------------------------
      // JOURNEY 5: Browse Places Search & Keyboard Navigation
      // ----------------------------------------------------
      console.log("\n  Running Journey 5: Browse Places Search & Keyboard Navigation...");
      let j5Pass = false;
      let j5Error = null;
      try {
        // Step 1: Open locator browser
        await send("Runtime.evaluate", {
          expression: `
            (() => {
              const menu = document.querySelector('[data-locator-menu]');
              if (!menu || menu.hidden) {
                document.querySelector('[data-locator-toggle]')?.click();
              }
            })()
          `,
        });
        await new Promise((r) => setTimeout(r, 200));

        // Step 2: Verify search input exists and initial 29 places
        const initialSearchCheck = await send("Runtime.evaluate", {
          expression: `
            (() => {
              const input = document.querySelector('[data-locator-filter-input]');
              const count = document.querySelector('[data-locator-filter-count]');
              const totalItems = document.querySelectorAll('[data-place-item-wrap]').length;
              return Boolean(input && input.value === "" && totalItems === 29 && count?.textContent?.includes("29"));
            })()
          `,
          returnByValue: true,
        });
        if (!initialSearchCheck?.result?.value) {
          throw new Error("Search input or initial 29 places count not verified");
        }

        // Step 3: Type 'Havana' into search input
        const havanaFilterCheck = await send("Runtime.evaluate", {
          expression: `
            (() => {
              const input = document.querySelector('[data-locator-filter-input]');
              if (!input) return false;
              input.value = "Havana";
              input.dispatchEvent(new Event("input", { bubbles: true }));
              const visibleWraps = Array.from(document.querySelectorAll('[data-place-item-wrap]')).filter(w => !w.hidden);
              const count = document.querySelector('[data-locator-filter-count]');
              const empty = document.querySelector('[data-locator-empty]');
              return visibleWraps.length === 1 && count?.textContent?.includes("1 of 29") && empty?.hidden === true;
            })()
          `,
          returnByValue: true,
        });
        if (!havanaFilterCheck?.result?.value) {
          throw new Error("Filter by 'Havana' did not yield exactly 1 visible place or count mismatch");
        }

        // Step 4: Type non-matching query 'zzzznonexistent'
        const emptyStateCheck = await send("Runtime.evaluate", {
          expression: `
            (() => {
              const input = document.querySelector('[data-locator-filter-input]');
              if (!input) return false;
              input.value = "zzzznonexistent";
              input.dispatchEvent(new Event("input", { bubbles: true }));
              const visibleWraps = Array.from(document.querySelectorAll('[data-place-item-wrap]')).filter(w => !w.hidden);
              const count = document.querySelector('[data-locator-filter-count]');
              const empty = document.querySelector('[data-locator-empty]');
              const emptyQuery = document.querySelector('[data-locator-empty-query]');
              return visibleWraps.length === 0 && count?.textContent?.includes("0 of 29") && !empty?.hidden && emptyQuery?.textContent === "zzzznonexistent";
            })()
          `,
          returnByValue: true,
        });
        if (!emptyStateCheck?.result?.value) {
          throw new Error("Empty state or zero count not verified for non-matching query");
        }

        // Step 5: Clear query by dispatching Escape on input
        const escapeClearCheck = await send("Runtime.evaluate", {
          expression: `
            (() => {
              const input = document.querySelector('[data-locator-filter-input]');
              if (!input) return false;
              input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
              const visibleWraps = Array.from(document.querySelectorAll('[data-place-item-wrap]')).filter(w => !w.hidden);
              const count = document.querySelector('[data-locator-filter-count]');
              const empty = document.querySelector('[data-locator-empty]');
              return input.value === "" && visibleWraps.length === 29 && count?.textContent?.includes("29") && empty?.hidden === true;
            })()
          `,
          returnByValue: true,
        });
        if (!escapeClearCheck?.result?.value) {
          throw new Error("Escape key on input did not reset filter query to full 29 places");
        }

        // Step 6: Test ArrowDown navigation from input to first visible button
        const arrowDownCheck = await send("Runtime.evaluate", {
          expression: `
            (() => {
              const input = document.querySelector('[data-locator-filter-input]');
              if (!input) return false;
              input.focus();
              input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
              const active = document.activeElement;
              const firstBtn = document.querySelector('[data-place-item-wrap]:not([hidden]) .map-locator-browser__item');
              return active === firstBtn;
            })()
          `,
          returnByValue: true,
        });
        if (!arrowDownCheck?.result?.value) {
          throw new Error("ArrowDown from filter input did not move focus to first visible locator button");
        }

        // Close locator menu
        await send("Runtime.evaluate", {
          expression: `
            (() => {
              const menu = document.querySelector('[data-locator-menu]');
              if (menu && !menu.hidden) {
                document.querySelector('[data-locator-toggle]')?.click();
              }
            })()
          `,
        });
        await new Promise((r) => setTimeout(r, 200));

        j5Pass = true;
      } catch (err) {
        j5Error = err.message;
      }

      if (j5Pass) {
        auditReport.summary.journeys_passed++;
        console.log("  [PASS] Journey 5: Browse Places Search & Keyboard Navigation passed.");
      } else {
        auditReport.summary.journeys_failed++;
        testFailures++;
        console.error(`  [FAIL] Journey 5: Browse Places Search & Keyboard Navigation failed: ${j5Error}`);
      }
      auditReport.journeys.push({ id: "journey_5_browse_places_search_and_keyboard", passed: j5Pass, error: j5Error });
    }

    // Save machine-readable quality audit report
    const testResultsDir = path.resolve("test-results");
    fs.mkdirSync(testResultsDir, { recursive: true });
    const auditReportPath = path.join(testResultsDir, "quality-audit.json");
    fs.writeFileSync(auditReportPath, JSON.stringify(auditReport, null, 2), "utf8");
    console.log(`\nMachine-readable quality audit written to: ${auditReportPath}`);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n==================================================`);
    console.log(`AUDIT COMPLETE in ${elapsed}s`);
    if (uncaughtExceptions.length > 0) {
      console.error(`Uncaught Exceptions:      ${uncaughtExceptions.length}`);
      testFailures += uncaughtExceptions.length;
    }
    auditReport.summary.uncaught_browser_exceptions = uncaughtExceptions.length;
    auditReport.uncaught_exceptions = uncaughtExceptions;

    console.log(`Critical A11y Violations: ${auditReport.summary.critical_a11y}`);
    console.log(`Unallowed Serious A11y:   ${auditReport.summary.unallowed_serious_a11y}`);
    console.log(`Allowed Baseline Serious: ${auditReport.summary.allowed_serious_a11y}`);
    console.log(`Layout Failures:          ${auditReport.summary.layout_failures}`);
    console.log(`Journeys Passed:          ${auditReport.summary.journeys_passed} / ${auditReport.journeys.length}`);
    console.log(`==================================================\n`);

    try {
      ws.close();
    } catch {}
  } finally {
    try {
      proc.kill();
    } catch {}
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    } catch {}
    try {
      server.close();
    } catch {}
  }

  if (testFailures > 0) {
    console.error(`[FAILURE] Quality audit detected ${testFailures} violation(s).`);
    process.exit(1);
  } else {
    console.log(`[SUCCESS] All quality audit gates passed cleanly.`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("[FATAL ERROR]", err);
  process.exit(1);
});
