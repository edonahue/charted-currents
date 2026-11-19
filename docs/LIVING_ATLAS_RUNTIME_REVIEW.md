# Living Atlas runtime and display review

This review compares the Packet 12 approach with the pinned MapLibre 6.6
implementation, recorded browser runs and primary guidance. The campaign
contract remains [the source of truth](LIVING_ATLAS_CAMPAIGN.md). Items marked
**Probe** name a concrete check for the release candidate or preview. A plausible
failure mode is a test hypothesis until reproduced.

## Runtime

| Priority | Check | Current approach and evidence | Next observation or decision |
|---|---|---|---|
| Release | Measure the first usable map | The cold mobile lab records LCP, CLS and native port selection separately. Geometry requests overlap basemap loading. The release median selection was 4.98 s versus 5.75 s on current main. All five release observations were below 5 s. | Compare the integrated build to the original budget and current main. If the result straddles 5 s, trace script evaluation, worker startup, style fetch, initial tiles/glyphs and project-layer availability on the same profile. Require five valid observations for each claim. The harness now flags and reports incomplete samples, while retaining diagnostic medians over available observations. |
| Release | Keep record and chart transfer off the opening path | The inspector controller, record data and registered raster load on intent. The session cache shares pending/successful requests and evicts failures. The earlier candidate eliminated an 830,286-byte initial period-image request. The integrated map bundle and worker are about 252 KB and 132 KB gzip on disk. | Confirm via HTTP transfer and resource accounting. Probe cold search-to-record, first source and first registered raster separately. Report compression and omitted cross-origin timing. |
| Release | Exercise prolonged exploration | The stability workload cycles native selections, evidence, periods, chart comparison and geography. It records console/unhandled errors, DOM/resource diagnostics and post-collection heap. The test confirms pointer targets after scroll settles. | Report the full duration, failures and trend. Frame samples use software WebGL and cannot establish physical GPU or battery performance. |
| Release | Degrade after resource and GPU failures | The corpus stays available with WebGL disabled or the provider blocked. The spatial probe checks controlled context restoration and globe fallback. | Probe slow connection and failed style, glyph, vector tile and period-image requests separately on preview. Compare start-up and failure after the map is ready. Every degraded state should preserve locator, evidence and attribution where displayed. |
| High | Recover after successful startup | Historical geometry can fail after the basemap reports ready. The generic error listener ignores errors after readiness. The raster source persists when hidden, so a failed raster fetch does not necessarily retry on toggle. | Inject a one-time 503 for ports/routes and the registered image. Check whether the legend and controls stay truthful, the corpus remains usable, and reload or a retry recovers. Use measured behavior to decide whether to add a specific notice or retry. |
| High | Profile compositor and GPU cost on representative hardware | One MapLibre context owns both map modes. A dedicated worker handles rendering data work. Globe uses the loaded map engine. MapLibre uses device pixel ratio by default and has a hardware canvas limit. | On a current iPhone and one midrange Android device, record cold pan/pinch, globe activation, period-image activation and background/foreground. Compare active p95 frame times, thermal behavior and browser restarts. Try a DPR 2 cap only if high-DPR traces implicate fill rate. At DPR 3 that would reduce framebuffer area by about 56%, with a label-sharpness tradeoff to inspect. |
| High | Avoid resizing WebGL for chrome-only changes | The atlas observes the container, attribution, legend and inspector. The same callback calls `map.resize()` for each, while MapLibre itself already observes container size. In 6.6 public resize updates the painter and may fire movement events at unchanged size. | Count resize, paint and history events on inspector expansion and folio changes. If redundant work is material, split chrome layout from true canvas sizing. Re-run inspector clearance, restored geography and narrow 2D/globe controls before keeping the change. |
| High | Preserve state on a real document round trip | Native tests exercise same-document Back/Forward and deep links. `pagehide` preserves a cached page and cancels map motion. | Navigate to a separate page in the same tab and return. Observe `pageshow.persisted`, resumed map input, selection, period, focus and stable URL, including an interrupted camera move. Repeat with a normal reload. |
| Medium | Attribute early work before moving it | Provider style is loaded from the network, and the campaign restyles it after map load. Unavailable cross-origin Resource Timing fields are excluded from byte totals. | Capture a DevTools waterfall and map lifecycle marks. If provider connection setup is material, compare preconnect in an isolated test. If initial style churn is material, compare applying the same policy before the first style parse. Keep attribution, font compatibility and failover intact. |
| Medium | Avoid a default-region fetch on direct links | Map construction starts in the Caribbean and restores the URL view after initial load. Extra default-region work on Atlantic or globe links is plausible. | Trace cold direct links. If materially slower, seed center and zoom from the existing URL parser before map construction while preserving selection-only semantics. |
| Medium | Account for retained raster memory | The 2560×1422 period image loads on intent and its source survives hiding. One four-byte-per-pixel surface represents about 14.6 MB before browser/GPU overhead. | Confirm a stable memory plateau through repeated toggles on physical hardware. The main-thread JavaScript heap cannot show texture retention. Only consider unloading if real device pressure warrants repeating decode/upload. |
| Medium | Verify usage of cache and compression on the actual origin | Fixed build-time data paths and fingerprinted app assets fit the existing Pages deployment. Local gzip reports establish a comparable lab profile. Current production serves Brotli. Observed HTML and stable corpus JSON use `max-age=0, must-revalidate`; a sampled fingerprinted script used `max-age=14400, must-revalidate`. | On preview and production inspect actual compression, cache headers and revalidation for HTML, fingerprinted assets and stable data paths. Exercise warm revisit and cache invalidation after a deployed revision. Avoid broad immutable policies for stable data URLs. |
| Defer | Shard sources, cluster ports or replace the renderer | The published map draws 29 ports and 16 display edges representing 21 routes. Existing GeoJSON sources stay mounted. Port interactions use feature state. Discrete route-paint changes can queue a layer relayout and source reload in MapLibre 6.6, which batches the updates. There is no permanent app render loop. | Keep the single renderer and small snapshots. Revisit incremental source updates, clustering or tiling only if a larger reviewed corpus and a trace show sizing, parsing or draw cost. |
| Defer | Tune search or source rendering after measurement | The corpus search is built from published data. Evidence loads and groups by record on demand, with native collapsed record details. | Profile large real evidence groups and look for event handling, DOM work and paint separately. For ship/person selection, measure the sequential core-data and sources requests. Comparison candidates are overlap when both are known to be needed, a lazy index, or rendering only opened record panels. Preserve accessible disclosure and source grouping. |

