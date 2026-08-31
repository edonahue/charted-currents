# Agent context index

Use this file to load **the minimum useful context for the task**. Do not read the entire documentation tree simply because a large context window is available.

## First project run

Start with `docs/KICKOFF.md`. It contains the exact local command sequence and Packet 1 plan/execution prompts for the existing bootable scaffold.

Do not run a fresh framework scaffolder; the repository already owns the initial Astro/MapLibre structure and pinned toolchain.

## Always for substantial implementation

1. `GEMINI.md` — project constitution for the Antigravity/Gemini workflow.
2. `docs/MAINTAINER_EXPECTATIONS.md` — bounded work, review, verification, polish, and handoff expectations.
3. `docs/IMPLEMENTATION_CONTRACT.md` — locked v0.1 engineering defaults and bootstrap state.
4. Current unfinished **work packet** in `docs/FIRST_SESSIONS.md` — immediate objective and acceptance criteria.
5. `docs/AGENT_EXECUTION_PLAYBOOK.md` — execution, anti-swirl, and blocker behavior.

For Packet 1, also read `docs/PACKET1_DIRECTION.md` and `docs/VISUAL_QUALITY_CONTRACT.md`; the first-build product and visual-quality choices are settled there and should not be reopened.

For the initial implementation run, also use `docs/ANTIGRAVITY_SETUP.md` so routine sandboxed commands do not generate unnecessary approval churn.

## UI / product work

Read only what is needed from:

- `docs/PACKET1_DIRECTION.md` during Packet 1;
- `docs/VISUAL_QUALITY_CONTRACT.md`;
- `docs/VISUAL_ASSET_STRATEGY.md` when deciding whether to add/use visual assets or richer visual techniques;
- `docs/PROJECT_BRIEF.md`;
- `docs/PRODUCT_PRINCIPLES.md`;
- `docs/DESIGN_DIRECTION.md`;
- `docs/DESIGN_REFERENCES.md`;
- `docs/MVP.md`.

For interaction precedents, use `design/MODERN_INTERACTION_REFERENCES.md`. These are principles to study, not visual templates to clone.

For map UI/runtime work, also read `docs/BASEMAP_RUNTIME.md` and `src/lib/map/visualPolicy.ts` rather than reopening provider/style research.

For Packet 1 visual styling, inspect the locally synced images plus `manifest.json` under `design/reference-board/`. Do not browse for arbitrary replacement aesthetics merely because external search is available.

For layout or styling work, do not automatically load large source dossiers.

## Historical data / ontology / provenance

Read:

- `docs/DATA_MODEL.md`
- `docs/PROVENANCE_AND_UNCERTAINTY.md`
- `docs/AI_AND_EXTRACTION_POLICY.md`
- `docs/CONTENT_AND_HISTORICAL_ETHICS.md`
- `docs/HISTORICAL_SCOPE.md`
- `docs/PUBLIC_PRIVATE_BOUNDARY.md`

Then read only the relevant source registries/dossiers.

## Source ingestion or archival research

Read:

- `docs/DATA_SOURCES.md`
- `docs/SOURCE_RIGHTS.md`
- `docs/PUBLIC_PRIVATE_BOUNDARY.md`
- relevant entries in `research/sources.yml` and source-specific registries

For images/maps/material culture, also use `docs/ART_AND_MAP_SOURCES.md`, `docs/VISUAL_ASSET_STRATEGY.md`, and `research/art_sources.yml`.

For shipwreck/museum enrichment, use `docs/SHIPWRECKS_AND_MUSEUMS.md` and `research/shipwreck_museum_sources.yml`.

## Architecture or dependency changes

Read:

- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- relevant ADRs under `docs/adr/`
- `docs/IMPLEMENTATION_CONTRACT.md`
- `docs/MAINTAINER_EXPECTATIONS.md`

A settled direction should change through an ADR, not an incidental implementation choice. The pinned Packet 1 versions are not an invitation to perform dependency upgrades during feature work.

## Deployment / Cloudflare

Read:

- `docs/CLOUDFLARE_DEPLOYMENT.md`
- `docs/PUBLIC_PRIVATE_BOUNDARY.md`
- `docs/IMPLEMENTATION_CONTRACT.md`

The first deployment target is the independent Pages project root. Do not solve the eventual `/labs/...` URL shape during Packet 1.

## Benchmark, environment, data-export, screenshot, or config work

Always read `docs/PUBLIC_PRIVATE_BOUNDARY.md` before producing a committed artifact.

Visual review screenshots belong under `design/reviews/` only when they come from the real running application and are safe to publish.

## Current/future work

- `docs/ROADMAP.md` — sequencing and phase intent.
- `docs/FOLLOWUPS.md` — deferred ideas; not an instruction to implement all of them.

Do not treat either file as evidence that a capability already exists. Inspect code/artifacts/runtime before making present-tense claims.
