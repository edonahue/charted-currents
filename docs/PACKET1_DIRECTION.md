# Packet 1 product direction

This document locks the remaining product/design choices for the first public interactive shell. These are not prompts for another option survey. Gemini should implement them within the existing architecture and refine details locally where they are reversible.

## 1. Real geographic anchors, not fake history

Packet 1 may use a **small set of real modern geographic locator anchors** to make the map genuinely explorable before the historical corpus exists.

Initial anchors:

- Port Royal, Jamaica;
- Havana, Cuba;
- Curaçao / Willemstad;
- Cartagena de Indias, Colombia.

Their Packet 1 purpose is limited to:

- a real place label;
- a modern locator point;
- map selection;
- exercising the shared `port` selection/inspector path;
- establishing geographic relationships across the Greater Caribbean.

They do **not** establish any historical voyage, vessel, event, port boundary, political jurisdiction, or period-specific coordinate. The point geometry is a modern interface locator only. Historical place assertions and historical-name variants enter through the normal evidence/provenance system later.

Keep these development anchors outside `public/data/`; that directory is reserved for deliberately published historical artifacts. `src/lib/map/developmentAnchors.ts` is the canonical Packet 1 anchor list.

The locator coordinates come from GeoNames, whose data is licensed under **CC BY 4.0**. If the development anchors appear in the public Packet 1 shell, expose the discreet credit defined by `DEVELOPMENT_ANCHOR_ATTRIBUTION` in the canonical anchor module (for example in a credits/About/utility surface). Source metadata in code alone is not a substitute for public attribution.

## 2. Basemap: restrained modern context, trending historical-atlas

Use the current OpenFreeMap/MapLibre runtime, but do not leave the default Liberty style visually dominant.

Packet 1 should move toward a deliberately quiet modern spatial context:

- mute or remove most roads and contemporary POI clutter;
- reduce modern administrative-boundary prominence;
- emphasize coastline, land/water shape, islands, and a restrained set of orientation labels;
- preserve required attribution;
- let Charted Currents overlays, typography, paper/ink surfaces, and selected historical references provide the visual character.

This should lean toward a period-inflected editorial atlas without pretending the modern basemap is historical cartography. Do not spend Packet 1 building new tile infrastructure.

## 3. Responsive composition

### Desktop

Use an elegant **right-side inspector dock** that preserves substantial map area and feels integrated into the atlas rather than like a generic analytics sidebar.

The inspector may open/close or adapt width as interaction requires, but the map should remain the dominant spatial surface.

### Mobile

Use an elegant **bottom sheet / drawer** rather than stacking a full inspector below the map.

Requirements:

- the map remains visibly present while the sheet is open;
- the sheet has a clear drag/close affordance without mimicking a native app mechanically;
- content can scroll independently when needed;
- keyboard/focus behavior remains correct;
- sheet states should be simple and predictable (for example closed / useful partial height / expanded) rather than an elaborate gesture system;
- do not add a UI framework solely to implement the sheet.

## 4. Camera behavior

Selecting an anchor/entity may gently reposition the map **only as needed to keep the selected feature visible beside/above the inspector**.

Default behavior:

- restrained MapLibre `easeTo`-style movement;
- minimal zoom change;
- preserve user geographic context;
- north-up, essentially 2D presentation;
- no cinematic fly-throughs;
- no gratuitous pitch/bearing effects;
- reduced-motion users receive immediate/minimal repositioning rather than animated travel.

The interaction goal is continuity, not spectacle.

## 5. Timeline in Packet 1

The compact **1650–1730 timeline rail should already look intentional and finished as part of the composition**, but it must not pretend to filter historical evidence before Packet 2 provides temporal data.

Packet 1 may establish:

- beginning/end years;
- tick/period hierarchy;
- spatial relationship with map and inspector;
- visual language for future event/source-coverage marks;
- an honest prototype/non-filtering state.

Do not implement a fake scrubber whose movement implies data filtering that does not yet exist.

## 6. Typography

Use locally bundled/open-font dependencies:

- **Libre Caslon Text** — primary editorial/historical serif;
- **Inter** — interface sans;
- **IBM Plex Mono** — archival IDs, coordinates, evidence metadata, and research-oriented microcopy.

Use Fontsource packages so the public shell does not depend on a third-party font CDN. Keep font usage restrained; the serif should create historical/editorial character without turning every control into period pastiche.

## 7. Visual reference board

Packet 1 should work from **real historical reference images locally available in the repository**, not only URLs that require the agent to browse repeatedly.

The initial board should include a small set of public-domain/reference-safe derivatives representing:

1. Herman Moll, *A map of the West-Indies...*, ca. 1715 — regional hierarchy, trade winds, route notation, harbor insets.
2. Guillaume Delisle, *Carte des Antilles françoises et des isles voisines*, 1717/1718 — alternative imperial/cartographic viewpoint, lettering, hierarchy, chart composition.
3. Georges-Louis Le Rouge, *Port-Royal de Jamaique*, 1755 — harbor/fort plan language and an explicitly later representation of the 1692 earthquake aftermath.
4. Patrick Browne / Sheffield / J. Bayly, Jamaica with Port Royal detail, 1755 — soundings, settlements, coastline detail, inset treatment.

Each local reference must retain a manifest entry with creator, date, holding/source institution, canonical source URL, rights basis, retrieval origin, and a note that the local derivative is **design research / evidence reference**, not anonymous product texture.

Use `design/reference-board/manifest.json` and `scripts/sync-visual-references.mjs`. Do not introduce these images into the public application merely because they are checked into the repository.

## 8. Maker identity

Charted Currents owns the primary experience. Personal/portfolio identity is secondary.

A restrained secondary treatment such as **“Erich Donahue · Lab”** and a GitHub/project link is appropriate in low-priority chrome, an About surface, or footer/utility area.

Do not turn the masthead into portfolio navigation or make the project look embedded inside a personal landing page.

## Packet 1 visual test

The shell should feel, in order:

1. like an inviting map worth exploring;
2. like an editorial historical atlas with a modern interaction model;
3. credible and careful about what is and is not yet historical evidence;
4. polished enough that the early public Pages deployment feels intentional rather than like a framework demo.
