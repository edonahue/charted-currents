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

## Front-end shape

Use this as the default structure; change it only when implementation demonstrates a clearer boundary.

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

## Published-data boundary

The browser consumes only deliberately published artifacts. It must never fetch raw archives, local staging data, credentials, or rights-uncleared assets.

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
- no generic cargo representation for enslaved people.

Do not create a historical fact merely to make a UI fixture convenient. If a required value is not yet verified, leave the historical record absent and make the empty/loading state work.

## Map behavior

- Initial geographic focus: Greater Caribbean, with Port Royal as the first exploration hub.
- A modern interactive basemap may establish spatial context; period maps are inspectable/toggleable evidence or reference layers.
- Do not draw an endpoint-to-endpoint line as though it were an observed ship track.
- Route styling must be capable of distinguishing `endpoints_only`, `schematic`, `observed_track`, and `reconstructed_route`.
- Preserve MapLibre attribution.
- Respect reduced-motion preferences for camera and route animation.

## Selection and navigation

Use one shared typed selection concept for ship, port, voyage, person, and context/event inspectors. Selecting an entity must preserve map continuity.

Do not build a client-side router just for inspector state. Prefer URL-addressable state/deep links using Astro pages and/or search/hash state where useful, while keeping the main map experience intact.

Do not implement detailed entity pages until the inspector spine works and there is enough real corpus to justify them.

## Design-system rules

`tokens.css` should define the small reusable vocabulary before components proliferate:

- paper/surface colors;
- Atlantic/ink/verdigris/brass/oxblood semantic colors;
- text hierarchy;
- spacing and radius scales;
- serif/sans/mono font stacks using legally redistributable or system/web-served choices;
- focus, border, shadow, and motion tokens.

The product should look like a contemporary editorial historical atlas informed by engraved charts, not a distressed-paper theme or a generic analytics dashboard.

## Dependency rule

Add a dependency only when it removes concrete implementation complexity or materially improves correctness/accessibility. Do not add utility, state, charting, animation, or component libraries speculatively.

## Verification baseline

Every implementation session that changes web code must end with the applicable real commands, not an assertion that the code “should work”:

```bash
npm run check
npm run build
git diff --check
git status --short
```

Add focused tests when behavior becomes nontrivial. Add Playwright only when there is browser behavior worth protecting; do not install it merely to satisfy a checklist.

When a browser or screenshot tool is available, inspect the actual running product for visual acceptance. A generated mock image, HTML string, or self-authored fixture is not evidence that the application rendered correctly.

## Scope rule

Solve the current vertical objective. Do not opportunistically add backend infrastructure, broad ingestion, a design-system framework, simulation, global navigation, generic dashboards, or unrelated refactors. Put a worthwhile deferred idea in `docs/FOLLOWUPS.md`.