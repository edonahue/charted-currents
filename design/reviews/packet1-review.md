# Packet 1 Visual Review Note

**Date**: 2026-09-01  
**Target**: Packet 1 interactive shell, map styling, dynamic dock, mobile bottom sheet, and non-filtering period rail.  
**Runtime**: Real running Astro static build served via HTTP and rendered in headless Chromium (`Google Chrome for Testing 151.0.7922.34`).

## Viewport Artifacts Retained

The following final representative screenshots from the real application runtime are retained under `design/reviews/`:

- `packet1-desktop-1440x900.png`: Standard desktop viewport showing the quiet atlas basemap, masthead, "Browse places (4)" control, zoom chrome, and 1650–1730 period rail.
- `packet1-ultrawide-3440x1440.png`: Ultrawide viewport demonstrating full canvas utilization without awkward stretched cards.
- `packet1-phone-390x844.png`: Compact phone viewport with top masthead brand, map workspace, and bottom period rail.
- `packet1-phone-430x932.png`: Large phone viewport verifying responsive layout scaling.
- `packet1-desktop-selected-1440x900.png`: Desktop viewport with an active place selection (Port Royal), showing the right-side folio dock claiming its constrained width while the map remains dominant.
- `packet1-phone-selected-390x844.png`: Mobile viewport with an active place selection, showing the bottom sheet anchored at `bottom: 0` with drag handle, title, coordinates, and prototype disclaimer.

## Deliberate Post-Functionality Visual Refinements

During the dedicated visual refinement pass following functional implementation, the following concrete design changes were made based on real browser observations:

1. **Heading Focus Outline Suppression for Non-Interactive Target**:
   - *Observation*: Programmatically focusing the inspector heading (`h2.inspector-title`) upon selection caused Chromium to draw an aggressive blue focus rectangle around the title text, disrupting the calm editorial typography.
   - *Refinement*: Added `outline: none` to `.inspector-title:focus`, preserving programmatic focus for assistive technology without unwanted visual artifacts for sighted users.

2. **Mobile Bottom Sheet Alignment and Timeline Integration**:
   - *Observation*: In the initial mobile layout, positioning the bottom sheet with `bottom: var(--cc-timeline-height)` left an awkward peek of timeline tick marks and text clipping behind the sheet.
   - *Refinement*: Anchored `.inspector-shell` to `bottom: 0` on mobile (`z-index: 25`) with safe-area bottom padding and rounded top corners (`var(--cc-radius-md)`), providing an intentional modal sheet over the map.

3. **Folio Metadata Row Separation**:
   - *Observation*: Definition list metadata (coordinates, locator type, locator source) ran together without sufficient visual grouping in the narrow folio dock.
   - *Refinement*: Added 1px dashed hairline dividers (`border-bottom: 1px dashed var(--cc-line)`) and subtle vertical row padding between metadata pairs.

4. **Timeline Tick Hierarchy**:
   - *Observation*: Five evenly-spaced ticks on a wide timeline lacked cartographic detail.
   - *Refinement*: Added minor decade ticks (1660, 1680, 1700, 1720) with reduced height (0.4rem) and opacity (0.5), evoking the fine engraved rules of 18th-century maritime charts.

## Known Visual Limitations & Deferred Items

- **Historical Polygons & Routes**: The four development marks (Port Royal, Havana, Curaçao, Cartagena) are modern populated-place locators from GeoNames (CC BY 4.0). Historical harbor extents, fortifications, voyages, and period tracks begin in Packet 2 with real evidence records.
- **Raster Period Map Overlays**: Period georeferenced raster layers (e.g., Moll 1715) are planned for Packet 2/3 and intentionally not included in Packet 1 to keep the initial shell lightweight.
- **Timeline Filtering**: The 1650–1730 timeline is an intentional non-filtering period rail in Packet 1; temporal brush and range filtering will connect to real temporal event records in Packet 2.
