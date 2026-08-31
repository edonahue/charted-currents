# Implementation contract — v0.1

This file resolves routine implementation choices so coding sessions can spend their effort building rather than repeatedly reopening architecture.

If a future task genuinely requires a different choice, record the reason in an ADR before changing the default.

## Locked defaults

- **Package manager:** npm.
- **Web framework:** Astro, static output.
- **Language:** TypeScript 6 in strict mode.
- **Map:** MapLibre GL JS 6.
- **Styling:** project CSS with global design tokens and component-scoped styles. No Tailwind or component-library dependency for v0.1.
- **UI framework:** none by default. Prefer Astro plus browser-native TypeScript. Add React/Preact/Svelte/etc. only for a demonstrated interaction that is materially simpler with it.
- **Client state:** small typed modules and explicit events/state transitions. No Redux/Zustand-equivalent dependency for v0.1.
- **Historical-data pipeline:** Python 3.12+ and DuckDB, run locally/build-time.
- **Published web data:** rights-safe precomputed JSON/GeoJSON first.
- **Runtime backend:** none.
- **Browser-side database:** none for v0.1.

## Bootstrap toolchain

The repository is already a bootable web scaffold. Packet 1 must **extend it rather than re-run a framework scaffolder**.

Pinned starter versions:

- Node `22.16.0` via `.nvmrc`;
- Astro `7.2.9`;
- MapLibre GL JS `6.6.0`;
- `@astrojs/check` `0.9.10`;
- TypeScript `6.0.3`;
- Fontsource `5.3.0` packages for Libre Caslon Text, Inter, and IBM Plex Mono.

These versions were chosen to eliminate first-run ambiguity and make the first local/Cloudflare build reproducible. A dependency upgrade is a separate maintenance decision, not an automatic Packet 1 task.

Do not run `npm create astro` or `npm create cloudflare` over the existing repository. The first `npm install` should create `package-lock.json`; keep that lockfile and commit it with Packet 1.

The initial modern basemap decision lives in `docs/BASEMAP_RUNTIME.md`. The remaining Packet 1 product/interaction choices live in `docs/PACKET1_DIRECTION.md`; neither should be reopened unless implementation exposes a genuine contradiction/blocker.

## Front-end shape

Use this as the default structure; the scaffold already creates these boundaries:

```text
src/
  pages/
    index.astro
  layouts/
    BaseLayout.astro
  components/
    map/
      MapViewport.astro
    inspector/
      EntityInspector.astro
    timeline/
      TimelineRail.astro
    evidence/
      EvidenceBadge.astro
      SourceDrawer.astro
  lib/
    domain/
      types.ts
    data/
      loadPublished.ts
    paths.ts
    map/
      config.ts
      developmentAnchors.ts
    state/
      selection.ts
    time/
      config.ts
  styles/
    tokens.css
    global.css
public/
  data/
design/
  reference-board/
```

Keep the map as the dominant product surface. The inspector and timeline are overlays/supporting surfaces, not a dashboard surrounding a small map.

## Canonical sources of truth

Prefer one canonical representation when several consumers need the same concept.

The scaffold already establishes:

- `src/lib/domain/types.ts` for entity kinds, evidence states, and route geometry kinds;
- `src/lib/paths.ts` for Astro-base-aware public paths;
- `src/lib/data/loadPublished.ts` for canonical published-artifact filenames;
- `src/lib/map/config.ts` for initial map/camera posture;
- `src/lib/map/developmentAnchors.ts` for Packet 1 real modern locator anchors;
- `src/lib/time/config.ts` for Packet 1 timeline bounds/interaction posture;
- `design/reference-board/manifest.json` for the local historical visual-reference set.

Extend these rather than creating component-local competing vocabularies or path/config maps.

Other examples:

- source registries feeding publication/rights checks;
- one manifest describing published artifacts;
- one template/configuration generating repeated derivative files.

If output is generated, mark it as generated and provide a deterministic command. Do not hand-edit generated files to fix one consumer. Add drift validation when generated output becomes important enough that divergence would be costly.

