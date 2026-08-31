# Charted Currents

**The Greater Caribbean · 1650–1730**

*Ships, trade, weather, and predation in the age of piracy.*

Charted Currents is an open exploratory historical-data project that aims to reconstruct parts of the maritime Greater Caribbean from connected archival and structured sources. The project treats ships, voyages, ports, people, commerce, forced migration, privateering, piracy, environmental conditions, and contemporaneous events as parts of one provenance-aware historical system.

The initial build is deliberately a **small, beautiful vertical slice** centered on Port Royal and its connected maritime world, roughly 1685–1720. It should prove that real records can produce a compelling exploratory experience before the corpus is expanded.

## What success looks like

Charted Currents should make it possible to:

- open a familiar port and discover unexpected connections radiating outward;
- follow an ordinary vessel across multiple records and years without pretending ambiguous identities are certain;
- move from a capture or famous pirate into the underlying commercial world;
- understand how weather, war, disaster, law, and trade change the meaning of a voyage;
- inspect the evidence behind every meaningful claim;
- discover patterns that are difficult to see from any single archive or dataset.

The core product principle is:

> **The data should make the historical world feel deeper every time the user clicks.**

## Initial product shape

- **Map-first exploration** using a modern interactive map styled from historical cartography.
- **Inspector-first interaction** so the map remains visible while users inspect ships, ports, voyages, people, and events.
- **Entity pages** later for deep linking and detailed evidence once the inspector spine earns them.
- **Compact persistent timeline** with source-coverage gaps and contextual events.
- **Context Stack** for wars, major disasters, and documented/reconstructed hurricanes in v0.1.
- **Research View** for provenance, evidence state, source identifiers, and uncertainty.
- **Historical map/document surfaces** using reusable primary-source assets with item-level rights tracking.

## Initial technology direction

