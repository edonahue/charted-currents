# Visual quality contract

This is an implementation contract, not a mood board. Packet 1 is not accepted merely because the interface is functional, responsive, and historically careful. It must also avoid the recognizable shortcuts that make an AI-generated historical interface look cheap.

## Desired impression

In the first five seconds the page should feel, in order:

1. like a serious, inviting map worth touching;
2. like a contemporary editorial atlas informed by real historical cartography;
3. like a modern interactive product rather than a scanned-map viewer;
4. restrained enough that the actual historical evidence can become the most visually interesting material later.

The design should get its historical character primarily from **typography, proportion, cartographic linework, hierarchy, restrained color, and real source imagery**. It should not depend on pirate decoration or fake aging effects.

## Anti-cheapness rules

Do not use these as the default visual language:

- generic dashboard card grids;
- glassmorphism or floating translucent-card soup;
- large rounded SaaS cards everywhere;
- pill-shaped controls/badges for every concept;
- strong decorative gradients;
- generic navy-and-gold "luxury pirate" branding;
- fake parchment textures, burnt edges, stains, torn paper, or sepia photo filters;
- anchor/skull/ship-wheel/compass clip art as ambient decoration;
- faux wax seals, treasure-chest metaphors, stamped pirate fonts, or distressed type;
- heavy drop shadows that make every surface float independently;
- excessive all-caps microcopy;
- oversized hero marketing copy that pushes the map below the fold;
- random icon libraries mixed with historical ornament;
- animation whose purpose is to demonstrate animation.

A historical source image may be visibly old because it **is a historical source**. The application chrome should not pretend to be old.

## Composition

There should be only a few major spatial layers:

1. map/world;
2. inspector/evidence surface;
3. compact timeline;
4. minimal utility/identity chrome.

Avoid adding independent cards around the map. When information belongs to the selected entity, it belongs in the inspector. When information changes the map, it belongs in a restrained map control or legend. When it is provenance, it belongs in the evidence/source path.

### Desktop

- Map should visually own roughly three quarters of the first screen before an inspector is opened.
- The right inspector dock should read as an **atlas margin / research folio**, not a generic application sidebar.
- The boundary between map and inspector should be achieved mostly with a rule, change of paper value, and typography—not a giant shadow or floating-card radius.
- Masthead/utility chrome should consume little vertical space and may visually merge with the map edge rather than behaving like a conventional website navigation bar.

### Mobile

- Map remains visible with the bottom sheet open.
- The partial sheet should feel like an elegant paper folio sliding over the lower map, not a stock mobile modal.
- Use a small number of sheet states; avoid a gesture demo.
- Maintain generous touch targets without making every control visually large.

## Surface language

Prefer:

- hairline rules;
- subtle changes in warm-paper value;
- very small radii (often 0–6px);
- restrained shadow only where depth communicates behavior, especially the mobile sheet;
- typographic grouping before boxes;
- negative space before decoration;
- a small number of clearly meaningful colors.

The inspector can contain document-like sections, but "document-like" means careful hierarchy and evidence metadata—not fake paper artifacts.

## Typography

Canonical families are already settled:

- Libre Caslon Text for editorial/historical hierarchy;
- Inter for interface copy and controls;
- IBM Plex Mono for IDs, coordinates, accession-like metadata, and compact evidence labels.

Use contrast by **size, weight, spacing, and family**, not by adding boxes around every heading.

Recommended posture:

- large-but-not-heroic Caslon entity/project headings;
- Inter for ordinary explanatory text and controls;
- Caslon italic sparingly for source-language/title moments;
- mono at small sizes only where the content actually has archival/technical meaning.

Do not force Libre Caslon Text into MapLibre symbol labels in Packet 1. MapLibre labels use provider-served glyphs unless we deliberately build/host a glyph pipeline. Project overlay labels may use a provider-compatible map font while the surrounding UI carries the Caslon identity.

## Map cartography

The modern basemap should recede.

### Preserve/emphasize