Do not create a second config/schema/enum merely because the existing canonical path takes effort to understand.

## Published-data boundary

The browser consumes only deliberately published artifacts. It must never fetch raw archives, local staging data, credentials, rights-uncleared assets, or private/local project state.

The first stable public bundle should converge on:

```text
public/data/
  manifest.json
  ports.geojson
  routes.geojson
  entities.json
  events.json
  sources.json
```

The exact schemas may evolve before they are declared stable, but preserve these invariants from the first real fixture:

- stable project IDs rather than display names as join keys;
- source-record IDs supporting meaningful historical assertions;
- an evidence/uncertainty state on relationships that need interpretation;
- `geometry_kind` on voyage/route geometry;
- source and rights metadata sufficient to decide whether each public asset may ship;
- separate source wording from normalized values where normalization changes meaning;
- no generic cargo representation for enslaved people;
- explicit public precision/sensitivity state where heritage-site geometry may need generalization or withholding.

Do not create a historical fact merely to make a UI fixture convenient. If a required value is not yet verified, leave the historical record absent and make the empty/loading state work.

`public/data/README.md` may exist before the first real corpus. The real modern points in `src/lib/map/developmentAnchors.ts` are **development locators only** and must remain outside `public/data/`; they do not establish historical port geometry or historical activity.

All committed data/config/artifacts must satisfy `docs/PUBLIC_PRIVATE_BOUNDARY.md`.

## Map behavior

- Initial geographic focus: Greater Caribbean, with Port Royal as the first exploration hub.
- A modern interactive basemap may establish spatial context; it is infrastructure rather than historical evidence. Follow `docs/BASEMAP_RUNTIME.md` for Packet 1.
- Packet 1 should quiet contemporary roads/POIs/admin clutter and emphasize coast/island/land-water structure without pretending the modern style is a period map.
- Period maps are inspectable/toggleable evidence or reference layers.
- Do not draw an endpoint-to-endpoint line as though it were an observed ship track.
- Route styling must be capable of distinguishing `endpoints_only`, `schematic`, `observed_track`, and `reconstructed_route`.
- Sensitive archaeological/wreck geometry must use the public display geometry/precision policy, not automatically the most exact research geometry available.
- Preserve all required basemap/MapLibre attribution.
- Respect reduced-motion preferences for camera and route animation.

## Selection, inspector, and camera

Use one shared typed selection concept for ship, port, voyage, person, and event inspectors. Selecting an entity must preserve map continuity.

Packet 1 responsive composition is locked:

- desktop: elegant right-side inspector dock;
- mobile: simple bottom-sheet/drawer with the map remaining visible; a small number of predictable sheet states is sufficient;
- do not add a UI framework solely for the sheet.

Selection camera behavior is restrained:

- gently reposition only when needed to keep the selected feature visible beside/above the inspector;
- minimal zoom delta;
- north-up/essentially 2D;
- no cinematic fly-to, gratuitous pitch, or bearing effects;
- reduced-motion path minimizes/removes animation.

Do not build a client-side router just for inspector state. Prefer URL-addressable state/deep links using Astro pages and/or search/hash state where useful, while keeping the main map experience intact.

Do not implement detailed entity pages until the inspector spine works and there is enough real corpus to justify them.

## Timeline

The Packet 1 timeline covers **1650–1730** and should look like an intentional finished part of the composition, but `src/lib/time/config.ts` explicitly keeps historical filtering non-interactive until real temporal evidence exists.

Establish tick/period hierarchy and visual language for future events/coverage without a fake scrubber that implies data has been filtered.

## Design-system rules

`tokens.css` contains a starter semantic vocabulary, not a finished visual design. Packet 1 should refine values and component composition without abandoning the semantic roles unless there is a demonstrated reason.

The reusable vocabulary includes:

