import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const chromePath = "/home/erich/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const distDir = path.resolve("dist");

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
  let reqPath = req.url.split("?")[0];
  if (reqPath === "/" || reqPath === "") reqPath = "/index.html";
  const filePath = path.join(distDir, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(fs.readFileSync(filePath));
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(4321, "127.0.0.1", async () => {
  console.log("Static review server listening at http://127.0.0.1:4321");
  const port = 9290;
  const proc = spawn(chromePath, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--hide-scrollbars",
    `--remote-debugging-port=${port}`,
    "http://127.0.0.1:4321/",
  ]);

  await new Promise((r) => setTimeout(r, 2000));
  const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
  const targets = await listRes.json();
  const pageTarget = targets.find((t) => t.type === "page");
  if (!pageTarget) throw new Error("No page target found");

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  const send = (method, params = {}) =>
    new Promise((res) => {
      const id = Math.floor(Math.random() * 1000000);
      const handler = (evt) => {
        const data = JSON.parse(evt.data);
        if (data.id === id) {
          ws.removeEventListener("message", handler);
          res(data.result);
        }
      };
      ws.addEventListener("message", handler);
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send("Page.enable");
  await send("Runtime.enable");

  const viewports = [
    { name: "packet1-desktop-1440x900.png", width: 1440, height: 900 },
    { name: "packet1-ultrawide-3440x1440.png", width: 3440, height: 1440 },
    { name: "packet1-phone-390x844.png", width: 390, height: 844 },
    { name: "packet1-phone-430x932.png", width: 430, height: 932 },
  ];

  fs.mkdirSync("design/reviews", { recursive: true });

  for (const vp of viewports) {
    console.log(`Setting viewport ${vp.width}x${vp.height} for ${vp.name}...`);
    await send("Emulation.setDeviceMetricsOverride", {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.width < 500,
    });

    await send("Page.navigate", { url: "http://127.0.0.1:4321/" });
    await new Promise((r) => setTimeout(r, 3000));

    const screenshot = await send("Page.captureScreenshot", { format: "png" });
    if (screenshot && screenshot.data) {
      const outPath = path.resolve("design/reviews", vp.name);
      fs.writeFileSync(outPath, Buffer.from(screenshot.data, "base64"));
      console.log(`Saved ${vp.name} (${fs.statSync(outPath).size} bytes)`);
    }
  }

  // Also test interactive selection on desktop (1440x900)
  console.log("Testing interactive selection flow on desktop...");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send("Page.navigate", { url: "http://127.0.0.1:4321/" });
  await new Promise((r) => setTimeout(r, 2000));

  // Click place item in Browse Places
  await send("Runtime.evaluate", {
    expression: `(() => {
      const toggle = document.querySelector('[data-locator-toggle]');
      toggle?.click();
      const firstItem = document.querySelector('.map-locator-browser__item');
      firstItem?.click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 1200));

  const selectedScreenshot = await send("Page.captureScreenshot", { format: "png" });
  if (selectedScreenshot && selectedScreenshot.data) {
    const selectedOutPath = path.resolve("design/reviews/packet1-desktop-selected-1440x900.png");
    fs.writeFileSync(selectedOutPath, Buffer.from(selectedScreenshot.data, "base64"));
    console.log(`Saved selected desktop review capture (${fs.statSync(selectedOutPath).size} bytes)`);
  }

  // Also test interactive selection on mobile (390x844)
  console.log("Testing interactive selection flow on mobile...");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await send("Page.navigate", { url: "http://127.0.0.1:4321/" });
  await new Promise((r) => setTimeout(r, 2000));

  await send("Runtime.evaluate", {
    expression: `(() => {
      const toggle = document.querySelector('[data-locator-toggle]');
      toggle?.click();
      const firstItem = document.querySelector('.map-locator-browser__item');
      firstItem?.click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 1200));

  const mobileSelectedScreenshot = await send("Page.captureScreenshot", { format: "png" });
  if (mobileSelectedScreenshot && mobileSelectedScreenshot.data) {
    const mobileSelectedOutPath = path.resolve("design/reviews/packet1-phone-selected-390x844.png");
    fs.writeFileSync(mobileSelectedOutPath, Buffer.from(mobileSelectedScreenshot.data, "base64"));
    console.log(`Saved selected mobile review capture (${fs.statSync(mobileSelectedOutPath).size} bytes)`);
  }

  ws.close();
  proc.kill();
  server.close(() => {
    console.log("Capture script finished successfully");
    process.exit(0);
  });
});
