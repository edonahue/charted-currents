# Hosted Production Review — Packet 2 Closeout

**URL**: [https://charted-currents.pages.dev/](https://charted-currents.pages.dev/)
**Reviewed At**: 2026-09-01
**Deployment Commit**: `6832933`
**Status**: All hosted endpoints and provenance invariants verified live.

## 1. Live Endpoint Audit
| Endpoint | HTTP Status | Content-Type | Result |
| :--- | :--- | :--- | :--- |
| `/` | 200 | text/html; charset=utf-8 | PASS |
| `/robots.txt` | 200 | text/plain | PASS |
| `/data/manifest.json` | 200 | application/json | PASS |
| `/data/sources.json` | 200 | application/json | PASS |
| `/data/entities.json` | 200 | application/json | PASS |
| `/data/events.json` | 200 | application/json | PASS |
| `/data/ports.geojson` | 200 | application/geo+json | PASS |
| `/data/routes.geojson` | 200 | application/geo+json | PASS |
| `/assets/visuals/bochart-knollis-jamaica-1684.jpg` | 200 | image/jpeg | PASS |

## 2. Live Historical Provenance Invariants
- **Royal Society Separation**: `sr_rs_el_l5_117` is `metadata_only` (manuscript letter from T L); `sr_rs_phil_trans_209` is `digital_content_inspected` (Phil. Trans. Vol. 18, No. 209).
- **Inspection States**: All source records carry explicit enum states (`dataset_record_inspected`, `digital_content_inspected`, `metadata_only`, `upstream_cited_only`).
- **Port Royal Map Grounding**: `ast_loc_map_port_royal` verifies "Port Royall" label on 1684 Bochart & Knollis chart.
- **Vessel Construction Display**: Richard & Sarah displays recorded facts (`English built · reported age 20 at capture`) with zero unmodeled `~1685` inference.
- **Endpoints-Only Routing**: Transatlantic routes are strictly schematic 2-point lines with capture roadsteads decoupled.
- **Attribution & Metadata**: OpenStreetMap / MapLibre attribution, WHG gazetteer links, and robots `noindex` verified live.