- paper/surface colors;
- Atlantic/ink/verdigris/brass/oxblood semantic colors;
- text hierarchy;
- spacing and radius scales;
- Libre Caslon Text / Inter / IBM Plex Mono roles;
- focus, border, shadow, and motion tokens.

The product should look like a contemporary editorial historical atlas informed by engraved charts, not a distressed-paper theme or a generic analytics dashboard.

Use the locally synced, source-tracked `design/reference-board/` images for Packet 1 design study. Their presence in Git does **not** make them anonymous textures or automatically approved public-product assets.

Visual acceptance is part of implementation. For layout-affecting work, inspect an ordinary desktop view and a narrow phone view when browser tooling is available.

## Maker identity

Charted Currents owns the primary experience. A restrained secondary `Erich Donahue · Lab` / GitHub treatment is appropriate in low-priority utility chrome, an About surface, or footer. Do not turn the primary masthead into portfolio navigation.

## Dependency rule

Add a dependency only when it removes concrete implementation complexity or materially improves correctness/accessibility. Do not add utility, state, charting, animation, or component libraries speculatively.

Do not introduce a framework/database/service/queue/tool solely because it is familiar from another project.

The pinned starter dependencies are sufficient to begin Packet 1. Needing another package should be demonstrated by the implementation, not assumed during bootstrap.

## Command surfaces and local/CI parity

Prefer a small documented command surface over requiring contributors/agents to know internal command chains.

For the web application, `package.json` scripts are the canonical web command surface:

```bash
npm run preflight   # zero-dependency environment/repo-shape check
npm run dev
npm run check       # astro check
npm run build       # production dist/
npm run preview
npm run verify      # check + build
npm run refs:sync   # fetch reviewed local visual-reference derivatives
```

`npm run check`, `npm run build`, and `npm run verify` must remain truthful about what they exercise. `refs:sync` is a deliberate networked setup/research helper, not part of every build.

If a top-level cross-language command surface becomes useful once Python ingestion is real, add it deliberately rather than prematurely; it should invoke the same meaningful checks CI runs rather than a reduced suite that silently skips important work.

When CI/deployment is introduced, keep local and remote semantics close enough that a locally passing command is useful evidence. Any environment-only or skipped gate must be reported explicitly.

## Verification tiers

As coverage grows, organize checks by cost and scope:

- **targeted:** smallest relevant checks during implementation;
- **fast:** deterministic broad checks before normal handoff/commit;
- **full:** browser/accessibility/integration or larger data checks warranted by the change;
- **CI/deployment:** authoritative remote result where environment-specific.

Do not add commands solely to satisfy this naming scheme; introduce a tier when the repository actually has distinct work at that tier.

Every implementation packet that changes web code currently ends with the applicable real baseline commands:

```bash
npm run preflight
npm run verify
git diff --check
git status --short
```

Packet 1 should additionally confirm that the reviewed visual-reference derivatives/checksums have been synced and retained, and inspect real browser behavior at ordinary desktop and narrow-phone widths.

Add focused tests when behavior becomes nontrivial. Add Playwright when there is browser behavior worth protecting, not merely to satisfy a checklist.

When a browser or screenshot tool is available, inspect the actual running product for visual acceptance. A generated mock image, HTML string, or self-authored fixture is not evidence that the application rendered correctly.

## Performance

Optimize measured problems. Prefer structural changes—batching, bounded concurrency, caching, lazy work, early termination, reduced serialization/DOM work—over speculative micro-optimization.

Performance claims should identify enough context to be comparable: relevant input/data version, method, elapsed time, and resource measure when material. Keep benchmark environment descriptions public-safe.

## Documentation coupling

When code changes a documented command, schema, generated-file rule, public behavior, or architecture boundary, update the canonical documentation in the same change.

Do not document local-only/planned capability in present tense as if it is part of the public repository.

## Scope rule

Solve the current vertical objective. Do not opportunistically add backend infrastructure, broad ingestion, a design-system framework, simulation, global navigation, generic dashboards, or unrelated refactors. Put a worthwhile deferred idea in `docs/FOLLOWUPS.md`.
