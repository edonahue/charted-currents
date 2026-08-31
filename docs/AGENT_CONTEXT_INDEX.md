# Agent context index

Use this file to load **the minimum useful context for the task**. Do not read the entire documentation tree simply because a large context window is available.

## Always for substantial implementation

1. `GEMINI.md` — project constitution for the Antigravity/Gemini workflow.
2. `docs/MAINTAINER_EXPECTATIONS.md` — how bounded work, review, verification, polish, and handoff are expected to operate.
3. `docs/IMPLEMENTATION_CONTRACT.md` — locked v0.1 engineering defaults.
4. Current unfinished section of `docs/FIRST_SESSIONS.md` — immediate objective and acceptance criteria.
5. `docs/AGENT_EXECUTION_PLAYBOOK.md` — agent execution and anti-swirl behavior.

## UI / product work

Read only what is needed from:

- `docs/PROJECT_BRIEF.md`
- `docs/PRODUCT_PRINCIPLES.md`
- `docs/DESIGN_DIRECTION.md`
- `docs/DESIGN_REFERENCES.md`
- `docs/MVP.md`

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

For images/maps/material culture, also use `docs/ART_AND_MAP_SOURCES.md` and `research/art_sources.yml`.

For shipwreck/museum enrichment, use `docs/SHIPWRECKS_AND_MUSEUMS.md` and `research/shipwreck_museum_sources.yml`.

## Architecture or dependency changes

Read:

- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- relevant ADRs under `docs/adr/`
- `docs/IMPLEMENTATION_CONTRACT.md`
- `docs/MAINTAINER_EXPECTATIONS.md`

A settled direction should change through an ADR, not an incidental implementation choice.

## Deployment, benchmark, environment, data-export, screenshot, or config work

Always read `docs/PUBLIC_PRIVATE_BOUNDARY.md` before producing a committed artifact.

## Current/future work

- `docs/ROADMAP.md` — sequencing and phase intent.
- `docs/FOLLOWUPS.md` — deferred ideas; not an instruction to implement all of them.

Do not treat either file as evidence that a capability already exists. Inspect code/artifacts/runtime before making present-tense claims.
