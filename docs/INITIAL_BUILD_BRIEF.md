# Initial build brief for Gemini 3.7 Flash

## Mission

Create the first visual/technical vertical slice without expanding the historical corpus beyond verified sample data. The project has already made its major product, architecture, historical-policy, and design-direction choices; implementation should execute them rather than repeatedly reconsider them.

Use `docs/FIRST_SESSIONS.md` as the initial work queue and `docs/IMPLEMENTATION_CONTRACT.md` for routine technical choices. Use `docs/AGENT_EXECUTION_PLAYBOOK.md` for planning, verification, and blocker behavior.

## Build sequence

1. **Foundation and visual shell** — Astro + strict TypeScript, npm, design tokens, accessible map-dominant shell, MapLibre initialized, static deployment assumptions.
2. **Interaction spine** — map selection, shared typed entity selection, inspector-first behavior, uncertainty semantics, honest empty states.
3. **Published data + provenance** — tiny verified real corpus, deterministic artifact validation, source drawer, evidence states, route-geometry semantics.
4. **Timeline + historical source** — compact persistent timeline, separate contextual event, one rights-cleared period map/document/reference layer with item-level attribution.
5. **Integration + QA** — responsive, keyboard, focus, contrast, reduced motion, attribution, source-link/fixture validation, real browser inspection, visual cleanup.

## Acceptance

Reject a technically correct build if it:

- looks like a generic MapLibre demo or analytics dashboard;
- makes the map secondary to cards;
- buries provenance;
- makes all routes or relationships look equally certain;
- invents plausible historical fixture data to make the UI feel complete;
- treats historical imagery as anonymous texture;
- slips into parody pirate theming;
- adds infrastructure/frameworks without a demonstrated v0.1 need;
- claims visual/runtime/source verification that was not actually performed.

## Agent behavior

- Inspect status/diff before editing and preserve unrelated work.
- Read the bounded context for the current session rather than loading the whole research library.
- Prefer locked repository decisions over presenting new option menus.
- For an undecided reversible local detail, choose the simplest adequate approach and proceed.
- After two materially different failed approaches to one blocker, diagnose from actual evidence rather than cycling fixes.
- Treat missing historical evidence as an acceptable gap, not a generation opportunity.
- End each session by running real checks and reporting observed vs inferred vs unverified results.
- Do not automatically begin the next session.

## Do not do yet

No full Crespo ingestion unless explicitly tasked, DuckDB-Wasm, PMTiles, backend/API, dynamic AI feature, UI/state/CSS framework without demonstrated need, extensive dashboard charts, global Atlantic map, historical route simulation, unsupervised extraction into published data, or broad corpus expansion before the map → inspector → provenance path works.