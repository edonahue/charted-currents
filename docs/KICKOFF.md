# Packet 1 kickoff

This is the shortest path from a fresh checkout to sustained Antigravity work.

The repository contains a **bootable Astro/MapLibre scaffold**. Do not run `npm create astro`, `npm create cloudflare`, or replace the existing `package.json`, `astro.config.mjs`, `tsconfig.json`, layout, path helper, or component boundaries merely to start the project. Packet 1 should extend and refine the scaffold.

The remaining first-build product choices are already locked in `docs/PACKET1_DIRECTION.md`. The visual quality bar and anti-cheapness constraints are locked in `docs/VISUAL_QUALITY_CONTRACT.md`. `docs/VISUAL_ASSET_STRATEGY.md` explains where richer historical visual material should come from without prematurely building later infrastructure.

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

Paste the following prompt exactly or preserve its constraints if adapting it:

> You are planning the **entire first implementation packet of Charted Currents**, not a framework bootstrap and not a loose design brainstorm. This first move matters: the project has deliberately ambitious visual and historical standards, and a technically competent but generic or cheap-looking historical-dashboard result is a failure.
>
> **Do not implement or edit files in this turn.** Work in plan mode. Inspect the actual repository and produce one concrete, execution-ready plan for all of Packet 1 in `docs/FIRST_SESSIONS.md`.
>
> ### Read and obey the repository before forming the plan
>
> Start with the repository as it exists. Read, in this order where practical:
>
> 1. `GEMINI.md`
> 2. `docs/AGENT_CONTEXT_INDEX.md`
> 3. `docs/MAINTAINER_EXPECTATIONS.md`
> 4. `docs/IMPLEMENTATION_CONTRACT.md`
> 5. the full Packet 1 section of `docs/FIRST_SESSIONS.md`
> 6. `docs/PACKET1_DIRECTION.md`
> 7. `docs/VISUAL_QUALITY_CONTRACT.md`
> 8. `docs/VISUAL_ASSET_STRATEGY.md`
> 9. `docs/DESIGN_DIRECTION.md`
> 10. `design/MODERN_INTERACTION_REFERENCES.md`
> 11. `docs/BASEMAP_RUNTIME.md`
> 12. `docs/AGENT_EXECUTION_PLAYBOOK.md`
> 13. `docs/PUBLIC_PRIVATE_BOUNDARY.md`
> 14. `docs/CLOUDFLARE_DEPLOYMENT.md` only for Packet 1 deployment-readiness constraints, not to perform deployment.
>
> Then inspect the actual starter implementation rather than reasoning from documentation alone, especially:
>
> - `src/pages/index.astro`
> - `src/layouts/BaseLayout.astro`
> - `src/styles/tokens.css` and `src/styles/global.css`
> - `src/components/map/MapViewport.astro`
> - `src/lib/map/config.ts`
> - `src/lib/map/visualPolicy.ts`
> - `src/lib/map/applyVisualPolicy.ts`
> - `src/lib/map/developmentAnchors.ts`
> - `src/lib/domain/types.ts`
> - `src/lib/state/selection.ts`
> - `src/components/inspector/EntityInspector.astro`
> - `src/components/timeline/TimelineRail.astro`
> - `src/components/evidence/EvidenceBadge.astro`
> - `src/components/evidence/SourceDrawer.astro`
> - `src/lib/time/config.ts`
> - `src/lib/paths.ts`
> - `src/lib/data/loadPublished.ts`
> - `package.json`, `astro.config.mjs`, and `tsconfig.json`.
>
> Inspect `design/reference-board/manifest.json` **and the locally synced historical reference images themselves**, not only their filenames. Extract concrete visual principles from the real maps: hierarchy, line weight, coastline/sea treatment, labeling, spacing, inset/rule language, information density, and restraint. Do not turn those scans into anonymous texture or imitate decorative cartouches. Also inspect `design/MODERN_INTERACTION_REFERENCES.md` for modern interaction principles without cloning another product.
>
> If browser tooling can inspect the existing local app **without mutating the repository**, inspect the current shell and distinguish what you actually observed from what you infer from source. If it cannot, say explicitly that the pre-implementation browser state is unobserved. Do not fabricate screenshots or visual observations.
>
> ### Treat these decisions as settled
>
> Do not spend the plan reconsidering Astro, npm, TypeScript, MapLibre, OpenFreeMap, Positron, Fontsource, the absence of a UI/state/CSS framework, static-first deployment, or the basic component boundaries. Do not run a new tile-provider or design-framework survey.
>
> Packet 1 uses the four approved **modern locator anchors** only to exercise interaction; they are not historical port geometry or evidence. Do not invent ships, voyages, events, routes, dates, historical boundaries, quotations, or other historical fixture content to make the page look populated.
>
> The first public shell remains noindex and honest about its prototype/evidence state. Packet 1 prepares `dist/` for Cloudflare Pages but does not solve the eventual `/labs/...` URL architecture and does not add Workers, SSR, a runtime backend, or proxy infrastructure.
>
> Visual direction is also settled: contemporary editorial historical atlas, warm/light paper, map-first, restrained and source-led—not faux pirate, faux parchment, generic SaaS, or generic analytics dashboard. Historical atmosphere should come from typography, proportion, cartographic linework, hierarchy, restrained color, project-owned marks, and later real source imagery. `docs/VISUAL_ASSET_STRATEGY.md` is a roadmap, **not permission to prematurely add** IIIF/OpenSeadragon, a custom tile stack, texture assets, animation libraries, generic icon systems, or later historical-map infrastructure during Packet 1.
>
> Desktop composition is a map-dominant experience with an elegant right-side inspector dock that reads more like an atlas/research margin than a generic sidebar. Mobile uses an elegant bottom sheet/drawer while keeping the map visible. The 1650–1730 timeline must look intentional but must not pretend to filter or scrub historical evidence yet.
>
> Map movement must preserve spatial continuity: north-up, effectively 2D, restrained `easeTo`-style repositioning, minimal zoom change, reduced-motion support, and no cinematic movement. The scaffold already blocks mouse/touch rotation and pitch; your Packet 1 plan must also verify that **keyboard interaction preserves useful accessible pan/zoom while preventing keyboard rotation/pitch shortcuts** rather than simply disabling keyboard access.
>
> ### The visual bar is an acceptance criterion
>
> Plan explicitly against the failure modes in `docs/VISUAL_QUALITY_CONTRACT.md`. In particular, do not allow the first implementation to settle into:
>
> - card soup;
> - glassmorphism;
> - large rounded SaaS panels;
> - pill-heavy controls or gamified evidence chips;
> - strong decorative gradients;
> - fake parchment, stains, torn edges, sepia effects, or distressed fonts;
> - generic navy-and-gold "pirate luxury" styling;
> - decorative skull/anchor/ship-wheel/compass clip art;
> - default web-map pins;
> - 3D map effects, pitch, or rotation;
> - excessive shadow/floating surfaces;
> - an oversized marketing hero that displaces the map;
> - arbitrary icon-library semantics;
> - motion added merely to look impressive.
>
> The modern basemap must become visibly subordinate to Charted Currents: sea/land silhouette, coastlines/islands and restrained orientation labels matter; contemporary roads, POIs, buildings, land-use coloration and administrative clutter should recede. Use and refine the existing machine-readable visual policy rather than copying a giant upstream style JSON or changing providers.
>
> ### Plan for a true interaction spine
>
> The plan must cover a coherent end-to-end Packet 1 path, not isolated components:
>
> `map → project anchor → shared typed selection → context-preserving camera → inspector → close/back/focus recovery`
>
> Explain how the four locator anchors should be represented with project-owned MapLibre GeoJSON/circle/symbol layers and selected/focus states without default pins. Include discreet GeoNames attribution if the anchors are visible.
>
> The shared selection architecture must remain able to support `ship`, `port`, `voyage`, `person`, and `event` without creating a state framework. Packet 1 only needs truthful interaction content; do not populate unsupported historical states merely to demonstrate every type.
>
> ### Build accessibility into the plan, not after it
>
> Include keyboard navigation and focus behavior, selected-state distinction that does not rely on color alone, mobile bottom-sheet focus/close behavior, touch target sizing, semantic status/error messaging, reduced motion, contrast, and preservation of required MapLibre/OpenStreetMap/OpenFreeMap and GeoNames attribution.
>
> ### Plan a separate visual-refinement phase after functionality
>
> This is mandatory. The first working composition is not the final composition.
>
> After the core interaction works, plan a distinct browser-driven refinement pass that revisits the running app as one visual system: map hierarchy, typography, line weight, whitespace, inspector proportions, marker treatment, timeline, map controls, evidence notation, prototype/empty states, hover/focus states, and modern-map clutter.
>
> The refinement pass must inspect the actual running product at, when tooling permits:
>
> - 1440×900
> - 3440×1440
> - 390×844
> - 430×932
>
> It should result in at least one meaningful design revision based on browser observation rather than source-code inspection alone. Safe final review screenshots/notes should go under `design/reviews/` when browser capture is available.
>
> ### Verification and scope discipline
>
> Plan targeted checks during implementation and the Packet 1 completion gates: `npm run preflight`, `npm run verify`, `git diff --check`, real browser inspection, console/runtime review, responsive states, keyboard behavior, attribution, map-provider failure behavior, and review of `git status`/diff. Distinguish local build readiness from actual Cloudflare deployment success.
>
> Do not push. Do not begin Packet 2. Do not expand into real historical corpus ingestion. Do not add dependencies unless a concrete Packet 1 requirement genuinely cannot be satisfied by the settled stack; if you believe one is necessary, treat that as an explicit escalation with a specific justification rather than silently adding it.
>
> ### Required plan output
>
> Produce the plan in the following structure so it can be reviewed once and then executed in one sustained `accept-edits` session:
>
> **1. Repository reality check** — what you actually observed in code/assets/current runtime, what is inferred, and anything still unverified.
>
> **2. Packet 1 design thesis** — a concise description of how the final shell should feel and how historical reference material and modern interaction principles will be synthesized without costume historicism.
>
> **3. Settled constraints** — briefly confirm the important decisions you will *not* reopen.
>
> **4. Implementation sequence** — concrete ordered phases for the whole packet, optimized to minimize rework and permission interruptions. Identify real files/modules expected to change; avoid vague "build UI" bullets.
>
> **5. Map/cartography strategy** — basemap visual-policy refinement, project anchor source/layers, hover/focus/selection states, camera padding/repositioning, attribution, failure behavior, and accessible keyboard/touch behavior.
>
> **6. Responsive composition and interaction strategy** — desktop map/inspector composition, mobile bottom-sheet states, timeline placement, focus recovery, and how map continuity is preserved.
>
> **7. Visual-system strategy** — typography hierarchy, spacing/rules/surfaces, color roles, evidence notation, map controls, empty/prototype states, and which starter treatments should be replaced rather than merely polished.
>
> **8. State/data boundaries** — shared typed selection flow, development-anchor boundary, public-data boundary, and how Packet 1 avoids invented history while remaining genuinely interactive.
>
> **9. Accessibility and reduced-motion plan** — concrete behaviors, including keyboard pan/zoom without rotation/pitch.
>
> **10. Deliberate visual-refinement pass** — what will be reassessed after functionality works and how browser evidence will drive at least one revision.
>
> **11. Verification matrix** — map each important Packet 1 acceptance criterion to the command, browser state, interaction, or evidence that will verify it. Do not call something verified in the plan merely because you expect it to work.
>
> **12. File-impact map** — expected existing files to modify, any new files likely required, and why. Prefer the existing canonical boundaries.
>
> **13. Genuine risks/blockers only** — contradictions, API/tool uncertainties, or rights/privacy issues that could actually block execution. Do not list routine implementation choices as blockers.
>
> **14. Execution handoff** — a short final checklist defining exactly what "ready to switch to accept-edits" means and what Packet 1 completion will mean.
>
> The goal is a plan that is specific enough to execute without another design survey, but not so prescriptive that it replaces browser-based design judgment. Use your remaining discretion on implementation details to create an elegant, coherent experience within the settled direction. Do not implement yet.

