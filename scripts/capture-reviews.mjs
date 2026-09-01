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

  // Path traversal guard
  if (!filePath.startsWith(distDir)) {
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

  try {
    await new Promise((r) => setTimeout(r, 1500));
    const listRes = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
    const targets = await listRes.json();
    const pageTarget = targets.find((t) => t.type === "page");
    if (!pageTarget) throw new Error("No page target found in browser debugger");

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((r) => (ws.onopen = r));

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
        await new Promise((r) => setTimeout(r, 200));
      }
      return false;
    }

    const ready = await waitForMapReady();
    if (!ready) {
      console.warn("Warning: Map was not ready within timeout (proceeding with review capture)");
    } else {
      console.log("Map initialized and ready.");
    }

    const viewports = [
      { name: "packet1-desktop-1440x900.png", width: 1440, height: 900 },
      { name: "packet1-ultrawide-3440x1440.png", width: 3440, height: 1440 },
      { name: "packet1-phone-390x844.png", width: 390, height: 844 },
      { name: "packet1-phone-430x932.png", width: 430, height: 932 },
    ];

    fs.mkdirSync("design/reviews", { recursive: true });

    for (const vp of viewports) {
      console.log(`Capturing ${vp.name} (${vp.width}x${vp.height})...`);
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
        console.log(`Saved ${vp.name} (${fs.statSync(outPath).size} bytes)`);
      }
    }

    // Active selection capture on desktop (1440x900)
    console.log("Capturing desktop selected state...");
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
      console.log(`Saved packet1-desktop-selected-1440x900.png (${fs.statSync(selectedOutPath).size} bytes)`);
    }

    // Active selection capture on mobile (390x844)
    console.log("Capturing mobile selected state...");
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
      console.log(`Saved packet1-phone-selected-390x844.png (${fs.statSync(mobileSelectedOutPath).size} bytes)`);
    }

    // Verification assertion tests
    console.log("Running interactive assertion tests...");
    const assertions = await send("Runtime.evaluate", {
      expression: `(() => {
        const titleEl = document.querySelector('[data-inspector-title]');
        const coordsEl = document.querySelector('[data-inspector-coords]');
        const inspectorEl = document.getElementById('entity-inspector');
        const handleEl = document.querySelector('[data-sheet-handle]');

        return {
          inspectorOpen: inspectorEl?.getAttribute('data-state') === 'open',
          hasTitle: Boolean(titleEl?.textContent?.includes('Port Royal')),
          hasCoords: Boolean(coordsEl?.textContent?.includes('17.93738')),
          handleExpandedAria: handleEl?.getAttribute('aria-expanded'),
        };
      })()`,
      returnByValue: true,
    });

    console.log("Assertion results:", JSON.stringify(assertions?.result?.value, null, 2));

    ws.close();
  } finally {
    proc.kill();
    server.close(() => {
      console.log("Capture script finished successfully");
      process.exit(0);
    });
  }
});
