# Living Atlas campaign — Packet 12

**Campaign state:** REVIEW_PENDING
**Implementation branch:** `campaign/living-atlas-review`
**Baseline commit:** `3e6ef52`
**Acceptance state:** external decision pending. See measurement and device gaps below.
**Publication:** the maintainer subsequently authorized completion, merge/push to main, and live-site verification. Production publication follows verification and independent acceptance. Draft PR #13 has a hosted review build at `c855595`.

This is the durable product, implementation, and acceptance brief for the Living Atlas campaign. The machine-readable packet contract is [living-atlas.json](packets/living-atlas.json). The [runtime and display review](LIVING_ATLAS_RUNTIME_REVIEW.md) records evidence and additional probes. The whole campaign is one implementation packet; its milestones are sequencing aids, not separately accepted packets. Implementation may reach self-verification and review pending. A human maintainer or independent reviewer makes the final acceptance decision.

## Outcome

Turn Charted Currents into a living ocean atlas: an inviting, coherent spatial experience that makes geographic rediscovery immediate and connects the chart directly to its historical records. The map should feel like a world to explore, with evidence close enough to inspect that discovery can become research without a change of product or tone.

The approved direction is a **Living Ocean Atlas** with a luminous mineral sea, warm land, Atlantic ink, and the repository’s existing fonts. Free exploration is the default; optional guided paths may lead through reviewed data. The signature research experience is a chart-to-record reading room with integrated period-map comparison. A native MapLibre Atlantic globe is optional and must have a useful 2D fallback. These are campaign decisions, not claims about the current application.

## Starting point and evidence boundary

The original campaign measurement baseline is commit `3e6ef52`. The review branch integrates the accepted improvements on `main` at `9a97042` and contains only the campaign changes. Its reported corpus inventory is 22 canonical vessels, 29 places, 21 routes, 16 events, 26 crew occurrences, and 1,928 context rows. The crew count is **occurrences**, not verified depositions. Re-run repository reporting during implementation before using these counts as current-state or completion evidence. Do not infer that counts establish source inspection, independent corroboration, or historical completeness.

No new historical assertions, tracks, records, maps, or visual assets are authorized by this design campaign. Use only existing reviewed data and assets, preserve provenance and uncertainty, and leave absent evidence absent. Any separately justified corpus or asset work requires its own approved scope.

### Reproducible baseline

The preserved baseline build uses the same gzip-enabled local performance
harness as the campaign candidate: five cold loads,390x844,DPR2,4xCPU,
1.6Mbps down/750Kbps up,150ms latency, software WebGL. Its median LCP was616ms,
session-window CLS0.03432, and map-ready proxy5202ms. Actual initial encoded
JavaScript was394989bytes, CSS18938, fonts87616, data95877, and an eagerly fetched
period raster830286bytes. Cross-origin resources without timing permission are
excluded, not assumed free. Earlier uncompressed diagnostics are not comparable
with these compressed measurements. No field Core Web Vitals or real-device
performance is inferred from this baseline.

Baseline corpus validation and negative tests passed. The original full browser
audit covered five viewport sizes and allowed two existing serious axe findings;
the current campaign matrix adds768x1024 and has recorded zero axe findings.
Raw reports and screenshots remain ignored local review artifacts.

## Approved architecture and design decisions

- Preserve static Astro, TypeScript, MapLibre, the existing worker/browser-native interaction model, pinned dependencies, and local build-time data pipeline. No framework, service, backend, runtime research API, or dependency is approved by default.
- Approve the campaign’s exploration-first product direction and optional native MapLibre Atlantic globe, subject to capability detection, measured activation, and a legible north-up 2D fallback. Globe rendering is not a historical claim or a requirement to replace the chart/map view.
- Keep camera motion, lifecycle, and selection as separate concerns. Selection remains typed and evidence-bearing. Camera adjustment is interruptible and only resolves actual occlusion; it must not overwrite the user's geographic intent. Preserve north-up 2D navigation and reduced-motion behavior as dependable fallbacks.
- Keep URL/deep-link state separate from transient camera motion and hover state. Supported durable URL state should include the settled geographic view (center/zoom), display mode (2D/globe), and entity/reading-room selection where applicable. In-flight camera motion and hover are transient and are never durable state. Back/forward restores only state explicitly represented by the URL; it must not trap camera control or synthesize stale view state for a selection-only link. This target is implemented; native restoration and interruption proofs are required before closeout.
- Adapt the spatial and reading surfaces to viewport and device capability without hiding evidence or forcing a mode. No idle animation loop. Pause or reduce nonessential work when backgrounded or when reduced motion is requested.
- Use the required viewport matrix, including `768x1024` tablet, and inspect the actual running app. The existing quality suite remains useful, but its 1024-wide tablet case does not substitute for the campaign’s 768-wide requirement.