The plan should be for **all of Packet 1**, not separate approval checkpoints for map, inspector, timeline shell, mobile layout, visual refinement, or deployment readiness.

## 4. Execute the approved packet in `accept-edits`

After reviewing the plan, switch the active execution mode from `plan` to **`accept-edits`** with `Shift+Tab` (confirm `[accept-edits]` in the status bar), or start a new execution session with:

```bash
agy --mode=accept-edits --model=gemini-3.7-flash-high
```

The sandbox/scoped command permissions remain in force; `accept-edits` only removes the repeated per-file write confirmations.

Paste:

> Execute the approved Packet 1 plan using the `charted-currents-build` skill. Continue through all documented Packet 1 subsections without stopping for routine local/reversible choices. Extend the existing scaffold rather than recreating it. Treat `docs/PACKET1_DIRECTION.md`, `docs/VISUAL_QUALITY_CONTRACT.md`, and `docs/VISUAL_ASSET_STRATEGY.md` as settled product/visual direction: use the real development anchors without inventing history, implement the quiet Positron-based modern cartography using `src/lib/map/visualPolicy.ts`, implement the elegant desktop dock/mobile bottom-sheet inspector, preserve restrained 2D camera continuity and accessible keyboard pan/zoom without rotation/pitch, keep the Packet 1 timeline visually polished but non-filtering, use the selected locally bundled typography, and work from the local historical reference board. Avoid generic dashboard cards, glassmorphism, pill-heavy controls, fake parchment, decorative pirate clip art, default map pins, strong decorative gradients, and unnecessary rounded/shadowed surfaces. Once the interaction is functional, perform the separate deliberate visual-refinement pass from the approved plan. Inspect the real running product at 1440×900, 3440×1440, 390×844, and 430×932 when browser tooling permits, and retain safe final review evidence under `design/reviews/`. Run targeted checks while iterating and the full Packet 1 completion checks before handoff. Do not push. Stop only for a documented escalation condition, a real evidence-backed blocker, or an operation intentionally gated by permissions. Do not begin Packet 2.

