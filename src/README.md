# Web application source

The repository now contains a bootable Astro 7 + TypeScript + MapLibre 6 scaffold for Packet 1.

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
    paths.ts
  styles/
    tokens.css
    global.css
```

Product rules remain: map-first, inspector-first, light editorial historical-atlas design, provenance one click away, semantic uncertainty states, no faux pirate voice, and historical maps/documents treated as sources.

The starter files are intentionally incomplete but are **not disposable framework placeholders**. Extend their canonical types/path/config boundaries rather than creating a second application tree.

`MapViewport.astro` uses the reversible modern-basemap bootstrap documented in `docs/BASEMAP_RUNTIME.md`; modern map data is interface infrastructure, not historical evidence.

Packet 1 development-only interaction data must be clearly non-historical and must not masquerade as the published corpus under `public/data/`.
