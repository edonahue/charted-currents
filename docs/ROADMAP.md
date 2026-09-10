# Roadmap

## Phase 0 — documented stub
Project/product docs, source registry, rights policy, data model, design references, agent contract.

## Phase 1 — beautiful vertical slice
Astro/TypeScript, MapLibre, original light historical-atlas design system, inspector architecture, timeline skeleton, verified corpus (22 canonical vessels, 16 events, 12 sources, 21 routes, 29 places), provenance UI, period-map/reference layer (Herman Moll [1715?] corrected via CORR-20260906-01 Candidate C affine transform), first privateering encounter & imperial petition (Packet 11), automated quality & accessibility instrumentation (`scripts/quality-audit.mjs`), responsive/accessibility passes.

*Completed / Active Milestones*:
- Packets 1–9: Core pipeline, Carrera de Indias, Dutch Caribbean, Prize Papers documentary thread, Herman Moll period map layer.
- CORR-20260906-01: Herman Moll georeference quality pass (13 Candidate C GCPs, affine transform, unprojected inset preservation). Accepted, merged, and hosted-verified.
- Packet 11: First bounded privateering encounter & prize connection (*Richard & Sarah*, 1705, TNA `CO 138/11` and `HCA 32/80`) + automated design/usage/accessibility instrumentation slice (`review:quality`, `review:quality:full`, axe-core 6 UI states, 5 viewports, 5 journeys). Accepted, merged, and hosted-verified.
- Product Polish Interstitial 1: Narrow-screen mobile map control non-collision (390px/430px), dataset-context badge contrast elevation (`--cc-ink-soft`), timeline button accessibility naming, and native CDP keyboard test proof (Journey 5). Accepted, merged, and hosted-verified.
- *Upcoming Milestone*: Codex Astra session — comprehensive UI/UX overhaul, advanced cartographic elevation, and design-system refinement building upon the Packet 11 quality instrumentation baseline.

Shipwreck/museum enrichment is **not** a Phase 1 dependency. If a first-slice vessel happens to have unusually strong archaeological evidence, the model may preserve the linkage without expanding Phase 1 scope.

## Phase 2 — source adapters and deeper sample
CrespoDynCoopNet ingestion, PARES research/import utilities, selected open voyage sources, coverage reporting, entity-resolution workbench, more ships/Port Royal connections, document cards.

Begin passively flagging canonical vessels with plausible documented loss/wreck/museum leads; do not build a broad wreck database.

## Phase 3 — broader Greater Caribbean
Additional imperial/source traditions, person/merchant networks, commodities, capture/privateering data, richer context.

**Secondary material-afterlife lane:** for selected evidence-rich vessels, validate ship-loss events, archaeological wreck-site identities, investigations, recovered objects, and museum/repository links. Prefer a small number of deep examples over comprehensive wreck coverage. `Henrietta Marie` is the preferred first proof if it enters the corpus naturally.

## Phase 4 — analytical scale
Parquet/GeoParquet, PMTiles, predation denominator study, optional DuckDB-Wasm Lab, network analytics.

At scale, consider a targeted enrichment job that searches validated ship aliases against responsible archaeological/museum sources. Keep sensitive wreck geometry out of public artifacts.

## Phase 5 — reconstructed movement research
Period sailing/navigation model, winds/currents integration, explicitly reconstructed routes, richer temporal animation.

## Parallel source-access work
Original Naval Office Shipping Lists/archive access, BOA permission/API inquiry, Prize Papers rights/access review, Dutch/French source expansion, and targeted shipwreck/museum-source review as canonical vessels emerge.
