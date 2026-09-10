# Follow-ups

## Source access
- [x] obtain/inspect CrespoDynCoopNet MDB on x600 (Completed in Packets 4–6);
- investigate original Naval Office Shipping List access/transcription;
- draft British Online Archives permission/API inquiry if vertical slice works;
- [x] verify current Prize Papers structured-data access (Completed in Packet 9 via Nationaal Archief HCA thread);
- inspect Greater Caribbean Mapping CSV fields/terms;
- investigate Dutch Atlantic Connections;
- investigate physical court records at Kew (`TNA HCA 32/80` examinations and `TNA CO 138/11` entry book) for full crew depositions and captain/master identity of *Richard & Sarah*;
- cross-reference French privateer (20 guns, 166 men) in French naval/privateering records (Archives nationales Marine B/4, Dunkerque/Saint-Malo/Martinique commissions 1704–1705).

## Data
- design place-alias authority table;
- design ship-resolution evidence rubric;
- [x] define source-coverage schema (Completed in Packet 5);
- define field/component-level rights storage;
- when material-afterlife work begins, formalize `ship_loss_event`, `wreck_site`, `ship_wreck_resolution`, `archaeological_investigation`, `museum_object`, and custody/ownership distinctions;
- ensure wreck geometry supports separate private/source precision and public/generalized/withheld precision.

## Design
- [x] curate 10–20 period maps as visual reference board (Completed in Packet 8);
- [x] test georeferenced historical-map overlays (Completed in Packet 8; corrected in CORR-20260906-01);
- choose typography from actual screen comps;
- create original Charted Currents design tokens;
- later prototype a restrained `Fate & material evidence` inspector section rather than a global treasure-wreck layer;
- address `.inspector-dataset-context-badge` color contrast in future design pass to eliminate baseline ratchet exception.

## Research
- [x] identify first 10–20 vessels with robust reusable documentation (Completed in Packets 3, 5, 6, 9, 11);
- [x] identify first famous pirate/privateer whose network intersects ordinary traffic (Completed in Packet 11 with French privateer encounter on *Richard & Sarah*);
- [x] identify first context event with strong primary sources (Completed with Port Royal 1692 earthquake / 1703 fire context);
- [x] select a PARES item and LOC map for v0.1 source surfaces (Completed in Packets 4 and 8);
- as canonical ships emerge, check `research/shipwreck_museum_sources.yml` for credible loss/wreck/material-evidence matches;
- prefer `Henrietta Marie` as the first full ship -> wreck -> artifact -> museum proof if it appears naturally in the source corpus;
- evaluate La Concorde / Queen Anne's Revenge as a second high-information archaeological example;
- investigate Urca de Lima / 1715 fleet only as useful to actual corpus connections, not as a standalone treasure-fleet feature;
- never publish sensitive archaeological coordinates merely because a research source exposes them.

## Infrastructure
- benchmark GeoJSON before PMTiles;
- benchmark static JSON vs Parquet/DuckDB-Wasm only after corpus expansion;
- do not build a general wreck scraper; use targeted enrichment after canonical ship identity exists;
- [x] implement automated quality, accessibility, viewport layout, and user-journey audit harness (Completed in Packet 11 / Stream B via `@axe-core/puppeteer`);
- expand quality audit coverage during upcoming Codex Astra UI/UX session.
