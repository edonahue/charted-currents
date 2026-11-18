#!/usr/bin/env node
/** Native spatial review against an existing production build.
 * Run: node scripts/review-spatial.mjs [--dist-dir=dist] [--output-dir=test-results/spatial]
 * Requires a local Chromium/Chrome (CHROME_BIN/BROWSER_PATH or Playwright cache).
 * Uses actual CDP pointer/key/browser-history commands; explicit fault injection
 * verifies the unavailable-globe handler, not unsupported physical hardware.
 */
import http from "node:http";
import net from "node:net";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";

const options = new Map(process.argv.slice(2).map((argument) => {
  const match = /^--(dist-dir|output-dir)=(.+)$/.exec(argument);
  if (!match) throw new Error(`Unknown argument: ${argument}`);
  return [match[1], match[2]];
}));
const distDir = path.resolve(options.get("dist-dir") || "dist");
const outputDir = path.resolve(options.get("output-dir") || "test-results/spatial");
if (!fs.existsSync(path.join(distDir, "index.html"))) throw new Error("Production build absent. Run npm run build first.");
fs.mkdirSync(outputDir, { recursive: true });
const report = { timestamp: new Date().toISOString(), status: "running", browser: null, checks: {}, screenshots: [], limitations: ["Software WebGL in a local headless browser; no physical-device or unsupported-GPU claim."] };
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function browserExecutable() {
  const custom = process.env.CHROME_BIN || process.env.BROWSER_PATH;
  if (custom && fs.existsSync(custom)) return custom;
  const candidates = ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium-browser", "/usr/bin/chromium", "/usr/bin/chrome", "/snap/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium"];
  for (const candidate of candidates) if (fs.existsSync(candidate)) return candidate;
  const cache = path.join(os.homedir(), ".cache", "ms-playwright");
  if (fs.existsSync(cache)) for (const entry of fs.readdirSync(cache).sort((a,b) => b.localeCompare(a, undefined, {numeric:true}))) {
    if (!entry.startsWith("chromium-")) continue;
    for (const executable of ["chrome-linux64/chrome", "chrome-linux/chrome", "chrome-mac/Chromium.app/Contents/MacOS/Chromium"]) {
      const candidate = path.join(cache, entry, executable);
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  throw new Error("No Chrome/Chromium found. Set CHROME_BIN to an installed browser.");
}
function availablePort() {
  return new Promise((resolve, reject) => {
    const socket = net.createServer();
    socket.on("error", reject);
    socket.listen(0, "127.0.0.1", () => { const port = socket.address().port; socket.close(() => resolve(port)); });
  });
}
const mimeTypes = { ".html":"text/html", ".css":"text/css", ".js":"application/javascript", ".mjs":"application/javascript", ".json":"application/json", ".geojson":"application/geo+json", ".png":"image/png", ".jpg":"image/jpeg", ".webp":"image/webp", ".svg":"image/svg+xml", ".woff2":"font/woff2", ".woff":"font/woff" };
const server = http.createServer((request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname); } catch { response.writeHead(400).end(); return; }
  const file = path.resolve(distDir, "." + (pathname === "/" ? "/index.html" : pathname));
  const relative = path.relative(distDir, file);
  if (relative.startsWith("..") || path.isAbsolute(relative)) { response.writeHead(403).end(); return; }
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404).end(); return; }
  response.writeHead(200, { "Content-Type": mimeTypes[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(response);
});
let proc;
let profile;
let ws;
try {
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  const baseUrl = `http://127.0.0.1:${server.address().port}/`;
  const port = await availablePort();
  profile = fs.mkdtempSync(path.join(os.tmpdir(), "cc-spatial-"));
  proc = spawn(browserExecutable(), ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--hide-scrollbars", `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, "about:blank"], {stdio:"ignore"});
  let launchError;
  proc.on("error", (error) => { launchError = error; });
 let targets;
 for(let n=0;n<200;n++){if(launchError)throw launchError;if(proc.exitCode!==null)throw new Error('Browser exited before CDP startup');try{targets=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();if(targets.length)break}catch{} await delay(100)}
 if(!targets?.length)throw new Error('Browser CDP did not start within 20 seconds');
 ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
 let serial=0;const errors=[];const pending=new Map();
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.id){const p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result)}}};
 const send = (method, params = {}) => new Promise((resolve, reject) => {
   const id = ++serial;
   const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timed out: ${method}`)); }, 15000);
   pending.set(id, {resolve, reject, timer});
   ws.send(JSON.stringify({id, method, params}));
 });
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value};
 const until=async(expression,limit=60000)=>{const t=Date.now();while(Date.now()-t<limit){if(await evaluate(expression))return;await delay(100)}throw new Error('Timed out '+expression)};
 const click=async(selector)=>{const rect=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:"nearest"});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...rect});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...rect})};
 const key=async(key,code)=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:key==='Enter'?13:32,text:key==='Enter'?'\r':' ',unmodifiedText:key==='Enter'?'\r':' '});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:key==='Enter'?13:32});await delay(100)};
 const shot=async name=>{await delay(500);const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(outputDir,name+'.png'),Buffer.from(r.data,'base64'))};
 await send('Runtime.enable');await send('Page.enable');await send('Page.bringToFront');
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await send('Page.addScriptToEvaluateOnNewDocument',{source:'window.__ENABLE_MAP_TEST_HARNESS__=true'});
 await send('Page.navigate',{url:baseUrl});
 await until(`Boolean(window.__CC_MAP__?.getLayer('historical-ports-core'))`);
 await until('window.__CC_MAP__.isStyleLoaded()');await shot('cc-spatial-regional');
 assert.equal(await evaluate('window.__CC_MAP__.getProjection()?.type'),'mercator');
 // Native Shift+arrows must not rotate/pitch the north-up map, while ordinary
 // arrow keys still pan. Focus MapLibre's real canvas, not its outer wrapper.
 await evaluate('window.__CC_MAP__.getCanvas().focus()');
 const nativeMapKey = async (key, code, virtualKey, modifiers = 0) => {
   await send('Input.dispatchKeyEvent',{type:'rawKeyDown',key,code,windowsVirtualKeyCode:virtualKey,modifiers});
   await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:virtualKey,modifiers});
   await delay(400);
 };
 await nativeMapKey('ArrowRight','ArrowRight',39,8);
 await nativeMapKey('ArrowUp','ArrowUp',38,8);
 const nativeNorth = await evaluate('({bearing:window.__CC_MAP__.getBearing(),pitch:window.__CC_MAP__.getPitch(),pinch:window.__CC_MAP__.touchZoomRotate.isEnabled()})');
 assert.ok(Math.abs(nativeNorth.bearing)<.001&&Math.abs(nativeNorth.pitch)<.001,'native Shift+arrows preserve north-up2D');
 assert.equal(nativeNorth.pinch,true,'pinch zoom stays enabled');
 const beforeArrowPan = await evaluate('window.__CC_MAP__.getCenter().toArray()');
 await nativeMapKey('ArrowRight','ArrowRight',39);
 assert.notDeepEqual(await evaluate('window.__CC_MAP__.getCenter().toArray()'),beforeArrowPan,'ordinary native arrow pan stays enabled');
 // Deferred image: inspect network entries before and after actual activation.
 const initialMoll = await evaluate(`(()=>{const path=new URL(document.querySelector('[data-layer-control]').dataset.rectifiedUrl,location.href).pathname;return {source:!!window.__CC_MAP__.getSource('historical-reference-moll-1715'),requests:performance.getEntriesByType('resource').filter(e=>new URL(e.name).pathname===path).length}})()`);
 assert.deepEqual(initialMoll,{source:false,requests:0});
 assert.equal(await evaluate("Boolean(window.__CC_MAP__.getSource('cc-coordinate-grid'))"), false,
   "regional startup does not load the optional ocean coordinate grid");
 await click('[data-layer-toggle]');await click('[data-layer-visibility-checkbox]');
 await until(`window.__CC_MAP__.isSourceLoaded('historical-reference-moll-1715')`);
 const loadedMoll=await evaluate(`(()=>{const layers=window.__CC_MAP__.getStyle().layers.map(l=>l.id);const path=new URL(document.querySelector('[data-layer-control]').dataset.rectifiedUrl,location.href).pathname;return {underRoutes:layers.indexOf('historical-reference-moll-1715-layer')<layers.indexOf('historical-routes-line'),requests:performance.getEntriesByType('resource').filter(e=>new URL(e.name).pathname===path).length}})()`);
 assert.equal(loadedMoll.underRoutes,true);assert.equal(loadedMoll.requests,1);

 const comparisonCenter=await evaluate('window.__CC_MAP__.getCenter().toArray()');
 await evaluate(`document.querySelector('[data-map-comparison="chart"]').focus()`);await key('Enter','Enter');
 assert.equal(await evaluate(`window.__CC_MAP__.getPaintProperty('historical-reference-moll-1715-layer','raster-opacity')`),1);
 await shot('cc-spatial-registered-chart');
 await click('[data-layer-inspect-btn]');
 await until(`document.querySelector('#source-drawer')?.getAttribute('data-state')==='open' && Boolean(document.querySelector('.source-reference-image img'))`);
 await evaluate(`document.querySelector('.source-reference-image img').scrollIntoView({block:'nearest'})`);
 await until(`document.querySelector('.source-reference-image img').complete && document.querySelector('.source-reference-image img').naturalWidth>0`);
 await until(`document.getElementById('charted-currents-map').getBoundingClientRect().right <= document.querySelector('.source-drawer-panel').getBoundingClientRect().left + 2`);
 const sourceComparison=await evaluate(`(()=>{const m=document.getElementById('charted-currents-map').getBoundingClientRect();const source=document.querySelector('.source-drawer-panel').getBoundingClientRect();const image=document.querySelector('.source-reference-image img');return {spread:document.querySelector('.app-shell').dataset.readingOpen==='true',mapBesideSource:m.right<=source.left+2,sourceImageDistinct:new URL(image.src).pathname!==new URL(document.querySelector('[data-layer-control]').dataset.rectifiedUrl,location.href).pathname,registeredVisible:window.__CC_MAP__.getLayoutProperty('historical-reference-moll-1715-layer','visibility')==='visible'}})()`);
 assert.deepEqual(sourceComparison,{spread:true,mapBesideSource:true,sourceImageDistinct:true,registeredVisible:true});
 await shot('cc-spatial-source-comparison');
 await click('[data-source-drawer-close]');await delay(300);
 const sourceFocusReturn=await evaluate(`({focused:document.activeElement===document.querySelector('[data-layer-inspect-btn]'),visible:document.querySelector('[data-layer-inspect-btn]').getClientRects().length>0,panelOpen:!document.querySelector('[data-layer-panel]').hidden})`);
 assert.deepEqual(sourceFocusReturn,{focused:true,visible:true,panelOpen:true},'source close must return focus to a visible period-map trigger');


 await click('[data-map-comparison="modern"]');
 assert.equal(await evaluate(`window.__CC_MAP__.getLayoutProperty('historical-reference-moll-1715-layer','visibility')`),'none');
 await click('[data-map-comparison="blend"]');
 assert.equal(await evaluate(`window.__CC_MAP__.getPaintProperty('historical-reference-moll-1715-layer','raster-opacity')`),0.65);
 assert.deepEqual(await evaluate('window.__CC_MAP__.getCenter().toArray()'),comparisonCenter,'comparison must keep geographic view');
 await click('[data-layer-visibility-checkbox]');await click('[data-layer-panel-close]');
 // Click an actual single-record connector interior, independently resolved
 // from the published display edge, with no overlapping port hit target.
 const routes = JSON.parse(fs.readFileSync(path.join(distDir, 'data/routes.geojson'), 'utf8'));
 const singleEdges = routes.features.filter(feature => feature.properties.record_count === 1 && feature.properties.constituent_vessel_ids.length === 1)
   .map(feature => ({id:feature.properties.id, vesselId:feature.properties.constituent_vessel_ids[0], coordinates:feature.geometry.coordinates}));
 assert.ok(singleEdges.length);
 await click('[data-map-view="atlantic"]');await until('!window.__CC_MAP__.isMoving()');
 const connectorTarget = await evaluate(`(()=>{const map=window.__CC_MAP__;const edges=${JSON.stringify(singleEdges)};const r=map.getContainer().getBoundingClientRect();for(const edge of edges){for(let i=1;i<edge.coordinates.length;i++){const a=map.project(edge.coordinates[i-1]);const b=map.project(edge.coordinates[i]);const p={x:(a.x+b.x)/2,y:(a.y+b.y)/2};if(p.x<50||p.x>r.width-50||p.y<50||p.y>r.height-50)continue;if(map.queryRenderedFeatures([p.x,p.y],{layers:['historical-ports-hit-target']}).length)continue;const top=map.queryRenderedFeatures([p.x,p.y],{layers:['historical-routes-hit-target']})[0];const reviewed=edges.find(candidate=>candidate.id===top?.properties.id);if(reviewed)return {x:r.left+p.x,y:r.top+p.y,id:reviewed.id,vesselId:reviewed.vesselId};}}return null;})()`);
 assert.ok(connectorTarget,'a reviewed single-vessel connector has an unobstructed interior');
 await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,x:connectorTarget.x,y:connectorTarget.y});
 await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:connectorTarget.x,y:connectorTarget.y});
 await until(`window.__CC_SELECTION_STORE__?.get()?.kind==='ship' && window.__CC_SELECTION_STORE__.get().id===${JSON.stringify(connectorTarget.vesselId)} && !document.querySelector('#inspector-content').hasAttribute('aria-busy')`);
 const singleConnectorSelection = await evaluate('window.__CC_SELECTION_STORE__.get()');
 assert.equal(singleConnectorSelection.id,connectorTarget.vesselId);
 await click('[data-inspector-close]');
 // Native keyboard invocation of globe mode.
 await evaluate(`window.__nativeEvents=[];['keydown','keyup','click'].forEach(type=>document.addEventListener(type,e=>window.__nativeEvents.push({type:e.type,key:e.key,target:e.target.tagName,view:e.target.dataset?.mapView,trusted:e.isTrusted,defaultPrevented:e.defaultPrevented}),true))`);
 await send('Page.bringToFront');
 await evaluate(`document.querySelector('[data-map-view="globe"]').focus()`);
 const desktopGlobeStart = performance.now();
 await key('Enter','Enter');
 assert.equal(await evaluate(`window.__nativeEvents.some(event=>event.type==='click' && event.view==='globe' && event.trusted)`),true,'globe must activate through a trusted native click');
 assert.equal(await evaluate('window.__CC_MAP__.getProjection()?.type'),'globe','native Enter must activate globe'); await until(`window.__CC_MAP__.getProjection()?.type==='globe' && !window.__CC_MAP__.isMoving()`,10000);
 const desktopGlobeActivationMs = performance.now() - desktopGlobeStart;
 assert.equal(await evaluate("window.__CC_MAP__.getLayoutProperty('cc-coordinate-grid','visibility')"), "visible");
 await shot('cc-spatial-globe');
 await click('[data-layer-toggle]');await click('[data-layer-visibility-checkbox]');
 assert.equal(await evaluate("window.__CC_MAP__.getLayoutProperty('cc-coordinate-grid','visibility')"), "none",
   "registered chart comparison suppresses the modern coordinate grid");
 await click('[data-layer-visibility-checkbox]');await click('[data-layer-panel-close]');
 assert.equal(await evaluate("window.__CC_MAP__.getLayoutProperty('cc-coordinate-grid','visibility')"), "visible",
   "returning to the modern globe restores the coordinate grid");
 await evaluate(`void window.__CC_MAP__.jumpTo({bearing:24,pitch:20})`);
 await click('[data-map-north]');await until('!window.__CC_MAP__.isMoving()');
 const north=await evaluate('({bearing:window.__CC_MAP__.getBearing(),pitch:window.__CC_MAP__.getPitch()})');assert.ok(Math.abs(north.bearing)<.001&&Math.abs(north.pitch)<.001);
 // Browser-native Back/Forward restores explicit settled geography.
 await click('[data-map-view="atlantic"]');await until('!window.__CC_MAP__.isMoving()');
 const atlanticURL=await evaluate('location.href');
 await click('[data-map-view="globe"]');await delay(100);
 assert.equal(await evaluate('location.href'),atlanticURL,'in-flight mode must remain transient');
 await until('!window.__CC_MAP__.isMoving()');
 const globeURL=await evaluate('location.href');assert.notEqual(globeURL,atlanticURL);
 const history=await send('Page.getNavigationHistory');
 await send('Page.navigateToHistoryEntry',{entryId:history.entries[history.currentIndex-1].id});
 await until(`location.href===${JSON.stringify(atlanticURL)} && window.__CC_MAP__.getProjection()?.type==='mercator'`);await delay(150);
 const backCenter=await evaluate('window.__CC_MAP__.getCenter().toArray()');assert.ok(Math.abs(backCenter[0]+40)<.001 && Math.abs(backCenter[1]-25)<.001);
 await send('Page.navigateToHistoryEntry',{entryId:history.entries[history.currentIndex].id});
 await until(`location.href===${JSON.stringify(globeURL)} && window.__CC_MAP__.getProjection()?.type==='globe'`);
 await click('[data-map-view="caribbean"]');await until('!window.__CC_MAP__.isMoving()');
 // Native initial selection must not throw and a visible point must not travel.
 await evaluate(`void window.__CC_MAP__.jumpTo({center:[-76,20],zoom:3.5})`);
 const before=await evaluate('window.__CC_MAP__.getCenter().toArray()');
 await click('[data-locator-toggle]');
 const ids=await evaluate(`Array.from(document.querySelectorAll('[data-place-id]')).map(e=>({id:e.dataset.placeId,label:e.textContent}))`);
 const royal=ids.find(x=>/Port Royal/.test(x.label));assert.ok(royal);
 await click(`[data-place-id="${royal.id}"]`);await delay(1100);
 const after=await evaluate('window.__CC_MAP__.getCenter().toArray()');
 assert.ok(Math.abs(before[0]-after[0])<.01&&Math.abs(before[1]-after[1])<.01,'visible port selection moved camera');
 // A map-origin selection returns to the actual keyboard-enabled canvas.
 await click('[data-inspector-close]');
 await delay(350);
 const mapPoint=await evaluate(`(()=>{const m=window.__CC_MAP__;const feature=m.querySourceFeatures('historical-ports').find(f=>f.properties.id===${JSON.stringify(royal.id)});if(!feature)return null;const p=m.project(feature.geometry.coordinates),r=m.getContainer().getBoundingClientRect();return{x:r.left+p.x,y:r.top+p.y};})()`);
 assert.ok(mapPoint);
 await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...mapPoint});
 await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...mapPoint});
 await until(`window.__CC_SELECTION_STORE__?.get()?.kind==='port' && window.__CC_SELECTION_STORE__.get().id===${JSON.stringify(royal.id)}`);
 await click('[data-inspector-close]');
 assert.equal(await evaluate('document.activeElement===window.__CC_MAP__.getCanvas()'),true,'closing a map-origin record returns focus to the real map canvas');
 const beforeReturnPan=await evaluate('window.__CC_MAP__.getCenter().toArray()');
 await nativeMapKey('ArrowRight','ArrowRight',39);
 assert.notDeepEqual(await evaluate('window.__CC_MAP__.getCenter().toArray()'),beforeReturnPan,'native arrow pan works immediately after map focus return');
 // Cancel an offscreen reveal with actual pointer input during the ease.
 const distant=ids.find(x=>/Cádiz|Cadiz|Sevilla|Seville|Amsterdam/.test(x.label));assert.ok(distant);
 await click('[data-locator-toggle]');await click(`[data-place-id="${distant.id}"]`);
 await until('window.__CC_MAP__.isMoving()',5000);await delay(100);
 const interruptionPoint=await evaluate(`(()=>{const m=window.__CC_MAP__;const r=m.getContainer().getBoundingClientRect();for(const xf of [.35,.5,.65])for(const yf of [.3,.5,.65]){const x=r.width*xf,y=r.height*yf;const target=document.elementFromPoint(r.left+x,r.top+y);if(target!==m.getCanvas())continue;if(m.queryRenderedFeatures([x,y],{layers:['historical-ports-hit-target','historical-routes-hit-target']}).length)continue;return{x:r.left+x,y:r.top+y};}return null;})()`);
 assert.ok(interruptionPoint,'interruption targets empty canvas rather than another selectable record');
 const interruptionSelection=await evaluate('window.__CC_SELECTION_STORE__.get()');
 await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...interruptionPoint});
 const canceled=await evaluate('window.__CC_MAP__.getCenter().toArray()');
 await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...interruptionPoint});await delay(850);
 const stopped=await evaluate('window.__CC_MAP__.getCenter().toArray()');
 assert.deepEqual(await evaluate('window.__CC_SELECTION_STORE__.get()'),interruptionSelection,'camera interruption does not select another connector');
 assert.ok(Math.abs(canceled[0]-stopped[0])<.001&&Math.abs(canceled[1]-stopped[1])<.001,'selection ease resumed after interruption');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await delay(250);
 await evaluate(`window.__CC_MAP__.jumpTo({center:[-76,20],zoom:4});window.__travel=[];window.__CC_MAP__.on('movestart',()=>window.__travel.push({type:'start',t:performance.now()}));void window.__CC_MAP__.on('moveend',()=>window.__travel.push({type:'end',t:performance.now()}))`);
 // Pick a different offscreen port so store changes.
 const other=ids.find(x=>/London|Bristol|Rotterdam|Lisboa|Lisbon/.test(x.label))||ids.find(x=>x.id!==distant.id&&/Cádiz|Cadiz|Sevilla|Seville|Amsterdam/.test(x.label));assert.ok(other);
 await click('[data-locator-toggle]');await click(`[data-place-id="${other.id}"]`);await delay(700);
 const travel=await evaluate('window.__travel');
 const start=travel.find(x=>x.type==='start'),end=travel.find(x=>x.type==='end');assert.ok(start&&end);assert.ok(end.t-start.t<80,'reduced motion animated travel');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(700);
 const mobileChromeState=()=>evaluate(`(()=>{const rect=s=>{const e=document.querySelector(s);const r=e.getBoundingClientRect();const c=getComputedStyle(e);return{top:r.top,bottom:r.bottom,height:r.height,left:r.left,right:r.right,cssTop:c.top,cssBottom:c.bottom}};const p=document.querySelector('.map-viewport');return{inspectorHidden:document.querySelector('#entity-inspector').hidden,inspectorOpen:document.querySelector('.app-shell').dataset.inspectorOpen,overlap:p.style.getPropertyValue('--cc-map-sheet-overlap'),attributionClearance:p.style.getPropertyValue('--cc-map-attribution-clearance'),legendClearance:p.style.getPropertyValue('--cc-map-legend-clearance'),map:rect('#charted-currents-map'),legend:rect('.map-epistemic-legend'),attribution:rect('.maplibregl-ctrl-attrib'),views:rect('[data-map-view-controls]')};})()`);
 report.mobileChrome={beforeClose:await mobileChromeState()};
 await click('[data-inspector-close]');await delay(100);
 report.mobileChrome.afterClose=await mobileChromeState();
 await until(`(()=>{const m=document.querySelector('#charted-currents-map').getBoundingClientRect();return Array.from(document.querySelectorAll('[data-map-view]')).every(button=>{const r=button.getBoundingClientRect();const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return r.top>=m.top&&r.bottom<=m.bottom&&r.left>=m.left&&r.right<=m.right&&(hit===button||button.contains(hit));});})()`,5000);
 await click('[data-map-view="caribbean"]');await until(`window.__CC_MAP__.getProjection()?.type==='mercator' && !window.__CC_MAP__.isMoving()`);
 const compactGlobeStart = performance.now();
 await click('[data-map-view="globe"]');
 await until(`window.__CC_MAP__.getProjection()?.type==='globe' && !window.__CC_MAP__.isMoving()`);
 const compactGlobeActivationMs = performance.now() - compactGlobeStart;
 await shot('cc-spatial-globe-mobile');
 report.mobileChrome.afterGlobe=await mobileChromeState();
 const mobileGlobeClear=await evaluate(`(()=>{const map=window.__CC_MAP__;const canvas=map.getContainer().getBoundingClientRect();const c=map.project(map.getCenter());const x=canvas.left+c.x,y=canvas.top+c.y;const containsCenter=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom};return{legendOverCenter:containsCenter('.map-epistemic-legend'),viewsOverCenter:containsCenter('[data-map-view-controls]')};})()`);
 assert.deepEqual(mobileGlobeClear,{legendOverCenter:false,viewsOverCenter:false},'phone chrome leaves the globe center unobscured after inspector close');
 report.mobileChrome.native2DFallbackReachable=true;
 report.mobileChrome.globeCenterClear=mobileGlobeClear;

 await send('Emulation.setDeviceMetricsOverride',{width:768,height:1024,deviceScaleFactor:1,mobile:false});await delay(500);
 const chromeRects=await evaluate(`(()=>{const rect=(selector)=>{const r=document.querySelector(selector).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}};return {legend:rect('.map-epistemic-legend'),attribution:rect('.maplibregl-ctrl-attrib'),views:rect('[data-map-view-controls]')}})()`);
 const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
 assert.equal(overlaps(chromeRects.legend,chromeRects.attribution),false,'legend must not obscure required attribution');
 assert.equal(overlaps(chromeRects.views,chromeRects.attribution),false,'view controls must not obscure required attribution');
 await shot('cc-spatial-tablet');
 const directURL=baseUrl+'?view=120,0,2&mode=globe&select=port:'+royal.id;
 await send('Page.navigate',{url:directURL});
 await until(`Boolean(window.__CC_MAP__?.getLayer('historical-ports-core')) && document.querySelector('#entity-inspector')?.getAttribute('data-state')==='open'`);
 await delay(700);
 const direct=await evaluate('({center:window.__CC_MAP__.getCenter().toArray(),zoom:window.__CC_MAP__.getZoom(),mode:window.__CC_MAP__.getProjection()?.type,title:document.querySelector("[data-inspector-title]").textContent})');
 assert.ok(Math.abs(direct.center[0]-120)<.001&&Math.abs(direct.center[1])<.001);assert.equal(direct.mode,'globe');assert.match(direct.title,/Port Royal/);

 // Fault injection exercises the synchronous unavailable-globe path. It is not
 // evidence about a real unsupported GPU or driver.
 await evaluate(`(()=>{const m=window.__CC_MAP__;const original=m.setProjection.bind(m);m.setProjection=(projection)=>{if(projection.type==='globe')throw new Error('Synthetic unavailable globe');return original(projection)}})()`);
 await click('[data-map-view="globe"]');
 await until(`window.__CC_MAP__.getProjection()?.type==='mercator' && !window.__CC_MAP__.isMoving()`);
 const fallback=await evaluate(`({disabled:document.querySelector('[data-map-view="globe"]').disabled,title:document.querySelector('[data-inspector-title]').textContent,status:document.querySelector('[data-map-status]').textContent})`);
 assert.equal(fallback.disabled,true);assert.match(fallback.title,/Port Royal/);assert.match(fallback.status,/unavailable/);

 // Exercise the browser's real context-loss extension after a loaded map.
 // This checks recovery in this software renderer, not physical GPU drivers.
 const contextLossAvailable = await evaluate(`(()=>{
   const canvas=window.__CC_MAP__.getCanvas();
   const gl=canvas.getContext('webgl2');
   const extension=gl?.getExtension('WEBGL_lose_context');
   if(!extension)return false;
   window.__ccContextProbe={lost:false,restored:false};
   canvas.addEventListener('webglcontextlost',()=>{window.__ccContextProbe.lost=true},{once:true});
   canvas.addEventListener('webglcontextrestored',()=>{window.__ccContextProbe.restored=true},{once:true});
   extension.loseContext();
   setTimeout(()=>extension.restoreContext(),500);
   return true;
 })()`);
 if(contextLossAvailable){
   await until('window.__ccContextProbe.lost && window.__ccContextProbe.restored');
   await until(`window.__CC_MAP__.isStyleLoaded() && Boolean(window.__CC_MAP__.getLayer('historical-ports-core'))`);
   await click('[data-inspector-close]');
   await click('[data-locator-toggle]');await click(`[data-place-id="${royal.id}"]`);
   await until(`/Port Royal/.test(document.querySelector('[data-inspector-title]').textContent)`);
   await click('[data-place-evidence-btn]');
   await until(`document.querySelector('#source-drawer')?.dataset.state==='open' && Boolean(document.querySelector('.source-card'))`);
   await click('[data-source-drawer-close]');
 }
 report.contextRecovery={extensionAvailable:contextLossAvailable,recoveredWithEvidenceAccess:contextLossAvailable};

 // Block the actual third-party style host, leaving published local corpus
 // resources intact. A failed background must not strand records/evidence.
 await send('Network.enable');
 await send('Network.setCacheDisabled',{cacheDisabled:true});
 await send('Network.setBlockedURLs',{urls:['*tiles.openfreemap.org*']});
 await send('Page.navigate',{url:baseUrl});
 await until(`Boolean(document.querySelector('[data-map-unavailable]') && !document.querySelector('[data-map-unavailable]').hidden)`);
 assert.match(await evaluate(`document.querySelector('[data-map-unavailable]').textContent`),/background could not be loaded/);
 assert.equal(await evaluate(`Array.from(document.querySelectorAll('[data-map-view], [data-map-north], [data-layer-toggle]')).every(button=>button.disabled)`),true);
 await click('[data-locator-toggle]');await click(`[data-place-id="${royal.id}"]`);
 await until(`/Port Royal/.test(document.querySelector('[data-inspector-title]').textContent) && !document.querySelector('#inspector-content').hasAttribute('aria-busy')`);
 await click('[data-place-evidence-btn]');
 await until(`document.querySelector('#source-drawer')?.dataset.state==='open' && Boolean(document.querySelector('.source-card'))`);
 await click('[data-source-drawer-close]');
 await send('Network.setBlockedURLs',{urls:[]});
 await send('Page.navigate',{url:baseUrl});
 await until(`document.querySelector('#charted-currents-map')?.dataset.mapReady==='true' && Boolean(window.__CC_MAP__?.getLayer('historical-ports-core'))`);
 assert.equal(await evaluate(`document.querySelector('[data-map-unavailable]').hidden`),true);
 assert.equal(await evaluate(`Array.from(document.querySelectorAll('[data-map-view], [data-map-north], [data-layer-toggle]')).every(button=>!button.disabled)`),true);
 report.thirdPartyDegradation={blockedStyleVisibleNotice:true,nativeCorpusAndEvidence:true,successfulReloadRestoresControls:true};

 // Remove WebGL in a new document to prove the visible unavailable state and
 // native corpus browser still work when neither map mode can render.
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`const context=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:context.call(this,type,...args)}`});
 await send('Page.navigate',{url:baseUrl});
 await until(`Boolean(document.querySelector('[data-map-unavailable]') && !document.querySelector('[data-map-unavailable]').hidden)`);
 assert.equal(await evaluate(`Array.from(document.querySelectorAll('[data-map-view], [data-map-north], [data-layer-toggle]')).every(button=>button.disabled)`),true);
 await click('[data-locator-toggle]');await click(`[data-place-id="${royal.id}"]`);
 await until(`document.querySelector('#entity-inspector')?.getAttribute('data-state')==='open' && /Port Royal/.test(document.querySelector('[data-inspector-title]').textContent)`);
 await shot('cc-spatial-no-webgl');
 assert.deepEqual(errors,[]);
 report.status = "passed";
 report.browser = (await send("Browser.getVersion")).product;
 report.checks = { nativeKeyboardGlobe: true, nativeNorthUp: nativeNorth, nativeArrowPan: true, nativeMapReturnFocusAndPan: true, projection: true, geographicHistory: true,
   directGeographicSelection: true, wideGridDeferredAndComparisonAware: true, lazyMoll: {initial: initialMoll, activated: loadedMoll},
   comparison: {...sourceComparison, focusReturn:sourceFocusReturn}, northReset: north, visibleSelectionPreserved: true, interruptionStops: true,
   globeActivation: {
     desktopMs: desktopGlobeActivationMs,
     compactReducedMotionMs: compactGlobeActivationMs,
     method: "Native input to observed projection and camera settle, including CDP and polling overhead. Map already initialized. Software renderer.",
   },
   reducedMotionTravelMs: end.t-start.t, tabletAttributionClear: true,
   singleConnectorSelection, syntheticGlobeFailureFallback: true, syntheticNoWebGLCorpusFallback: true, uncaughtExceptions: errors };
 report.screenshots = ["cc-spatial-no-webgl.png", "cc-spatial-registered-chart.png", "cc-spatial-source-comparison.png", "cc-spatial-regional.png", "cc-spatial-globe.png", "cc-spatial-globe-mobile.png", "cc-spatial-tablet.png"];
 console.log("Spatial review passed: native modes, comparison, history, interruption, reduced motion, deferred image, attribution, and synthetic fallback.");
} catch (error) {
  report.status = "failed";
  report.error = error.message;
  console.error(`Spatial review failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  fs.writeFileSync(path.join(outputDir, "spatial-report.json"), JSON.stringify(report, null, 2) + "\n");
  if (proc && proc.exitCode === null) {
    const exited = new Promise((resolve) => proc.once("exit", resolve));
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({id:2147483647, method:"Browser.close"}));
    else proc.kill();
    await Promise.race([exited, delay(3000)]);
    if (proc.exitCode === null) { proc.kill("SIGKILL"); await Promise.race([exited, delay(1000)]); }
  }
  ws?.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  await delay(250);
  if (profile) {
    try { fs.rmSync(profile, {recursive:true, force:true, maxRetries:10, retryDelay:200}); }
    catch { console.warn("Temporary browser profile cleanup incomplete; primary review result preserved."); }
  }
}
