# Packet 1 kickoff

This is the shortest path from a fresh checkout to sustained Antigravity work.

The repository contains a **bootable Astro/MapLibre scaffold**. Do not run `npm create astro`, `npm create cloudflare`, or replace the existing `package.json`, `astro.config.mjs`, `tsconfig.json`, layout, path helper, or component boundaries merely to start the project. Packet 1 should extend and refine the scaffold.

The remaining first-build product choices are already locked in `docs/PACKET1_DIRECTION.md`.

## 1. Get the local checkout ready

```bash
git pull
nvm install
nvm use
npm run preflight
npm install
npm run refs:sync
npm run verify
```

Notes:

- `.nvmrc` pins the Node version used by the starter toolchain and Cloudflare Pages.
- The first `npm install` is expected to create `package-lock.json`. Keep it; Packet 1 should commit it with the implementation.
- `npm run preflight` intentionally uses only Node built-ins, so it can run before dependencies are installed.
- `npm run refs:sync` downloads the specifically reviewed ~1280px public-domain historical design-reference derivatives listed in `design/reference-board/manifest.json`. Review them and keep the generated `assets/` plus `checksums.json` with Packet 1; they are local design/evidence references, not automatically public-product assets.
- `npm run verify` proves only that the local scaffold checks/builds. It does not prove the eventual browser experience or Cloudflare deployment.

If the local checkout already has unrelated edits, preserve them and point them out to the agent.

## 2. Configure Antigravity once

Follow `docs/ANTIGRAVITY_SETUP.md` before the implementation run. The objective is to allow routine sandboxed npm/check/read-only-git work while keeping publication, destructive operations, unsandboxed execution, and non-workspace access gated.

Because the visual board is synced before the AGY implementation run, Gemini should not need repeated web browsing simply to discover the project's historical visual vocabulary.

## 3. Start Packet 1 in plan mode

Recommended launch:

```bash
agy --mode=plan --model=gemini-3.7-flash-high
```

Paste:

> Work on the entire current Packet 1 in `docs/FIRST_SESSIONS.md`. The repository already contains a bootable Astro 7 / MapLibre 6 scaffold; do not reinitialize Astro or replace the established bootstrap files just to start. Read and obey `GEMINI.md`, `docs/AGENT_CONTEXT_INDEX.md`, `docs/MAINTAINER_EXPECTATIONS.md`, `docs/IMPLEMENTATION_CONTRACT.md`, `docs/AGENT_EXECUTION_PLAYBOOK.md`, `docs/BASEMAP_RUNTIME.md`, `docs/PACKET1_DIRECTION.md`, and the Packet 1 section. Inspect the actual repository, the locally synced `design/reference-board/`, and current diff first. Do not implement yet. Produce one bounded plan for the entire Packet 1, map the work to its acceptance criteria, identify only genuine blockers or contradictions, and avoid reopening settled choices.

The plan should be for **all of Packet 1**, not separate approval checkpoints for map, inspector, timeline shell, mobile layout, or deployment readiness.

## 4. Execute the approved packet in `accept-edits`

After reviewing the plan, switch the active execution mode from `plan` to **`accept-edits`** with `Shift+Tab` (confirm `[accept-edits]` in the status bar), or start a new execution session with:

```bash
agy --mode=accept-edits --model=gemini-3.7-flash-high
```

The sandbox/scoped command permissions remain in force; `accept-edits` only removes the repeated per-file write confirmations.

Paste:

> Execute the approved Packet 1 plan using the `charted-currents-build` skill. Continue through all documented Packet 1 subsections without stopping for routine local/reversible choices. Extend the existing scaffold rather than recreating it. Treat `docs/PACKET1_DIRECTION.md` as settled product direction: use the real development anchors without inventing history, quiet the modern basemap, implement the elegant desktop dock/mobile bottom-sheet inspector, preserve restrained 2D camera continuity, keep the Packet 1 timeline visually polished but non-filtering, use the selected locally bundled typography, and work from the local historical reference board. Run targeted checks while iterating and the full Packet 1 completion checks before handoff. Inspect the real running product at desktop and narrow-phone widths when tooling permits. Do not push. Stop only for a documented escalation condition, a real evidence-backed blocker, or an operation intentionally gated by permissions. Do not begin Packet 2.

## 5. Packet 1 human gate

At the end, review the agent's:

- changed files/diff;
- real browser evidence;
- `npm run verify` result;
- locally committed reference-board derivatives/checksums;
- unresolved items;
- proposed commit.

Then authorize the final commit/push if desired and follow `docs/CLOUDFLARE_DEPLOYMENT.md` for the first public Pages deployment.

## What the starter scaffold already decides

Gemini does not need to choose these again:

- Astro 7 static output;
- TypeScript 6 strict mode (do not upgrade to TypeScript 7 until Astro language tooling supports it);
- MapLibre GL JS 6;
- npm;
- Node 22.16.0 locally/Pages-compatible;
- a central base-path helper;
- canonical domain enum/type names for entity kind, evidence state, and route geometry kind;
- four real modern Packet 1 development anchors, explicitly not historical geometry;
- the component/file boundaries from `docs/IMPLEMENTATION_CONTRACT.md`;
- initial noindex posture;
- OpenFreeMap as the reversible no-key bootstrap basemap provider, with a quiet/customized Packet 1 style posture;
- Libre Caslon Text + Inter + IBM Plex Mono, bundled through Fontsource;
- desktop right inspector dock + mobile bottom-sheet interaction direction;
- restrained context-preserving selection camera behavior;
- polished but non-filtering 1650–1730 Packet 1 timeline rail;
- local public-domain historical visual-reference board;
- restrained secondary `Erich Donahue · Lab` maker identity;
- no framework/state/CSS library;
- no runtime backend.

Packet 1 is responsible for turning this intentionally plain scaffold into the polished exploratory product shell described by the design/product documents.
