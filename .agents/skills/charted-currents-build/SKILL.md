---
name: charted-currents-build
description: Executes bounded Charted Currents implementation sessions with the repository's architecture, provenance, public/private, scope, polish, and verification gates. Use for Astro, MapLibre, UI, published-data contracts, inspectors, timelines, evidence/provenance, or vertical-slice work.
---

# Charted Currents bounded build

Use this skill to execute a build session, not to redesign the project.

## Start

1. Inspect `git status --short` and the current diff before editing. Preserve unrelated user work.
2. Read `GEMINI.md`, `docs/AGENT_CONTEXT_INDEX.md`, `docs/MAINTAINER_EXPECTATIONS.md`, `docs/IMPLEMENTATION_CONTRACT.md`, and the current incomplete session in `docs/FIRST_SESSIONS.md`.
3. Load only the additional context routed by `docs/AGENT_CONTEXT_INDEX.md`.
4. If the work touches committed data/config/screenshots/logs/benchmarks/environment/source artifacts, read `docs/PUBLIC_PRIVATE_BOUNDARY.md`.
5. State the session outcome, acceptance criteria, relevant source/rights/privacy implications, and files/boundaries you expect to touch.
6. If the requested work contradicts a locked decision or would create a materially different architecture, stop implementation and surface the conflict rather than silently choosing a new direction.

## Execute

- Implement the smallest coherent vertical objective that satisfies the current session.
- Prefer existing repository decisions and canonical sources of truth over introducing alternatives.
- Prefer small reversible code over speculative abstractions.
- Do not refactor unrelated files.
- Do not add a dependency without a concrete need.
- Do not hand-edit generated output when a canonical generator/config exists.
- Do not create historical facts, coordinates, routes, people, dates, ship identities, quotations, or rights claims to unblock a demo.
- For missing historical evidence, support an empty state, use clearly non-historical development data when appropriate, or record the research gap.
- Keep source/rights-sensitive ingestion separate from ordinary UI work.
- Keep private/restricted/local material out of the public repository.
- Update docs when implementation changes a documented command, schema, behavior, or boundary.
- Add worthwhile out-of-scope ideas to `docs/FOLLOWUPS.md` rather than implementing them.

## If blocked

Do not cycle through libraries or rewrites. After two materially different failed approaches to the same blocker:

1. inspect the actual error/runtime state;
2. identify what the evidence supports;
3. make at most one new evidence-based approach or report the blocker;
4. distinguish what is observed, inferred, and still unverified.

## Verify

Use the smallest relevant check while iterating, then the applicable completion gate. For current web changes, the baseline is normally:

```bash
npm run check
npm run build
git diff --check
git status --short
```

As targeted/fast/full/CI tiers are added, follow their documented semantics and never report an unrun higher tier as passed.

Run focused tests when they exist. Inspect real browser behavior when available; for layout changes inspect both an ordinary desktop view and a narrow phone view.

Never fabricate verification. A mock/generated image is not a screenshot of the running app; a self-referential test is not independent evidence; compiling CSS does not prove a visual defect is fixed.

For historical/data changes, additionally verify source IDs, evidence state, publication rights metadata, schema validity, and that public artifacts contain no raw/staging, sensitive-location, restricted, or secret material.

## Review the diff

Before declaring the session complete, check for:

- scope expansion;
- parallel/duplicated sources of truth;
- unsourced historical assertions;
- rights-sensitive assets without metadata;
- accidental secrets/local paths/private infrastructure/generated files;
- route/site geometry that visually overstates evidence or public precision;
- inaccessible interaction/focus behavior;
- generic dashboard or faux-pirate styling drift;
- documentation that now overstates or misdescribes reality;
- review feedback addressed superficially rather than at root cause.

If performance motivated the change, report actual measurement rather than an unsupported impression.

## Close

Report only what is useful for the handoff:

- **Changed** — the bounded result.
- **Verified** — exact checks/browser/source evidence actually observed.
- **Unresolved** — blockers or facts/checks not verified.
- **Next** — the next session or one clearly bounded follow-up.

Do not start the next session automatically.
