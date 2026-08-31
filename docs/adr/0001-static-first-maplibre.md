# ADR 0001 — Static-first Astro + MapLibre

**Status:** Accepted for initial build.

Use Astro + TypeScript for the public site and MapLibre GL JS for the primary map. Generate data artifacts offline using Python/DuckDB. This supports a polished static product, GeoJSON now, PMTiles later, and avoids binding the site to the x600's uptime. DuckDB-Wasm remains a future option.
