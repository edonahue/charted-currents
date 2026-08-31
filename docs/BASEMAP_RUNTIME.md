# Initial basemap and map runtime

This document resolves the **modern basemap provider** used to bootstrap Packet 1. It does not define historical evidence or period-map policy.

## Initial decision

Use **MapLibre GL JS 6** with the public **OpenFreeMap** service for the first interactive shell.

Initial style URL:

```text
https://tiles.openfreemap.org/styles/liberty
```

Use the npm `maplibre-gl` package rather than CDN-loaded application code.

## Why this is the bootstrap default

OpenFreeMap currently provides a public MapLibre-compatible service that:

- requires no account or API key;
- is intended for websites/apps;
- states that its public instance has no map-view/request limits;
- permits commercial use;
- uses OpenStreetMap-derived data/OpenMapTiles;
- requires attribution, which MapLibre styles expose through the normal attribution control;
- can later be self-hosted or replaced.

This removes account/API-key work from Packet 1 while keeping the map-provider dependency reversible.

Official references:

- `https://openfreemap.org/quick_start/`
- `https://openfreemap.org/`
- `https://openfreemap.org/tos/`

## Historical meaning

The modern basemap is **spatial interface infrastructure**, not a historical source.

Never treat modern OpenStreetMap/OpenFreeMap labels, coastlines, boundaries, roads, or place metadata as evidence about the 1650–1730 world.

Historical places, names, routes, boundaries, coast interpretations, period maps, and event relationships must continue through the project's provenance-aware historical data/source system.

## Packet 1 styling posture

The provider's Liberty style is only the starting configuration. Packet 1 should deliberately make the modern context quieter:

- mute/remove most road layers and contemporary POI clutter;
- reduce contemporary administrative-boundary prominence;
- emphasize coastline, islands, land/water shape, and restrained orientation labels;
- preserve required attribution;
- allow Charted Currents overlays, typography, paper/ink surfaces, and historical reference material to carry the visual identity.

The target leans toward a period-inflected editorial atlas, but the modern basemap must never masquerade as a period map.

Prefer adjusting/customizing the style configuration over changing providers or building tile infrastructure. Do not turn Packet 1 into a basemap-engineering project.

## Development anchors

Packet 1 may overlay the real modern locator points in `src/lib/map/developmentAnchors.ts` to exercise map → `port` selection → inspector interaction.

Those points are developmental interface anchors, not historical port geometries. They remain outside `public/data/` and must not acquire vessel/voyage/history claims merely to make the shell feel populated.

## Camera posture

Use `src/lib/map/config.ts` and `docs/PACKET1_DIRECTION.md`:

- gentle context-preserving `easeTo`-style repositioning only when needed;
- minimal zoom change;
- north-up, essentially 2D;
- no cinematic fly-throughs or gratuitous pitch/bearing;
- reduced-motion path minimizes animation.

## Attribution

Keep MapLibre's attribution control visible. Do not remove required attribution for OpenStreetMap/OpenMapTiles/provider data.

When source/provider configuration changes, re-check the current attribution and terms rather than assuming this file remains sufficient forever.

## Failure behavior

The public product must fail honestly if the external basemap is unavailable:

- the rest of the shell should remain usable where practical;
- do not silently substitute a different provider with unclear terms;
- show a concise map-unavailable state if initial style loading fails materially;
- historical/source data should remain conceptually separate from provider availability.

## Later options

A later measured need may justify:

- a custom hosted style;
- self-hosted OpenFreeMap/OpenMapTiles-compatible data;
- Protomaps/PMTiles;
- another documented provider;
- a deliberately simplified custom basemap.

Those are later infrastructure/product decisions. Packet 1 should not reopen them unless the initial provider demonstrably blocks the acceptance criteria.
