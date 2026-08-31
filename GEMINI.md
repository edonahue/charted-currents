# Gemini project instructions — Charted Currents

Read the project documentation before planning multi-file work. The repository is intentionally documentation-heavy because product judgment, historical provenance, and source rights are core requirements.

## Required context

Before substantial implementation, read:

- `docs/PROJECT_BRIEF.md`
- `docs/PRODUCT_PRINCIPLES.md`
- `docs/MVP.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/PROVENANCE_AND_UNCERTAINTY.md`
- `docs/SOURCE_RIGHTS.md`
- `docs/DESIGN_DIRECTION.md`
- `docs/AI_AND_EXTRACTION_POLICY.md`
- `docs/DECISIONS.md`

For source ingestion, also read `research/sources.yml`.

## Non-negotiable rules

1. **Never invent history.** No historical fact may be presented as observed/documented without a traceable source record.
2. **Preserve evidence state.** Every public historical assertion must be classifiable as `documented`, `probable_match`, `reconstructed`, or `contextual`.
3. **Do not silently merge entities.** A repeated ship name does not prove repeated physical identity.
4. **AI extraction is proposal generation.** Candidate output remains `proposed` until validation.
5. **Respect source-specific rights.** Do not ingest or publish a source/asset until its rights entry permits the intended use.
6. **Do not treat enslaved people as generic cargo.** Follow `docs/CONTENT_AND_HISTORICAL_ETHICS.md`.
7. **The map is a primary product surface.** Favor inspector-first interaction over unnecessary page navigation.
8. **Do not overbuild infrastructure.** v0.1 is static-first; do not add runtime backend or DuckDB-Wasm without a documented need.
9. **No faux pirate voice.** Avoid parody language such as “arrr,” “matey,” or “yo-ho-ho.”
10. **Historical routes must communicate uncertainty.** Endpoint lines are schematic unless supported by track/reconstruction evidence.
11. **Primary documents are evidence, not decoration.** Keep item-level attribution and rights metadata.
12. **Do not copy Sid Meier's Pirates! or Pirate Arcade UI.** They are conceptual/family references only.

## Engineering defaults

- Astro + TypeScript, static output.
- MapLibre GL JS for the interactive map.
- Python + DuckDB for ingestion, normalization, QA, and analytical derivation.
- JSON/GeoJSON for the first tiny corpus.
- Move large tabular data to Parquet and large geospatial data to PMTiles when measured scale warrants it.
- Prefer precomputed artifacts over runtime infrastructure.
- Keep raw/source-specific staging data separate from normalized and published artifacts.
- Add deterministic validation for every ingestion adapter.

## Initial implementation goal

Build a beautiful, credible vertical slice, not a giant incomplete platform:

- Greater Caribbean map, centered initially around Port Royal connections;
- ~10–20 real, properly sourced vessels;
- several meaningful ports;
- several repeated-vessel histories where identity is documented or carefully labeled probable;
- ship/port/voyage/person inspector states;
- at least one period map/reference layer;
- at least one contextual event;
- explicit provenance and uncertainty;
- a compact timeline;
- enough architecture that expansion to hundreds/thousands of records does not require a rewrite.

## Planning behavior

For multi-file work:
1. inspect relevant docs and existing code;
2. state assumptions;
3. identify source/rights implications;
4. propose a bounded implementation plan;
5. avoid opportunistic scope expansion;
6. record future work in `docs/FOLLOWUPS.md` rather than silently adding it.

## Quality bar

The initial build should make a user think:

> “The data here is surprisingly detailed, and connecting these sources gives me a new way to understand this history.”

Aesthetics are part of acceptance, not post-MVP polish.
