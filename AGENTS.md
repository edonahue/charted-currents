# Agent guide — Charted Currents

Read `GEMINI.md` first. For the first project run, start with `docs/KICKOFF.md`. Use `docs/AGENT_CONTEXT_INDEX.md` to load only task-relevant context rather than the entire documentation tree.

The repository is already a bootable Astro/MapLibre scaffold. **Do not run `npm create astro` / `npm create cloudflare`, replace the pinned `package.json`, or create a parallel starter tree just to begin.** Inspect and refine what exists.

For substantial implementation, also read `docs/MAINTAINER_EXPECTATIONS.md`, the current **work packet** in `docs/FIRST_SESSIONS.md`, `docs/IMPLEMENTATION_CONTRACT.md`, and `docs/AGENT_EXECUTION_PLAYBOOK.md`.

For local Antigravity setup, use `docs/ANTIGRAVITY_SETUP.md`. For map-runtime/provider assumptions, use `docs/BASEMAP_RUNTIME.md`. For deployment readiness/verification, use `docs/CLOUDFLARE_DEPLOYMENT.md`.

Read `docs/PUBLIC_PRIVATE_BOUNDARY.md` before committing data, config, screenshots, logs, benchmarks, environment details, source payloads, or generated research artifacts.

- Inspect `git status`/diff before editing and preserve unrelated work.
- Plan and execute the entire current packet; do not stop after every routine subsection.
- Prefer a small complete vertical slice over a broad placeholder framework.
- Prefer existing decisions and canonical sources of truth over parallel implementations.
- Preserve `src/lib/domain/types.ts`, `src/lib/paths.ts`, and `src/lib/data/loadPublished.ts` as canonical starting points rather than duplicating their vocabularies.
- Never invent or silently enrich historical facts or demo fixtures.
- Treat entity resolution as evidence-backed and reversible.
- Respect item-level data/image rights and sensitive heritage-location rules.
- Keep the site static-first until runtime complexity is justified.
- Make the map exploratory and beautiful without obscuring uncertainty.
- Preserve historical gravity; no cartoon-pirate language.
- Keep documentation synchronized with what actually exists.
- Verify with real commands/runtime/source/deployment evidence; report checks not exercised.
- A successful local build is deployment readiness, not proof that Cloudflare deployed.
- Treat substantive review feedback as evidence to investigate, not a test to silence.
- Optimize measured bottlenecks rather than theoretical ones.
- Add future ideas to `docs/FOLLOWUPS.md` instead of expanding scope without approval.
- Do not push unless explicitly authorized.