The approved deviations from Packet 1’s fixed initial focus and fixed 2D/north-up camera posture are recorded in [ADR 0006](adr/0006-living-ocean-atlas.md) and [ADR 0007](adr/0007-navigation-state-and-adaptive-rendering.md). Packet 1’s provenance, uncertainty, source/asset rights, static-first, responsive inspector, reduced-motion, and historical ethics rules remain in force except where these ADRs explicitly authorize an interaction evolution.

## Milestones

Milestones A–F are internal sequencing gates in this single packet. Record evidence and unresolved issues against the acceptance IDs in the packet contract.

### A — Baseline and contract

Capture current build, quality, bundle, and runtime baselines using reproducible methods. Record environment and data version. Confirm current corpus counts through the project report. Establish the baseline before interpreting campaign performance budgets. No screenshots, environment details, or generated research artifacts are committed unless they meet the public/private boundary.

### B — Atlas vertical slice

Deliver one coherent map-first visual and interaction slice in the approved Living Ocean Atlas direction. Preserve the existing font families, editorial hierarchy, source attribution, and evidence language. The opening state should invite free geographic exploration rather than present a dashboard or a required tutorial.

### C — Spatial modes

Implement the optional native globe only if the existing MapLibre/runtime path supports it without adding a default dependency. Provide a complete 2D fallback and explicit mode behavior. Both modes must preserve selection, source access, and usable geography. A globe must not be represented as a historical map or as observed voyage geometry.

### D — Exploration and navigation

Implement interruptible camera behavior, map continuity around inspector occlusion, capability-aware presentation, and supported URL/deep-link state. Support the journeys below with native pointer, keyboard, browser back/forward, and reduced-motion paths. Do not add a separate client router solely for transient map state.

### E — Evidence reading room

Build the signature chart-to-record path: a selected entity/place/event leads into a reading-room presentation where the corresponding reviewed record and its provenance can be inspected alongside or compared with a period-map reference. Comparison must clearly distinguish source imagery, georeferenced/projected imagery, modern basemap, and project overlay. Respect existing item-level rights and attribution; add no unreviewed source asset.

### F — Review and handoff

Complete repository verification, performance and stability observations, required viewport inspection, native accessibility checks, and two independent implementation/visual review passes. Resolve findings or record them as explicit unresolved issues. Generate the data-derived packet report and stop at `REVIEW_PENDING`. No self-acceptance. The subsequent publication authorization applies after the review boundary.

## Required user journeys

1. **Select, inspect, and return:** explore geography, select an existing reviewed entity, inspect its record and provenance, close or return to the chart, and retain usable spatial context.
2. **Search and resolve:** find an existing place/entity, select a result, inspect evidence, then clear or replace the selection using keyboard and pointer input.
3. **Time and reset:** use existing temporal controls where supported, inspect a represented event/entity, and restore the broad view without implying evidence outside the selected period.
4. **Chart and compare:** open a reviewed period-map reference from the reading room, compare it with the chart/map context using the available comparison control, inspect its source/rights information, and return to the record.
5. **Globe and region:** when globe mode is available, enter it, orient to a regional view, select/inspect the same reviewed feature, then switch to the 2D fallback without losing supported selection; also verify the 2D-only path.
6. **Deep link and browser history:** open a supported URL with selection and/or settled geographic view/mode directly, navigate to another supported state, and use browser back/forward to restore only the selection and settled view/mode encoded in history. Confirm in-flight camera motion is not serialized and camera remains user-controllable.
7. **Mobile and reduced motion:** complete selection, evidence access, map comparison, and return at narrow phone widths; with reduced motion enabled, no required task depends on animated camera travel.

The application must remain useful when optional globe capability is unavailable, when no guided path is selected, and when an entity or supporting record is absent.

## Proposed performance and stability budgets

These are **acceptance targets**, with measured results and remaining gaps recorded separately below. Milestone A established a reproducible local baseline before implementation tuning. The packet report must show observed values, method, and deviations. A miss is not permission to silently relax a threshold; explain it for external review. These budgets do not claim current performance or field-user metrics.

