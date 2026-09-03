# Agent guide — Charted Currents

This file is the model-agnostic entry point for coding/research/review agents. Gemini/Antigravity is the primary implementation workflow, but other assistants should follow the same repository-owned historical and engineering contracts.

Read `GEMINI.md` first even if you are not Gemini. It is the project's compact constitution, not model-specific secret context.

Then use `docs/AGENT_CONTEXT_INDEX.md` to load only task-relevant documentation rather than the entire tree.

The repository is already a working Astro/MapLibre project. **Do not run `npm create astro` / `npm create cloudflare`, replace the pinned `package.json`, or create a parallel starter tree just to begin.** Inspect and refine what exists.

For substantial implementation also read:

- `docs/MAINTAINER_EXPECTATIONS.md`
- `docs/IMPLEMENTATION_CONTRACT.md`
- `docs/AGENT_EXECUTION_PLAYBOOK.md`
- `docs/ROADMAP.md`
- the active packet/scope document when one exists.

For local Gemini/Antigravity setup use `docs/ANTIGRAVITY_SETUP.md`. For the current maintainer posture around scholarly-review agents and deferred worktree/rules enforcement use `docs/LOCAL_GEMINI_SCHOLARLY_REVIEW_SETUP.md`.

Read `docs/PUBLIC_PRIVATE_BOUNDARY.md` before committing data, config, screenshots, logs, benchmarks, environment details, source payloads, or generated research artifacts.

## Historical work

For any task that creates, changes, resolves, interprets, or audits public historical claims, read:

- `docs/SCHOLARLY_INTEGRITY.md`
- `docs/HISTORICAL_ASSERTION_POLICY.md`
- `docs/HISTORICAL_REVIEW_POLICY.md`
- `docs/PROVENANCE_AND_UNCERTAINTY.md`
- `docs/AI_AND_EXTRACTION_POLICY.md`

Also read:

- `docs/ENTITY_RESOLUTION_POLICY.md` for person/vessel/place identity;
- `docs/SECONDARY_SCHOLARSHIP_POLICY.md` for explanatory or causal historical prose;
- `docs/CORRECTIONS_POLICY.md` when changing a previously published substantive claim;
- source/rights/normalization documents routed by `docs/AGENT_CONTEXT_INDEX.md`.

Use `.agents/skills/charted-currents-historical-audit/SKILL.md` for adversarial historical review.

## Permanent working rules

- Inspect `git status`/diff before editing and preserve unrelated work.
- Prefer a small complete vertical slice over a broad placeholder framework.
- Prefer existing decisions and canonical sources of truth over parallel implementations.
- Never invent or silently enrich historical facts or demo fixtures.
- Evidence precedes entities: preserve source records/assertions/occurrences before canonical resolution.
- Preserve raw/source values; normalization and display labels are separate.
- Treat entity resolution as evidence-backed, occurrence-level, and reversible.
- Preserve contradictory evidence rather than cleaning it away.
- Review strength cannot upgrade evidence strength.
- Multiple AI reviewers agreeing is process QA, not independent historical corroboration.
- Interpretive historical prose must not outrun its citations/support.
- Respect item-level data/image rights and sensitive heritage-location rules.
- Keep the site static-first until runtime complexity is justified.
- Make the map exploratory and beautiful without obscuring uncertainty.
- Preserve historical gravity; no cartoon-pirate language or gamification of suffering.
- Inspect the locally synced `design/reference-board/` before styling; those images are references, not anonymous product textures.
- Avoid generic dashboard/card/pill/glassmorphism/fake-parchment visual defaults; historical character should come from cartography, typography, evidence, and real sources.
- Once interaction works, perform a separate visual-refinement pass and inspect required desktop/ultrawide/phone viewports before handoff.
- Keep documentation synchronized with what actually exists.
- Verify with real commands/runtime/source/deployment evidence; report checks not exercised.
- A successful local build is deployment readiness, not proof that Cloudflare deployed.
- Treat substantive review feedback as evidence to investigate, not a test to silence.
- Optimize measured bottlenecks rather than theoretical ones.
- Add future ideas to `docs/FOLLOWUPS.md` instead of expanding scope without approval.
- Do not push unless explicitly authorized.

## Audit-agent rule

A historical audit agent is normally a reviewer, not a publisher.

Unless explicitly asked to implement an adjudicated correction, it should report `PASS`, `MISMATCH`, `UNVERIFIABLE`, `DOWNGRADE`, `UNRESOLVED`, `CONFLICT`, `NEEDS_MORE_EVIDENCE`, or another policy-defined finding rather than editing reviewed history.

Do not weaken evidence, validators, or source semantics just to obtain a passing audit.
