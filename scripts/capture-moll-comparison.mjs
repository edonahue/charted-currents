import http from "node:http";
import net from "node:net";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

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
        }
      }
    } catch {
      // Ignore
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
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
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

const CANDIDATE_C = {
  id: "candidate-c",
  label: "Candidate C (Canonical 13 GCPs)",
  url: "/assets/visuals/moll-west-indies-1715-rectified.webp",
  coordinates: [
    [-103.504252, 34.004028],
    [-54.900389, 34.004028],
    [-54.900389, 9.146624],
    [-103.504252, 9.146624],
  ],
};

const CANDIDATE_F1 = {
  id: "candidate-f1",
  label: "Candidate F1 (Regional 10 GCPs)",
  url: "/assets/visuals/review/moll-west-indies-1715-f1-regional.webp",
  coordinates: [
    [-102.229315, 34.773944],
    [-55.659716, 34.773944],
    [-55.659716, 8.664943],
    [-102.229315, 8.664943],
  ],
};

const VIEWPORTS = [
  {
    name: "caribbean-wide",
    title: "1. Greater Caribbean wide",
    center: [-75.0, 20.0],
    zoom: 4.2,
  },
  {
    name: "cuba-jamaica-hispaniola",
    title: "2. Cuba / Jamaica / Hispaniola",
    center: [-75.5, 20.0],
    zoom: 5.5,
  },
  {
    name: "havana",
    title: "3. Havana",
    center: [-82.35, 23.14],
    zoom: 7.5,
  },
  {
    name: "jamaica-port-royal",
    title: "4. Jamaica / Port Royal",
    center: [-76.84, 17.94],
    zoom: 7.5,
  },
  {
    name: "hispaniola-puerto-rico",
    title: "5. Hispaniola / Puerto Rico",
    center: [-68.0, 18.5],
    zoom: 6.0,
  },
  {
    name: "willemstad-southern",
    title: "6. Willemstad / southern Caribbean",
    center: [-68.93, 12.11],
    zoom: 7.0,
  },
  {
    name: "cartagena-portobelo",
    title: "7. Cartagena / Portobelo",
    center: [-77.5, 10.0],
    zoom: 6.2,
  },
  {
    name: "barbados-eastern",
    title: "8. Barbados / eastern edge",
    center: [-59.62, 13.1],
    zoom: 7.0,
  },
  {
    name: "florida-northern",
    title: "9. Florida / northern edge",
    center: [-81.0, 29.5],
    zoom: 6.0,
  },
];

async function main() {
  const serverPort = await getAvailablePort();
  await new Promise((resolve) => server.listen(serverPort, "127.0.0.1", resolve));
  const baseUrl = `http://127.0.0.1:${serverPort}/`;

  const debugPort = await getAvailablePort();
  const chromeBin = findBrowserExecutable();
  const tmpUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cc-cdp-moll-"));

  const proc = spawn(
    chromeBin,
    [
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      `--user-data-dir=${tmpUserDataDir}`,
      "--remote-debugging-address=127.0.0.1",
      `--remote-debugging-port=${debugPort}`,
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-webgl",
      "--hide-scrollbars",
      "about:blank",
    ],
    { stdio: "pipe" }
  );

  try {
    let targets = null;
    const startTime = Date.now();
    while (Date.now() - startTime < 25000) {
      try {
        const listRes = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
        if (listRes.ok) {
          targets = await listRes.json();
          if (Array.isArray(targets) && targets.length > 0) break;
        }
      } catch {
        // Wait
      }
      await new Promise((r) => setTimeout(r, 200));
    }

    const pageTarget = targets.find((t) => t.type === "page") || targets[0];
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
    await send("Page.addScriptToEvaluateOnNewDocument", {
      source: "window.__ENABLE_MAP_TEST_HARNESS__ = true;",
    });

    await send("Page.navigate", { url: baseUrl });

    // Wait for map
    let ready = false;
    for (let i = 0; i < 60; i++) {
      const check = await send("Runtime.evaluate", {
        expression: `Boolean(document.getElementById("charted-currents-map")?.dataset.mapReady === "true" && window.__CC_MAP__?.isStyleLoaded())`,
        returnByValue: true,
      });
      if (check.result?.value) {
        ready = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    if (!ready) throw new Error("MapLibre style did not load in time.");

    await send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // Ensure period map layer is turned on with opacity 0.65
    await send("Runtime.evaluate", {
      expression: `(() => {
        const m = window.__CC_MAP__;
        if (m.getLayer('historical-reference-moll-1715-layer')) {
          m.setLayoutProperty('historical-reference-moll-1715-layer', 'visibility', 'visible');
          m.setPaintProperty('historical-reference-moll-1715-layer', 'raster-opacity', 0.65);
        }
      })()`,
    });

    const reviewsDir = path.resolve("design/reviews");
    fs.mkdirSync(reviewsDir, { recursive: true });

    console.log("=== CAPTURING PAIRED C-vs-F1 MAPLIBRE SCREENSHOTS (9 VIEWPORTS) ===");

    for (const vp of VIEWPORTS) {
      console.log(`\nView: ${vp.title} (center: [${vp.center}], zoom: ${vp.zoom})`);

      // Set view
      await send("Runtime.evaluate", {
        expression: `(() => {
          const m = window.__CC_MAP__;
          m.jumpTo({ center: [${vp.center[0]}, ${vp.center[1]}], zoom: ${vp.zoom}, bearing: 0, pitch: 0 });
        })()`,
      });
      await new Promise((r) => setTimeout(r, 600));

      // 1. Candidate C
      await send("Runtime.evaluate", {
        expression: `(() => {
          const m = window.__CC_MAP__;
          const src = m.getSource('historical-reference-moll-1715');
          if (src && src.updateImage) {
            src.updateImage({
              url: '${CANDIDATE_C.url}',
              coordinates: ${JSON.stringify(CANDIDATE_C.coordinates)}
            });
          }
        })()`,
      });
      await new Promise((r) => setTimeout(r, 600));

      const shotC = await send("Page.captureScreenshot", { format: "png" });
      const pathC = path.join(reviewsDir, `moll-candidate-c-${vp.name}.png`);
      fs.writeFileSync(pathC, Buffer.from(shotC.data, "base64"));
      const sizeC = fs.statSync(pathC).size;
      console.log(`  [SAVED] moll-candidate-c-${vp.name}.png (${sizeC} bytes)`);

      // 2. Candidate F1
      await send("Runtime.evaluate", {
        expression: `(() => {
          const m = window.__CC_MAP__;
          const src = m.getSource('historical-reference-moll-1715');
          if (src && src.updateImage) {
            src.updateImage({
              url: '${CANDIDATE_F1.url}',
              coordinates: ${JSON.stringify(CANDIDATE_F1.coordinates)}
            });
          }
        })()`,
      });
      await new Promise((r) => setTimeout(r, 600));

      const shotF1 = await send("Page.captureScreenshot", { format: "png" });
      const pathF1 = path.join(reviewsDir, `moll-candidate-f1-${vp.name}.png`);
      fs.writeFileSync(pathF1, Buffer.from(shotF1.data, "base64"));
      const sizeF1 = fs.statSync(pathF1).size;
      console.log(`  [SAVED] moll-candidate-f1-${vp.name}.png (${sizeF1} bytes)`);

      // Restore Candidate C
      await send("Runtime.evaluate", {
        expression: `(() => {
          const m = window.__CC_MAP__;
          const src = m.getSource('historical-reference-moll-1715');
          if (src && src.updateImage) {
            src.updateImage({
              url: '${CANDIDATE_C.url}',
              coordinates: ${JSON.stringify(CANDIDATE_C.coordinates)}
            });
          }
        })()`,
      });
    }

    ws.close();
    console.log("\n[SUCCESS] All 18 comparison screenshots successfully captured under identical conditions.");
  } finally {
    proc.kill();
    fs.rmSync(tmpUserDataDir, { recursive: true, force: true });
    server.close();
  }
}

main().catch((e) => {
  console.error("[FAIL]", e);
  process.exit(1);
});
