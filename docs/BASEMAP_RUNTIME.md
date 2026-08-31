# Initial basemap and map runtime

This document resolves the **modern basemap provider** used to bootstrap Packet 1. It does not define historical evidence or period-map policy.

## Initial decision

Use **MapLibre GL JS 6** with the public **OpenFreeMap** service for the first interactive shell.

Packet 1 seed style:

```text
https://tiles.openfreemap.org/styles/positron
```

Use the npm `maplibre-gl` package rather than CDN-loaded application code.

## Why Positron is the seed

OpenFreeMap remains the same provider. Positron replaces Liberty only as the **starting style** because it is deliberately cleaner and therefore requires less destructive restyling before Charted Currents can establish its own cartographic hierarchy. OpenFreeMap's style project describes Positron as its special clean-looking style, with POIs removed and some highway labels delayed to higher zooms.

This is still a seed, not the final Charted Currents cartography.

The machine-readable design posture lives in `src/lib/map/visualPolicy.ts`.

## Why OpenFreeMap remains the bootstrap provider

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
- `https://github.com/hyperknot/openfreemap-styles`

## Historical meaning

The modern basemap is **spatial interface infrastructure**, not a historical source.

Never treat modern OpenStreetMap/OpenFreeMap labels, coastlines, boundaries, roads, or place metadata as evidence about the 1650–1730 world.

Historical places, names, routes, boundaries, coast interpretations, period maps, and event relationships must continue through the project's provenance-aware historical data/source system.

## Packet 1 styling posture

The provider's Positron style is only the starting configuration. Packet 1 should deliberately make the modern context quieter and warmer:

- mute/remove residual road and contemporary land-use detail;
- reduce contemporary administrative-boundary prominence;
- emphasize coastline, islands, land/water shape, and restrained orientation labels;
- preserve required attribution;
- allow Charted Currents overlays, typography, paper/ink surfaces, and historical reference material to carry the visual identity.

The target leans toward a period-inflected editorial atlas, but the modern basemap must never masquerade as a period map.

Prefer MapLibre style-spec operations or a deliberately maintained project style over one-off CSS/DOM tricks. MapLibre's style system supports layer-level paint/layout control, and its style swap API can transform a fetched style when a future implementation benefits from that approach.

Do not turn Packet 1 into tile infrastructure or glyph-hosting work.

## Map-label typography caveat

The locally bundled Libre Caslon Text / Inter / IBM Plex Mono fonts apply to application UI. MapLibre vector-label typography is controlled by the map style's glyph service.

Do not attempt to force Libre Caslon Text into map symbol layers without intentionally adding a compatible glyph-hosting pipeline. For Packet 1, provider-compatible restrained map labels are acceptable; the surrounding UI and project overlays carry the stronger editorial identity.

## Development anchors

Packet 1 may overlay the real modern locator points in `src/lib/map/developmentAnchors.ts` to exercise map → `port` selection → inspector interaction.

Those points are developmental interface anchors, not historical port geometries. They remain outside `public/data/` and must not acquire vessel/voyage/history claims merely to make the shell feel populated.

Use project-owned GeoJSON/circle/symbol layers and the marker posture in `src/lib/map/visualPolicy.ts`; do not use default teardrop web-map pins.

## Camera posture

Use `src/lib/map/config.ts` and `docs/PACKET1_DIRECTION.md`:

- gentle context-preserving `easeTo`-style repositioning only when needed;
- minimal zoom change;
- north-up, 2D;
- map rotation/pitch interactions disabled in Packet 1;
- no cinematic fly-throughs;
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

- a project-hosted custom style JSON;
- self-hosted OpenFreeMap/OpenMapTiles-compatible data;
- Protomaps/PMTiles;
- another documented provider;
- a deliberately simplified custom basemap.

Those are later infrastructure/product decisions. Packet 1 should not reopen the provider unless OpenFreeMap demonstrably blocks the acceptance criteria.
