# Gemini project instructions — Charted Currents

Charted Currents is deliberately documentation-heavy because product judgment, historical provenance, uncertainty, source rights, and public/private boundaries are part of the implementation contract. Treat this file as the always-loaded project constitution, not as an invitation to reread the entire research library on every task.

## Initial-build execution context

Before substantial implementation:

1. read `docs/KICKOFF.md` when starting the project for the first time;
2. read `docs/AGENT_CONTEXT_INDEX.md` and load only the context relevant to the task;
3. read `docs/MAINTAINER_EXPECTATIONS.md`;
4. read `docs/IMPLEMENTATION_CONTRACT.md`;
5. read the current unfinished **work packet** in `docs/FIRST_SESSIONS.md`;
6. follow `docs/AGENT_EXECUTION_PLAYBOOK.md`.

For the initial local harness configuration, use `docs/ANTIGRAVITY_SETUP.md`.

For map-provider/runtime work, use `docs/BASEMAP_RUNTIME.md`.

For deployment readiness or hosted verification, use `docs/CLOUDFLARE_DEPLOYMENT.md`.

For any task that may commit data, config, screenshots, logs, benchmarks, environment details, source payloads, or generated research artifacts, also read `docs/PUBLIC_PRIVATE_BOUNDARY.md` before editing.

## Current bootstrap state

The repository is **already a bootable Astro application scaffold**. Do not spend Packet 1 recreating framework setup.

Existing bootstrap decisions include:

- Node `22.16.0` in `.nvmrc`;
- Astro `7.2.0`, MapLibre GL JS `6.6.0`, strict TypeScript, and npm scripts in `package.json`;
- static `astro.config.mjs` and strict `tsconfig.json`;
- a real MapLibre viewport using the documented bootstrap provider;
- `BaseLayout`, starter semantic design tokens/styles, inspector/timeline/evidence/source component boundaries;
- canonical domain enums/types in `src/lib/domain/types.ts`;
- base-aware public paths in `src/lib/paths.ts`;
- canonical published-data filenames in `src/lib/data/loadPublished.ts`;
- early noindex metadata and `public/robots.txt`;
- zero-dependency `npm run preflight`.

Do **not** run `npm create astro`, `npm create cloudflare`, replace `package.json`, or generate a parallel starter tree merely because a fresh template is familiar. Inspect and refine the existing scaffold.

The first `npm install` is expected to create `package-lock.json`; preserve and commit that lockfile with Packet 1.

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
14. **Never fabricate verification.** Do not claim a test, browser state, screenshot, source check, benchmark, deployment, or runtime result that was not actually observed.
15. **Preserve user work.** Inspect status/diff first; do not overwrite unrelated edits or clean the workspace destructively.
16. **Keep public/private boundaries explicit.** Never commit secrets, private environment details, restricted source material, or sensitive heritage locations merely to make development easier.
17. **Documentation must match reality.** Do not present planned, local-only, synthetic, or unverified capability as implemented/public fact.
18. **Prefer canonical sources of truth.** Do not create parallel configs/enums/manifests or hand-edit generated outputs when a canonical representation already exists.
19. **Do not manufacture checkpoints.** Once a work packet is approved, continue through its routine documented subsections without repeatedly asking whether to proceed.
20. **Publication is a separate gate.** Local file edits/builds do not authorize `git push` or prove a Cloudflare deployment succeeded.

## Locked engineering defaults

The routine implementation choices are resolved in `docs/IMPLEMENTATION_CONTRACT.md`. In summary:

- npm;
- pinned Astro 7 static output + strict TypeScript;
- pinned MapLibre GL JS 6;
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

Build a beautiful, credible vertical slice, not a giant incomplete platform. The initial work is organized into a few larger packets because Antigravity should spend its time implementing rather than repeatedly re-requesting approval for small milestones.

Packet 1 ends with a polished interactive shell ready for its **first public Cloudflare Pages deployment**. Real historical corpus/provenance work follows in Packet 2. Public-beta polish and meaningful corpus expansion follow in Packet 3.

The completed v0.1 direction remains:

- Greater Caribbean map, centered initially around Port Royal connections;
- ~10–20 real, properly sourced vessels;
- several meaningful ports;
- repeated-vessel histories where identity is documented or carefully labeled probable;
- ship/port/voyage/person/context inspector states;
- at least one period map/reference layer;
- at least one contextual event;
- explicit provenance and uncertainty;
- a compact timeline;
- enough architecture that expansion to hundreds/thousands of records does not require a rewrite.

Follow `docs/FIRST_SESSIONS.md` for the packet sequence. Do not skip ahead into broad corpus growth before the interaction and provenance spine works.

## Planning behavior

For a work packet:

1. inspect `git status`, relevant code, and routed context from `docs/AGENT_CONTEXT_INDEX.md`;
2. identify the **entire current packet** and its acceptance criteria;
3. make one bounded plan for the packet rather than separate plans for each component;
4. state source/rights/privacy/deployment implications where relevant;
5. use existing decisions and canonical sources of truth rather than generating option menus;
6. choose the simplest reversible option for genuinely undecided local details;
7. continue through routine packet subsections without stopping for a new approval;
8. record out-of-scope work in `docs/FOLLOWUPS.md`.

Apply `docs/MAINTAINER_EXPECTATIONS.md`: polished vertical slices, behavior-focused tests, local/CI honesty, measured optimization, documentation/reality parity, and root-cause handling of review feedback.

If two materially different attempts fail at the same blocker, stop cycling. Diagnose from actual errors/runtime evidence and either make one evidence-based next attempt or report the blocker.

## Completion behavior

A packet is not complete because the diff looks plausible. Run applicable checks from `docs/IMPLEMENTATION_CONTRACT.md`, inspect the actual diff, and distinguish:

- **observed** results;
- **inferred** conclusions;
- **unverified** items the available tools could not check.

For browser-visible changes, inspect the real running product when tooling permits. Never substitute a generated mock or self-authored artifact for runtime evidence.

For historical/data changes, verify supporting source unit, evidence state, source ID/link, and publication rights metadata before treating a result as published fact.

For deployment work, distinguish a local successful `dist/` build from an actually observed Cloudflare Pages deployment and matching commit.

For any committed data/config/artifact, verify it satisfies `docs/PUBLIC_PRIVATE_BOUNDARY.md`.

Update documentation in the same change when commands, behavior, schemas, deployment assumptions, or architectural boundaries change.

## Quality bar

The initial build should make a user think:

> “The data here is surprisingly detailed, and connecting these sources gives me a new way to understand this history.”

Aesthetics are part of acceptance, not post-MVP polish. Correct code that looks like a generic MapLibre demo or analytics dashboard is not finished.
