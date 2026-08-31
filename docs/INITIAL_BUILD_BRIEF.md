# Initial build brief for Gemini 3.7 Flash

## Mission

Turn the **existing bootable scaffold** into the first polished visual/technical vertical slice quickly without expanding the historical corpus beyond verified sample data. The major product, architecture, historical-policy, design-direction, public/private, bootstrap-toolchain, and initial basemap choices are already documented; implementation should execute them rather than repeatedly reconsider them.

Start with `docs/KICKOFF.md`. Use `docs/FIRST_SESSIONS.md` as the initial **work-packet queue**, `docs/IMPLEMENTATION_CONTRACT.md` for routine technical choices, `docs/AGENT_EXECUTION_PLAYBOOK.md` for planning/verification/blockers, `docs/BASEMAP_RUNTIME.md` for the initial map provider, and `docs/ANTIGRAVITY_SETUP.md` to reduce routine permission interruptions safely.

## Existing bootstrap

Do not recreate the framework setup. The repository already contains:

- pinned Node 22.16.0 / Astro 7.2.0 / MapLibre 6.6.0;
- static Astro config and strict TypeScript;
- a runnable page/layout/style shell;
- a real modern MapLibre Caribbean basemap;
- canonical entity/evidence/geometry types;
- base-aware public pathing and published-data filename mapping;
- inspector/timeline/evidence/source component boundaries;
- noindex/robots posture for the early public shell;
- `npm run preflight` and `npm run verify` command surfaces.

Do not run `npm create astro`, `npm create cloudflare`, or replace the starter tree just to begin. The first `npm install` should generate the lockfile; retain it.

## Build sequence

1. **Packet 1 — scaffold to public interactive shell**: refine the design system and real MapLibre surface, implement the map-first composition and typed selection/inspector spine, honest empty/failure states, responsive/a11y baseline, and a Cloudflare-ready `dist/` build.
2. **First public deployment**: connect the repository to Cloudflare Pages and verify the real `*.pages.dev` production shell. Do not block on a custom domain or `/labs/...` integration.
3. **Packet 2 — evidence-backed vertical slice**: tiny verified real corpus, deterministic publication validation, source drawer, evidence states, route semantics, compact timeline, one contextual event, one rights-cleared historical visual source.
4. **Packet 3 — public-beta quality**: deeper responsive/accessibility/validation pass, focused regression tests, meaningful corpus growth toward the v0.1 target, production/indexing/domain decision.

The larger packets are intentional. Once an approved packet begins, continue through its documented subsections without asking for a new go-ahead after each routine milestone.

## Acceptance

Reject a technically correct build if it:

- leaves the starter styling/composition untouched and calls the scaffold finished;
- looks like a generic MapLibre demo or analytics dashboard;
- makes the map secondary to cards;
- buries provenance;
- creates parallel domain/path/config conventions instead of extending the canonical starter files;
- makes all routes or relationships look equally certain;
- invents plausible historical fixture data to make the UI feel complete;
- treats the modern basemap as historical evidence;
- treats historical imagery as anonymous texture;
- slips into parody pirate theming;
- adds infrastructure/frameworks without a demonstrated v0.1 need;
- claims visual/runtime/source/deployment verification that was not actually performed;
- exposes private/restricted data or local environment details.

## Agent behavior

- Inspect status/diff before editing and preserve unrelated work.
- Verify the starter with `npm run preflight` / `npm run verify` before assuming framework setup is broken.
- Read context for the current packet rather than the entire research library.
- Prefer locked repository decisions over option menus.
- Make local/reversible routine decisions independently.
- Do not stop simply because one subsection of a packet is complete.
- After two materially different failed approaches to one blocker, diagnose from evidence rather than cycling fixes.
- Treat missing historical evidence as an acceptable gap.
- Use targeted checks while iterating, then the appropriate packet completion gates.
- Distinguish local build evidence from actual Cloudflare deployment evidence.
- Never push unless human authorization/policy permits it.
- Do not automatically begin the next packet.

## Do not do yet

No full Crespo ingestion unless explicitly tasked, dependency-major upgrade/re-scaffolding, DuckDB-Wasm, PMTiles, backend/API, dynamic AI feature, UI/state/CSS framework without demonstrated need, extensive dashboard charts, global Atlantic map, historical route simulation, unsupervised extraction into published data, broad corpus expansion before the map → inspector → provenance path works, or Worker/proxy infrastructure solely to obtain a preferred URL shape.
