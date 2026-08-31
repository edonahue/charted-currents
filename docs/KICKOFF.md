# Packet 1 kickoff

This is the shortest path from a fresh checkout to sustained Antigravity work.

The repository now contains a **bootable Astro/MapLibre scaffold**. Do not run `npm create astro`, `npm create cloudflare`, or replace the existing `package.json`, `astro.config.mjs`, `tsconfig.json`, layout, path helper, or component boundaries merely to start the project. Packet 1 should extend and refine the scaffold.

## 1. Get the local checkout ready

```bash
git pull
nvm install
nvm use
npm run preflight
npm install
npm run verify
```

Notes:

- `.nvmrc` pins the Node version used by the starter toolchain and Cloudflare Pages.
- The first `npm install` is expected to create `package-lock.json`. Keep it; Packet 1 should commit it with the implementation.
- `npm run preflight` intentionally uses only Node built-ins, so it can run before dependencies are installed.
- `npm run verify` proves only that the local scaffold checks/builds. It does not prove the eventual browser experience or Cloudflare deployment.

If the local checkout already has unrelated edits, preserve them and point them out to the agent.

## 2. Configure Antigravity once

Follow `docs/ANTIGRAVITY_SETUP.md` before the implementation run. The objective is to allow routine sandboxed npm/check/read-only-git work while keeping publication, destructive operations, unsandboxed execution, and non-workspace access gated.

## 3. Start Packet 1 in plan mode

Recommended launch:

```bash
agy --mode=plan --model=gemini-3.7-flash-high
```

Paste:

> Work on the entire current Packet 1 in `docs/FIRST_SESSIONS.md`. The repository already contains a bootable Astro 7 / MapLibre 6 scaffold; do not reinitialize Astro or replace the established bootstrap files just to start. Read and obey `GEMINI.md`, `docs/AGENT_CONTEXT_INDEX.md`, `docs/MAINTAINER_EXPECTATIONS.md`, `docs/IMPLEMENTATION_CONTRACT.md`, `docs/AGENT_EXECUTION_PLAYBOOK.md`, `docs/BASEMAP_RUNTIME.md`, and the Packet 1 section. Inspect the actual repository and current diff first. Do not implement yet. Produce one bounded plan for the entire Packet 1, map the work to its acceptance criteria, identify only genuine blockers or contradictions, and avoid reopening settled choices.

The plan should be for **all of Packet 1**, not separate approval checkpoints for map, inspector, timeline shell, mobile layout, or deployment readiness.

## 4. Execute the approved packet

Switch to editable mode and paste:

> Execute the approved Packet 1 plan using the `charted-currents-build` skill. Continue through all documented Packet 1 subsections without stopping for routine local/reversible choices. Extend the existing scaffold rather than recreating it. Use the pinned toolchain and the initial basemap decision in `docs/BASEMAP_RUNTIME.md`. Run targeted checks while iterating and the full Packet 1 completion checks before handoff. Inspect the real running product at desktop and narrow-phone widths when tooling permits. Do not invent historical records. Do not push. Stop only for a documented escalation condition, a real evidence-backed blocker, or an operation intentionally gated by permissions. Do not begin Packet 2.

## 5. Packet 1 human gate

At the end, review the agent's:

- changed files/diff;
- real browser evidence;
- `npm run verify` result;
- unresolved items;
- proposed commit.

Then authorize the final commit/push if desired and follow `docs/CLOUDFLARE_DEPLOYMENT.md` for the first public Pages deployment.

## What the starter scaffold already decides

Gemini does not need to choose these again:

- Astro 7 static output;
- TypeScript strict mode;
- MapLibre GL JS 6;
- npm;
- Node 22.16.0 locally/Pages-compatible;
- a central base-path helper;
- canonical domain enum/type names for entity kind, evidence state, and route geometry kind;
- the component/file boundaries from `docs/IMPLEMENTATION_CONTRACT.md`;
- initial noindex posture;
- OpenFreeMap as the reversible no-key bootstrap basemap provider;
- no framework/state/CSS library;
- no runtime backend.

Packet 1 is responsible for turning this intentionally plain scaffold into the polished exploratory product shell described by the design/product documents.
