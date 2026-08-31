# Published browser data

This directory is the browser-visible publication boundary.

Packet 1 should not add invented historical data merely to populate the interface. Packet 2 will introduce the first verified, rights-safe artifacts converging on:

- `manifest.json`
- `ports.geojson`
- `routes.geojson`
- `entities.json`
- `events.json`
- `sources.json`

Only deliberately publishable artifacts belong here. Raw archives, staging data, credentials, private research state, rights-uncleared material, and sensitive unpublished geometry never belong under `public/`.

The canonical filename mapping lives in `src/lib/data/loadPublished.ts`.
