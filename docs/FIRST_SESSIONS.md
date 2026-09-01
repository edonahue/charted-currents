# First implementation work packets

These work packets replace the earlier five small sessions. The change is deliberate: Antigravity's permission model makes repeated stop/restart cycles expensive, so each packet is large enough to justify one planning pass and one sustained implementation run while still having a coherent review boundary.

Complete packets in order unless the repository has clearly advanced past one.

## Packet behavior

Within a packet, do **not** stop after each subsection merely because one milestone is complete. Continue through the packet while:

- the work remains within the documented architecture and product contract;
- routine choices are local/reversible;
- verification is passing or failures are being diagnosed from evidence;
- no new source-rights, privacy, historical-identity, or irreversible architecture question appears.

Stop early only for a genuine blocker or escalation condition from `docs/AGENT_EXECUTION_PLAYBOOK.md`.

Prefer one final coherent commit/handoff for the packet. Intermediate local commits are optional; they are not required checkpoints. Never push automatically unless the current human instruction explicitly authorizes it.

---

## Packet 0 — One-time local harness preparation

### Outcome

Reduce repetitive Antigravity approvals without weakening the public/private or destructive-operation boundaries.

### Human setup

Follow `docs/KICKOFF.md` and `docs/ANTIGRAVITY_SETUP.md` once on the development machine.

Recommended posture:

- terminal sandbox enabled;
- `proceed-in-sandbox` for normal tool execution;
- artifact review set to `agent-decides`;
- non-workspace access disabled;
- routine npm/build/read-only-git commands allowed;
- `git push`, unsandboxed commands, privilege escalation, destructive Git, and broad filesystem access remain gated or denied.

The repository already contains the project bootstrap code. Packet 0 is workstation setup, dependency installation, visual-reference sync, and baseline verification rather than framework scaffolding.

---

## Packet 1 — Bootable scaffold to a public interactive shell

### Outcome

