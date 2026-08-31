---
name: charted-currents-build
description: Executes bounded Charted Currents implementation sessions with the repository's architecture, provenance, no-invention, scope, and verification gates. Use for Astro, MapLibre, UI, published-data contracts, inspectors, timelines, evidence/provenance, or vertical-slice work.
---

# Charted Currents bounded build

Use this skill to execute a build session, not to redesign the project.

## Start

1. Inspect `git status --short` and the current diff before editing. Preserve unrelated user work.
2. Read `GEMINI.md`, `docs/INITIAL_BUILD_BRIEF.md`, `docs/IMPLEMENTATION_CONTRACT.md`, and the current incomplete session in `docs/FIRST_SESSIONS.md`.
3. Read only the additional product/design/data/source documents needed for this session.
4. State the session outcome, acceptance criteria, relevant source/rights implications, and files/boundaries you expect to touch.
5. If the requested work contradicts a locked decision or would create a materially different architecture, stop implementation and surface the conflict rather than silently choosing a new direction.

## Execute

- Implement the smallest coherent vertical objective that satisfies the current session.
- Prefer existing repository decisions over introducing alternatives.
- Prefer small reversible code over speculative abstractions.
- Do not refactor unrelated files.
- Do not add a dependency without a concrete need.
- Do not create historical facts, coordinates, routes, people, dates, ship identities, quotations, or rights claims to unblock a demo.
- For missing historical evidence, support an empty state, use clearly non-historical development data when appropriate, or record the research gap.
- Keep source/rights-sensitive ingestion separate from ordinary UI work.
- Add worthwhile out-of-scope ideas to `docs/FOLLOWUPS.md` rather than implementing them.

## If blocked

Do not cycle through libraries or rewrites. After two materially different failed approaches to the same blocker:

1. inspect the actual error/runtime state;
2. identify what the evidence supports;
3. make at most one new evidence-based approach or report the blocker;
4. distinguish what is observed, inferred, and still unverified.

## Verify

For web changes, run the applicable real checks, normally:

```bash
npm run check
npm run build
git diff --check
git status --short
```

Run focused tests when they exist. Inspect real browser behavior when available.

Never fabricate verification. A mock/generated image is not a screenshot of the running app; a self-referential test is not independent evidence; compiling CSS does not prove a visual defect is fixed.

For historical/data changes, additionally verify source IDs, evidence state, publication rights metadata, schema validity, and that public artifacts contain no raw/staging or secret material.

## Review the diff

Before declaring the session complete, check for:

- scope expansion;
- unsourced historical assertions;
- rights-sensitive assets without metadata;
- accidental secrets/local paths/generated files;
- route geometry that visually overstates evidence;
- inaccessible interaction/focus behavior;
- generic dashboard or faux-pirate styling drift.

## Close

Report only what is useful for the handoff:

- **Changed** — the bounded result.
- **Verified** — exact checks/browser/source evidence actually observed.
- **Unresolved** — blockers or facts not verified.
- **Next** — the next session or one clearly bounded follow-up.

Do not start the next session automatically.