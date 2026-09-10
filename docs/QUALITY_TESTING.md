# Quality & Accessibility Testing Guide

This document describes the automated design, usage, accessibility, and layout testing architecture in Charted Currents.

The test harness runs headless Chrome directly via the native **Chrome DevTools Protocol (CDP)** over WebSocket (`scripts/quality-audit.mjs`), eliminating heavy third-party framework dependencies like Puppeteer or Playwright while evaluating real DOM/CSS layout, native interaction flows, and WCAG 2.1 AA accessibility via injected `axe-core`.

---

## 1. Quick Start

### Fast CI Mode (<25s)
Runs in GitHub Actions CI on every push and pull request.
```bash
npm run review:quality
# Equivalent to: node scripts/quality-audit.mjs --ci-mode
```
* **Viewports Tested**: 2 viewports (`standard_desktop` 1440x900, `mobile_compact` 390x844).
* **Scope**: 6 axe-core state scans, multi-state layout geometry checks across 5 UI states per viewport (10 evaluations total), 5 end-to-end user journeys.
* **Target Execution Time**: Under 25 seconds (typically ~18–21s).
* **Screenshots**: Skipped to minimize CI time.

### Full Local / Pre-Release Mode
Runs before merging or releasing to verify responsive stability across all supported viewport tiers and generate visual artifacts.
```bash
npm run review:quality:full
# Equivalent to: node scripts/quality-audit.mjs --full
```
* **Viewports Tested**: 5 viewports:
  1. `mobile_compact`: 390x844 (Mobile portrait — compact modern phone)
  2. `mobile_standard`: 430x932 (Mobile portrait — large phone)
  3. `tablet_small_desktop`: 1024x768 (Tablet / low-res desktop)
  4. `standard_desktop`: 1440x900 (Standard desktop reference)
  5. `ultrawide`: 3440x1440 (Ultrawide desktop)
* **Scope**: 6 axe-core state scans, responsive geometry matrix across 5 UI states per viewport (25 evaluations total), 5 end-to-end user journeys, and 7 deterministic visual screenshots.
* **Artifacts Generated**: `test-results/screenshots/*.png` and `test-results/quality-audit.json`.

---

## 2. Test Architecture

The audit suite is implemented in `scripts/quality-audit.mjs` and operates via direct CDP primitives:

```
┌────────────────────────────────────────────────────────┐
│                   Quality Audit Runner                 │
│              (scripts/quality-audit.mjs)               │
└───────────┬──────────────┬──────────────┬──────────────┘
            │              │              │
    ┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────────┐
    │  A11y Audits │ │   Layout   │ │  User Journeys │
    │  (Axe-Core)  │ │  Geometry  │ │  (Native CDP)  │
    └───────┬──────┘ └─────┬──────┘ └─────┬──────────┘
            │              │              │
            ▼              ▼              ▼
     Multi-Factor       Multi-State    5 Real Flows
    Ratchet Baseline      Matrix        Dual-Source
 (tests/a11y-baseline)  0px Overflow     Evidence
```

### Layer 1: WCAG 2.1 AA Accessibility Audits
Axe-core scans run across 6 distinct application UI states:
1. `state_1_initial`: Baseline desktop state with map canvas, app masthead, and filter bar.
2. `state_2_locator`: Place Locator dropdown navigation surface open with search input and port list.
3. `state_3_inspector`: Entity Inspector drawer rendered with historical facts and timeline (Port Royal selected).
4. `state_4_drawer`: Multi-source evidence drawer open, rendering archival citations and assertions.
5. `state_5_period_map`: Herman Moll [1715?] georeferenced raster layer loaded with overlay controls active.
6. `state_6_mobile`: Representative mobile portrait state (390x844) with mobile bottom-sheet inspector.

#### Baseline Ratchet Mechanism
Following the contrast repair on `.inspector-dataset-context-badge` using `--cc-ink-soft`, the test enforces a **strict zero-critical, zero-serious** policy defined in `tests/a11y-baseline.json`:
* **Critical violations**: strictly 0 allowed. Any critical violation fails the run.
* **Serious violations**: strictly 0 allowed (`baseline_counts.serious: 0`, `allowed_serious_rules: []`). Any serious violation anywhere across the matrix immediately fails the run.
* **Moderate / Minor**: recorded for monitoring in `quality-audit.json` without failing the build.

### Layer 2: Viewport & Layout Geometry Matrix
Every tested viewport is evaluated across five UI states (`initial`, `inspector_open`, `drawer_open`, `locator_open`, and `period_map_open`) against physical geometry constraints:
* **No Horizontal Overflow**: `document.documentElement.scrollWidth <= window.innerWidth + 2px` (2px tolerance for sub-pixel layout rounding).
* **Panel Boundary Clipping**: `.app-masthead`, `[data-component='place-locator']`, `[data-component='entity-inspector']`, `[data-component='source-drawer']`, `.source-drawer-panel`, `.map-layer-control`, and `.maplibregl-ctrl-attrib` must not clip outside viewport bounds.
* **Control Occlusion**: Primary controls (`[data-locator-toggle]`, `[data-layer-toggle]`) must not be unexpectedly covered by unannounced elements (excluding overlay/drawer backdrops).
* **Zero-Size Interactive Elements**: Interactive buttons/links must have non-zero client dimensions when rendered.
* **Unintended Content Clipping**: Scroll containers must not have `overflow-y: hidden` when content height exceeds container height.

