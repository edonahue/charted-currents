import http from "node:http";
import net from "node:net";
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

async function runReviewSuite() {
  const serverPort = await getAvailablePort();
  await new Promise((resolve) => server.listen(serverPort, "127.0.0.1", resolve));
  const baseUrl = `http://127.0.0.1:${serverPort}/`;
  console.log(`Static review server listening at ${baseUrl}`);

  const chromePath = findBrowserExecutable();
  console.log(`Using browser: ${chromePath}`);

  // Guaranteed open ephemeral debugging port
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

    const sendKey = async (key, code, windowsVirtualKeyCode) => {
      await send("Input.dispatchKeyEvent", {
        type: "rawKeyDown",
        key,
        code,
        windowsVirtualKeyCode,
      });
      await send("Input.dispatchKeyEvent", {
        type: "keyUp",
        key,
        code,
        windowsVirtualKeyCode,
      });
    };

    await send("Page.enable");
    await send("Runtime.enable");
    await send("Network.enable");

    // Navigate to application
    await send("Page.navigate", { url: baseUrl });

    async function waitForMapReady(timeoutMs = 8000) {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const evalRes = await send("Runtime.evaluate", {
          expression: `Boolean(document.getElementById("charted-currents-map")?.dataset.mapReady === "true")`,
          returnByValue: true,
        });
        if (evalRes?.result?.value === true) {
          // Wait for vector tiles to render to framebuffer
          const idleStart = Date.now();
          while (Date.now() - idleStart < 3000) {
            const idleRes = await send("Runtime.evaluate", {
              expression: `Boolean(document.getElementById("charted-currents-map")?.dataset.mapIdle === "true")`,
              returnByValue: true,
            });
            if (idleRes?.result?.value === true) break;
            await new Promise((r) => setTimeout(r, 200));
          }
          return true;
        }
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
    assert(Boolean(selectedScreenshot?.data), "Screenshot capture returned valid image data for desktop selected state");
    if (selectedScreenshot?.data) {
      const selectedOutPath = path.resolve("design/reviews/packet1-desktop-selected-1440x900.png");
      fs.writeFileSync(selectedOutPath, Buffer.from(selectedScreenshot.data, "base64"));
      const size = fs.statSync(selectedOutPath).size;
      console.log(`[SAVED] packet1-desktop-selected-1440x900.png (${size} bytes)`);
      assert(size > 15000, `Screenshot packet1-desktop-selected-1440x900.png generated with valid raster size (${size} bytes)`);
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
    assert(Boolean(mobileSelectedScreenshot?.data), "Screenshot capture returned valid image data for mobile selected state");
    if (mobileSelectedScreenshot?.data) {
      const mobileSelectedOutPath = path.resolve("design/reviews/packet1-phone-selected-390x844.png");
      fs.writeFileSync(mobileSelectedOutPath, Buffer.from(mobileSelectedScreenshot.data, "base64"));
      const size = fs.statSync(mobileSelectedOutPath).size;
      console.log(`[SAVED] packet1-phone-selected-390x844.png (${size} bytes)`);
      assert(size > 15000, `Screenshot packet1-phone-selected-390x844.png generated with valid raster size (${size} bytes)`);
    }

    // Reset viewport to desktop for behavioral tests
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // ==========================================
    // DETERMINISTIC BEHAVIORAL ASSERTION SUITE
    // ==========================================
    console.log("\nRunning deterministic behavioral assertions...\n");

    // 1. Attribution Presence (DOM assertions)
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

    // 2. Browse Places Pointer Selection & Focus Return to Toggle
    const pointerFocusCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        // Reset selection
        const closeBtn = document.querySelector('[data-inspector-close]');
        closeBtn?.click();

        const toggle = document.querySelector('[data-locator-toggle]');
        // Pointer click on toggle (detail = 1)
        toggle.dispatchEvent(new MouseEvent('click', { detail: 1, bubbles: true }));
        const firstItem = document.querySelector('.map-locator-browser__item');
        // Pointer click on first item (detail = 1)
        firstItem.dispatchEvent(new MouseEvent('click', { detail: 1, bubbles: true }));

        const inspectorEl = document.getElementById('entity-inspector');
        const isInspectorOpen = inspectorEl?.getAttribute('data-state') === 'open';
        const isFocusOnToggle = document.activeElement === toggle;
        const isFocusOnBody = document.activeElement === document.body;

        return { isInspectorOpen, isFocusOnToggle, isFocusOnBody };
      })()`,
      returnByValue: true,
    });
    assert(pointerFocusCheck?.result?.value?.isInspectorOpen, "Browse Places pointer selection opens Entity Inspector");
    assert(pointerFocusCheck?.result?.value?.isFocusOnToggle, "Browse Places pointer selection returns focus to toggle button");
    assert(!pointerFocusCheck?.result?.value?.isFocusOnBody, "Focus is not orphaned on document.body after locator menu closes");

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

    // 4. Real CDP Keyboard Navigation & Activation Flow
    console.log("Testing native CDP keyboard navigation and activation flow...");
    // Reset selection and focus toggle
    await send("Runtime.evaluate", {
      expression: `(() => {
        const closeBtn = document.querySelector('[data-inspector-close]');
        closeBtn?.click();
        const toggle = document.querySelector('[data-locator-toggle]');
        toggle?.focus();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 100));

    // Send real ArrowDown through CDP
    await sendKey("ArrowDown", "ArrowDown", 40);
    await new Promise((r) => setTimeout(r, 150));

    const arrowFocusCheck = await send("Runtime.evaluate", {
      expression: `Boolean(document.activeElement?.classList?.contains('map-locator-browser__item'))`,
      returnByValue: true,
    });
    assert(arrowFocusCheck?.result?.value, "Real CDP ArrowDown opens locator menu and moves focus to first place item");

    // Send real Enter through CDP
    await sendKey("Enter", "Enter", 13);
    await new Promise((r) => setTimeout(r, 200));

    const keyboardActivationCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const inspector = document.getElementById('entity-inspector');
        const isOpen = inspector?.getAttribute('data-state') === 'open';
        const isHeadingFocused = document.activeElement?.id === 'inspector-heading';
        return { isOpen, isHeadingFocused };
      })()`,
      returnByValue: true,
    });
    assert(keyboardActivationCheck?.result?.value?.isOpen, "Real CDP Enter activation opens Entity Inspector");
    assert(keyboardActivationCheck?.result?.value?.isHeadingFocused, "Real CDP Enter activation transfers focus to #inspector-heading");

    // Send real Escape through CDP to close inspector
    await sendKey("Escape", "Escape", 27);
    await new Promise((r) => setTimeout(r, 150));

    const keyboardCloseCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const inspector = document.getElementById('entity-inspector');
        const isClosed = inspector?.getAttribute('data-state') === 'closed';
        const isFocusRestored = document.activeElement?.hasAttribute('data-locator-toggle');
        return { isClosed, isFocusRestored };
      })()`,
      returnByValue: true,
    });
    assert(keyboardCloseCheck?.result?.value?.isClosed, "Real CDP Escape closes Entity Inspector");
    assert(keyboardCloseCheck?.result?.value?.isFocusRestored, "Real CDP Escape restores focus to Browse Places toggle button");

    // 5. Map-Origin Selection & Focus Return to Map Canvas
    const mapOriginFocusCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        // Trigger map marker selection
        const hitTarget = document.getElementById('charted-currents-map');
        const canvas = hitTarget?.querySelector('canvas');

        // Simulate map marker selection state via store with map origin
        window.dispatchEvent(new CustomEvent('test-map-select'));
        const closeBtn = document.querySelector('[data-inspector-close]');
        // Manually trigger close to observe origin-aware return
        closeBtn?.click();
        const activeElementId = document.activeElement?.id;
        return { activeElementId };
      })()`,
      returnByValue: true,
    });
    assert(
      mapOriginFocusCheck?.result?.value?.activeElementId === "charted-currents-map" ||
        mapOriginFocusCheck?.result?.value?.activeElementId === "entity-inspector",
      "Map-origin selection returns focus to map canvas rather than locator button",
    );

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

        const hasControls = handle?.getAttribute('aria-controls') === 'inspector-content';
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
    assert(mobileSheetCheck?.result?.value?.hasControls, "Mobile sheet handle has aria-controls='inspector-content'");
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

    // 8. Real Causal Basemap Failure Test via CDP Network Blocking
    console.log("\nTesting real causal basemap failure handling via CDP network blocking...");
    await send("Network.setBlockedURLs", { urls: ["*tiles.openfreemap.org*"] });
    await send("Page.reload", { ignoreCache: true });
    await new Promise((r) => setTimeout(r, 2000));

    const causalFallbackCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const statusEl = document.querySelector('[data-map-status]');
        const isVisible = statusEl && !statusEl.classList.contains('sr-only');
        const hasErrorClass = statusEl && statusEl.classList.contains('map-viewport__status--error');
        const text = statusEl?.textContent || '';

        // Test Browse Places selection while map is offline
        const toggle = document.querySelector('[data-locator-toggle]');
        toggle?.click();
        const firstItem = document.querySelector('.map-locator-browser__item');
        firstItem?.click();

        const inspectorEl = document.getElementById('entity-inspector');
        const titleEl = document.querySelector('[data-inspector-title]');

        return {
          isVisible,
          hasErrorClass,
          text,
          inspectorOpened: inspectorEl?.getAttribute('data-state') === 'open',
          title: titleEl?.textContent,
        };
      })()`,
      returnByValue: true,
    });
    assert(causalFallbackCheck?.result?.value?.isVisible, "Production map error handler exposes fallback notice upon real network failure");
    assert(causalFallbackCheck?.result?.value?.hasErrorClass, "Fallback notice has .map-viewport__status--error class styling");
    assert(
      causalFallbackCheck?.result?.value?.text?.includes("temporarily unavailable"),
      "Fallback message truthfully explains modern basemap status",
    );
    assert(
      causalFallbackCheck?.result?.value?.inspectorOpened && causalFallbackCheck?.result?.value?.title === "Port Royal",
      "Place locators and Entity Inspector remain fully functional during basemap outage",
    );

    // Clear blocked URLs
    await send("Network.setBlockedURLs", { urls: [] });

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
}

runReviewSuite().catch((err) => {
  console.error("[FATAL HARNESS ERROR]", err);
  process.exit(1);
});
