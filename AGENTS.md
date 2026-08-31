# Agent guide — Charted Currents

Read `GEMINI.md` first. For the first project run, start with `docs/KICKOFF.md`. Use `docs/AGENT_CONTEXT_INDEX.md` to load only task-relevant context rather than the entire documentation tree.

The repository is already a bootable Astro/MapLibre scaffold. **Do not run `npm create astro` / `npm create cloudflare`, replace the pinned `package.json`, or create a parallel starter tree just to begin.** Inspect and refine what exists.

For substantial implementation, also read `docs/MAINTAINER_EXPECTATIONS.md`, the current **work packet** in `docs/FIRST_SESSIONS.md`, `docs/IMPLEMENTATION_CONTRACT.md`, and `docs/AGENT_EXECUTION_PLAYBOOK.md`.

During Packet 1, `docs/PACKET1_DIRECTION.md` and `docs/VISUAL_QUALITY_CONTRACT.md` are required context. They settle the first-build product direction and visual-quality bar; do not reopen them through a new preference survey. Use `docs/VISUAL_ASSET_STRATEGY.md` to distinguish valuable future richness from premature/decorative implementation.

For local Antigravity setup, use `docs/ANTIGRAVITY_SETUP.md`. For map-runtime/provider assumptions, use `docs/BASEMAP_RUNTIME.md`. For deployment readiness/verification, use `docs/CLOUDFLARE_DEPLOYMENT.md`.

Read `docs/PUBLIC_PRIVATE_BOUNDARY.md` before committing data, config, screenshots, logs, benchmarks, environment details, source payloads, or generated research artifacts.

- Inspect `git status`/diff before editing and preserve unrelated work.
- Plan and execute the entire current packet; do not stop after every routine subsection.
- Prefer a small complete vertical slice over a broad placeholder framework.
- Prefer existing decisions and canonical sources of truth over parallel implementations.
- Preserve `src/lib/domain/types.ts`, `src/lib/paths.ts`, `src/lib/data/loadPublished.ts`, `src/lib/map/config.ts`, `src/lib/map/visualPolicy.ts`, `src/lib/map/developmentAnchors.ts`, and `src/lib/time/config.ts` as canonical starting points rather than duplicating their vocabularies/configuration.
- Never invent or silently enrich historical facts or demo fixtures.
- Packet 1 development anchors are real modern locators, not historical geometries; if publicly visible, expose the GeoNames CC BY 4.0 credit from the canonical anchor module.
- Treat entity resolution as evidence-backed and reversible.
- Respect item-level data/image rights and sensitive heritage-location rules.
- Keep the site static-first until runtime complexity is justified.
- Make the map exploratory and beautiful without obscuring uncertainty.
- Preserve historical gravity; no cartoon-pirate language.
- Inspect the locally synced `design/reference-board/` before styling; those images are references, not anonymous product textures.
- Avoid generic dashboard/card/pill/glassmorphism/fake-parchment visual defaults; historical character should come from cartography, typography, evidence, and real sources.
- Once interaction works, perform a separate visual-refinement pass and inspect the required desktop/ultrawide/phone viewports before handoff.
- Keep documentation synchronized with what actually exists.
- Verify with real commands/runtime/source/deployment evidence; report checks not exercised.
- A successful local build is deployment readiness, not proof that Cloudflare deployed.
- Treat substantive review feedback as evidence to investigate, not a test to silence.
- Optimize measured bottlenecks rather than theoretical ones.
- Add future ideas to `docs/FOLLOWUPS.md` instead of expanding scope without approval.
- Do not push unless explicitly authorized.
