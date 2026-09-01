# Hosted Production Review — Packet 3 Public Beta Closeout

**URL**: [https://charted-currents.pages.dev/](https://charted-currents.pages.dev/)
**Reviewed At**: 2026-09-01
**Deployment Commit**: `96fff9b`
**Status**: All hosted endpoints, provenance invariants, route aggregation, reactive temporal filters, and public indexing verified live.

## 1. Live Endpoint Audit
| Endpoint | HTTP Status | Content-Type | Result |
| :--- | :--- | :--- | :--- |
| `/` | 200 | text/html; charset=utf-8 | PASS |
| `/robots.txt` | 200 | text/plain (`Allow: /`) | PASS |
| `/data/manifest.json` | 200 | application/json (v0.3.0) | PASS |
| `/data/sources.json` | 200 | application/json | PASS |
| `/data/entities.json` | 200 | application/json (15 ships, 26 crew, 23 places) | PASS |
| `/data/events.json` | 200 | application/json (16 events) | PASS |
| `/data/ports.geojson` | 200 | application/geo+json (23 features) | PASS |
| `/data/routes.geojson` | 200 | application/geo+json (15 features with temporal metadata) | PASS |
| `/assets/visuals/bochart-knollis-jamaica-1684.jpg` | 200 | image/jpeg | PASS |

## 2. Live Public Beta Invariants
- **Public Search Indexing**: `<meta name="robots" content="index,follow" />` and `public/robots.txt` (`Allow: /`) verified active.
- **Raw Data Preservation**: Robert Ashworth (`ast_crew_5036` and `occ_crew_5036`) preserves verbatim recorded spelling `Dexlford`.
- **Evidence-Bounded Place Notes**: All 23 place records provide minimal Option A notes grounded strictly in surviving corpus evidence.
- **Route Temporal Metadata & Aggregation**: Route features declare integer `associated_record_year`, `temporal_basis: 'capture_record'`, and endpoint group aggregation metadata (`route_group_id`, `constituent_vessel_ids`, `record_count`).
- **Composite Voyage Inspector**: Multi-vessel route segments (`Jamaica → London` and `Saint-Domingue → La Rochelle`) open aggregated voyage view (`selection.kind === 'voyage'`) listing all constituent vessels.
- **Dynamic Period Filter**: Active preset buttons (`All (1650–1730)`, `1684–1695`, `1702–1712`) dynamically adjust MapLibre route opacity hierarchy and timeline marker interactivity.
- **Cartographic Reference Isolation**: Bochart & Knollis chart renders exclusively on Jamaica and Port Royal with strict CSS `display: none !important` enforcement on other places.
- **Geographic Coordinates**: Formatted accurately with Western longitudes (e.g. Havana: `23.1136° N, 82.3666° W`).
- **Zero Uncaught Exceptions**: All viewports and interaction paths verified with 0 runtime exceptions.
