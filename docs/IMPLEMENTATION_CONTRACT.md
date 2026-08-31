# Implementation contract — v0.1

This file resolves routine implementation choices so coding sessions can spend their effort building rather than repeatedly reopening architecture.

If a future task genuinely requires a different choice, record the reason in an ADR before changing the default.

## Locked defaults

- **Package manager:** npm.
- **Web framework:** Astro, static output.
- **Language:** TypeScript in strict mode.
- **Map:** MapLibre GL JS.
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
- Astro `7.2.0`;
- MapLibre GL JS `6.6.0`;
- `@astrojs/check` `0.9.5`;
- TypeScript `6.0.3`.

These versions were chosen to eliminate first-run ambiguity and make the first local/Cloudflare build reproducible. A dependency upgrade is a separate maintenance decision, not an automatic Packet 1 task.

Do not run `npm create astro` or `npm create cloudflare` over the existing repository. The first `npm install` should create `package-lock.json`; keep that lockfile and commit it with Packet 1.

The initial modern basemap decision lives in `docs/BASEMAP_RUNTIME.md` and should not be reopened unless it demonstrably blocks the packet.

## Front-end shape

Use this as the default structure; the scaffold already creates most of these boundaries:

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
    state/
      selection.ts
  styles/
    tokens.css
    global.css
public/
  data/
```

Keep the map as the dominant product surface. The inspector and timeline are overlays/supporting surfaces, not a dashboard surrounding a small map.

## Canonical sources of truth

Prefer one canonical representation when several consumers need the same concept.

The scaffold already establishes:

- `src/lib/domain/types.ts` for entity kinds, evidence states, and route geometry kinds;
- `src/lib/paths.ts` for Astro-base-aware public paths;
- `src/lib/data/loadPublished.ts` for canonical published-artifact filenames.

Extend these rather than creating component-local competing vocabularies or path maps.

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

`public/data/README.md` may exist before the first real corpus; Packet 1 development-only interaction data must not masquerade as a published historical artifact.

All committed data/config/artifacts must satisfy `docs/PUBLIC_PRIVATE_BOUNDARY.md`.

## Map behavior

- Initial geographic focus: Greater Caribbean, with Port Royal as the first exploration hub.
- A modern interactive basemap may establish spatial context; it is infrastructure rather than historical evidence. Follow `docs/BASEMAP_RUNTIME.md` for Packet 1.
- Period maps are inspectable/toggleable evidence or reference layers.
- Do not draw an endpoint-to-endpoint line as though it were an observed ship track.
- Route styling must be capable of distinguishing `endpoints_only`, `schematic`, `observed_track`, and `reconstructed_route`.
- Sensitive archaeological/wreck geometry must use the public display geometry/precision policy, not automatically the most exact research geometry available.
- Preserve all required basemap/MapLibre attribution.
- Respect reduced-motion preferences for camera and route animation.

## Selection and navigation

Use one shared typed selection concept for ship, port, voyage, person, and context/event inspectors. Selecting an entity must preserve map continuity.

Do not build a client-side router just for inspector state. Prefer URL-addressable state/deep links using Astro pages and/or search/hash state where useful, while keeping the main map experience intact.

Do not implement detailed entity pages until the inspector spine works and there is enough real corpus to justify them.

## Design-system rules

`tokens.css` contains a starter semantic vocabulary, not a finished visual design. Packet 1 should refine values and component composition without abandoning the semantic roles unless there is a demonstrated reason.

The reusable vocabulary includes:

- paper/surface colors;
- Atlantic/ink/verdigris/brass/oxblood semantic colors;
- text hierarchy;
- spacing and radius scales;
- serif/sans/mono font stacks using legally redistributable or system/web-served choices;
- focus, border, shadow, and motion tokens.

The product should look like a contemporary editorial historical atlas informed by engraved charts, not a distressed-paper theme or a generic analytics dashboard.

Visual acceptance is part of implementation. For layout-affecting work, inspect an ordinary desktop view and a narrow phone view when browser tooling is available.

## Dependency rule

Add a dependency only when it removes concrete implementation complexity or materially improves correctness/accessibility. Do not add utility, state, charting, animation, or component libraries speculatively.

Do not introduce a framework/database/service/queue/tool solely because it is familiar from another project.

The pinned starter dependencies are already sufficient to begin Packet 1. Needing another package should be demonstrated by the implementation, not assumed during bootstrap.

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
```

`npm run check`, `npm run build`, and `npm run verify` must remain truthful about what they exercise.

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
