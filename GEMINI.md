# Gemini project instructions — Charted Currents

Charted Currents is deliberately documentation-heavy because product judgment, historical provenance, uncertainty, and source rights are part of the implementation contract. Treat this file as the always-loaded project constitution, not as an invitation to reread the entire research library on every task.

## Initial-build execution context

Before substantial implementation, read:

- `docs/INITIAL_BUILD_BRIEF.md`
- `docs/IMPLEMENTATION_CONTRACT.md`
- the current incomplete section of `docs/FIRST_SESSIONS.md`
- `docs/AGENT_EXECUTION_PLAYBOOK.md`

Then read only the additional domain documents relevant to the current task.

Core references:

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

For source ingestion, also read the relevant entries in `research/sources.yml`, `research/art_sources.yml`, and source-specific registries. Do not load every source dossier for ordinary UI work.

## Non-negotiable rules

1. **Never invent history.** No historical fact may be presented as observed/documented without a traceable source record.
2. **Preserve evidence state.** Every public historical assertion must be classifiable as `documented`, `probable_match`, `reconstructed`, or `contextual` where interpretation is involved.
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
13. **Missing evidence is allowed.** An empty state or unresolved record is preferable to a plausible invented fixture.
14. **Never fabricate verification.** Do not claim a test, browser state, screenshot, source check, or runtime result that was not actually observed.
15. **Preserve user work.** Inspect status/diff first; do not overwrite unrelated edits or clean the workspace destructively.

## Locked engineering defaults

The routine implementation choices are resolved in `docs/IMPLEMENTATION_CONTRACT.md`. In summary:

- npm;
- Astro static output + strict TypeScript;
- MapLibre GL JS;
- project CSS/design tokens, no Tailwind/component library by default;
- no React/Preact/Svelte layer by default;
- small typed client state, no state framework by default;
- Python + DuckDB for ingestion, normalization, QA, and analytical derivation;
- JSON/GeoJSON for the first tiny published corpus;
- Parquet/GeoParquet/PMTiles only when measured scale warrants them;
- precomputed rights-safe artifacts over runtime infrastructure;
- raw/source-specific staging separate from normalized and published artifacts;
- deterministic validation for ingestion and publication boundaries.

Do not reopen these choices because another library is familiar. Change a locked default only when the current requirement demonstrates a material benefit and record the architectural reason.

## Initial implementation goal

Build a beautiful, credible vertical slice, not a giant incomplete platform:

- Greater Caribbean map, centered initially around Port Royal connections;
- ~10–20 real, properly sourced vessels by the completed v0.1 slice, not necessarily the first coding session;
- several meaningful ports;
- several repeated-vessel histories where identity is documented or carefully labeled probable;
- ship/port/voyage/person/context inspector states;
- at least one period map/reference layer;
- at least one contextual event;
- explicit provenance and uncertainty;
- a compact timeline;
- enough architecture that expansion to hundreds/thousands of records does not require a rewrite.

Follow `docs/FIRST_SESSIONS.md` for the initial sequence. Do not skip ahead into broad corpus growth before the interaction and provenance spine works.

## Planning behavior

For multi-file work:

1. inspect `git status`, relevant docs, and existing code;
2. identify the current bounded session/outcome;
3. state assumptions and source/rights implications;
4. use existing decisions rather than generating a menu of alternatives;
5. choose the simplest reversible option for genuinely undecided local details;
6. avoid opportunistic scope expansion;
7. record future work in `docs/FOLLOWUPS.md` rather than silently adding it.

If two materially different attempts fail at the same blocker, stop cycling. Diagnose from actual errors/runtime evidence and either make one evidence-based next attempt or report the blocker.

## Completion behavior

A coding session is not complete because the diff looks plausible. Run the applicable checks from `docs/IMPLEMENTATION_CONTRACT.md`, inspect the actual diff, and distinguish:

- **observed** results;
- **inferred** conclusions;
- **unverified** items the available tools could not check.

For browser-visible changes, inspect the real running product when tooling permits. Never substitute a generated mock or self-authored artifact for runtime evidence.

For historical/data changes, verify the supporting source unit, evidence state, source ID/link, and publication rights metadata before treating the result as published fact.

## Quality bar

The initial build should make a user think:

> “The data here is surprisingly detailed, and connecting these sources gives me a new way to understand this history.”

Aesthetics are part of acceptance, not post-MVP polish. Correct code that looks like a generic MapLibre demo or analytics dashboard is not finished.