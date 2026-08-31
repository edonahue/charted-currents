# Web application source

The repository contains a bootable Astro 7 + strict TypeScript 6 + MapLibre 6 scaffold for Packet 1.

Canonical starter boundaries:

```text
src/
  pages/index.astro
  layouts/BaseLayout.astro
  components/
    map/MapViewport.astro
    inspector/EntityInspector.astro
    timeline/TimelineRail.astro
    evidence/EvidenceBadge.astro
    evidence/SourceDrawer.astro
  lib/
    domain/types.ts
    data/loadPublished.ts
    map/
      config.ts
      developmentAnchors.ts
    state/selection.ts
    time/config.ts
    paths.ts
  styles/
    tokens.css
    global.css
```

Product rules remain: map-first, inspector-first, light editorial historical-atlas design, provenance one click away, semantic uncertainty states, no faux pirate voice, and historical maps/documents treated as sources.

For Packet 1 specifically, `docs/PACKET1_DIRECTION.md` is settled product direction. The starter files are intentionally incomplete but are **not disposable framework placeholders**. Extend their canonical types/path/config boundaries rather than creating a second application tree.

Key boundaries:

- `MapViewport.astro` uses the reversible modern-basemap bootstrap documented in `docs/BASEMAP_RUNTIME.md`; modern map data is interface infrastructure, not historical evidence.
- `lib/map/developmentAnchors.ts` contains the four approved real modern locator anchors and their GeoNames attribution. They may exercise the `port` inspector path, but they are not historical port geometries or historical-activity claims and remain outside `public/data/`.
- `lib/map/config.ts` owns the initial map and restrained selection-camera posture.
- `lib/time/config.ts` owns the 1650–1730 Packet 1 range and explicitly says that historical filtering is not interactive yet.
- `lib/state/selection.ts` is the framework-free shared selection starting point.
- `lib/data/loadPublished.ts` is for deliberately published/right-safe historical artifacts, not Packet 1 development locators.
- the selected fonts are locally bundled via imports in `BaseLayout.astro`; do not introduce a font CDN.

Packet 1 must replace the bootstrap mobile stacked-inspector fallback with the locked elegant bottom-sheet/drawer behavior while preserving the map on screen.