| Measure | Proposed target / method |
|---|---|
| Mobile cold-load profile | 390x844, DPR 2, 4x CPU slowdown, 1.6 Mbps down / 750 Kbps up, 150 ms latency; 5 cold runs; report median LCP; target <=2.5 s and CLS <=0.1. |
| Selectable map | Under the same mobile profile, time until a user can select an available map feature; target <=5 s. Define the observable interaction and report all runs. |
| Lab interaction responsiveness | p75 <=200 ms for the agreed local interaction set; this is a lab measure and must not be called field INP. |
| Rendering cadence | Desktop frame-time p95 <=20 ms; real mobile-device frame-time p95 <=33.3 ms on an identified device/browser/workload. Do not substitute simulated device throttling for the real-device observation. |
| Initial payload | Initial-route compressed JavaScript no larger than the separately measured initial-route baseline (394989 encoded bytes under the documented gzip profile; emitted-bundle totals are not a substitute); total compressed CSS <=50 KiB and fonts <=200 KiB transferred, with transfer accounting stated. |
| Optional mode payload | Optional globe code <=150 KiB compressed and optional assets <=1 MiB; defer activation until explicit availability/intent, with <=1 s desktop and <=2 s mobile activation after resources are available. State compression and cache conditions. |
| Idle/background work | No continuous idle animation loop; pause/reduce nonessential rendering when hidden or reduced motion is active. |
| Stability | 30-minute representative session without uncaught errors, progressive performance degradation, runaway resource growth, or lost navigation/selection behavior. Record browser, device, and workload. |

If a budget cannot be measured with repository tooling, document the measurement gap and a reproducible manual method; do not mark it passed.

## Required visual viewports

Inspect and retain review evidence for the real running application at:

- 1440x900 — standard desktop;
- 3440x1440 — ultrawide;
- 768x1024 — tablet portrait;
- 390x844 — compact phone;
- 430x932 — larger phone.

Evaluate orientation, visible map, readable evidence, control reachability, panel occlusion, keyboard/focus behavior, reduced motion, globe fallback where available, and chart-to-record comparison. Record the actual browser/runtime and distinguish screenshots from manual/native interaction evidence.

## Review and lifecycle gates

- Preserve all established historical, provenance, uncertainty, rights, ethics, and public/private policies. No reviewer agreement may be represented as independent historical corroboration.
- Run the existing deterministic repository verification commands relevant to application, data, and quality behavior, including the current full quality/accessibility suite. Add no tests merely for paperwork; implementation verification should cover the changed behavior and all required journeys.
- Perform native keyboard and assistive-technology checks in addition to automated axe scans; automated scans alone do not satisfy native accessibility review.
- Obtain two independent implementation/visual review passes and address new severe defects before handoff. Reviewer count is process QA, not historical evidence.
- `npm run packet:report` is required for handoff. State observed, inferred, proposed, and unverified results separately.
- End at `REVIEW_PENDING`; human final acceptance remains outstanding. The subsequent maintainer authorization includes publication and hosted verification after the required acceptance boundary; local verification alone does not establish acceptance or deployment.

## Non-goals

- Expanding or rewriting the historical corpus; inventing tracks, facts, routes, source descriptions, or demo fixtures.
- Adding unreviewed historical imagery, decorative textures, or an asset solely to meet a visual target.
- Replacing Astro/MapLibre, adding a framework/backend/service/database/runtime research API, or upgrading dependencies without a new approved ADR/scope.
- Replacing the 2D chart/map with a mandatory globe, forcing a guided path, or moving the site into a SPA.
- Claiming performance budgets, user outcomes, accessibility, independent historical corroboration, acceptance, or deployment without the corresponding evidence.
- Beginning an unapproved follow-on packet or publishing before the required review boundary.

## Current implementation and review evidence — 2026-11-17

The first review build passed phone globe clearance and map-canvas focus return.
The integrated candidate preserves the accepted accessibility baseline and place
browsing improvements from `main`. Subsequent short-landscape and archive-image
layout refinements preserve the JavaScript and data from the integrated
30-minute stability build. Publication follows the external acceptance decision.

Implemented surfaces include native Caribbean/Atlantic/globe views with 2D and
no-WebGL fallbacks; separated selection/camera/geographic URL state; corpus search
and optional featured-record entry links; a deferred inspector; modeless desktop
source reading alongside the map and modal compact reading; registered-map
comparison; a responsive native dated-event list; and record-specific provenance.
Published historical data is unchanged. Modern basemap rendering and registered
image transformations do not become historical evidence.

