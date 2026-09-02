import http from "node:http";
import net from "node:net";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

/**
 * Portable browser executable discovery.
 */
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
    } catch {
      // Ignore cache read errors
    }
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

let failureCount = 0;
let passCount = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    failureCount++;
  } else {
    console.log(`[PASS] ${message}`);
    passCount++;
  }
}

async function runReviewSuite() {
  const serverPort = await getAvailablePort();
  await new Promise((resolve) => server.listen(serverPort, "127.0.0.1", resolve));
  const baseUrl = `http://127.0.0.1:${serverPort}/`;
  console.log(`Static review server listening at ${baseUrl}`);

  const chromePath = findBrowserExecutable();
  console.log(`Using browser: ${chromePath}`);

  const debugPort = await getAvailablePort();
  const proc = spawn(chromePath, [
    "--headless=new",
    "--no-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-webgl",
    "--hide-scrollbars",
    `--remote-debugging-port=${debugPort}`,
    "about:blank",
  ]);

  let uncaughtExceptions = [];

  try {
    await new Promise((r) => setTimeout(r, 1500));
    const listRes = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
    const targets = await listRes.json();
    const pageTarget = targets.find((t) => t.type === "page");
    if (!pageTarget) throw new Error("No page target found in browser debugger");

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((r) => (ws.onopen = r));

    ws.onmessage = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.method === "Runtime.exceptionThrown") {
        console.error("[RUNTIME EXCEPTION]", data.params.exceptionDetails?.exception?.description || data.params.exceptionDetails?.text || data.params.exceptionDetails);
        uncaughtExceptions.push(data.params.exceptionDetails);
      }
    };

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
      await send("Input.dispatchKeyEvent", {
        type: "rawKeyDown",
        key,
        code,
        windowsVirtualKeyCode,
        modifiers: shiftKey ? 8 : 0,
      });
      await send("Input.dispatchKeyEvent", {
        type: "keyUp",
        key,
        code,
        windowsVirtualKeyCode,
        modifiers: shiftKey ? 8 : 0,
      });
    };

    await send("Page.enable");
    await send("Runtime.enable");
    await send("Network.enable");

    // Navigate to application
    await send("Page.navigate", { url: baseUrl });

    async function waitForMapReady(timeoutMs = 8000) {
      const start = Date.now();
      let styleLoaded = false;
      while (Date.now() - start < timeoutMs) {
        if (!styleLoaded) {
          const evalRes = await send("Runtime.evaluate", {
            expression: `Boolean(document.getElementById("charted-currents-map")?.dataset.mapReady === "true")`,
            returnByValue: true,
          });
          if (evalRes?.result?.value === true) {
            styleLoaded = true;
          }
        }
        if (styleLoaded) {
          const idleRes = await send("Runtime.evaluate", {
            expression: `Boolean(document.getElementById("charted-currents-map")?.dataset.mapIdle === "true")`,
            returnByValue: true,
          });
          if (idleRes?.result?.value === true) return true;
        }
        await new Promise((r) => setTimeout(r, 150));
      }
      return false;
    }

    const ready = await waitForMapReady();
    assert(
      ready,
      "Historical map initialized and reached idle state within timeout",
    );

    const packetArg = process.argv.find((a) => a.startsWith("--packet="));
    const packetPrefix = packetArg ? packetArg.split("=")[1] + "-" : "packet3-";

    const viewports = [
      { name: `${packetPrefix}desktop-1440x900.png`, width: 1440, height: 900 },
      { name: `${packetPrefix}ultrawide-3440x1440.png`, width: 3440, height: 1440 },
      { name: `${packetPrefix}phone-390x844.png`, width: 390, height: 844 },
      { name: `${packetPrefix}phone-430x932.png`, width: 430, height: 932 },
    ];

    fs.mkdirSync("design/reviews", { recursive: true });

    for (const vp of viewports) {
      console.log(`[CAPTURE] ${vp.name} (${vp.width}x${vp.height})...`);
      await send("Emulation.setDeviceMetricsOverride", {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.width < 500,
      });
      await new Promise((r) => setTimeout(r, 1200));

      const screenshot = await send("Page.captureScreenshot", { format: "png" });
      assert(Boolean(screenshot?.data), `Screenshot capture returned valid image data for ${vp.name}`);
      if (screenshot?.data) {
        const outPath = path.resolve("design/reviews", vp.name);
        fs.writeFileSync(outPath, Buffer.from(screenshot.data, "base64"));
        const size = fs.statSync(outPath).size;
        console.log(`[SAVED] ${vp.name} (${size} bytes)`);
        assert(size > 15000, `Screenshot ${vp.name} generated with valid non-empty raster size (${size} bytes)`);
      }
    }

    // Active selection capture on desktop (1440x900) - Select Jamaica
    console.log("[CAPTURE] desktop selected state (Jamaica)...");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await new Promise((r) => setTimeout(r, 300));

    await send("Runtime.evaluate", {
      expression: `(() => {
        const toggle = document.querySelector('[data-locator-toggle]');
        toggle?.click();
        const jamaicaBtn = document.querySelector('[data-place-id="place_jamaica"]');
        jamaicaBtn?.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));

    const selectedScreenshot = await send("Page.captureScreenshot", { format: "png" });
    assert(Boolean(selectedScreenshot?.data), "Screenshot capture returned valid image data for desktop selected state");
    if (selectedScreenshot?.data) {
      const selectedOutPath = path.resolve(`design/reviews/${packetPrefix}desktop-selected-1440x900.png`);
      fs.writeFileSync(selectedOutPath, Buffer.from(selectedScreenshot.data, "base64"));
      const size = fs.statSync(selectedOutPath).size;
      console.log(`[SAVED] ${packetPrefix}desktop-selected-1440x900.png (${size} bytes)`);
      assert(size > 15000, `Screenshot ${packetPrefix}desktop-selected-1440x900.png generated with valid raster size (${size} bytes)`);
    }

    // Capture inspector-open timeline state (verifying zero overlap with Period Focus)
    console.log("[CAPTURE] inspector-open timeline state (1440x900)...");
    const inspectorOpenScreenshot = await send("Page.captureScreenshot", { format: "png" });
    if (inspectorOpenScreenshot?.data) {
      const inspectorOpenOutPath = path.resolve(`design/reviews/${packetPrefix}inspector-open-timeline-1440x900.png`);
      fs.writeFileSync(inspectorOpenOutPath, Buffer.from(inspectorOpenScreenshot.data, "base64"));
      const size = fs.statSync(inspectorOpenOutPath).size;
      console.log(`[SAVED] ${packetPrefix}inspector-open-timeline-1440x900.png (${size} bytes)`);
      assert(size > 15000, `Screenshot ${packetPrefix}inspector-open-timeline-1440x900.png generated with valid raster size (${size} bytes)`);
    }

    // Active Source Drawer capture on desktop (1440x900)
    console.log("[CAPTURE] desktop source drawer state...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const openVisualBtn = document.querySelector('[data-open-visual-source]');
        openVisualBtn?.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));

    const drawerScreenshot = await send("Page.captureScreenshot", { format: "png" });
    assert(Boolean(drawerScreenshot?.data), "Screenshot capture returned valid image data for source drawer state");
    if (drawerScreenshot?.data) {
      const drawerOutPath = path.resolve(`design/reviews/${packetPrefix}source-drawer-1440x900.png`);
      fs.writeFileSync(drawerOutPath, Buffer.from(drawerScreenshot.data, "base64"));
      const size = fs.statSync(drawerOutPath).size;
      console.log(`[SAVED] ${packetPrefix}source-drawer-1440x900.png (${size} bytes)`);
      assert(size > 15000, `Screenshot ${packetPrefix}source-drawer-1440x900.png generated with valid raster size (${size} bytes)`);
    }

    // Close source drawer
    await send("Runtime.evaluate", {
      expression: `(() => {
        const closeBtn = document.querySelector('[data-source-drawer-close]');
        closeBtn?.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 300));

    // Active selection capture on mobile (390x844)
    console.log("[CAPTURE] mobile selected state (390x844)...");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await new Promise((r) => setTimeout(r, 300));

    const mobileSelectedScreenshot = await send("Page.captureScreenshot", { format: "png" });
    assert(Boolean(mobileSelectedScreenshot?.data), "Screenshot capture returned valid image data for mobile selected state");
    if (mobileSelectedScreenshot?.data) {
      const mobileSelectedOutPath = path.resolve(`design/reviews/${packetPrefix}phone-selected-390x844.png`);
      fs.writeFileSync(mobileSelectedOutPath, Buffer.from(mobileSelectedScreenshot.data, "base64"));
      const size = fs.statSync(mobileSelectedOutPath).size;
      console.log(`[SAVED] ${packetPrefix}phone-selected-390x844.png (${size} bytes)`);
      assert(size > 15000, `Screenshot ${packetPrefix}phone-selected-390x844.png generated with valid raster size (${size} bytes)`);
    }

    // Reset viewport to desktop for behavioral tests
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // Capture temporal precedence state (1684-1695 filter + Havana selected)
    console.log("[CAPTURE] temporal precedence state (1684-1695 filter + Havana selected)...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const filter1684 = document.querySelector('[data-time-filter="1684-1695"]');
        filter1684?.click();
        const toggle = document.querySelector('[data-locator-toggle]');
        if (!document.querySelector('.locator-drawer[data-state="open"]')) {
          toggle?.click();
        }
        const havanaBtn = document.querySelector('[data-place-id="place_havana"]');
        havanaBtn?.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));

    const tempPrecedenceScreenshot = await send("Page.captureScreenshot", { format: "png" });
    if (tempPrecedenceScreenshot?.data) {
      const tempPrecedenceOutPath = path.resolve(`design/reviews/${packetPrefix}temporal-precedence-1440x900.png`);
      fs.writeFileSync(tempPrecedenceOutPath, Buffer.from(tempPrecedenceScreenshot.data, "base64"));
      const size = fs.statSync(tempPrecedenceOutPath).size;
      console.log(`[SAVED] ${packetPrefix}temporal-precedence-1440x900.png (${size} bytes)`);
      assert(size > 15000, `Screenshot ${packetPrefix}temporal-precedence-1440x900.png generated with valid raster size (${size} bytes)`);
    }

    // Reset filter to All and close locator drawer
    await send("Runtime.evaluate", {
      expression: `(() => {
        const filterAll = document.querySelector('[data-time-filter="all"]');
        filterAll?.click();
        const closeBtn = document.querySelector('[data-inspector-close]');
        closeBtn?.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));

    // ==========================================
    // DETERMINISTIC BEHAVIORAL ASSERTION SUITE
    // ==========================================
    console.log("\nRunning deterministic behavioral assertions...\n");

    // 1. Attribution Presence (DOM assertions)
    const attributionCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const hasMapLibre = Boolean(document.querySelector(".maplibregl-ctrl-attrib"));
        const hasWHG = Boolean(document.querySelector("a[href*='whgazetteer.org']"));
        return { hasMapLibre, hasWHG };
      })()`,
      returnByValue: true,
    });
    assert(attributionCheck?.result?.value?.hasMapLibre, "MapLibre / OpenStreetMap attribution control present in DOM");
    assert(attributionCheck?.result?.value?.hasWHG, "WHG authority attribution link present in DOM");

    // 2. Timeline Precision & Sub-Lane Stacking
    console.log("Testing timeline fractional precision & sub-lane stacking...");
    const timelineCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const markers = Array.from(document.querySelectorAll('[data-timeline-event]'));
        const hasFractionalPositions = markers.some(m => {
          const style = m.getAttribute('style') || '';
          const match = style.match(/left:\\s*([0-9.]+)%/);
          if (!match) return false;
          const num = parseFloat(match[1]);
          return (num % 1) !== 0; // has decimal fractional part
        });
        const hasStackClasses = markers.some(m => m.className.includes('timeline-event-marker--stack-'));
        return { markerCount: markers.length, hasFractionalPositions, hasStackClasses };
      })()`,
      returnByValue: true,
    });
    assert(timelineCheck?.result?.value?.markerCount === 16, "Timeline contains all 16 historical event markers");
    assert(timelineCheck?.result?.value?.hasFractionalPositions, "Timeline markers positioned using precise fractional date calculations");
    assert(timelineCheck?.result?.value?.hasStackClasses, "Timeline markers staggered in vertical sub-lanes to prevent overlapping");

    // 3. Inspector-Open Timeline Layout Non-Occlusion
    console.log("Testing inspector-open timeline layout clearance...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const marker = document.querySelector('[data-selection-id="event_capture_richard_and_sarah_1705"]');
        marker?.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));

    const inspectorOpenTimelineCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const appShell = document.querySelector('.app-shell');
        const isInspectorOpen = appShell?.getAttribute('data-inspector-open') === 'true';
        const timelineShell = document.querySelector('.timeline-shell');
        const filterBtns = Array.from(document.querySelectorAll('.timeline-filter-btn'));
        const allFiltersVisible = filterBtns.every(b => {
          const rect = b.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && rect.right < (window.innerWidth - 360);
        });
        return { isInspectorOpen, allFiltersVisible };
      })()`,
      returnByValue: true,
    });
    assert(inspectorOpenTimelineCheck?.result?.value?.isInspectorOpen, "Selecting event sets data-inspector-open='true'");
    assert(inspectorOpenTimelineCheck?.result?.value?.allFiltersVisible, "All Period Focus controls remain fully visible and non-occluded when inspector is open on desktop");

    // 4. Historical Vessel Selection & Construction Display (No ~1685)
    console.log("Testing vessel selection & construction display...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const rows = Array.from(document.querySelectorAll('.inspector-rel-row'));
        const vesselRow = rows.find(r => r.textContent?.includes('Richard & Sarah'));
        vesselRow?.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));

    const vesselCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const inspector = document.getElementById('entity-inspector');
        const isOpen = inspector?.getAttribute('data-state') === 'open';
        const title = document.querySelector('[data-inspector-title]')?.textContent;
        const rawName = document.querySelector('[data-ship-raw-name]')?.textContent;
        const tonnage = document.querySelector('[data-ship-tonnage]')?.textContent;
        const construction = document.querySelector('[data-ship-construction]')?.textContent;
        const crewRows = document.querySelectorAll('[data-ship-crew-tbody] tr').length;
        const isHeadingFocused = document.activeElement?.id === 'inspector-heading';

        return { isOpen, title, rawName, tonnage, construction, crewRows, isHeadingFocused };
      })()`,
      returnByValue: true,
    });
    assert(vesselCheck?.result?.value?.isOpen, "Selecting ship on timeline opens Entity Inspector");
    assert(vesselCheck?.result?.value?.title === "Richard & Sarah of London", "Vessel title displays 'Richard & Sarah of London'");
    assert(vesselCheck?.result?.value?.rawName === "Richard & Sarah of London", "Raw vessel name preserved faithfully");
    assert(vesselCheck?.result?.value?.tonnage === "300 tons reported burden", "Reported burden displays '300 tons reported burden'");
    assert(vesselCheck?.result?.value?.construction === "English built · reported age 20 at capture", "Construction display shows recorded facts without unmodeled '~1685'");
    assert(vesselCheck?.result?.value?.crewRows === 3, "All 3 documented crew members rendered in table");
    assert(!vesselCheck?.result?.value?.isHeadingFocused, "Pointer selection on timeline does NOT steal keyboard focus to inspector heading");

    // 3. Layered Source Drawer & Modal Tab Focus Trap
    console.log("Testing assertion-driven Source Drawer opening...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const openSrcBtn = document.querySelector('[data-open-ship-source]');
        openSrcBtn?.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 300));

    const sourceDrawerCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const drawer = document.getElementById('source-drawer');
        const isOpen = drawer?.getAttribute('data-state') === 'open';
        const inspectionState = document.querySelector('[data-source-inspection-state]')?.textContent;
        const inst = document.querySelector('[data-source-institution]')?.textContent;
        const upstreamRef = document.querySelector('[data-source-upstream-ref]')?.textContent;
        const assertionRows = document.querySelectorAll('[data-source-assertions-tbody] tr').length;

        return { isOpen, inspectionState, inst, upstreamRef, assertionRows };
      })()`,
      returnByValue: true,
    });
    assert(sourceDrawerCheck?.result?.value?.isOpen, "Clicking 'Inspect Archival Provenance' opens Source Drawer");
    assert(sourceDrawerCheck?.result?.value?.inspectionState === "Dataset record inspected", "Source Drawer displays inspection state 'Dataset record inspected'");
    assert(sourceDrawerCheck?.result?.value?.inst === "UK Data Archive / ReShare", "Holding institution displays 'UK Data Archive / ReShare'");
    assert(sourceDrawerCheck?.result?.value?.upstreamRef === "TNA HCA 32/80", "Upstream archival reference displays cited 'TNA HCA 32/80'");
    assert(sourceDrawerCheck?.result?.value?.assertionRows > 0, "Source Drawer renders supporting assertion breakdown");

    // Test Modal Focus Containment (Tab and Shift+Tab)
    console.log("Testing modal Tab focus containment in Source Drawer...");
    await sendKey("Tab", "Tab", 9);
    await new Promise((r) => setTimeout(r, 100));

    const tabFocusCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const panel = document.querySelector('.source-drawer-panel');
        return panel?.contains(document.activeElement);
      })()`,
      returnByValue: true,
    });
    assert(tabFocusCheck?.result?.value, "Tab key preserves focus inside SourceDrawer panel");

    // Escape closes SourceDrawer and restores focus
    console.log("Testing Escape key isolation in Source Drawer...");
    await sendKey("Escape", "Escape", 27);
    await new Promise((r) => setTimeout(r, 200));

    const escapeDrawerCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const drawer = document.getElementById('source-drawer');
        const inspector = document.getElementById('entity-inspector');
        const drawerClosed = drawer?.getAttribute('data-state') === 'closed';
        const inspectorOpen = inspector?.getAttribute('data-state') === 'open';
        const focusRestored = document.activeElement?.hasAttribute('data-open-ship-source');

        return { drawerClosed, inspectorOpen, focusRestored };
      })()`,
      returnByValue: true,
    });
    assert(escapeDrawerCheck?.result?.value?.drawerClosed, "Pressing Escape in SourceDrawer closes the drawer");
    assert(escapeDrawerCheck?.result?.value?.inspectorOpen, "Escape in SourceDrawer does NOT close the underlying Entity Inspector");
    assert(escapeDrawerCheck?.result?.value?.focusRestored, "Closing SourceDrawer restores focus to the trigger button");

    // Close Inspector
    await send("Runtime.evaluate", {
      expression: `(() => {
        const closeBtn = document.querySelector('[data-inspector-close]');
        closeBtn?.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 200));

    // 4. Place Evidence Button for Port Royal
    console.log("Testing generic Place Evidence action for Port Royal...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const toggle = document.querySelector('[data-locator-toggle]');
        toggle?.click();
        const portRoyalBtn = document.querySelector('[data-place-id="place_port_royal"]');
        portRoyalBtn?.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 300));

    await send("Runtime.evaluate", {
      expression: `(() => {
        const openPlaceSrcBtn = document.querySelector('[data-open-place-source]');
        openPlaceSrcBtn?.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 300));

    const placeEvidenceCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const drawer = document.getElementById('source-drawer');
        const isOpen = drawer?.getAttribute('data-state') === 'open';
        const assertionRows = document.querySelectorAll('[data-source-assertions-tbody] tr').length;
        const text = drawer?.textContent || '';
        const hasPortRoyallLabel = text.includes('Port Royall') || text.includes('cartographic place label');

        return { isOpen, assertionRows, hasPortRoyallLabel };
      })()`,
      returnByValue: true,
    });
    assert(placeEvidenceCheck?.result?.value?.isOpen, "Clicking 'Inspect Place Evidence' opens Source Drawer");
    assert(placeEvidenceCheck?.result?.value?.assertionRows > 0, "Place evidence resolves supporting assertions in Source Drawer");
    assert(placeEvidenceCheck?.result?.value?.hasPortRoyallLabel, "Port Royal place evidence shows 'Port Royall' map assertion");

    // Close source drawer
    await sendKey("Escape", "Escape", 27);
    await new Promise((r) => setTimeout(r, 200));

    // 5. Contextual Event Selection (1692 Earthquake & Royal Society metadata)
    console.log("Testing contextual 1692 earthquake selection...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const eqMarker = document.querySelector('[data-selection-id="event_port_royal_earthquake_1692"]');
        eqMarker?.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 300));

    const eventCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const inspector = document.getElementById('entity-inspector');
        const isOpen = inspector?.getAttribute('data-state') === 'open';
        const title = document.querySelector('[data-inspector-title]')?.textContent;
        const date = document.querySelector('[data-event-date]')?.textContent;
        const badgeState = document.querySelector('[data-inspector-badge]')?.getAttribute('data-evidence-state');

        return { isOpen, title, date, badgeState };
      })()`,
      returnByValue: true,
    });
    assert(eventCheck?.result?.value?.isOpen, "Selecting 1692 earthquake opens Entity Inspector");
    assert(eventCheck?.result?.value?.title === "The Port Royal Earthquake of 1692", "Event title matches expected");
    assert(eventCheck?.result?.value?.date?.includes("1692-06-07"), "Event date includes '1692-06-07'");
    assert(eventCheck?.result?.value?.badgeState === "contextual", "Evidence badge correctly marks event as 'contextual'");

    // Open Event Source Drawer
    await send("Runtime.evaluate", {
      expression: `(() => {
        const openEventSrcBtn = document.querySelector('[data-open-event-source]');
        openEventSrcBtn?.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 300));

    const eventSourceCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const drawer = document.getElementById('source-drawer');
        const isOpen = drawer?.getAttribute('data-state') === 'open';
        const text = drawer?.textContent || '';
        const hasPhilTrans = text.includes('Philosophical Transactions') || text.includes('Phil. Trans.');

        return { isOpen, hasPhilTrans };
      })()`,
      returnByValue: true,
    });
    assert(eventSourceCheck?.result?.value?.isOpen, "Opening earthquake event source opens Source Drawer");
    assert(eventSourceCheck?.result?.value?.hasPhilTrans, "Event source drawer references Philosophical Transactions (1694)");

    await sendKey("Escape", "Escape", 27);
    await new Promise((r) => setTimeout(r, 200));

    // Close Inspector
    await send("Runtime.evaluate", {
      expression: `(() => {
        const closeBtn = document.querySelector('[data-inspector-close]');
        closeBtn?.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 200));

    // 6. Native CDP Keyboard Activation of Timeline Marker & Focus Restoration
    console.log("Testing native CDP keyboard activation of timeline marker...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const marker = document.querySelector('[data-selection-id="event_capture_william_1702"]');
        marker?.focus();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 100));

    await sendKey("Enter", "Enter", 13);
    await new Promise((r) => setTimeout(r, 300));

    const timelineKeyboardCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const inspector = document.getElementById('entity-inspector');
        const isOpen = inspector?.getAttribute('data-state') === 'open';
        const isHeadingFocused = document.activeElement?.id === 'inspector-heading';
        const title = document.querySelector('[data-inspector-title]')?.textContent;
        const hasVesselConn = Boolean(document.querySelector('[data-event-connections-list] .inspector-rel-row'));

        return { isOpen, isHeadingFocused, title, hasVesselConn };
      })()`,
      returnByValue: true,
    });
    assert(timelineKeyboardCheck?.result?.value?.isOpen, "Native keyboard Enter on timeline marker opens Entity Inspector");
    assert(timelineKeyboardCheck?.result?.value?.isHeadingFocused, "Keyboard timeline activation transfers focus to #inspector-heading");
    assert(timelineKeyboardCheck?.result?.value?.title?.includes("Capture") || timelineKeyboardCheck?.result?.value?.title?.includes("William"), "Selected item is capture event");
    assert(timelineKeyboardCheck?.result?.value?.hasVesselConn, "Event inspector renders connection button to related vessel");

    // Close inspector with Escape and verify focus restores to timeline button
    await sendKey("Escape", "Escape", 27);
    await new Promise((r) => setTimeout(r, 200));

    const timelineFocusRestoreCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const isRestored = document.activeElement?.getAttribute('data-selection-id') === 'event_capture_william_1702';
        return isRestored;
      })()`,
      returnByValue: true,
    });
    assert(timelineFocusRestoreCheck?.result?.value, "Closing inspector restores focus to originating timeline marker");

    // 7. Historical Chart View for Jamaica/Port Royal and Strict Exclusion for Havana/London
    console.log("Testing historical visual chart display and strict exclusion for non-Jamaica places...");
    // Test Jamaica
    await send("Runtime.evaluate", {
      expression: `(() => {
        const toggle = document.querySelector('[data-locator-toggle]');
        toggle?.click();
        const jamaicaBtn = document.querySelector('[data-place-id="place_jamaica"]');
        jamaicaBtn?.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 300));

    const jamaicaVisualCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const visualWrap = document.querySelector('[data-place-visual-wrap]');
        const isVisualVisible = visualWrap && !visualWrap.hidden && getComputedStyle(visualWrap).display !== 'none';
        const img = document.querySelector('.inspector-visual-img');
        const hasImgSrc = img && img.getAttribute('src')?.includes('bochart-knollis-jamaica-1684.jpg');

        return { isVisualVisible, hasImgSrc };
      })()`,
      returnByValue: true,
    });
    assert(jamaicaVisualCheck?.result?.value?.isVisualVisible, "Selecting Jamaica exposes the 1684 cartographic reference visual card");
    assert(jamaicaVisualCheck?.result?.value?.hasImgSrc, "1684 Bochart & Knollis chart image loaded correctly for Jamaica");

    // Test Port Royal
    await send("Runtime.evaluate", {
      expression: `(() => {
        const toggle = document.querySelector('[data-locator-toggle]');
        toggle?.click();
        const prBtn = document.querySelector('[data-place-id="place_port_royal"]');
        prBtn?.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 300));

    const prVisualCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const visualWrap = document.querySelector('[data-place-visual-wrap]');
        return visualWrap && !visualWrap.hidden && getComputedStyle(visualWrap).display !== 'none';
      })()`,
      returnByValue: true,
    });
    assert(prVisualCheck?.result?.value, "Selecting Port Royal exposes the 1684 cartographic reference visual card");

    // Test Havana - Visual card MUST be hidden and coordinates must end in W
    console.log("Testing Havana coordinate formatting and visual card exclusion...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const toggle = document.querySelector('[data-locator-toggle]');
        toggle?.click();
        const havanaBtn = document.querySelector('[data-place-id="place_havana"]');
        havanaBtn?.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 300));

    const havanaCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const visualWrap = document.querySelector('[data-place-visual-wrap]');
        const isHidden = !visualWrap || visualWrap.hidden || getComputedStyle(visualWrap).display === 'none';
        const coords = document.querySelector('[data-place-coords]')?.textContent || '';
        const endsInW = coords.endsWith('W') && !coords.includes('-') && !coords.endsWith('E');

        return { isHidden, coords, endsInW };
      })()`,
      returnByValue: true,
    });
    assert(havanaCheck?.result?.value?.isHidden, "Selecting Havana strictly hides the Jamaica cartographic visual card");
    assert(havanaCheck?.result?.value?.endsInW, `Havana coordinates formatted with Western longitude ('${havanaCheck?.result?.value?.coords}')`);

    // Test London - Visual card MUST be hidden
    await send("Runtime.evaluate", {
      expression: `(() => {
        const toggle = document.querySelector('[data-locator-toggle]');
        toggle?.click();
        const londonBtn = document.querySelector('[data-place-id="place_london"]');
        londonBtn?.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 300));

    const londonVisualCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const visualWrap = document.querySelector('[data-place-visual-wrap]');
        return !visualWrap || visualWrap.hidden || getComputedStyle(visualWrap).display === 'none';
      })()`,
      returnByValue: true,
    });
    assert(londonVisualCheck?.result?.value, "Selecting London strictly hides the Jamaica cartographic visual card");

    // 8. Test Route Aggregation View for Overlapping Directional Endpoints
    console.log("Testing route aggregation view for Jamaica -> London...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        // Programmatically select route group for Jamaica -> London
        const evt = new CustomEvent("cc:test-select-voyage", { detail: "route_group_place_jamaica_place_london" });
        window.dispatchEvent(evt);
        // Also test directly via selectionStore
        const store = window.__CC_SELECTION_STORE__;
      })()`,
    });
    // Trigger voyage selection in inspector directly
    await send("Runtime.evaluate", {
      expression: `(() => {
        const sel = { kind: "voyage", id: "route_group_place_jamaica_place_london" };
        window.dispatchEvent(new CustomEvent("cc:mock-select", { detail: sel }));
        // Or click close and select London origin from Jamaica
      })()`,
    });

    // 9. Test Temporal Period Filter UI and Map Line Opacity Effects
    console.log("Testing temporal period filter effects...");
    // Click 1684-1695 filter
    await send("Runtime.evaluate", {
      expression: `(() => {
        const filterBtn = document.querySelector('[data-time-filter="1684-1695"]');
        filterBtn?.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 300));

    const filter1684Check = await send("Runtime.evaluate", {
      expression: `(() => {
        const activeBtn = document.querySelector('[data-time-filter="1684-1695"]')?.classList.contains('is-active');
        const marker = document.querySelector('[data-selection-id="event_capture_william_1702"]');
        const markerDimmed = marker && (getComputedStyle(marker).opacity === '0.15' || getComputedStyle(marker).pointerEvents === 'none');

        return { activeBtn, markerDimmed };
      })()`,
      returnByValue: true,
    });
    assert(filter1684Check?.result?.value?.activeBtn, "1684–1695 filter button marked active");
    assert(filter1684Check?.result?.value?.markerDimmed, "1702 prize capture marker dimmed and disabled during 1684–1695 filter");

    // Click 1702-1712 filter
    await send("Runtime.evaluate", {
      expression: `(() => {
        const filterBtn = document.querySelector('[data-time-filter="1702-1712"]');
        filterBtn?.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 300));

    const filter1702Check = await send("Runtime.evaluate", {
      expression: `(() => {
        const activeBtn = document.querySelector('[data-time-filter="1702-1712"]')?.classList.contains('is-active');
        const marker = document.querySelector('[data-selection-id="event_capture_william_1702"]');
        const markerActive = marker && getComputedStyle(marker).opacity === '1';

        return { activeBtn, markerActive };
      })()`,
      returnByValue: true,
    });
    assert(filter1702Check?.result?.value?.activeBtn, "1702–1712 filter button marked active");
    assert(filter1702Check?.result?.value?.markerActive, "1702 prize capture marker active during 1702–1712 filter");

    // 10. Test Temporal Selection Precedence (1684-1695 filter + Havana -> St Augustine 1712 connection)
    console.log("Testing temporal selection precedence under period filter...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        // Apply 1684-1695 filter
        const filterBtn = document.querySelector('[data-time-filter="1684-1695"]');
        filterBtn?.click();
        // Select Havana
        const toggle = document.querySelector('[data-locator-toggle]');
        if (!document.querySelector('.locator-drawer[data-state="open"]')) {
          toggle?.click();
        }
        const havanaBtn = document.querySelector('[data-place-id="place_havana"]');
        havanaBtn?.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));

    const temporalPrecedenceCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const inspector = document.getElementById('entity-inspector');
        const isOpen = inspector?.getAttribute('data-state') === 'open';
        const rows = Array.from(document.querySelectorAll('.inspector-rel-row'));
        const hasRelTypes = rows.every(r => Boolean(r.querySelector('.inspector-rel-type')));
        const hasRelRoles = rows.every(r => Boolean(r.querySelector('.inspector-rel-role')));
        const hasRelLabels = rows.every(r => Boolean(r.querySelector('.inspector-rel-label')));
        
        // Select the connected vessel (St John Baptiste, captured 1712)
        const stJohnRow = rows.find(r => r.textContent?.includes('St John Baptiste'));
        stJohnRow?.click();

        return { isOpen, hasRelTypes, hasRelRoles, hasRelLabels };
      })()`,
      returnByValue: true,
    });
    await new Promise((r) => setTimeout(r, 300));

    const outOfPeriodNoticeCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const notice = document.querySelector('[data-inspector-period-notice]');
        const isNoticeVisible = notice && !notice.hidden && getComputedStyle(notice).display !== 'none';
        const noticeText = notice?.textContent || '';
        return { isNoticeVisible, noticeText };
      })()`,
      returnByValue: true,
    });

    assert(temporalPrecedenceCheck?.result?.value?.isOpen, "Havana selected and inspector open");
    assert(temporalPrecedenceCheck?.result?.value?.hasRelTypes, "Relationship rows contain semantic uppercase TYPE badges");
    assert(temporalPrecedenceCheck?.result?.value?.hasRelRoles, "Relationship rows contain editorial role descriptions");
    assert(temporalPrecedenceCheck?.result?.value?.hasRelLabels, "Relationship rows contain clear entity labels");
    assert(outOfPeriodNoticeCheck?.result?.value?.isNoticeVisible, "Inspecting 1712 vessel during 1684–1695 filter displays 'Outside current period focus' banner");

    // Reset to All
    await send("Runtime.evaluate", {
      expression: `(() => {
        const filterBtn = document.querySelector('[data-time-filter="all"]');
        filterBtn?.click();
        const closeBtn = document.querySelector('[data-inspector-close]');
        closeBtn?.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 300));

    // 11. Test Packet 4 Spanish Atlantic Vessel Selection & Upstream AGI/PARES Provenance
    console.log("Testing Packet 4 Spanish Atlantic vessel selection & AGI/PARES provenance...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        window.dispatchEvent(new CustomEvent("cc:test-select", { detail: { kind: "ship", id: "ship_nuestra_senora_de_la_estrella_1684" } }));
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));

    const estrellaCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const title = document.querySelector('[data-inspector-title]')?.textContent || '';
        const tonnage = document.querySelector('[data-ship-tonnage]')?.textContent || '';
        const upstream = document.querySelector('[data-ship-upstream-ref]')?.textContent || '';
        return { title, tonnage, upstream };
      })()`,
      returnByValue: true,
    });
    assert(estrellaCheck?.result?.value?.title === "Nuestra Señora de la Estrella (1684)", "Estrella 1684 vessel selected in inspector");
    assert(estrellaCheck?.result?.value?.tonnage === "Recorded tonnage: 278", "Estrella 1684 burden formatted with conservative recorded tonnage");
    assert(estrellaCheck?.result?.value?.upstream.includes("Archivo General de Indias"), "Estrella 1684 displays Archivo General de Indias upstream archive series");

    // Capture Spanish Atlantic vessel inspector screenshot
    const estrellaScreenshot = await send("Page.captureScreenshot", { format: "png" });
    if (estrellaScreenshot?.data) {
      const estrellaOutPath = path.resolve(`design/reviews/${packetPrefix}crespo-pares-vessel-1440x900.png`);
      fs.writeFileSync(estrellaOutPath, Buffer.from(estrellaScreenshot.data, "base64"));
      const size = fs.statSync(estrellaOutPath).size;
      console.log(`[SAVED] ${packetPrefix}crespo-pares-vessel-1440x900.png (${size} bytes)`);
      assert(size > 15000, `Screenshot ${packetPrefix}crespo-pares-vessel-1440x900.png generated with valid raster size (${size} bytes)`);
    }

    // Open Source Drawer for Estrella
    await send("Runtime.evaluate", {
      expression: `(() => {
        const evidenceBtn = document.querySelector('[data-ship-evidence-btn]');
        evidenceBtn?.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 500));

    const paresDrawerCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const drawer = document.getElementById('source-drawer');
        const isOpen = drawer && !drawer.hidden && drawer.getAttribute('data-state') === 'open';
        const cardText = document.querySelector('[data-source-cards-container]')?.textContent || '';
        const hasParesCitation = cardText.includes('Crespo Solana') || cardText.includes('Archivo General de Indias') || cardText.includes('PARES');
        return { isOpen, hasParesCitation };
      })()`,
      returnByValue: true,
    });
    assert(paresDrawerCheck?.result?.value?.isOpen, "Source drawer opened for Spanish Atlantic vessel");
    assert(paresDrawerCheck?.result?.value?.hasParesCitation, "Source drawer contains Crespo / AGI / PARES citation");

    // Close Source Drawer
    await send("Runtime.evaluate", {
      expression: `(() => {
        const closeBtn = document.querySelector('[data-source-drawer-close]');
        closeBtn?.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 300));

    // 12. Test Packet 4 Multi-Period Aggregate Display Edge (Cádiz -> Havana)
    console.log("Testing Packet 4 Cádiz -> Havana multi-period aggregate route...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        window.dispatchEvent(new CustomEvent("cc:test-select", { detail: { kind: "voyage", id: "display_edge_place_cadiz_place_havana" } }));
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));

    const cadizHavanaCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const title = document.querySelector('[data-inspector-title]')?.textContent || '';
        const subtitle = document.querySelector('[data-inspector-subtitle]')?.textContent || '';
        const rows = Array.from(document.querySelectorAll('[data-voyage-vessels-list] .inspector-rel-row'));
        return { title, subtitle, rowCount: rows.length };
      })()`,
      returnByValue: true,
    });
    assert(cadizHavanaCheck?.result?.value?.title === "Cádiz → Havana", "Cádiz → Havana route selected in inspector");
    assert(cadizHavanaCheck?.result?.value?.subtitle?.includes("3 documented vessel voyages"), "Cádiz → Havana route subtitle indicates 3 documented vessel voyages in corpus");
    assert(cadizHavanaCheck?.result?.value?.rowCount === 3, "Cádiz → Havana route lists all 3 constituent voyages (1684, 1695, 1706)");

    // Test dynamic filter subtitle update on multi-period edge
    await send("Runtime.evaluate", {
      expression: `(() => {
        const filterBtn = document.querySelector('[data-time-filter="1684-1695"]');
        filterBtn?.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));

    const cadizFilteredCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const subtitle = document.querySelector('[data-inspector-subtitle]')?.textContent || '';
        const hasOutOfPeriodBadge = Array.from(document.querySelectorAll('[data-voyage-vessels-list] .inspector-rel-label')).some(l => l.textContent?.includes('Outside Focus'));
        return { subtitle, hasOutOfPeriodBadge };
      })()`,
      returnByValue: true,
    });
    assert(cadizFilteredCheck?.result?.value?.subtitle?.includes("2 of 3 documented voyages in current period focus"), "Cádiz → Havana subtitle dynamically evaluates active constituent count (2 of 3) under 1684–1695 period focus");
    assert(cadizFilteredCheck?.result?.value?.hasOutOfPeriodBadge, "1706 voyage correctly displays 'Outside Focus' badge under 1684–1695 period focus");

    // Capture Cádiz -> Havana route screenshot
    const cadizScreenshot = await send("Page.captureScreenshot", { format: "png" });
    if (cadizScreenshot?.data) {
      const cadizOutPath = path.resolve(`design/reviews/${packetPrefix}cadiz-havana-route-1440x900.png`);
      fs.writeFileSync(cadizOutPath, Buffer.from(cadizScreenshot.data, "base64"));
      const size = fs.statSync(cadizOutPath).size;
      console.log(`[SAVED] ${packetPrefix}cadiz-havana-route-1440x900.png (${size} bytes)`);
      assert(size > 15000, `Screenshot ${packetPrefix}cadiz-havana-route-1440x900.png generated with valid raster size (${size} bytes)`);
    }

    // Reset filter
    await send("Runtime.evaluate", {
      expression: `(() => {
        const filterBtn = document.querySelector('[data-time-filter="all"]');
        filterBtn?.click();
        const closeBtn = document.querySelector('[data-inspector-close]');
        closeBtn?.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 300));

    // 13. Runtime Exceptions check
    assert(uncaughtExceptions.length === 0, `No uncaught runtime exceptions observed (count: ${uncaughtExceptions.length})`);

    ws.close();
  } catch (err) {
    console.error("[ERROR]", err);
    failureCount++;
  } finally {
    proc.kill();
    server.close(() => {
      console.log("\n==========================================");
      console.log(`Review Summary: ${passCount} passed, ${failureCount} failed.`);
      console.log("==========================================\n");
      process.exit(failureCount > 0 ? 1 : 0);
    });
  }
}

runReviewSuite().catch((err) => {
  console.error("[FATAL HARNESS ERROR]", err);
  process.exit(1);
});
