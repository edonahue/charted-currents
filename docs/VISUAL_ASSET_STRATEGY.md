# Visual asset and technique strategy

Charted Currents should become visually richer primarily by introducing **better historical evidence and better cartography**, not by accumulating decorative UI effects.

This document distinguishes the visual assets/techniques worth preparing for from the ones that should remain deferred until real evidence requires them.

## Principle

A modern UI can be beautiful because it gives historical material room to be beautiful.

Prefer this progression:

```text
modern spatial clarity
  + editorial typography
  + project cartographic marks
  + real source maps/documents/images
  + evidence-aware interaction
  = historical atmosphere
```

Do not replace the source-material steps with fake parchment, clip art, or costume typography.

---

## Asset class 1 — Modern cartographic substrate

### Packet 1

Use:

- MapLibre GL JS;
- OpenFreeMap data/service;
- Positron as a clean seed;
- `src/lib/map/visualPolicy.ts` + runtime policy adapter;
- project GeoJSON/circle/symbol layers for selectable anchors.

Design tasks:

- quiet modern map detail;
- warm chart-like land/background values;
- subdued cool sea field;
- fine modern orientation labels;
- custom project marker/selection states;
- integrated attribution and controls.

### Later

If Packet 1 runtime styling becomes cumbersome, graduate to a **project-hosted MapLibre style JSON** based on a documented OpenFreeMap/OpenMapTiles-compatible style. That would let the project own layer hierarchy deterministically while continuing to use the same tile provider.

Do not build a custom tile stack merely to get custom colors.

---

## Asset class 2 — Period maps as evidence layers

This is one of the highest-value future visual capabilities.

Potential sources already researched include Library of Congress, BnF/Gallica, Rijksmuseum, JCB, BNE, dLOC, and other institutional collections.

### Desired experience

A user should eventually be able to:

- turn on a period map/reference layer;
- see its source date, creator, institution, and rights;
- change opacity against modern geography;
- understand whether it is contemporary with the selected event or a later representation;
- inspect the source itself;
- compare the cartographer's geographic assertions with modern spatial context without mistaking one for the other.

### Technical patterns

Depending on the source:

- ordinary raster source/layer for already georeferenced imagery;
- tiled raster/PMTiles when large georeferenced sheets warrant it;
- MapLibre image source for small/simple bounded imagery when four-corner placement is defensible;
- an institutional IIIF image service as the canonical high-resolution source where available;
- opacity control before more elaborate compare modes;
- later swipe/spyglass comparison inspired by Rumsey-style workflows when it actually improves interpretation.

### Required metadata

Every public period-map layer should know:

- project asset ID;
- source/institution item ID;
- creator/title/date;
- source URL;
- rights and credit line;
- retrieval/version info;
- georeferencing method/source;
- transformation/cropping/resampling history;
- source-date relationship to the historical event/period being discussed;
- whether georeferencing is project-generated or institution-provided.

A beautiful georeferenced map with unclear provenance is not an acceptable visual layer.

---

## Asset class 3 — Primary documents and manuscript pages

Historical records should become visually inspectable, not just external hyperlinks.

### Near-term

Use restrained source thumbnails/previews in the evidence path when item rights permit. The thumbnail should always feel like a doorway into a source, with title/date/institution nearby.

### Later deep zoom

Where an institution exposes IIIF, prefer using its image service/manifests rather than downloading giant master files unnecessarily.

A dedicated deep-zoom viewer such as OpenSeadragon can be introduced when there is a real use case: manuscripts, maps, registers, or documents whose detail cannot be understood from an ordinary image element.

Do **not** add OpenSeadragon during Packet 1. Introduce it only after a real source object proves the need.

Potential future interactions:

- source thumbnail → evidence drawer → deep zoom;
- highlight/crop coordinates linking an assertion to an area of a document;
- side-by-side normalized transcription and source image;
- preserved institutional metadata/manifest link.

---

## Asset class 4 — Ship, port, person, and material-culture imagery

Use imagery when it has a defensible relationship to the selected entity.

Relationship should be explicit, for example:

- depicts this ship;
- depicts this person;
- depicts this port near this period;
- recovered from this wreck;
- later commemoration/representation;
- representative object from a contextual source, clearly labeled as contextual.

Do not silently use a generic 18th-century ship engraving as though it depicts a vessel in the database.

### UI posture

Prefer:

- one strong image/detail with provenance;
- small source-object strips;
- full-image inspect action;
- meaningful crops when transformation metadata is retained.

Avoid decorative galleries whose historical relationship is vague.

