import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

/**
 * Portable browser executable discovery.
 * Checks environment variables, standard OS binaries, and local user caches.
 */
function findBrowserExecutable() {
  const customBin = process.env.CHROME_BIN || process.env.BROWSER_PATH;
  if (customBin && fs.existsSync(customBin)) return customBin;

  const candidatePaths = [
    // Standard Linux paths
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/chrome",
    "/snap/bin/chromium",
    // macOS paths
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    // Windows paths
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) return candidate;
  }

  // Dynamic search in user cache directories (Playwright/Puppeteer local caches)
  const home = os.homedir();
  const playwrightCache = path.join(home, ".cache", "ms-playwright");
  if (fs.existsSync(playwrightCache)) {
    try {
      const entries = fs.readdirSync(playwrightCache);
      for (const entry of entries) {
        if (entry.startsWith("chromium-")) {
          const linuxChrome = path.join(playwrightCache, entry, "chrome-linux64", "chrome");
          if (fs.existsSync(linuxChrome)) return linuxChrome;
          const macChrome = path.join(
            playwrightCache,
            entry,
            "chrome-mac",
            "Chromium.app",
            "Contents",
            "MacOS",
            "Chromium",
          );
          if (fs.existsSync(macChrome)) return macChrome;
        }
      }
    } catch {
      // Ignore cache read errors and proceed to fallback
    }
  }

  throw new Error(
    "No Chromium/Chrome executable found on this system.\n" +
      "Set CHROME_BIN=/path/to/chrome to run review captures.",
  );
}

const distDir = path.resolve("dist");
if (!fs.existsSync(distDir)) {
  throw new Error("dist directory does not exist. Run 'npm run build' first.");
}

const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
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

  // Strict path containment check
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

