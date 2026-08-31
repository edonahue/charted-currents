---
name: charted-currents-build
description: Executes sustained Charted Currents implementation packets with the repository's architecture, provenance, public/private, deployment, polish, and verification gates. Use for Astro, MapLibre, UI, published-data contracts, inspectors, timelines, evidence/provenance, or vertical-slice work.
---

# Charted Currents bounded build

Use this skill to execute a **whole current work packet**, not to redesign the project or stop after every subsection.

## Start

1. Inspect `git status --short` and the current diff before editing. Preserve unrelated user work.
2. On the first project run, read `docs/KICKOFF.md`.
3. Read `GEMINI.md`, `docs/AGENT_CONTEXT_INDEX.md`, `docs/MAINTAINER_EXPECTATIONS.md`, `docs/IMPLEMENTATION_CONTRACT.md`, and the current unfinished packet in `docs/FIRST_SESSIONS.md`.
4. Load only the additional context routed by `docs/AGENT_CONTEXT_INDEX.md`.
5. If map runtime/provider behavior is in scope, read `docs/BASEMAP_RUNTIME.md`.
6. If the work touches committed data/config/screenshots/logs/benchmarks/environment/source artifacts, read `docs/PUBLIC_PRIVATE_BOUNDARY.md`.
7. If the current packet includes deployment readiness, read `docs/CLOUDFLARE_DEPLOYMENT.md`.
8. State one plan for the entire packet: outcome, acceptance criteria, relevant source/rights/privacy implications, and expected files/boundaries.
9. If the requested work contradicts a locked decision or would create a materially different architecture, stop before implementation and surface the conflict.

## Bootstrap invariant

The repository already contains a bootable pinned Astro 7 / MapLibre 6 scaffold. Do not run `npm create astro`, `npm create cloudflare`, overwrite the starter configuration, or create a parallel component/tree structure simply to start.

Use the existing:

- `package.json` / `.nvmrc` / `astro.config.mjs` / `tsconfig.json`;
- `src/lib/domain/types.ts`;
- `src/lib/paths.ts`;
- `src/lib/data/loadPublished.ts`;
- layout/component/style boundaries from the implementation contract.

The first `npm install` may generate `package-lock.json`; preserve it for Packet 1.

## Execute continuously within the packet

- Implement the smallest coherent solution that completes the **entire current packet**.
- Do not stop to request approval merely because one documented subsection or component is complete.
- Make routine local, reversible, low-risk choices independently when they fit existing conventions.
- Prefer existing repository decisions and canonical sources of truth over introducing alternatives.
- Prefer small reversible code over speculative abstractions.
- Do not refactor unrelated files.
- Do not add or upgrade a dependency without a concrete need.
- Do not hand-edit generated output when a canonical generator/config exists.
- Do not create historical facts, coordinates, routes, people, dates, ship identities, quotations, or rights claims to unblock a demo.
- For missing historical evidence, support an empty state, use clearly non-historical development data when appropriate, or record the research gap.
- Keep source/rights-sensitive ingestion separate from ordinary UI work.
- Keep private/restricted/local material out of the public repository.
- Update docs when implementation changes a documented command, schema, behavior, deployment assumption, or boundary.
- Add worthwhile out-of-scope ideas to `docs/FOLLOWUPS.md` rather than implementing them.

## Stop conditions

Do not interrupt the packet for ordinary milestones. Stop only when:

- implementation reveals a real product/architecture contradiction;
- a new source-rights, privacy, sensitive-location, or historical-identity decision cannot be resolved from repository policy;
- an operation is intentionally gated by Antigravity permissions (for example `git push` or unsandboxed execution);
- two materially different attempts at the same blocker have failed and evidence does not support a safe next attempt;
- continuing would require destructive/unrelated workspace changes.

If blocked:

1. inspect the actual error/runtime state;
2. identify what the evidence supports;
3. make at most one new evidence-based approach or report the blocker;
4. distinguish observed, inferred, and unverified facts.

## Verify

Use the smallest relevant check while iterating, then the applicable packet completion gate. For current web changes, the baseline is normally:

```bash
npm run preflight
npm run verify
git diff --check
git status --short
```

As targeted/fast/full/CI tiers are added, follow their documented semantics and never report an unrun higher tier as passed.

Run focused tests when they exist. Inspect real browser behavior when available; for layout changes inspect both an ordinary desktop view and a narrow phone view.

Never fabricate verification. A mock/generated image is not a screenshot of the running app; a self-referential test is not independent evidence; compiling CSS does not prove a visual defect is fixed; a local build does not prove Cloudflare deployed successfully.

For historical/data changes, additionally verify source IDs, evidence state, publication rights metadata, schema validity, and that public artifacts contain no raw/staging, sensitive-location, restricted, or secret material.

For deployment work, distinguish **deployment readiness** (local `dist/` build) from **deployment success** (observed Cloudflare production/preview URL and commit).

## Review the diff

Before declaring the packet complete, check for:

- accidental re-scaffolding or duplicate config/component trees;
- scope expansion;
- parallel/duplicated sources of truth;
- unsourced historical assertions;
- rights-sensitive assets without metadata;
- accidental secrets/local paths/private infrastructure/generated files;
- route/site geometry that visually overstates evidence or public precision;
- inaccessible interaction/focus behavior;
- generic dashboard or faux-pirate styling drift;
- documentation that overstates or misdescribes reality;
- premature custom-domain/proxy infrastructure;
- review feedback addressed superficially rather than at root cause.

If performance motivated the change, report actual measurement rather than an unsupported impression.

## Close

Report only what is useful for the handoff:

- **Changed** — the packet result.
- **Verified** — exact checks/browser/source/deployment evidence actually observed.
- **Unresolved** — blockers or checks not verified.
- **Next** — the next packet or one clearly bounded human gate.

Do not begin the next packet automatically. Do not push unless explicitly authorized.
