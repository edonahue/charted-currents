# Agent context index

Use this file to load **the minimum useful context for the task**. Do not read the entire documentation tree simply because a large context window is available.

## Current phase

Packet 1 is complete, deployed, and hosted-verified. Packet 2 is the active work packet.

For new implementation/research sessions, start with the current packet in `docs/FIRST_SESSIONS.md` plus the task-specific routes below. `docs/KICKOFF.md` remains the historical Packet 1 bootstrap record; do not rerun its Packet 1 initialization workflow.

The repository already owns the Astro/MapLibre application, production Cloudflare Pages deployment, pinned toolchain, and Packet 1 interaction/design architecture. Do not reinitialize or redesign that foundation when beginning Packet 2.

## Always for substantial implementation

1. `GEMINI.md` — project constitution for the Antigravity/Gemini workflow.
2. `docs/MAINTAINER_EXPECTATIONS.md` — bounded work, review, verification, polish, and handoff expectations.
3. `docs/IMPLEMENTATION_CONTRACT.md` — locked v0.1 engineering defaults and bootstrap state.
4. Current unfinished **work packet** in `docs/FIRST_SESSIONS.md` — immediate objective and acceptance criteria.
5. `docs/AGENT_EXECUTION_PLAYBOOK.md` — execution, anti-swirl, and blocker behavior.

Packet 1's settled product/visual contracts remain constraints when Packet 2 adds real historical content. Read `docs/PACKET1_DIRECTION.md`, `docs/VISUAL_QUALITY_CONTRACT.md`, and `docs/VISUAL_ASSET_STRATEGY.md` only when the Packet 2 work affects the existing UI, map composition, or historical visual surfaces; do not reopen the completed Packet 1 direction.

## UI / product work

Read only what is needed from:

- `docs/PACKET1_DIRECTION.md` for the settled existing composition;
- `docs/VISUAL_QUALITY_CONTRACT.md`;
- `docs/VISUAL_ASSET_STRATEGY.md` when deciding whether to add/use visual assets or richer visual techniques;
- `docs/PROJECT_BRIEF.md`;
- `docs/PRODUCT_PRINCIPLES.md`;
- `docs/DESIGN_DIRECTION.md`;
- `docs/DESIGN_REFERENCES.md`;
- `docs/MVP.md`.

For interaction precedents, use `design/MODERN_INTERACTION_REFERENCES.md`. These are principles to study, not visual templates to clone.

For map UI/runtime work, also read `docs/BASEMAP_RUNTIME.md` and `src/lib/map/visualPolicy.ts` rather than reopening provider/style research.

For historical visual work, inspect the reviewed local reference board plus the source-access/rights material below. Do not browse for arbitrary replacement aesthetics merely because external search is available.

For layout or styling work, do not automatically load large source dossiers.

## Historical data / ontology / provenance

Read:

- `docs/DATA_MODEL.md`
- `docs/PROVENANCE_AND_UNCERTAINTY.md`
- `docs/AI_AND_EXTRACTION_POLICY.md`
- `docs/CONTENT_AND_HISTORICAL_ETHICS.md`
- `docs/HISTORICAL_SCOPE.md`
- `docs/PRE_INGESTION_NORMALIZATION_POLICY.md` — source roles, calendars/dates, historical units, legal status, translations, authority IDs, and field/component rights
- `docs/PUBLIC_PRIVATE_BOUNDARY.md`

Then read only the relevant source registries/dossiers.

## Source ingestion, APIs, archival research, or source accounts

Read:

- `docs/DATA_SOURCES.md`
- `docs/SOURCE_RIGHTS.md`
- `docs/PRE_INGESTION_NORMALIZATION_POLICY.md`
- `docs/PUBLIC_PRIVATE_BOUNDARY.md`
- **`docs/HUMAN_SOURCE_SETUP.md`** — canonical human accounts, source-access requests, no-key sources, local research tools, and credential rules
- **`.env.example`** — canonical environment-variable names; never invent alternate credential names
- relevant entries in `research/sources.yml` and source-specific registries

