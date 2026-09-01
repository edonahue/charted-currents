# Packet 1 Visual Review & Hardening Note

**Date**: 2026-09-01
**Target**: Packet 1 interactive shell, map styling, dynamic dock, mobile bottom sheet, focus management, and non-filtering period rail.
**Runtime**: Real running Astro static build served via HTTP and rendered in headless Chromium (`Google Chrome for Testing`).

## Viewport Artifacts Retained

The following final representative screenshots from the real application runtime are retained under `design/reviews/`:

- `packet1-desktop-1440x900.png`: Standard desktop viewport showing the quiet atlas basemap, masthead, "Browse places (4)" control, zoom chrome, and 1650–1730 period rail.
- `packet1-ultrawide-3440x1440.png`: Ultrawide viewport demonstrating full canvas utilization without awkward stretched cards.
- `packet1-phone-390x844.png`: Compact phone viewport with top masthead brand, map workspace, and bottom period rail.
- `packet1-phone-430x932.png`: Large phone viewport verifying responsive layout scaling.
- `packet1-desktop-selected-1440x900.png`: Desktop viewport with an active place selection (Port Royal), showing the right-side folio dock claiming its constrained width while the map remains dominant.
- `packet1-phone-selected-390x844.png`: Mobile viewport with an active place selection, showing the bottom sheet anchored at `bottom: 0` with drag handle, title, coordinates, and prototype disclaimer.

## Hardening & Visual Refinements

During the initial visual pass and subsequent cleanup and rebuttal review, the following concrete changes were made based on real browser observations, strict assertions, and accessibility audits:

1. **Strict Deterministic Assertion Suite & Exit Code Gates**:
   - *Observation*: Initial review scripts logged assertions without failing on falsy conditions, and swallowed errors inside `finally`.
   - *Refinement*: Replaced lenient reporting with a 24-check assertion suite in `scripts/capture-reviews.mjs` (via `npm run review:capture`) that enforces non-zero exit codes on any failure, timeout, or uncaught runtime exception (`Runtime.exceptionThrown`).

2. **Deterministic Map Lifecycle Synchronization**:
   - *Observation*: Headless browsers without active frame rendering did not trigger MapLibre's render-bound `load` event until a paint occurred, causing timeout warnings.
   - *Refinement*: Subscribed to `style.load` alongside `load` and `isStyleLoaded()`, ensuring `dataset.mapReady = "true"` is set deterministically immediately upon style readiness.

3. **Focus Modality & Escape Isolation**:
   - *Observation*: Escape inside the "Browse places" disclosure closed both the menu and cleared the active selection due to bubbling; pointer opening forced focus into the list; pointer selection orphaned focus on `document.body` after menu closure.
   - *Refinement*: Added `e.stopPropagation()` on menu Escape, input-aware `toggleMenu(open, focusFirstItem)`, focus return to toggle on pointer item selection, arrow key menu navigation, and defensive `!e.defaultPrevented` check on inspector Escape.

4. **Mobile Bottom Sheet Accessibility Affordance**:
   - *Observation*: Handle button lacked `aria-controls` and dynamic accessible label updates between partial and expanded states.
   - *Refinement*: Added `aria-controls="entity-inspector"`, synchronized `aria-expanded="false"` / `"true"`, and dynamic labels (`Expand place details` / `Collapse place details`).

5. **Basemap Unavailable Fallback Simulation**:
   - *Observation*: Fallback behavior was implemented in code but unexercised by automated review.
   - *Refinement*: Integrated automated fallback simulation proving the error banner is visibly exposed and place locators remain functional even if basemap services are offline.

6. **Elimination of Translucent Glassmorphism & Status Box Dismissal**:
   - *Observation*: Floating status boxes and translucent/blurred surfaces introduced generic web-dashboard aesthetics.
   - *Refinement*: Replaced translucent overlays with solid book-arts paper surfaces (`var(--cc-paper-raised)`), and dismissed the success status banner into an accessible live region (`sr-only`), keeping it visible only during genuine fallback/error conditions.

7. **Public Copy Refinement**:
   - *Observation*: Internal project-management terms ("Packet 1", "Development Locators") were visible in UI chrome.
   - *Refinement*: Updated titles, masthead kickers, headers, and disclaimers to public-safe reference phrasing ("Reference places", "Modern populated place", "Modern location reference only").

## Verification Evidence Categories

- **Deterministic Automated Proofs (`npm run review:capture`)**:
  - Map initialization & readiness gate (`dataset.mapReady === "true"`);
  - MapLibre & GeoNames CC BY 4.0 attribution DOM presence;
  - Pointer selection flow & focus return to toggle button;
  - Escape isolation in disclosure menu with active inspector dock;
  - Keyboard selection flow & focus transfer to `#inspector-heading`;
  - Escape focus restoration to triggering element / toggle;
  - Mobile sheet toggle, `aria-controls`, and dynamic label updates;
  - Shift+Arrow 2D gesture interception (`map.getBearing() === 0`);
  - Basemap fallback notice visibility & disclosure operability;
  - 0 uncaught runtime exceptions.
- **Automated Type & Build Checks (`npm run verify`)**:
  - Astro diagnostics (0 errors, 0 warnings, 0 hints across 23 files);
  - Static production build (`dist/` directory generated).
- **Zero-Dependency Preflight (`npm run preflight`)**:
  - Node floor `>=22.19.0 <23`, required files, lockfile validation.
- **GitHub Actions CI Workflow (`.github/workflows/ci.yml`)**:
  - Remote verification of preflight, Astro check, and static build on push/PR.
