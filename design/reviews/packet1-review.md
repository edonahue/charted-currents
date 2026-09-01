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

During the initial visual pass and subsequent cleanup and hardening review, the following concrete changes were made based on real browser observations and accessibility audits:

1. **Portable Review Automation & Public-Boundary Safety**:
   - *Observation*: The initial review harness contained a personal home-directory path and fixed ports.
   - *Refinement*: Hardened `scripts/capture-reviews.mjs` with runtime executable discovery (`CHROME_BIN`, system paths, dynamic cache discovery), dynamic ephemeral ports, path traversal guards, and interactive assertions via `npm run review:capture`.

2. **Focus Modality & Escape Isolation**:
   - *Observation*: Escape inside the "Browse places" disclosure closed both the menu and cleared the active selection due to bubbling; pointer activation was conflated with keyboard activation.
   - *Refinement*: Added `e.stopPropagation()` on menu Escape keydown, differentiated pointer vs keyboard activation using `e.detail === 0`, and moved focus tracking into a typed scoped module (`interactionState.ts`) without `window` pollution.

3. **Subtle Editorial Focus Cue on Heading**:
   - *Observation*: Suppressing focus styling completely (`outline: none`) left keyboard users without visual feedback when focus moved to the inspector heading.
   - *Refinement*: Added a subtle brass baseline accent (`box-shadow: inset 0 -2px 0 var(--cc-brass)`) on `:focus-visible` while keeping mouse clicks clean.

4. **Map Hit Target & Hover Feature-State**:
   - *Observation*: Overlapping event listeners on outer ring, core, and label layers caused redundant event firing.
   - *Refinement*: Consolidated interaction onto a single generous transparent `dev-anchors-hit-target` circle layer (~22px radius) and added a subtle outer-ring hover feature-state response.

5. **Elimination of Translucent Glassmorphism & Status Box Dismissal**:
   - *Observation*: Floating status boxes and translucent/blurred surfaces introduced generic web-dashboard aesthetics.
   - *Refinement*: Replaced translucent overlays with solid book-arts paper surfaces (`var(--cc-paper-raised)`), and dismissed the success status banner into an accessible live region (`sr-only`), keeping it visible only during genuine fallback/error conditions.

6. **Public Copy De-Jargonization**:
   - *Observation*: Internal project-management terms ("Packet 1", "Packet 2", "implementation shell") were visible in UI chrome.
   - *Refinement*: Updated titles, masthead kickers, and disclaimers to public-safe phrasing ("Research prototype", "Historical records not yet loaded").

## Known Visual Limitations & Deferred Items

- **Historical Polygons & Routes**: The four development marks (Port Royal, Havana, Curaçao, Cartagena) are modern populated-place locators from GeoNames (CC BY 4.0). Historical harbor extents, fortifications, voyages, and period tracks begin in Packet 2 with real evidence records.
- **Raster Period Map Overlays**: Period georeferenced raster layers (e.g., Moll 1715) are planned for Packet 2/3 and intentionally not included in Packet 1 to keep the initial shell lightweight.
- **Timeline Filtering**: The 1650–1730 timeline is an intentional non-filtering period rail in Packet 1; temporal brush and range filtering will connect to real temporal event records in Packet 2.