**Status: Complete — deployed and hosted-verified on Cloudflare Pages on 2026-09-01.**
- Production URL: [`https://charted-currents.pages.dev/`](https://charted-currents.pages.dev/)
- Hosted Closeout Record: [`design/reviews/packet1-hosted-review.md`](../design/reviews/packet1-hosted-review.md)

Turn the existing bootable Astro/MapLibre scaffold into a polished, deployable application that proves the primary interaction model and is ready for its first Cloudflare Pages deployment.

This packet intentionally combines the former foundation and interaction-spine sessions. The first public deployment should happen **after this packet**, before real-corpus work becomes a dependency.

**Visual quality is part of this outcome.** Read and obey `docs/PACKET1_DIRECTION.md` and `docs/VISUAL_QUALITY_CONTRACT.md`. A functional generic historical-dashboard treatment does not complete the packet.

### Start from the repository that exists

Do **not** run `npm create astro`, `npm create cloudflare`, or replace the starter architecture merely to get a fresh template.

The scaffold already provides:

- Astro 7 static configuration and strict TypeScript;
- pinned Node/Astro/MapLibre versions in `.nvmrc` and `package.json`;
- `BaseLayout`, design-token/global-style entry points, and a runnable page shell;
- a real MapLibre viewport using the bootstrap provider/Positron seed in `docs/BASEMAP_RUNTIME.md`;
- a machine-readable cartography posture plus basemap policy adapter under `src/lib/map/`;
- canonical entity/evidence/geometry type vocabulary;
- a base-aware public-path helper and published-data filename contract;
- inspector, timeline, evidence badge, and source-drawer component boundaries;
- a local historical reference-board manifest/sync path plus modern interaction references under `design/`;
- an early noindex posture;
- a zero-dependency `npm run preflight` check.

Inspect and improve these files. Do not create parallel versions simply because a template or remembered pattern is more familiar.

The first dependency install is expected to create `package-lock.json`; keep and commit that lockfile with Packet 1. Run/review `npm run refs:sync` before visual implementation so the historical reference board is locally available.

### Build/refine the foundation

- Run `npm run preflight`, `npm install` when needed, `npm run refs:sync`, and verify the existing scaffold before broad edits.
- Preserve npm, strict TypeScript, static output, and the locked dependency rules.
- Keep MapLibre GL JS 6 unless a demonstrated blocker requires escalation.
- Refine `BaseLayout`, design tokens, global styles, and the map-dominant composition into an intentional product rather than leaving the bootstrap styling as final design.
- Establish the warm editorial-atlas / Atlantic / ink visual direction from `docs/DESIGN_DIRECTION.md` and the anti-cheapness constraints in `docs/VISUAL_QUALITY_CONTRACT.md`.
- Refine the real `MapViewport`, retaining correct attribution and the modern-basemap-vs-historical-evidence distinction.
- Use `docs/BASEMAP_RUNTIME.md` and `src/lib/map/visualPolicy.ts`; do not reopen tile-provider research unless the documented provider demonstrably blocks the packet.
- Refine inspector and compact timeline regions as part of the composition rather than isolated dashboard cards.
- Use `design/reference-board/` for historical visual grounding and `design/MODERN_INTERACTION_REFERENCES.md` for interaction principles; do not copy any precedent wholesale.

### Build the interaction spine

- Extend the canonical primitives in `src/lib/domain/types.ts`; do not define competing entity/evidence/geometry vocabularies in components.
- Implement one shared typed selection path/state contract for `ship`, `port`, `voyage`, `person`, and `event`.
- Use the explicitly approved real modern locator anchors in `src/lib/map/developmentAnchors.ts` to exercise map → `port` selection → inspector. They are modern interface locators only, not historical port geometry/history, and remain outside `public/data/`.
- Render anchors with restrained project-owned MapLibre GeoJSON/circle/symbol layers; do not use default web-map pins.
- Implement accessible close/back/focus behavior.
- Refine the existing `EvidenceBadge` component around the public uncertainty vocabulary without turning states into gamified pills/chips.
- Implement honest loading, empty, map-unavailable, and error states.
- Keep Packet 1 development geometry clearly separate from `public/data/`, which is reserved for deliberately published historical artifacts.

### Deliberate visual-refinement pass

Once the main interaction is working, perform a separate visual pass before calling Packet 1 complete.

During that pass:

- inspect the actual application against `docs/VISUAL_QUALITY_CONTRACT.md`;
- remove generic card/pill/gradient/shadow treatments that survived implementation but do not serve hierarchy;
- verify the modern basemap recedes behind Charted Currents rather than reading as a stock map style;
- tune typography, line weight, spacing, inspector proportions, map controls, project markers, timeline, empty states, and focus/hover states as one system;
- inspect the historical reference board again and ask whether the UI has absorbed its hierarchy/linework/restraint without imitating scans or decorative cartouches;
- make at least one refinement based on actual desktop/phone browser inspection rather than code inspection alone.

The first functional composition is **not** the final visual composition.

### Prepare for root deployment now and subpath flexibility later

The first public deployment will be at the Cloudflare Pages project root. Do **not** prematurely set Astro's `base` to `/labs/charted-currents/`.

Instead:

- use the existing `src/lib/paths.ts` helper for public asset/data paths that may later need a base;
- avoid scattered hard-coded root-relative asset/data URLs;
- keep code compatible with a later non-root deployment if the project is eventually mounted below another site;
- do not add Worker/proxy infrastructure for that future possibility during this packet.

### Public-shell posture

The first deployed shell is a research prototype, not a claim that the historical corpus exists.

Until Packet 2 provides a real evidence-backed corpus:

- keep the restrained visible prototype/status treatment rather than fake data;
- keep historical content empty or explicitly development-only;
- retain the page meta noindex and `public/robots.txt` block unless a real canonical/public-launch decision has been made;
- do not advertise unimplemented data/source features as live.

### Deployment readiness

Before handoff:

- `npm run preflight` passes;
- `npm run verify` passes (`astro check` + production build);
- `package-lock.json` exists and reflects the pinned starter toolchain;
- reviewed reference-board derivatives/checksums are present if sync succeeded;
- `dist/` is produced;
- the app runs locally without console-breaking errors;
- browser inspection covers at minimum 1440×900, 3440×1440, 390×844, and 430×932 when tooling permits;
- the deliberate post-functionality visual-refinement pass is complete;
- safe final visual review artifacts are retained under `design/reviews/` when browser tooling can capture them;
- the map remains unquestionably visually primary;
- the mobile inspector is an elegant bottom sheet/drawer, not the bootstrap stacked fallback;
- map attribution and GeoNames anchor attribution are visible where required;
- the selection/inspector path works by keyboard;
- rotation/pitch/default-pin behavior has not crept back into the map;
- the timeline looks intentional but does not advertise filtering/scrubbing that does not exist;
- map-provider failure has an honest state;
- the result does not look like a generic dashboard/SaaS shell, faux-parchment theme, or decorative pirate site;
- no historical fact was invented for the demo;
- no secret/private/local material is present in the build or review artifacts;
- `git diff --check` passes.

### Human deployment gate

After Packet 1 is locally verified and pushed, follow `docs/CLOUDFLARE_DEPLOYMENT.md` to create the one-time Git-integrated Pages project.

The first successful `*.pages.dev` deployment is part of the Packet 1 milestone, but the Cloudflare account connection itself is a human/dashboard action rather than a coding-agent responsibility.

---

## Packet 2 — Real evidence, provenance, time, and one historical visual

### Outcome

Replace development-only interaction content with a tiny real corpus and prove the complete historical product path:

`map → entity → evidence state → source → temporal/context view`

This packet combines the former published-data/provenance and timeline/historical-source sessions.

### Recommended review boundary

This packet crosses into historical ontology, publication contracts, source rights, and real evidence. Review Packet 1 before beginning it. If a stronger model/human review is available, use that review at the **packet boundary**, not by interrupting routine implementation inside the packet.

### Published-data contract

- Formalize schemas/validators around the canonical filenames already exposed by `src/lib/data/loadPublished.ts`: `manifest`, `ports`, `routes`, `entities`, `events`, and `sources`.
- Build or manually curate the smallest useful **verified** fixture from already approved/reusable sources.
- Preserve source IDs/URLs, retrieval/version metadata where relevant, rights state, and evidence state.
- Extend `loadPublished` with validated real schemas and remove any historical-looking development fixture.
- Implement/refine `SourceDrawer` or equivalent provenance surface one click from meaningful claims.
- Render route geometry according to the canonical `geometry_kind` vocabulary.

### Time and context

- Implement the compact persistent timeline contract.
- Add one independently sourced contextual event; do not imply causality from proximity.
- Preserve map/selection/provenance state while changing temporal context.

### Historical visual

- Add one rights-cleared period map/document/reference asset from the existing source research.
- Store item-level attribution, date, holding/source institution, and reuse state.
- Make it inspectable/toggleable as evidence/reference, not an anonymous distressed-paper texture.
- Clearly label a later representation if its creation date differs materially from the event/period it is helping interpret.

### Scope target

Do not turn this packet into broad source ingestion. A few fully supported records that exercise the contracts are better than a large weak corpus.

### Acceptance

- Provenance graph from Source Record → Assertion → Occurrence → Canonical Entity is complete and verifiable.
- Deterministic data compiler outputs all 6 canonical artifacts in `public/data/`.
- All historical invariants and negative validation checks pass offline.
- Multi-source archival grouping and contemporary visual asset rendering are fully functional.
- Completed and hosted-verified on production.

---

## Packet 3 — Public-beta quality and first meaningful corpus (COMPLETE)

### Outcome

Turn the technically complete small vertical slice into a published public-beta product with a verified 15-vessel / 23-place historical network, reactive period filtering, route aggregation for overlapping segments, accessible multi-source inspection, and open search indexing.

### Completed Milestones

- **Expanded Verified Corpus**: 15 canonical vessels, 26 crew depositions (preserving raw source spellings like `Dexlford`), 23 geographic places with evidence-bounded notes, 15 route segments, and 16 dated historical events.
- **Reactive Period Focus & Temporal State**: Typed `timeFilterStore` wired to MapLibre route layers, timeline markers, and entity inspector notices with source-grounded presets (`All (1650–1730)`, `1684–1695 (Early / Disaster Context)`, `1702–1712 (Prize Papers Sample)`).
- **Route Aggregation**: Exact directional endpoint pairs (`Jamaica → London`, `Saint-Domingue → La Rochelle`) grouped into a composite voyage connection view (`selection.kind === "voyage"`) eliminating arbitrary hit selection.
- **Inspector Visibility & Coordinate Precision**: CSS `hidden` contract enforced across all sections; geographic coordinates formatted with accurate Western longitudes (`82.3666° W`).
- **UI & Accessibility Polish**: Emoji replaced with semantic badges (`VESSEL`, `EVENT`, `LOCATION`); full focus traps and Escape isolation in `SourceDrawer`.
- **Public Search Indexing**: Active `<meta name="robots" content="index,follow" />` and `public/robots.txt` `Allow: /`.
- **Deterministic Automated Verification**: 18 historical invariant tests, 8 negative validator checks, 6 research access diagnostic tests, and 58 deterministic browser assertions across desktop, ultrawide, and mobile viewports.

### Acceptance

A user can open the public product at `https://charted-currents.pages.dev/`, immediately understand that the map is primary, select any real entity, explore aggregated route connections, change temporal context with perceptible map feedback, inspect multi-source archival provenance down to the specific archival box and transcribed deposition, and view contemporary cartographic references without being misled about historical uncertainty.

---

## After Packet 3

All initial implementation packets (Packets 1–3) are complete. Subsequent milestones are formalized in `docs/ROADMAP.md` Phase 2 (*Packet 4 — Source Adapters, Entity Resolution Workbench, and Deeper Port Royal Connections*).