Key verified corrections include single-vessel connector selection from existing
constituent IDs, port-over-connector hit priority, native north-up keyboard/touch
behavior, same-selection focus return, new-record scroll reset, mobile source
focus containment, and retry after a failed source request. Mobile viewport
expansion was traced to hidden timeline tooltips and repaired at that cause.
Attribution/control clearance uses actual geometry. The registered raster and
inspector data are deferred until relevant user intent; the small map geometry
requests overlap basemap loading and reuse the shared session cache.

A cold hosted check found the lazy Jamaica chart moved the Port Royal evidence
action by 123.94 CSS pixels on decode. The inspector now supplies the published
image's intrinsic dimensions. With a controlled 1.2-second image request delay,
the revised build measured the same image height and evidence-button position
before and after decode. Native pointer input then opened the source records.


| Evidence | Observed result / limitation |
|---|---|
| Astro check/build | 49 files, zero errors, warnings or hints on the review branch. Production build succeeds. Vite retains its large MapLibre chunk advisory. |
| Interaction tests | Camera/geographic policy, six navigation-state cases, shared-loader deduplication and retry pass. |
| Corpus | Deterministic rebuild produces no published-data diff; validation, 69 Python tests and 30 negative tests pass on the review branch. |
| Full visual/accessibility suite | The release full suite passed all five journeys, 35 layout evaluations across seven viewports, and six accessibility states with zero findings. Native 844×390 landscape review verified the restored orientation and period-map controls. A separate visual inspection checked the rendered map and record panels. |
| Native navigation | 34 integrated observations pass. They cover exact 390px layout, search/history, scroll/focus, dated-event list, 41 source records’ assertion grouping, delayed selection and native 503 retry. Zero uncaught exceptions. |
| Native spatial | Passes connector and port interaction, globe/history, native north-up, interruption without new selection, comparison/source return, provider-blocked corpus access, context restoration, no-WebGL fallback; zero uncaught exceptions. The integrated probe passed. Desktop globe settled in 862 ms and compact reduced-motion globe in 11 ms after native input on a warm map, including probe overhead. Physical GPU behavior remains a separate measurement. |
| Established behavioral suite | 238 assertions passed on the integrated build. |
| Independent review | Earlier independent visual/engineering passes identified repaired defects. Final independent screenshot review found unreachable phone globe orientation controls and a misplaced legend after inspector close. The staged measurement repair passes native visibility/hit testing and independent screenshot recheck; the finding is resolved. This is process QA, not acceptance. |
| Historical presentation | Independent metadata audit supports revised crew/source-container wording; no corpus or evidence-state change. See CORR-20261117-01 in the corrections log; external acceptance remains pending. |
| Performance | All five release cold-load and selection observations were valid. Compare current main, original campaign budget and findings below. |
| Stability | A three-cycle smoke passed after repairing pointer tests to wait for scroll rendering and confirm the hit target. The integrated 30-minute workload completed 52 cycles with zero interaction, console, unhandled, resource or crash failures. |
| Device/assistive technology | Native keyboard, axe and an isolated Firefox/Orca journey are observed. Audible output, the return-focus announcement and physical-device rendering/battery remain unverified. |
| Publication | Authorized after required acceptance; no hosted claim yet. |

### Release performance observations

Both builds used the documented throttled mobile profile with five cold loads
and five separate native selections. The baseline is the current production
revision on `main` at `9a97042`. An unrelated local typecheck ran during the
early baseline sequence, so use this comparison as diagnostic and retain the
original campaign baseline for the strict payload budget.

| Measure | Current main | Release candidate |
|---|---:|---:|
| Median LCP | 624 ms | 644 ms |
| Median session-window CLS | 0.03432 | 0.03794 |
| Median map-ready signal | 5,219 ms | 4,713 ms |
| Median native selectable port | 5,746 ms | 4,980 ms |
| Median selected record ready | 5,746 ms | 5,531 ms |
| Initial encoded JavaScript | 395,310 B | 395,506 B |
| Initial encoded CSS | 19,164 B | 21,401 B |
| Initial encoded fonts | 87,616 B | 87,616 B |
| Initial encoded data | 95,877 B | 7,082 B |
| Initial same-origin encoded image | 830,286 B | 174 B |

Selection runs were 4,988.8, 4,978.8, 4,988.3, 4,979.9 and 4,967.2 ms.
All five met 5,000 ms. Polling and native input transport overhead stay in
the observation.

