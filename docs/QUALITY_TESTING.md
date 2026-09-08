# Quality & Accessibility Testing Guide

This document describes the automated design, usage, accessibility, and layout testing architecture in Charted Currents.

The test harness runs headless Chrome via Puppeteer to evaluate real DOM/CSS layout, native interaction flows, and WCAG 2.1 AA accessibility via `@axe-core/puppeteer`.

---

## 1. Quick Start

### Fast CI Mode (<20s)
Runs in GitHub Actions CI on every push and pull request.
```bash
npm run review:quality
# Equivalent to: node scripts/quality-audit.mjs --ci-mode
```
* **Viewports Tested**: 2 viewports (`1440x900` desktop, `390x844` mobile).
* **Scope**: 6 axe-core state scans, layout geometry checks, 4 end-to-end user journeys.
* **Target Execution Time**: Under 20 seconds (measured ~17s).
* **Screenshots**: Skipped to minimize CI time.

### Full Local / Pre-Release Mode
Runs before merging or releasing to verify responsive stability across all supported viewport tiers and generate visual artifacts.
```bash
npm run review:quality:full
# Equivalent to: node scripts/quality-audit.mjs --full
```
* **Viewports Tested**: 5 viewports:
  1. `390x844` (Mobile portrait — modern phone)
  2. `430x932` (Mobile portrait — large phone)
  3. `1024x768` (Tablet / low-res desktop)
  4. `1440x900` (Standard desktop)
  5. `3440x1440` (Ultrawide desktop)
* **Scope**: 6 axe-core state scans, full responsive geometry checks, 4 end-to-end user journeys, and deterministic visual screenshots.
* **Artifacts Generated**: `test-results/screenshots/*.png` and `test-results/quality-audit.json`.

---

## 2. Test Architecture

The audit suite is implemented in [`scripts/quality-audit.mjs`](file:///home/erich/projects/charted-currents/scripts/quality-audit.mjs) and consists of four main layers:

```
┌────────────────────────────────────────────────────────┐
│                   Quality Audit Runner                 │
│              (scripts/quality-audit.mjs)               │
└───────────┬──────────────┬──────────────┬──────────────┘
            │              │              │
    ┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────────┐
    │  A11y Audits │ │   Layout   │ │  User Journeys │
    │  (Axe-Core)  │ │  Geometry  │ │  (Puppeteer)   │
    └───────┬──────┘ └─────┬──────┘ └─────┬──────────┘
            │              │              │
            ▼              ▼              ▼
    Ratchet Baseline    0px Overflow   4 Real Flows
 (tests/a11y-baseline)  Header/Sheet   State Changes
```

### Layer 1: WCAG 2.1 AA Accessibility Audits
Axe-core scans run across 6 distinct application UI states:
1. **Initial Landing**: Baseline state with map, header, timeline slider, and filter bar.
2. **Vessel Inspector Open**: Entity inspector drawer rendered with historical facts, timeline, and actions.
3. **Source Drawer Open**: Multi-source evidence drawer open, rendering transcriptions and assertions.
4. **Period Map Active**: Herman Moll 1715 georeferenced raster layer loaded and overlay controls visible.
5. **Filters Applied**: Active text filter or search query filtering corpus entities.
6. **About / Methodology Dialog**: Scholarly methodology and attribution modal open.

#### Baseline Ratchet Mechanism
To prevent regressions without blocking on pre-existing editorial contrast choices, the test enforces a **zero-critical, ratcheted-serious** policy defined in [`tests/a11y-baseline.json`](file:///home/erich/projects/charted-currents/tests/a11y-baseline.json):
* **Critical violations**: strictly 0 allowed. Any critical violation fails the run.
* **Serious violations**: only specific selectors documented in the baseline file are tolerated (currently `.inspector-dataset-context-badge` for historical dataset tags). Any new or unexpected serious rule or selector fails the run.
* **Moderate / Minor**: recorded for monitoring in `quality-audit.json` without failing the build.

### Layer 2: Viewport & Layout Geometry Checks
Every tested viewport is evaluated against strict physical geometry constraints:
* **No Horizontal Overflow**: `document.documentElement.scrollWidth <= window.innerWidth + 2px` (2px tolerance for browser rounding).
* **Persistent Navigation / Header**: App header must remain visible, within viewport bounds, and unobstructed.
* **Mobile Inspector Layout**: On mobile (<768px), inspector must properly activate as a bottom sheet (`data-sheet-state="open"` or `"expanded"`) rather than overflowing off-screen.
* **Desktop Split View**: On desktop, map and inspector coexist without overlapping controls.

### Layer 3: End-to-End User Journeys
The runner executes four realistic research user journeys:
1. **Journey 1 — Landing to Vessel Inspection**:
   * Click a vessel card in the entity list.
   * Verify inspector opens, displays vessel name (*Richard & Sarah of London*), and renders route metadata.
2. **Journey 2 — Vessel to Source Drawer Evidence**:
   * Click the "Inspect All Assertions" button in the inspector.
   * Verify source evidence drawer opens, displaying archival citations (`CO 138/11` and `HCA 32/80`).
3. **Journey 3 — Period Map Toggle & Opacity Slider**:
   * Activate the historical map layer (Herman Moll [1715?]).
   * Change opacity slider; verify map canvas updates and controls remain responsive.
4. **Journey 4 — Search / Filter to Selection**:
   * Type search query into the search input.
   * Verify list filters down and selecting the filtered entity activates the inspector.

---

## 3. Visual Artifacts & Reporting

### Deterministic Screenshots
When run with `--full`, high-resolution full-page or component screenshots are written to `test-results/screenshots/`:
* `01-landing-desktop.png`
* `02-landing-mobile.png`
* `03-inspector-richard-and-sarah.png`
* `04-source-drawer-open.png`
* `05-period-map-active.png`
* `06-filtered-results.png`
* `07-about-dialog.png`

> [!NOTE]
> `test-results/` is explicitly listed in `.gitignore` to prevent binary image drift in git history. Screenshots are generated locally or in review artifacts.

### Audit Report JSON
Every run emits [`test-results/quality-audit.json`](file:///home/erich/projects/charted-currents/test-results/quality-audit.json) containing:
* Timestamp, execution time (ms), and mode (`ci-mode` vs `full`).
* Total axe violations count categorized by impact (`critical`, `serious`, `moderate`, `minor`).
* Array of evaluated viewports and pass/fail layout statuses.
* Array of user journeys with completion status and latency.
* List of generated screenshot filenames.

This file is automatically consumed by `scripts/packet-report.mjs --quality=test-results/quality-audit.json` to generate data-derived packet handoff tables.

---

## 4. Continuous Integration (CI)

In [`.github/workflows/ci.yml`](file:///home/erich/projects/charted-currents/.github/workflows/ci.yml), the `review:quality` job runs after unit tests and before deployment:
```yaml
- name: Run product quality and accessibility audit
  run: npm run review:quality
```
If any critical violation occurs, any layout overflow is detected, or any user journey fails, CI fails immediately.