---

## Asset class 5 — Project-owned cartographic primitives

Charted Currents should eventually own a small visual alphabet rather than relying on a generic icon library.

Packet 1 can establish these without image assets:

- port/anchor point mark;
- selected point ring;
- focus/keyboard state;
- timeline major/minor tick;
- evidence-state border/line vocabulary;
- source/evidence link notation.

Later, once real data requires them, add carefully designed primitives for:

- schematic route;
- reconstructed route;
- observed/documented track;
- capture/conflict event;
- storm/environmental event;
- source-coverage gap;
- wreck/loss site with sensitivity-aware geometry.

Favor MapLibre circle/line/symbol layers and small original SVGs only when geometry cannot express the concept well.

Do not start with Font Awesome/Material/Heroicons as the project's historical icon vocabulary. A small generic utility icon may be acceptable for universal actions such as close/external-link, but product semantics should not become a stock icon set.

---

## Asset class 6 — Cartographic line and pattern language

Fine linework can create historical resonance without fake antiquing.

Useful techniques:

- hairline coastline/project outlines;
- `line-dasharray` for reconstruction/schematic semantics;
- repeated ticks/hatching where meaning justifies them;
- concentric point rings;
- low-opacity secondary boundaries;
- restrained halo around orientation labels;
- annotation leader lines;
- measured inset rules/dividers.

Pattern meaning must be documented and accessible. Do not rely only on subtle color differences.

---

## Asset class 7 — Texture

Default answer: **do not add a texture asset in Packet 1**.

A flat-but-warm paper field plus real map/source imagery is safer and more modern than generated parchment noise.

If a later design review demonstrates that surfaces are unnaturally sterile, a tiny project-owned monochrome paper grain may be tested at very low contrast. It must:

- remain visually subordinate;
- not reduce text/map legibility;
- not imitate stains/tears/age damage;
- not become part of historical-evidence imagery;
- be removable without changing hierarchy.

Do not generate or download a distressed-paper background merely because the subject is historical.

---

## Asset class 8 — Motion

No animation asset/library is required.

Use native CSS and MapLibre transitions first:

- context-preserving map ease;
- inspector reveal;
- bottom-sheet state transition;
- selected-marker emphasis;
- evidence drawer transition;
- timeline marks later.

Only add an animation library if a later interaction is demonstrably difficult to implement/accessibly maintain without it.

Motion should explain **where something came from or what changed**, not supply spectacle.

---

## Asset processing

As real public imagery arrives, add a deterministic asset pipeline rather than ad-hoc image editing.

Likely future responsibilities:

- fetch only when source rights permit local derivative storage;
- record canonical source URL/item ID;
- checksum originals/derivatives where useful;
- generate responsive derivatives (WebP/AVIF/JPEG as appropriate);
- retain source aspect ratio and crop metadata;
- record transformations;
- avoid shipping oversized archive masters when institutional delivery can be used;
- separate design-reference files from public-product assets.

Do not add an image-processing dependency until the first real publishable asset makes the requirements concrete.

---

## Visual testing strategy

### Packet 1

Manual browser evidence plus retained final screenshots under `design/reviews/` is enough.

### After composition stabilizes

Add Playwright visual/regression coverage only for stable, valuable states such as:

- initial desktop shell;
- selected port desktop dock;
- selected port mobile bottom sheet;
- timeline + map layout;
- source drawer once real provenance exists.

Avoid brittle screenshot tests for every component during the exploratory first pass. Establish the composition first, then protect it.

---

## Technique priority by phase

### Packet 1 — use now

- Positron + project MapLibre layer styling;
- custom circle/ring markers;
- editorial typography;
- hairline/rule-based surfaces;
- restrained CSS/MapLibre motion;
- real local historical reference board;
- visual review artifacts.

### Packet 2 — likely next

- real source thumbnails;
- first rights-cleared period map/reference layer;
- evidence drawer with visual source object;
- semantic route line styles;
- real temporal/event marks.

### v0.1 / later

- opacity/compare treatment for georeferenced period maps;
- IIIF-aware source viewer/deep zoom where justified;
- richer route/cartographic pattern system;
- responsive image derivative pipeline;
- stable Playwright visual regression states;
- project-hosted map style JSON if runtime style mutation proves too fragile.

### Deliberately deferred

- custom tile infrastructure;
- custom glyph hosting solely to put Caslon into the basemap;
- animation framework;
- generic icon library as visual identity;
- faux paper texture;
- 3D globe/buildings/terrain;
- cinematic map motion;
- decorative generative historical imagery.