- Node 22.16.0
- Astro 7.2.9 + strict TypeScript 6.0.3
- MapLibre GL JS 6.6.0
- OpenFreeMap as the reversible no-key modern basemap bootstrap
- Libre Caslon Text + Inter + IBM Plex Mono, locally bundled through Fontsource
- Python ingestion and validation
- DuckDB for local analytical transforms
- JSON / GeoJSON first; Parquet and PMTiles when scale justifies them
- Static-first deployment
- Cloudflare Pages for the first public web deployment
- DuckDB-Wasm reserved for later client-side analytical exploration if the corpus earns the complexity

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/IMPLEMENTATION_CONTRACT.md`](docs/IMPLEMENTATION_CONTRACT.md), [`docs/PACKET1_DIRECTION.md`](docs/PACKET1_DIRECTION.md), and [`docs/BASEMAP_RUNTIME.md`](docs/BASEMAP_RUNTIME.md).

## Source research

The project keeps source selection, reuse rights, and human access/setup explicit rather than burying them inside ingestion code.

- [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md) — operational historical-data dossier and ingestion priorities.
- [`docs/ART_AND_MAP_SOURCES.md`](docs/ART_AND_MAP_SOURCES.md) — maps, archival documents, maritime art, and material-culture resources.
- [`docs/SHIPWRECKS_AND_MUSEUMS.md`](docs/SHIPWRECKS_AND_MUSEUMS.md) — secondary wreck/archaeology/museum enrichment lane.
- [`docs/SOURCE_RIGHTS.md`](docs/SOURCE_RIGHTS.md) — source/component-level rights and publication policy.
- [`docs/HUMAN_SOURCE_SETUP.md`](docs/HUMAN_SOURCE_SETUP.md) — accounts, API keys, and permission/reproduction requests that require human action.
- [`research/sources.yml`](research/sources.yml) and related research registries — machine-readable source inventories.

## Historical and ethical posture

Charted Currents is not a comprehensive reconstruction of the Caribbean and must never imply that surviving records are complete. The interface should distinguish:

- **Documented**
- **Probable Match**
- **Reconstructed**
- **Contextual**

Forced migration and slavery are part of the maritime history represented here, but enslaved people must not be reduced to an interchangeable generic cargo category. See [`docs/CONTENT_AND_HISTORICAL_ETHICS.md`](docs/CONTENT_AND_HISTORICAL_ETHICS.md).

## AI use

AI is development and research tooling, not a public thesis of the project. AI may propose entity extraction and candidate matches, but it may not create unsourced historical facts or silently promote an inference into a documented claim. See [`docs/AI_AND_EXTRACTION_POLICY.md`](docs/AI_AND_EXTRACTION_POLICY.md) and [`GEMINI.md`](GEMINI.md).

### Agentic implementation bootstrap

The repository contains a **bootable pinned Astro/MapLibre scaffold** so a coding agent can begin product work without running interactive framework scaffolders or rediscovering routine setup.

Start here:

- [`docs/KICKOFF.md`](docs/KICKOFF.md) — exact local commands and Packet 1 plan/execution prompts.
- [`docs/PACKET1_DIRECTION.md`](docs/PACKET1_DIRECTION.md) — locked first-build product choices: real modern locator anchors, quiet basemap, responsive inspector, camera, timeline, typography, visual references, and restrained maker identity.
- [`docs/FIRST_SESSIONS.md`](docs/FIRST_SESSIONS.md) — three large implementation packets; Packet 1 runs all the way to a deployable/public interactive shell.
- [`docs/ANTIGRAVITY_SETUP.md`](docs/ANTIGRAVITY_SETUP.md) — recommended sandboxed/scoped permission posture for sustained AGY work.
- [`docs/BASEMAP_RUNTIME.md`](docs/BASEMAP_RUNTIME.md) — resolved modern-basemap bootstrap choice and historical/evidence boundary.
- [`docs/CLOUDFLARE_DEPLOYMENT.md`](docs/CLOUDFLARE_DEPLOYMENT.md) — shortest path from Packet 1 to the first public Pages deployment.
- [`docs/IMPLEMENTATION_CONTRACT.md`](docs/IMPLEMENTATION_CONTRACT.md) — locked v0.1 engineering defaults, pinned starter toolchain, and published-data boundary.
- [`docs/AGENT_CONTEXT_INDEX.md`](docs/AGENT_CONTEXT_INDEX.md) — task-based context routing so agents do not load the entire research corpus for routine code work.
- [`docs/AGENT_EXECUTION_PLAYBOOK.md`](docs/AGENT_EXECUTION_PLAYBOOK.md) — anti-swirl, packet execution, verification, and blocker behavior.
- [`docs/MAINTAINER_EXPECTATIONS.md`](docs/MAINTAINER_EXPECTATIONS.md) — public-safe implementation/review conventions.
- [`.agents/skills/charted-currents-build/SKILL.md`](.agents/skills/charted-currents-build/SKILL.md) — reusable Antigravity workspace skill for executing a complete current packet.

### Local scaffold check

```bash
nvm install
nvm use
npm run preflight
npm install
npm run refs:sync
npm run verify
```

The first `npm install` should generate `package-lock.json`; Packet 1 should keep it. `refs:sync` populates the reviewed local historical visual-reference board described by `design/reference-board/manifest.json`; review and retain those derivatives/checksums for Packet 1 design work.

Packet 1 may display four real **modern locator** anchors to make the shell explorable without inventing historical activity. They remain outside the published historical-data bundle and, if visible publicly, require the GeoNames CC BY 4.0 attribution defined in `src/lib/map/developmentAnchors.ts`.

## First public deployment posture

The first deployment should not wait for the final domain architecture. Packet 1 targets a root-hosted Cloudflare Pages project and a real `*.pages.dev` URL, with an honest prototype/noindex posture until the evidence-backed corpus exists.

The earlier idea of ultimately surfacing the project at `erichdonahue.com/labs/charted-currents/` remains possible, but it is deliberately **not** a Packet 1 infrastructure requirement. See [`docs/CLOUDFLARE_DEPLOYMENT.md`](docs/CLOUDFLARE_DEPLOYMENT.md).

## Design references

Interaction is informed in part by the world-map experience of **Sid Meier's Pirates! (2004/2005 era)**: ports, ships, wind, time, and events coexist on one navigable Caribbean surface. Charted Currents should borrow that *mental model*, not Firaxis assets or recognizable visual composition.

Aesthetic grounding should come primarily from period maps, charts, archival documents, maritime art, and modern editorial/data visualization. Packet 1 has a specifically reviewed local board under [`design/reference-board/`](design/reference-board/); those files are design/evidence references, not anonymous product textures or automatically approved product assets. See [`docs/DESIGN_DIRECTION.md`](docs/DESIGN_DIRECTION.md) and [`docs/DESIGN_REFERENCES.md`](docs/DESIGN_REFERENCES.md).

## Relationship to Pirate Arcade

[**Pirate Arcade**](https://github.com/edonahue/pirate-arcade-web) is a minor sister project and useful family reference, not a template. Charted Currents may share restrained nautical vocabulary and some palette DNA, but it should be substantially more refined, archival, and historically grounded.

## Repository status

**Bootable implementation scaffold; Packet 1 direction locked and ready.** The current site intentionally contains only a modern basemap and honest empty historical surfaces. Packet 1 should implement the already-decided exploratory composition and interaction spine rather than reinitialize the framework or reopen product preferences. Packet 2 introduces the first real evidence-backed historical corpus.

## Licensing

Project code is intended to be MIT-licensed. Historical data, transcriptions, metadata, maps, images, and derived datasets retain source-specific rights and are **not automatically covered by the code license**. See [`DATA_LICENSE.md`](DATA_LICENSE.md) and [`docs/SOURCE_RIGHTS.md`](docs/SOURCE_RIGHTS.md).