### Layer 3: End-to-End User Journeys
The runner executes five realistic research user journeys using native Chrome DevTools Protocol input (`Input.dispatchKeyEvent` for key navigation and `Input.insertText` for typing):
1. **Journey 1 — Place to Provenance & Dual-Evidence Verification**:
   * Open Place Locator and select Jamaica (`place_jamaica`).
   * Select vessel *Richard & Sarah of London* from network connections list.
   * Verify privateering engagement and petition details render in inspector.
   * Click `[data-privateering-evidence-btn]`; verify Source Drawer opens with `CO 138/11` and `Calendar of State Papers`. Close drawer with Escape.
   * Click `[data-ship-evidence-btn]`; verify Source Drawer opens with `HCA 32/80` and `international maritime labour market` (IMLM). Close drawer with Escape.
   * Both source citations must independently pass with `AND` assertions.
2. **Journey 2 — Temporal Filter & Entity Sync**:
   * Click `1684–1695` temporal preset filter; verify `.is-active` class.
   * Select active event `event_port_royal_earthquake_1692`.
   * Reset filter to `all` (`1650–1730`); verify filter restoration.
3. **Journey 3 — Period Map Lifecycle**:
   * Open historical map panel.
   * Toggle Herman Moll [1715?] layer ON; verify MapLibre layer `historical-reference-moll-1715-layer` added to map style.
   * Adjust raster opacity slider; verify map property updates.
   * Toggle layer OFF; verify layer is removed or hidden.
4. **Journey 4 — Mobile Exploration Flow**:
   * Set mobile viewport (`390x844`).
   * Open locator and select Port Royal.
   * Verify bottom-sheet inspector opens in `data-sheet-state="open"` or `"expanded"`.
   * Click drag handle; verify transition to `expanded`.
   * Close inspector; verify document scroll width has no horizontal overflow.
   * Verify mobile timeline rail buttons exhibit short visible labels (`All`, `1684–1695`, `1702–1712`), full period accessible names via `aria-label`, correct `aria-pressed` state, and `aria-hidden="true"` on inner text spans.
5. **Journey 5 — Browse Places Search & Keyboard Navigation**:
   * Focus `[data-locator-toggle]` and open dropdown navigation surface via native CDP `Enter`.
   * Verify native focus enters `[data-locator-filter-input]` with 29 initial places listed.
   * Type search query `Havana` via native CDP `Input.insertText`; verify list filters to exactly 1 of 29 places.
   * Navigate via native CDP `ArrowDown` (`Input.dispatchKeyEvent`) to first matching place button; verify focus moves to button (`plc_havana`).
   * Navigate via native CDP `ArrowUp`; verify focus returns to search input.
   * Clear query via native `Escape`; verify search input resets to empty and all 29 places restore.
   * Test list navigation via native `ArrowDown`, `End`, `Home`, and `ArrowUp` across visible items.
   * Re-filter by typing `Havana`, `ArrowDown` to Havana item, and activate via native `Enter`.
   * Verify place selection updates `selectionStore` (`selectedPlaceId === 'plc_havana'`), dropdown closes, and focus returns to `[data-locator-toggle]`.

---

## 3. Visual Artifacts & Reporting

### Deterministic Screenshots
When run with `--full`, high-resolution full-page screenshots are written to `test-results/screenshots/`:
* `initial-state-1440x900.png`
* `place-locator-open-1440x900.png`
* `inspector-open-1440x900.png`
* `source-drawer-open-1440x900.png`
* `period-map-active-1440x900.png`
* `mobile-overview-390x844.png`
* `mobile-inspector-390x844.png`

> [!NOTE]
> `test-results/` is explicitly listed in `.gitignore` to prevent binary image drift in git history. Screenshots are generated locally or in review artifacts.

### Audit Report JSON
Every run emits `test-results/quality-audit.json` containing:
* Timestamp, commit SHA, execution mode (`ci_mode` vs `full`).
* Summary counts: critical, serious (allowed vs unallowed), moderate, minor, layout failures, journeys passed/failed, and uncaught browser exceptions.
* Per-state a11y violation records with node targets and descriptions.
* Per-viewport layout findings across evaluated states.
* Journey completion and latency records.

This file is automatically consumed by `scripts/packet-report.mjs --quality=test-results/quality-audit.json` to generate data-derived packet handoff tables.

---

## 4. Continuous Integration (CI)

In `.github/workflows/ci.yml`, the `review:quality` job runs after unit tests and before deployment:
```yaml
- name: Run product quality and accessibility audit
  run: npm run review:quality
```
If any critical violation occurs, any unallowed serious violation appears, any layout overflow is detected, any uncaught browser exception is thrown, or any user journey fails, CI fails immediately.
