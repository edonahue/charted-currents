# Packet 1 Visual Review & Hardening Note

**Date**: 2026-09-01
**Target**: Packet 1 interactive shell, map styling, dynamic dock, mobile bottom sheet, focus management, and non-filtering period rail.
**Runtime**: Real running Astro static build served via HTTP and rendered in headless Chromium (`Google Chrome for Testing`).

## Viewport Artifacts Retained

The following representative screenshots from the real application runtime are regenerated and verified under `design/reviews/`:

- `packet1-desktop-1440x900.png` (221 KB): Standard desktop viewport showing the quiet atlas basemap, masthead, "Browse places (4)" control, zoom chrome, and 1650–1730 period rail.
- `packet1-ultrawide-3440x1440.png` (487 KB): Ultrawide viewport demonstrating full canvas utilization without awkward stretched cards.
- `packet1-phone-390x844.png` (77 KB): Compact phone viewport with top masthead brand, map workspace, and bottom period rail.
- `packet1-phone-430x932.png` (90 KB): Large phone viewport verifying responsive layout scaling.
- `packet1-desktop-selected-1440x900.png` (219 KB): Desktop viewport with an active place selection (Port Royal), showing the right-side folio dock claiming its constrained width while the map remains dominant.
- `packet1-phone-selected-390x844.png` (61 KB): Mobile viewport with an active place selection, showing the bottom sheet anchored at `bottom: 0` with drag handle, title, coordinates, and prototype disclaimer.

## Hardening & Evidence Refinements

During the initial visual pass and subsequent rebuttal reviews, the following concrete changes were made and verified:

1. **MapLibre GL JS 6 Web Worker Bundling via Vite Pipeline**:
   - *Observation*: `maplibre-gl` v6 worker chunks (`maplibre-gl-worker.mjs`, `maplibre-gl-shared.mjs`) require routing through the bundler's worker pipeline to avoid 404s during runtime vector tile decoding.
   - *Refinement*: Configured the official Vite worker import (`import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url"`) in `src/components/map/MapViewport.astro`. Vite automatically bundles all worker chunks into `dist/_astro/maplibre-gl-worker-[hash].js`, eliminating manually maintained vendor files in `public/`.

2. **Strict Render & Tile Settlement Gate (`mapReady` + `mapIdle`)**:
   - *Observation*: Capturing screenshots immediately upon `style.load` could race with asynchronous vector tile rendering.
   - *Refinement*: Enforced a strict readiness gate in `scripts/capture-reviews.mjs` that requires both `dataset.mapReady === "true"` and `dataset.mapIdle === "true"` before capturing normal visual screenshots. If idle is not achieved, the review script fails with a non-zero exit code.

3. **Real Causal Basemap Failure Verification**:
   - *Observation*: Initial review scripts simulated fallback by directly mutating DOM elements.
   - *Refinement*: Replaced with a real causal test using CDP `Network.setBlockedURLs` on `*tiles.openfreemap.org*`, allowing production `map.on("error")` to fire naturally, exposing the fallback banner, and proving that Browse Places and the Entity Inspector remain operational during outages.

4. **Native CDP Keyboard Navigation & Activation**:
   - *Observation*: Previous tests constructed synthetic `MouseEvent(detail: 0)` clicks.
   - *Refinement*: Upgraded to native Chrome CDP key events (`Input.dispatchKeyEvent` for <kbd>ArrowDown</kbd>, <kbd>Enter</kbd>, and <kbd>Escape</kbd>), testing real browser focus movement, disclosure opening, inspector activation, and focus transfer to `#inspector-heading`.

5. **Origin-Aware Focus Restoration**:
   - *Observation*: Closing the inspector after map marker clicks jumped focus to the Browse Places button.
   - *Refinement*: Implemented structured `SelectionTrigger` tracking origin (`map` vs `locator_menu`). Map marker selections restore focus to the `#charted-currents-map` canvas on close; locator selections restore focus to `[data-locator-toggle]`.

6. **Bottom Sheet Semantic Precision & UI Polish**:
   - *Observation*: Mobile sheet handle `aria-controls` targeted the parent container rather than the collapsible content area.
   - *Refinement*: Assigned `id="inspector-content"` and updated `aria-controls="inspector-content"`. Removed the static uninformative amber indicator dot from the header kicker, and refined the disclaimer surface to an understated editorial top rule.

7. **Harness Integrity & Verified Screenshot Outputs**:
   - *Observation*: Ephemeral debugging port used random offsets and did not assert generated file sizes.
   - *Refinement*: Acquired ephemeral free ports using `net.createServer().listen(0)` and asserted that every captured viewport produced a non-empty image file (>15 KB).

## Evidence Classification Summary

- **Real End-to-End Browser Interactions (CDP Input / Network)**:
  - Vector tile rendering with WebGL framebuffer output and strict `mapIdle` settlement;
  - Causal network blocking failure and fallback banner exposure;
  - Native CDP ArrowDown disclosure navigation;
  - Native CDP Enter inspector activation & heading focus transfer;
  - Native CDP Escape inspector dismissal & focus restoration;
  - Real runtime exception monitoring (`Runtime.exceptionThrown` count = 0).
- **Component Interaction & DOM State Assertions**:
  - MapLibre & GeoNames CC BY 4.0 attribution links;
  - Browse Places pointer selection and toggle focus return;
  - Escape key isolation between disclosure menu and folio dock;
  - Mobile bottom sheet `aria-controls`, dynamic `aria-expanded`, and state transitions;
  - Shift+Arrow 2D rotation prevention.
- **Manual Browser-Observed Behaviors**:
  - Direct canvas marker pointer click and canvas focus return on close (implemented via production `SelectionTrigger` origin tracking and observed directly in interactive browser);
  - Ordinary keyboard map panning and zooming;
  - Reduced-motion animation dampening.
- **Screenshot Artifact Verification**:
  - Valid image byte stream and file size threshold (>15 KB) verified across all 6 viewports.
- **Static Code & Type Verification**:
  - `npm run preflight` (Node `>=22.19.0`, required files, lockfile);
  - `npm run verify` (`astro check` 0 errors/warnings across 23 files, `astro build` static output);
  - GitHub Actions CI workflow on `main`.