## 5. Packet 1 human gate

At the end, review the agent's:

- changed files/diff;
- real browser evidence at desktop, ultrawide, and phone widths;
- explanation of the deliberate post-functionality visual refinement pass;
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
- Node 22.23.1 locally/Pages-compatible (project engine floor `>=22.19.0 <23`);
- a central base-path helper;
- canonical domain enum/type names for entity kind, evidence state, and route geometry kind;
- four real modern Packet 1 development anchors, explicitly not historical geometry;
- the component/file boundaries from `docs/IMPLEMENTATION_CONTRACT.md`;
- initial noindex posture;
- OpenFreeMap as the reversible no-key bootstrap basemap provider, using Positron as the cleaner styling seed;
- a machine-readable modern-map visual policy in `src/lib/map/visualPolicy.ts`;
- Libre Caslon Text + Inter + IBM Plex Mono, bundled through Fontsource;
- desktop right inspector dock + mobile bottom-sheet interaction direction;
- restrained context-preserving selection camera behavior, with mouse/touch rotation and pitch already blocked in the scaffold and Packet 1 required to preserve keyboard pan/zoom while preventing keyboard rotation/pitch;
- polished but non-filtering 1650–1730 Packet 1 timeline rail;
- local public-domain historical visual-reference board;
- restrained secondary `Erich Donahue · Lab` maker identity;
- the anti-cheapness constraints and visual-review matrix in `docs/VISUAL_QUALITY_CONTRACT.md`;
- the future visual-asset/technique roadmap in `docs/VISUAL_ASSET_STRATEGY.md`;
- no framework/state/CSS library;
- no runtime backend.

Packet 1 is responsible for turning this scaffold into the polished exploratory product shell described by the design/product documents. A functional first pass is not visually complete until the separate refinement pass has been performed and reviewed.