JavaScript is 196 B above current main and 517 B above the original 394,989 B
budget. The latter is a 0.13% increase and an explicit budget miss for external
review. Deferred inspector work keeps first-load data small. The registered
period raster no longer transfers at startup. The remaining 174 B image is the
favicon. Initial CSS and fonts meet their budgets. Cross-origin requests without
timing permission are excluded from the byte totals. This software-rendered lab
profile does not establish hosted, field or physical-device timing.

### Integrated stability observations

The 1440×900 desktop workload used Chrome 153 with SwiftShader. All 52 cycles
completed across 30 minutes with zero interaction failures, browser errors or
crashes. Median cycle duration was 4.66 s in the first ten cycles and 4.65 s in
the last ten. The 884 observed interaction groups had p75 duration 56 ms, with
entries under 16 ms censored. Post-cycle frame interval p95 was 16.7 ms at the
median checkpoint (worst checkpoint p95 16.8 ms). Active GPU frame time and
physical-device performance require separate recordings.

Post-collection main-thread heap rose from 7.46 MB at startup to 11.93 MB at
five minutes as the repeated journey loaded more data and surfaces. Subsequent
checkpoints rose to 12.52 MB at 25 minutes with smaller increases after each
collection. From five minutes onward, DOM node and listener counts were steady
at 1,819 and 167. These diagnostics showed no degradation in the tested
workload. They leave GPU, worker and device memory unmeasured.

### External review items

Review the Globe cadence and physical-device measurements alongside the
rendered candidate. The runtime and display checklist records the local
measurements and the follow-up probes for hardware and preview verification.

Firefox 159 with Orca 49.4 completed the native keyboard journey through
search, Port Royal and supporting evidence. A silent Speech Dispatcher output
module recorded generated Orca announcements for the search result, evidence
heading, description list and repository link. AT-SPI independently observed
focus return to the evidence trigger after Escape. The returned trigger's
speech announcement and audible output were not verified. Earlier isolated
Chromium attempts stalled before reaching the atlas.

For physical-mobile performance, record the phone, OS and browser version.
Start a browser performance recording on that device, let initial tiles settle,
then pan, zoom, enter the globe, return to 2D and open/close a record. Report p95
frame interval over the active interactions. Use a separate sustained session
for battery and temperature observations.

### Local cartography candidate for release review

The follow-up branch contains the revised basemap, an intent-loaded evidence
renderer, timeline and reading-room layout repairs, and cold Globe fallback.
Application revision `6575cf8` adds chart retry and graphics-context recovery,
keeps the compact comparison scrollable, and fixes keyboard focus when leaving
the panel. The exact built entry HTML has SHA-256 prefix `b5c3b6a1a918`.
The [runtime review](LIVING_ATLAS_RUNTIME_REVIEW.md#candidate-recovery-and-compact-comparison-recheck)
records the candidate's cold loads, 30-minute stability run, and Globe cadence.
A later [short-phone Globe layout refinement](LIVING_ATLAS_RUNTIME_REVIEW.md#globe-composition-on-short-phones)
clears northern markers obscured by map controls. The latest built entry
HTML has SHA-256 prefix `5ec7396764b5`.
Physical-device timing and audible assistive-technology observations remain
open for release review. The [chart coverage and blend study](LIVING_ATLAS_CHART_COMPARISON.md)
records a separate derivative that requires source review.

On November 19, 2026, [draft PR #13](https://github.com/edonahue/charted-currents/pull/13)
was open at `c855595` with successful verification and Pages checks. Its
[preview](https://campaign-living-atlas-review.charted-currents.pages.dev/)
served HTML with SHA-256 prefix `02b9c9eb4bb9`, matching the archived preview
HTML from that revision. Production still matched the rollback build at
`9a97042`. The repaired candidate awaits preview verification and external
acceptance.

### Release and rollback

After external acceptance, verify the review commit's checks and merge through
the repository's GitHub and Cloudflare Pages integration. The live HTML matched a clean build of current main `9a97042` byte for byte,
and GitHub verified its Pages deployment. Use that accepted revision and its
Pages deployment as the rollback reference if main advances through Packet 12.
After merging, confirm the successful production deployment matches the merged
revision. Check the canonical origin for atlas search, 2D/globe navigation,
period-map comparison, sourced evidence, attribution and corpus integrity.
If those checks reveal a material regression, prefer a forward fix where safe.
For an urgent rollback, restore the prior accepted Pages deployment or revert
the release on Git and verify the restored production site. Follow
[Cloudflare Pages deployment](CLOUDFLARE_DEPLOYMENT.md) for the project workflow.