MapLibre 6.6 source establishes the container observer and default rendering
options. Public APIs describe configurable pixel ratio, tile caching and style
transforms. Use [MapLibre MapOptions](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapOptions/),
[MapLibre StyleSwapOptions](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/StyleSwapOptions/)
and the [GeoJSON source API](https://maplibre.org/maplibre-gl-js/docs/API/classes/GeoJSONSource/).
Per-global [Resource Timing](https://www.w3.org/TR/resource-timing/) also means a
window snapshot cannot account for every worker-originated request. Use network
events when comparing total provider traffic.
Use [Chrome performance traces](https://developer.chrome.com/docs/devtools/performance/reference)
to separate script, layout and presentation. Local interaction p75 and active frame
intervals answer different questions from [field INP](https://web.dev/articles/optimize-inp/).
Use [back/forward cache guidance](https://web.dev/articles/bfcache) for real
document restoration and [Pages serving defaults](https://developers.cloudflare.com/pages/configuration/serving-pages/)
for hosted caching checks.

## Display and interaction

| Priority | Probe | Compare with current coverage and expected result |
|---|---|---|
| Release | Recheck integrated required viewports and visual states | Compare 1440×900, 3440×1440, 768×1024, 390×844 and 430×932 across initial, inspector, evidence, locator and period options. Inspect real tiles and source imagery as well as DOM geometry. The release audit passed five native journeys across seven viewports, including 844×390, with zero axe/layout findings. |
| Release | Reproduce globe chrome across transitions | Open a tablet inspector, resize to phone, close it, enter Globe, return to Caribbean and reopen. Verify control hit targets, legend versus routes, zoom, attribution and retained selection. A prior phone regression was repaired with staged clearance measurements and passed the targeted native probe before integration. |
| Release | Use keyboard and a screen reader through the evidence path | Native tests cover search, inspector return, period-map source return, timeline and map keys. Test Tab and Shift+Tab in both directions, including from a programmatically focused heading, and verify the source title, record list, close and return announcements. Check that mobile modal interaction and reading stay inside the drawer. Verify desktop map access alongside the folio. |
| High | Rotate a phone with live browser chrome and the virtual keyboard | Chromium at 844×390 exposed below-fold map controls before the short-landscape repair. Native globe, Caribbean and period map controls passed the focused probe after the height adjustment. The 320 px and breakpoint-width probes showed exact document width. The virtual keyboard may shrink the visual viewport only. Exercise portrait-to-landscape with search open, sheet expanded and source open. Check physical side cutouts and 767/768/769 px boundaries, and confirm focus and attribution remain visible. |
| High | Reflow and text enlargement around the map | Narrow layout and exact width tests catch document overflow. Test 320 CSS px and 200% text and 400% browser zoom, long source titles/URLs, tables, cross-references, inline help and focus rings. Keep any map/table scrolling localized and ordinary text and controls readable. |
| High | Touch targets, gestures and occlusion | View buttons and the narrow event list have 44 px targets. Check actual hit boxes for the sheet handle, close controls and clustered markers, including spacing, finger drag, pinch and blank-area camera interruption. Verify native page scrolling around the chart. |
| High | Use the same source long enough to expose reading-state glitches | Switch records rapidly, open a long 41-record source, expand summaries, scroll, close/reopen, replace selection and retry a failed request. Existing probes cover record-specific grouping, stale-response protection, scroll reset and retry. In compact layout confirm focus remains visible after crossing the desktop breakpoint and after an image decodes. |
| High | Check cartography against actual imagery | Inspect route dashes, labels and coastal contrast at regional zoom, across the Atlantic and at the globe limb. Compare Modern, Blend, Registered and the original source image, with qualifying copy and attribution. Verify point-over-line hit priority and concise wording distinguishing endpoints from observed tracks. |
| Medium | Cross-browser typography and visual preferences | Chromium lab supplies the main automated evidence. Inspect Safari and Firefox for details/summary, layout, focus, glyphs and viewport handling. Try a real reduced-motion preference, forced colors where available, browser font scaling and a long-press link. Preserve the accessible record path if canvas contrast is insufficient. |

The map's two-dimensional nature does not extend the reflow exception to
the surrounding reading surfaces. Use [WCAG Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html),
[Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)
and [Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
as criteria. Use the [visual viewport model](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/CSSOM_view/Viewport_concepts)
to distinguish keyboard and pinch-zoom issues from ordinary CSS width changes.

Record the exact build, browser, device, route and action for each finding.
Repair confirmed release defects and refresh the affected proof. Prioritize
measured improvements, and carry device-specific observations and later
experiments into external review where local tools cannot establish them.

## Follow-up cartography candidate

The local candidate applies the visual policy to the provider style before
MapLibre loads it, uses the saved camera at construction for geographic
links, and leaves canvas resizing to MapLibre's container observer. The
app still observes its chrome for control clearance. It opens record and
source requests in parallel when a selected record needs both, loads the
evidence renderer on intent, and creates the wide coordinate grid only
when needed. It retains the pinned stack and provider attribution.

Five cold loads and five separate native selection runs per build on
Chromium 153, 390×844 at DPR 2, used 4× CPU slowdown, 150 ms latency,
200,000 bytes/s download, disabled cache, and software WebGL. Values below
compare the local build of the verified preview revision (`c855595`) with
the cartography candidate after the layout and globe fallback repairs.
The performance and stability reports independently recorded the same
SHA-256 for the candidate's built entry HTML, beginning `18bfef8582c0`.

| Metric | Verified preview build | Local candidate |
| --- | ---: | ---: |
| LCP | 648 ms | 620 ms |
| Session-window CLS | 0.03794 | 0.03902 |
| Map-ready proxy | 4,765 ms | 4,652 ms |
| Native port selection | 4,982 ms | 4,532 ms |
| Native selected record visible | 5,549 ms | 5,109 ms |
| Same-origin initial JavaScript body, encoded | 395,506 bytes | 392,809 bytes |
| Same-origin initial CSS transfer | 21,701 bytes | 21,754 bytes |
| Same-origin initial font transfer | 88,816 bytes | 88,816 bytes |

Median native port selection was 9.0% faster in this profile. The five
candidate selections were 4,532, 4,481, 4,550, 4,571 and 4,468 ms. Each
met the 5 s target. Initial JavaScript is 2,180 bytes below the campaign's
original 394,989-byte budget. The workload includes browser and polling
overhead. Window resource timing does not include every provider or worker
request. A cold geographic deep-link comparison would help isolate the
camera-seeding change.

The later native stability probe found the timeline filters rewrapping
after the reading room closed. The pointer landed on the heading after
the filter had moved. Accelerating the same journey also reproduced an
Atlantic center 0.143° east of the requested coordinate while the map
pane was resizing. The local repair commits the map and timeline layout
sizes without animating columns or padding. Existing camera and mobile
sheet motion stay available. The accelerated trace then completed 13
whole journeys in one minute with no errors.

The repaired build completed a 30-minute Chromium 153 software-WebGL
soak at 1440×900. All 53 cycles passed with zero interaction, browser,
resource or crash failures. The workload used native port selection,
evidence inspection, period switching, chart comparison, Atlantic and
Caribbean orientation, and north reset. Median cycle times were 4.288 s
for the first ten and 4.279 s for the last ten. Lab Event Timing p75 was
40 ms across 901 observed interaction groups, with observations below
16 ms censored. The post-cycle animation-frame interval p95 ranged
from 16.7 to 16.8 ms.

After five minutes the forced-GC JavaScript heap samples rose from
12.09 to 12.53 MB by minute 25, with 1,820 DOM nodes and 167 listeners
at each warm post-GC checkpoint. Cycle times showed no slowdown in this
session. The heap trend warrants separate longer observation. The final
non-forced sample is a different diagnostic. Physical-phone frame timing,
thermal behavior and sustained globe rendering remain unmeasured.

A separate desktop software-WebGL probe recorded MapLibre render event
intervals during five native activations of the Atlantic and Globe views.
The first switches had p95 intervals of 41.8 ms (37 samples) and 222.4 ms
(10 samples). Across the four warm switches, p95 was 19.2 ms for
Atlantic (148 samples) and 69.2 ms for Globe (77 samples). This diagnostic
found substantial stalls in the software-rendered globe, including after
the first switch. Hardware frame timing remains open. There were no
page-target script requests during the switches, and no MapLibre render
events in either 1.5-second settled idle window, before and after putting
the tab in the background. The probe confirmed the visibility changes.

Native navigation, spatial, full quality and behavioral browser checks
passed locally. The phone globe has clear space between its southern
basin name and the route legend. The seven-view audit reported zero
geometry findings across its 35 states, and the behavioral suite passed
238 checks. An independent screenshot review found the southern basin
name crosses the globe limb, and the open phone inspector leaves a shallow
map with substantial control coverage. The Globe and chart controls
remained legible and distinct in the reviewed images.
A separate [chart comparison study](LIVING_ATLAS_CHART_COMPARISON.md)
records the local review of edge softening and research into wider
historical coverage.

Independent review of the earlier style-loading path found that it
could re-enable Globe when a cold globe link had already fallen back to
2D. The browser test reproduces this by injecting a projection failure
before style readiness. The repair preserves the unavailable state when
enabling the rest of the map controls. The repaired build passed this
cold-link case, including native selection of the Caribbean view in
the fallback. The fault was simulated on software WebGL.

The repaired local build also passed the Firefox and Orca keyboard
journey through atlas search, Port Royal, and its evidence folio. An
isolated Speech Dispatcher sink recorded generated speech for the
search field, result, evidence heading, description list and repository
link. AT-SPI recorded focus returning to the evidence trigger on Escape.
The sink did not establish audible output or a return-focus announcement.

## Candidate recovery and compact comparison recheck

The spatial suite now withholds the rectified Moll image, sends HTTP 503,
and releases a successful response after native keyboard retry. The modern
grid and water labels stay visible during loading and failure. Registered
chart becomes active only after the image is ready, with exactly two image
requests. The raster remains below the published routes. The source and
derivative retain their attribution.

A second browser case uses `WEBGL_lose_context` while the image request
is pending. Before the fix the rebuilt source completed its replacement
request while the panel stayed on Loading. The repaired build keeps the
modern reference cues throughout the reset and activates the chart after
the rebuilt source completes, without a second visitor action.

A cold Globe link now initializes the basemap in 2D before switching
projection. A separate browser case throws inside the pinned MapLibre
projection initializer before map readiness. The default atlas loads its
published ports, disables Globe, and responds to the Caribbean control.
The inactive regional coordinate grid now skips style serialization.

At 320×568 the browser scrolls the comparison panel 120 px to reveal the
source action while the map, page and zoom remain in place. Tab reaches
the source action and Enter opens the drawer. Shift+Tab and Tab wrap within
the drawer, and closing it returns focus to the visible source action.
Moving focus outside the comparison closes it. Additional wheel and Tab
probes passed at 390×844 and 844×390. The seven-viewport quality suite
passed all 35 layout states with zero axe findings, and all 238 behavioral
checks passed.

Five cold Chromium runs on the mobile profile above recorded median LCP
of 612 ms and CLS of 0.03902. Native port selection had a median of
4,497 ms and ranged from 4,480 to 4,587 ms. Same-origin initial JavaScript
was 393,100 encoded bytes, 1,889 bytes below the campaign budget. CSS and
font transfers were 21,810 and 88,816 bytes respectively. The local build's
entry SHA-256 begins `b5c3b6a1a918`.

With desktop software WebGL, the warm render-interval p95 was 17.8 ms for
Atlantic (147 intervals) and 71.0 ms for Globe (75 intervals). Globe cadence
remains above the 20 ms target in this profile. The switches requested no
additional page scripts. Each settled 1.5-second window produced zero
MapLibre renders in a visible or background tab. Physical-device cadence
and thermals still need hardware measurements.

The same build completed 53 native interaction cycles in 30 minutes at
1440×900 with zero interaction, browser, resource or crash failures.
Median cycle duration was 4.294 s for the first ten and 4.279 s for the
last ten. Lab Event Timing p75 was 40 ms across 901 interaction groups,
with entries below 16 ms censored. Forced-GC heap rose from 12.18 MB at
minute five to 12.65 MB at minute 25. The warm post-GC checkpoints held
1,822 DOM nodes and 168 event listeners throughout. The heap trend remains
a diagnostic to track in longer sessions.

### Globe composition on short phones

Browser comparisons at 320, 360, 390 and 1440 px assessed moving the opening
camera and aligning the water labels to the Globe surface. Moving the camera
brought northern endpoints closer to the opposite limb and removed Labrador
Sea in some views. Surface-aligned lettering compressed the southern basin
name. The South Atlantic label remains close to the lower edge.

The phone comparison exposed a larger problem at 320×568. The Globe's view
buttons covered northern port markers and the legend covered the lower disk.
Short portrait phones now reserve vertical space for the Globe between the
map controls and the legend. Bristol's projected point moved to 55 px below
the view buttons and hit-tested on the map canvas. The native regression
failed on the previous build and passed on this one. At 320×568 the legend
and period controls now continue below the first screen. The 390×844 layout
uses its previous sizing rule.

The build's entry SHA-256 begins `5ec7396764b5`. Its built JavaScript, data
and assets match the preceding build byte for byte. Only the entry HTML
and its stylesheet differ. The short-phone rule is outside the desktop
stability profile and applies only in Globe mode.

The final build's five cold runs at 390×844 had median LCP of 616 ms,
CLS of 0.03902, and median native port selection of 4,519 ms. All five
selections completed within the 5 s budget. The same-origin JavaScript
was 393,100 encoded bytes, and the CSS transfer was 21,839 bytes.

Across four warm Globe switches at 320×568 and DPR 1, the software WebGL
render-interval p95 was 46.3 ms before and 44.4 ms after the layout change.
Neither build rendered during the settled visible or hidden windows. The
comparison is a software-browser diagnostic. Physical phones still need
their own measurements.