- sea/land silhouette;
- coastlines and island structure;
- major place orientation labels at restrained contrast;
- selected project anchors/entities;
- required provider/data attribution.

### Mute/remove

- POIs;
- road hierarchy except where faint orientation value remains at close zoom;
- buildings;
- housenumbers;
- transit detail;
- most land-use coloration;
- contemporary administrative emphasis;
- modern visual clutter competing with project layers.

The sea should feel like the primary field. Land should read as warm chart material rather than bright modern map fill.

See `src/lib/map/visualPolicy.ts` for the machine-readable Packet 1 posture.

## Project markers

Do not use default MapLibre teardrop pins.

Packet 1 port anchors should use a restrained custom map-layer treatment: a small ink/brass point or concentric ring with an intentional selected state. Use MapLibre GeoJSON + circle/symbol layers rather than four independent HTML widgets unless accessibility/testing demonstrates a reason otherwise.

Hover/focus/selection should change **weight, ring, opacity, or label emphasis**, not introduce a large bouncing marker.

The selected state must be visible without relying on color alone.

## Routes later

When routes arrive, treat line semantics as cartography, not chart decoration:

- documented/observed geometry: strongest continuous treatment;
- schematic endpoint connection: visibly schematic;
- reconstructed route: distinct pattern/dash/annotation;
- uncertainty cannot be represented by color alone.

Line width should remain fine enough that the Caribbean stays readable.

## Timeline

The Packet 1 timeline is a period rail, not a slider.

Avoid the bootstrap gradient bar. Prefer an engraved-chart-like temporal rule with measured tick hierarchy and a few Caslon/Inter year labels. It should look capable of accepting event/coverage marks later without falsely advertising current filtering.

## Evidence state

Evidence UI should feel like editorial notation, not gamification.

Prefer compact rectangular/near-square labels, rules, line patterns, and precise wording. Avoid bright status-chip palettes and excessive pill badges.

## Historical imagery

Real historical imagery should eventually provide the visual richness that generic decoration cannot.

Appropriate uses include:

- inspectable map/reference layer;
- source thumbnail leading into the evidence drawer;
- entity illustration when source relationship and rights are explicit;
- detail crop shown with source/date/institution context;
- a compare/opacity/swipe view once georeferencing is defensible.

Do not sample a historical scan into an anonymous global parchment background.

## Motion

Motion should clarify spatial continuity.

- map selection: gentle ease, normally about 450–700ms;
- inspector open/close: about 160–240ms;
- hover/focus: about 100–160ms;
- no bounce/spring by default;
- no dramatic parallax;
- no route animation before there is meaningful route data;
- reduced-motion must remove nonessential travel/transition.

Use the shared CSS/mapping motion tokens; do not scatter unrelated cubic-bezier curves and durations through components.

## Modern interaction precedents

Read `design/MODERN_INTERACTION_REFERENCES.md`. Precedents are for interaction principles, not visual cloning.

## Visual review matrix

Before Packet 1 handoff, inspect the real application at minimum at:

- 1440 × 900 — ordinary desktop/laptop;
- 3440 × 1440 — ultrawide stress test: map should benefit from width rather than stretching chrome absurdly;
- 390 × 844 — narrow phone;
- 430 × 932 — larger phone.

At each size answer:

1. Is the map unquestionably the primary surface?
2. Does the UI look intentionally composed rather than generated from default blocks?
3. Is there any unnecessary card/pill/gradient/shadow treatment?
4. Does historical character come from typography/cartography/evidence rather than costume?
5. Does selection preserve geographic context?
6. Are empty/prototype states elegant rather than apologetic developer messages?
7. Does any modern-map detail visually compete with Charted Currents?

Packet 1 is not visually accepted until those answers are satisfactory in actual browser inspection.

## Screenshot review requirement

For browser-capable agents, capture/inspect the running application at desktop and phone widths after the major composition is in place and again before handoff. An agent should make at least one deliberate visual-refinement pass **after** functionality works. Do not treat the first functional layout as the final design.
