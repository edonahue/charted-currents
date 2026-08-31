# Architecture

## Principle

**Static-first public product, strong local analytical pipeline.**

The x600 can do substantial ingestion, normalization, geospatial transforms, entity-resolution candidate generation, and analytical builds locally. The public site should not initially depend on the x600 being online.

```text
Source archives / datasets
        |
source-specific adapters
        |
raw (local/rights-governed)
        |
staging + normalized records
        |---- provenance/evidence
        |---- entity-resolution candidates
        |---- coverage/QA
        |
DuckDB + Python build pipeline
        |
JSON / GeoJSON first
later: Parquet / GeoParquet / PMTiles
        |
Astro + TypeScript + MapLibre
        |
static hosting
```

## Front end

### Astro
Static output by default. Use Astro components plus small browser-native TypeScript modules/scripts for map, timeline, inspector, filters, and small charts. Do not add a UI-framework island layer or turn the project into a SPA without a demonstrated benefit.

### MapLibre GL JS
Chosen for TypeScript/WebGL mapping, vector/raster layers, data-driven styling, camera animation, GeoJSON now, and PMTiles later.

## ETL / analysis

### Python
Source adapters, validation, entity resolution helpers, geospatial transforms, artifact generation.

### DuckDB
Canonical analytical workspace for imports, joins, audits, coverage reports, derived measures, and artifact exports.

### Parquet
Durable tabular interchange when data size grows.

### PMTiles
Adopt for large vector/raster tile layers when GeoJSON/raster files become inefficient.

### DuckDB-Wasm
Future option only. Useful later for arbitrary browser-side slicing/Lab queries. Defer because v0.1 does not need the bundle/memory/worker complexity.

## Storage layers

1. `raw` — unchanged source payload where rights allow local storage.
2. `staging` — source-shaped parsed records.
3. `normalized` — project ontology with provenance.
4. `published` — web-safe, rights-safe artifacts.

Never publish directly from raw/staging.

## Reproducibility

Published artifacts should be reproducible from source version/retrieval metadata, adapter version, normalization code, entity-resolution decisions, and explicit manual overrides.
