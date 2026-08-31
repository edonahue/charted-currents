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

## Styling posture

The provider style is a bootstrap base, not the final visual identity.

Packet 1 may adapt presentation around it or later host a customized style, but should not spend the packet building tile infrastructure. The Charted Currents overlays, typography, surfaces, route semantics, and historical reference layers should carry the product's editorial-atlas identity.

Do not copy OpenFreeMap's default visual appearance into unrelated UI tokens.

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