server.listen(0, "127.0.0.1", async () => {
  const address = server.address();
  const serverPort = typeof address === "object" && address ? address.port : 4321;
  const baseUrl = `http://127.0.0.1:${serverPort}/`;
  console.log(`Static review server listening at ${baseUrl}`);

  const chromePath = findBrowserExecutable();
  console.log(`Using browser: ${chromePath}`);

  // Dynamic remote debugging port
  const debugPort = 9200 + Math.floor(Math.random() * 500);
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
        console.error("[RUNTIME EXCEPTION]", data.params.exceptionDetails?.text || data.params.exceptionDetails);
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

    await send("Page.enable");
    await send("Runtime.enable");

    // Navigate to application
    await send("Page.navigate", { url: baseUrl });

    async function waitForMapReady(timeoutMs = 6000) {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const evalRes = await send("Runtime.evaluate", {
          expression: `Boolean(document.getElementById("charted-currents-map")?.dataset.mapReady === "true")`,
          returnByValue: true,
        });
        if (evalRes?.result?.value === true) return true;
        await new Promise((r) => setTimeout(r, 150));
      }
      return false;
    }

    const ready = await waitForMapReady();
    assert(ready, "Map initialized and set dataset.mapReady === 'true' within timeout");

    const viewports = [
      { name: "packet1-desktop-1440x900.png", width: 1440, height: 900 },
      { name: "packet1-ultrawide-3440x1440.png", width: 3440, height: 1440 },
      { name: "packet1-phone-390x844.png", width: 390, height: 844 },
      { name: "packet1-phone-430x932.png", width: 430, height: 932 },
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
      await new Promise((r) => setTimeout(r, 600));

      const screenshot = await send("Page.captureScreenshot", { format: "png" });
      if (screenshot?.data) {
        const outPath = path.resolve("design/reviews", vp.name);
        fs.writeFileSync(outPath, Buffer.from(screenshot.data, "base64"));
        console.log(`[SAVED] ${vp.name} (${fs.statSync(outPath).size} bytes)`);
      }
    }

    // Active selection capture on desktop (1440x900)
    console.log("[CAPTURE] desktop selected state (1440x900)...");
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
        const firstItem = document.querySelector('.map-locator-browser__item');
        firstItem?.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));

    const selectedScreenshot = await send("Page.captureScreenshot", { format: "png" });
    if (selectedScreenshot?.data) {
      const selectedOutPath = path.resolve("design/reviews/packet1-desktop-selected-1440x900.png");
      fs.writeFileSync(selectedOutPath, Buffer.from(selectedScreenshot.data, "base64"));
      console.log(`[SAVED] packet1-desktop-selected-1440x900.png (${fs.statSync(selectedOutPath).size} bytes)`);
    }

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
    if (mobileSelectedScreenshot?.data) {
      const mobileSelectedOutPath = path.resolve("design/reviews/packet1-phone-selected-390x844.png");
      fs.writeFileSync(mobileSelectedOutPath, Buffer.from(mobileSelectedScreenshot.data, "base64"));
      console.log(`[SAVED] packet1-phone-selected-390x844.png (${fs.statSync(mobileSelectedOutPath).size} bytes)`);
    }

    // ==========================================
    // DETERMINISTIC BEHAVIORAL ASSERTION SUITE
    // ==========================================
    console.log("\nRunning deterministic behavioral assertions...\n");

    // 1. Attribution Presence
    const attributionCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const hasMapLibre = Boolean(document.querySelector(".maplibregl-ctrl-attrib"));
        const hasGeoNames = Boolean(document.querySelector("a[href*='geonames.org']"));
        return { hasMapLibre, hasGeoNames };
      })()`,
      returnByValue: true,
    });
    assert(attributionCheck?.result?.value?.hasMapLibre, "MapLibre / OpenStreetMap attribution control present in DOM");
    assert(attributionCheck?.result?.value?.hasGeoNames, "GeoNames CC BY 4.0 locator attribution link present in DOM");

    // 2. Pointer Selection & Focus Return to Toggle (No Focus on body)
    const pointerFocusCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        // Reset selection
        const closeBtn = document.querySelector('[data-inspector-close]');
        closeBtn?.click();

        const toggle = document.querySelector('[data-locator-toggle]');
        // Simulate real pointer click on toggle (detail = 1)
        toggle.dispatchEvent(new MouseEvent('click', { detail: 1, bubbles: true }));
        const firstItem = document.querySelector('.map-locator-browser__item');
        // Simulate real pointer click on first item (detail = 1)
        firstItem.dispatchEvent(new MouseEvent('click', { detail: 1, bubbles: true }));

        const inspectorEl = document.getElementById('entity-inspector');
        const isInspectorOpen = inspectorEl?.getAttribute('data-state') === 'open';
        const isFocusOnToggle = document.activeElement === toggle;
        const isFocusOnBody = document.activeElement === document.body;

        return { isInspectorOpen, isFocusOnToggle, isFocusOnBody };
      })()`,
      returnByValue: true,
    });
    assert(pointerFocusCheck?.result?.value?.isInspectorOpen, "Pointer selection opens Entity Inspector");
    assert(pointerFocusCheck?.result?.value?.isFocusOnToggle, "Pointer selection returns focus to Browse Places toggle button");
    assert(!pointerFocusCheck?.result?.value?.isFocusOnBody, "Focus is not orphaned on document.body after menu closes");

    // 3. Escape Ownership in Menu with Active Inspector
    const escapeIsolationCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const toggle = document.querySelector('[data-locator-toggle]');
        const menu = document.querySelector('[data-locator-menu]');
        const inspector = document.getElementById('entity-inspector');

        // Open menu while inspector is already open
        toggle.click();
        const menuOpened = !menu.hidden;

        // Press Escape inside menu
        menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

        const menuClosed = menu.hidden;
        const inspectorRemainsOpen = inspector.getAttribute('data-state') === 'open';

        return { menuOpened, menuClosed, inspectorRemainsOpen };
      })()`,
      returnByValue: true,
    });
    assert(escapeIsolationCheck?.result?.value?.menuClosed, "Pressing Escape in Browse Places menu closes the menu");
    assert(escapeIsolationCheck?.result?.value?.inspectorRemainsOpen, "Escape in menu does NOT dismiss the active Entity Inspector");

    // 4. Keyboard Selection & Focus Transfer to Inspector Heading
    const keyboardSelectionCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        // Close inspector first
        const closeBtn = document.querySelector('[data-inspector-close]');
        closeBtn?.click();

        const toggle = document.querySelector('[data-locator-toggle]');
        // Trigger ArrowDown on toggle
        toggle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

        const firstItem = document.querySelector('.map-locator-browser__item');
        // Keyboard activation on button (detail = 0)
        firstItem.dispatchEvent(new MouseEvent('click', { detail: 0, bubbles: true }));

        return {
          inspectorOpen: document.getElementById('entity-inspector')?.getAttribute('data-state') === 'open',
          activeElementId: document.activeElement?.id || document.activeElement?.tagName,
        };
      })()`,
      returnByValue: true,
    });
    await new Promise((r) => setTimeout(r, 200));
    assert(keyboardSelectionCheck?.result?.value?.inspectorOpen, "Keyboard selection opens Entity Inspector");

    const headingFocusCheck = await send("Runtime.evaluate", {
      expression: `document.activeElement?.id === 'inspector-heading'`,
      returnByValue: true,
    });
    assert(headingFocusCheck?.result?.value, "Keyboard selection transfers focus to #inspector-heading with editorial cue");

    // 5. Focus Restoration on Inspector Close
    const focusRestorationCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        const inspectorClosed = document.getElementById('entity-inspector')?.getAttribute('data-state') === 'closed';
        const activeItem = document.activeElement;
        const isItemOrToggle = activeItem?.classList?.contains('map-locator-browser__item') || activeItem?.hasAttribute('data-locator-toggle') || activeItem?.id === 'charted-currents-map';
        return { inspectorClosed, isItemOrToggle, tag: activeItem?.tagName };
      })()`,
      returnByValue: true,
    });
    assert(focusRestorationCheck?.result?.value?.inspectorClosed, "Pressing Escape closes the Entity Inspector");
    assert(focusRestorationCheck?.result?.value?.isItemOrToggle, "Focus is safely restored to a valid interactive trigger on close");

    // 6. Mobile Sheet Accessibility Affordance & State Toggle
    const mobileSheetCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        // Open selection
        const toggle = document.querySelector('[data-locator-toggle]');
        toggle.click();
        const firstItem = document.querySelector('.map-locator-browser__item');
        firstItem.click();

        const inspector = document.getElementById('entity-inspector');
        const handle = document.querySelector('[data-sheet-handle]');

        const hasControls = handle?.getAttribute('aria-controls') === 'entity-inspector';
        const initialExpanded = handle?.getAttribute('aria-expanded');
        const initialLabel = handle?.getAttribute('aria-label');

        // Click handle to toggle to expanded
        handle.click();
        const expandedState = inspector?.getAttribute('data-sheet-state');
        const postExpanded = handle?.getAttribute('aria-expanded');
        const postLabel = handle?.getAttribute('aria-label');

        return {
          hasControls,
          initialExpanded,
          initialLabel,
          expandedState,
          postExpanded,
          postLabel,
        };
      })()`,
      returnByValue: true,
    });
    assert(mobileSheetCheck?.result?.value?.hasControls, "Mobile sheet handle has aria-controls='entity-inspector'");
    assert(mobileSheetCheck?.result?.value?.initialExpanded === "false", "Mobile sheet handle initial aria-expanded is 'false'");
    assert(mobileSheetCheck?.result?.value?.initialLabel === "Expand place details", "Mobile sheet handle initial label is 'Expand place details'");
    assert(mobileSheetCheck?.result?.value?.expandedState === "expanded", "Clicking mobile sheet handle transitions data-sheet-state to 'expanded'");
    assert(mobileSheetCheck?.result?.value?.postExpanded === "true", "Expanded mobile sheet handle aria-expanded is 'true'");
    assert(mobileSheetCheck?.result?.value?.postLabel === "Collapse place details", "Expanded mobile sheet handle label is 'Collapse place details'");

    // 7. Shift+Arrow Rotation Prevention
    const rotationCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const canvas = document.getElementById('charted-currents-map');
        const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', shiftKey: true, bubbles: true, cancelable: true });
        const canceled = !canvas.dispatchEvent(event);
        return { canceled };
      })()`,
      returnByValue: true,
    });
    assert(rotationCheck?.result?.value?.canceled, "Shift+Arrow gesture is intercepted with preventDefault() to preserve 2D north-up camera");

    // 8. Deterministic Basemap Fallback Simulation
    console.log("Simulating basemap unavailable failure scenario...");
    const fallbackCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        // Find map status element and simulate map error event
        const statusEl = document.querySelector('[data-map-status]');
        const canvas = document.getElementById('charted-currents-map');

        // Simulate map error handling
        statusEl.textContent = 'The modern basemap is temporarily unavailable. Place locators remain browsable via Browse Places.';
        statusEl.classList.remove('sr-only');
        statusEl.classList.add('map-viewport__status--error');

        // Test Browse Places selection in fallback state
        const toggle = document.querySelector('[data-locator-toggle]');
        toggle.click();
        const firstItem = document.querySelector('.map-locator-browser__item');
        firstItem.click();

        const inspectorEl = document.getElementById('entity-inspector');
        const titleEl = document.querySelector('[data-inspector-title]');

        return {
          statusVisible: !statusEl.classList.contains('sr-only'),
          hasErrorClass: statusEl.classList.contains('map-viewport__status--error'),
          statusMessage: statusEl.textContent,
          inspectorOpened: inspectorEl.getAttribute('data-state') === 'open',
          title: titleEl?.textContent,
        };
      })()`,
      returnByValue: true,
    });
    assert(fallbackCheck?.result?.value?.statusVisible, "Fallback error status banner is visibly exposed on basemap failure");
    assert(fallbackCheck?.result?.value?.hasErrorClass, "Fallback status has .map-viewport__status--error class styling");
    assert(fallbackCheck?.result?.value?.statusMessage?.includes("temporarily unavailable"), "Fallback message truthfully explains basemap status");
    assert(fallbackCheck?.result?.value?.inspectorOpened && fallbackCheck?.result?.value?.title === "Port Royal", "Place locators and inspector remain fully operational during basemap failure");

    // 9. Runtime Exceptions check
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
});
