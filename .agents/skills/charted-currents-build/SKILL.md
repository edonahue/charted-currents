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
4. During Packet 1, read `docs/PACKET1_DIRECTION.md` and inspect the locally synced `design/reference-board/` before planning visual implementation.
5. Load only the additional context routed by `docs/AGENT_CONTEXT_INDEX.md`.
6. If map runtime/provider behavior is in scope, read `docs/BASEMAP_RUNTIME.md`.
7. If the work touches committed data/config/screenshots/logs/benchmarks/environment/source artifacts, read `docs/PUBLIC_PRIVATE_BOUNDARY.md`.
8. If the current packet includes deployment readiness, read `docs/CLOUDFLARE_DEPLOYMENT.md`.
9. State one plan for the entire packet: outcome, acceptance criteria, relevant source/rights/privacy implications, and expected files/boundaries.
10. If the requested work contradicts a locked decision or would create a materially different architecture, stop before implementation and surface the conflict.

## Bootstrap invariant

The repository already contains a bootable pinned Astro 7 / TypeScript 6 / MapLibre 6 scaffold. Do not run `npm create astro`, `npm create cloudflare`, overwrite starter configuration, or create a parallel component/tree structure simply to start.

Use the existing:

- `package.json` / `.nvmrc` / `astro.config.mjs` / `tsconfig.json`;
- `src/lib/domain/types.ts`;
- `src/lib/paths.ts`;
- `src/lib/data/loadPublished.ts`;
- `src/lib/map/config.ts` and `src/lib/map/developmentAnchors.ts`;
- `src/lib/time/config.ts`;
- `design/reference-board/manifest.json` and reviewed local derivatives;
- layout/component/style boundaries from the implementation contract.

The first `npm install` may generate `package-lock.json`; preserve it for Packet 1. The local visual-reference sync may generate `design/reference-board/assets/` and `checksums.json`; review and retain those Packet 1 design references rather than repeatedly fetching replacements.

## Packet 1 locked direction

Do not reopen these decisions unless implementation exposes a genuine contradiction:

- real modern port locator anchors exercise selection; they are not historical geometry/history;
- if those anchors appear publicly, expose the canonical GeoNames CC BY 4.0 attribution;
- quiet the modern basemap's roads/POIs/admin clutter and lean editorial-atlas without pretending it is historical;
- desktop right-side inspector dock, elegant mobile bottom sheet/drawer with map continuity;
- restrained north-up/2D selection camera with minimal zoom and reduced-motion handling;
- polished 1650–1730 timeline rail that remains non-filtering in Packet 1;
- Libre Caslon Text + Inter + IBM Plex Mono via the existing Fontsource setup;
- use the local historical reference board for visual grounding without treating scans as anonymous textures;
- maker identity remains low-priority `Erich Donahue · Lab` / project utility, not primary navigation.

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
- For missing historical evidence, support an empty state, use only the explicitly approved modern development locators, or record the research gap.
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

During Packet 1 also verify:

- the reviewed reference-board derivatives/checksums are present if `refs:sync` was run;
- the four development anchors remain clearly non-historical and outside `public/data/`;
- public use of those anchors includes the GeoNames attribution;
- the mobile inspector is actually a bottom sheet/drawer rather than the bootstrap stacked fallback;
- the timeline does not claim filtering/scrubbing behavior that does not exist;
- the modern basemap remains properly attributed and visually subordinate to the product's historical/editorial identity.

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