For **TNA/Colonial Office/HCA, privateering/prize records, port books/customs, Privy Council, or local Jamaica/Curaçao/Barbados archival research**, also read:

- **`docs/DOCUMENTARY_SOURCE_ACCESS.md`** — practical search, catalogue, reference-conversion, copy/onsite-access, and archival-identifier workflows;
- **`research/documentary_sources.yml`** — machine-readable access posture and source-specific caveats.

Do not build an automated source adapter merely because a web catalogue is searchable. First follow the documented access/rights route and determine whether the source is an original, catalogue description, editorial calendar, transcription, or scholarly derivative.

Credential rules:

- research API credentials are local ETL/research inputs, not browser configuration;
- never expose them through Astro `PUBLIC_*` variables;
- never request that the human paste a real key into an agent prompt;
- never log or commit values;
- test credentials only by presence or a minimal non-secret API request;
- missing optional credentials should not block unrelated source work;
- possession of a credential does not establish publication/reuse rights.

For **weather, winds, tides, water levels, currents, bathymetry, or other physical-ocean/environmental history**, also read `docs/OCEAN_WEATHER_SOURCE_SETUP.md` and `research/environmental_sources.yml`. Preserve the distinction between period observations, reconstructed/hydrographic conditions, and modern contextual/reanalysis data; never silently substitute one evidence class for another.

For **historical images, maps, manuscript/document scans, prints, material culture, design references, IIIF acquisition, crops/derivatives, or georeferencing**, read:

- `docs/ART_AND_MAP_SOURCES.md` — strategic source dossier;
- **`docs/VISUAL_SOURCE_ACCESS.md`** — canonical acquisition, rights, IIIF, derivative, credit, and publication workflow;
- `docs/VISUAL_ASSET_STRATEGY.md` — product/design use of historical visual material;
- **`research/art_sources.yml`** — machine-readable per-source access and rights posture.

Institution-first is the default. Aggregators and Wikimedia Commons may aid discovery, but do not erase the holding institution or substitute an aggregator license for item/media rights. Do not download anonymous web images, bypass watermarks/restrictions, or treat IIIF availability as a reuse license.

For shipwreck/museum enrichment, use `docs/SHIPWRECKS_AND_MUSEUMS.md`, `docs/SHIPWRECK_MUSEUM_SOURCE_SETUP.md`, and `research/shipwreck_museum_sources.yml`.

## Architecture or dependency changes

Read:

- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- relevant ADRs under `docs/adr/`
- `docs/IMPLEMENTATION_CONTRACT.md`
- `docs/MAINTAINER_EXPECTATIONS.md`

A settled direction should change through an ADR, not an incidental implementation choice. The pinned versions are not an invitation to perform dependency upgrades during feature work.

## Deployment / Cloudflare

Read:

- `docs/CLOUDFLARE_DEPLOYMENT.md`
- `docs/PUBLIC_PRIVATE_BOUNDARY.md`
- `docs/IMPLEMENTATION_CONTRACT.md`
- `design/reviews/packet1-hosted-review.md` when production-history context matters.

The root Cloudflare Pages deployment already exists at the recorded production URL. Packet 2 should preserve the noindex prototype posture unless a later explicit indexing decision changes it. Do not solve the eventual `/labs/...` URL shape during historical-data work.

## Benchmark, environment, data-export, screenshot, or config work

Always read `docs/PUBLIC_PRIVATE_BOUNDARY.md` before producing a committed artifact.

Visual review screenshots belong under `design/reviews/` only when they come from the real running application and are safe to publish.

## Current/future work

- `docs/ROADMAP.md` — sequencing and phase intent.
- `docs/FOLLOWUPS.md` — deferred ideas; not an instruction to implement all of them.

Do not treat either file as evidence that a capability already exists. Inspect code/artifacts/runtime before making present-tense claims.
