# Follow-ups

## Source access
- obtain/inspect CrespoDynCoopNet MDB on x600;
- investigate original Naval Office Shipping List access/transcription;
- draft British Online Archives permission/API inquiry if vertical slice works;
- verify current Prize Papers structured-data access;
- inspect Greater Caribbean Mapping CSV fields/terms;
- investigate Dutch Atlantic Connections.

## Data
- design place-alias authority table;
- design ship-resolution evidence rubric;
- define source-coverage schema;
- define field/component-level rights storage;
- when material-afterlife work begins, formalize `ship_loss_event`, `wreck_site`, `ship_wreck_resolution`, `archaeological_investigation`, `museum_object`, and custody/ownership distinctions;
- ensure wreck geometry supports separate private/source precision and public/generalized/withheld precision.

## Design
- curate 10–20 period maps as visual reference board;
- test georeferenced historical-map overlays;
- choose typography from actual screen comps;
- create original Charted Currents design tokens;
- later prototype a restrained `Fate & material evidence` inspector section rather than a global treasure-wreck layer.

## Research
- identify first 10–20 vessels with robust reusable documentation;
- identify first famous pirate/privateer whose network intersects ordinary traffic;
- identify first context event with strong primary sources;
- select a PARES item and LOC map for v0.1 source surfaces;
- as canonical ships emerge, check `research/shipwreck_museum_sources.yml` for credible loss/wreck/material-evidence matches;
- prefer `Henrietta Marie` as the first full ship -> wreck -> artifact -> museum proof if it appears naturally in the source corpus;
- evaluate La Concorde / Queen Anne's Revenge as a second high-information archaeological example;
- investigate Urca de Lima / 1715 fleet only as useful to actual corpus connections, not as a standalone treasure-fleet feature;
- never publish sensitive archaeological coordinates merely because a research source exposes them.

## Infrastructure
- benchmark GeoJSON before PMTiles;
- benchmark static JSON vs Parquet/DuckDB-Wasm only after corpus expansion;
- do not build a general wreck scraper; use targeted enrichment after canonical ship identity exists.
