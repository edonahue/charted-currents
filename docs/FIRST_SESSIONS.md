# First implementation sessions

These sessions deliberately front-load decisions and verification. Complete them in order unless the repository has clearly advanced past a session.

Each session should produce one coherent, reviewable commit. Do not continue into the next session just because the current agent still has context.

## Session 1 — Foundation and visual shell

### Outcome

Turn the documentation stub into a real Astro application without yet inventing historical content.

### Build

- Initialize Astro in the existing repository; preserve all existing docs/research files.
- Use npm, TypeScript strict mode, and static output.
- Add MapLibre GL JS and only the dependencies needed for Astro checks/build.
- Create the `BaseLayout`, global design tokens, global styles, and the first map-dominant page shell.
- Establish the editorial warm-paper / Atlantic / ink visual language from `docs/DESIGN_DIRECTION.md`.
- Create a real `MapViewport` surface and initialize MapLibre successfully. It may be intentionally sparse until verified historical fixtures exist.
- Create empty/skeleton inspector and timeline regions so the composition can be evaluated as a product, not as isolated components.
- Make asset/data paths safe for eventual hosting below `/labs/charted-currents/`; do not scatter hard-coded root-relative paths.

### Explicit non-goals

No historical fixture invention, source ingestion, UI framework, Tailwind, chart library, backend, database in the browser, entity pages, or elaborate animation.

### Acceptance

- `npm run check` passes.
- `npm run build` passes.
- Running the site produces a real MapLibre map surface with attribution and no console-breaking error.
- Map dominates the viewport; inspector/timeline read as supporting surfaces.
- Narrow/mobile layout remains usable.
- The page does not resemble a generic starter/dashboard or faux-pirate theme.
- `git diff --check` passes.

---

## Session 2 — Interaction spine: map → selection → inspector

### Outcome

Prove the core interaction model before building a large corpus or detailed panels.

### Build

- Define typed domain/selection primitives for `ship`, `port`, `voyage`, `person`, and `event`.
- Implement one shared selection state path.
- Wire MapLibre feature selection to `EntityInspector` while preserving the map.
- Implement accessible close/back/focus behavior.
- Add `EvidenceBadge` semantics for the project’s public uncertainty vocabulary even if only a subset is exercised by verified fixtures.
- Establish empty/error/loading states that make missing data explicit rather than encouraging fabricated fixtures.

### Historical-data rule

If no verified spatial fixture is ready, use only clearly non-historical development geometry or leave the map data layer empty. Do **not** invent coordinates, voyage dates, routes, captains, ownership, or ship identities to demonstrate interaction.

### Acceptance

- Selection behavior is testable independently of display copy.
- Inspector preserves map context and works by keyboard.
- Selection styling is visually distinct without implying certainty.
- Checks/build pass and actual browser behavior is inspected.

---

## Session 3 — Published-data and provenance vertical slice

### Outcome

Connect the interface to a tiny real evidence-backed corpus and make provenance a first-class interaction.

### Build

- Formalize the first published-artifact schemas/validators around `manifest`, `ports`, `routes`, `entities`, `events`, and `sources`.
- Build or manually curate the smallest useful **verified** fixture from already approved/reusable sources.
- Preserve source IDs/URLs, retrieval/version metadata where relevant, rights state, and evidence state.
- Implement `loadPublished` and replace development-only interaction fixtures.
- Implement `SourceDrawer` or equivalent provenance surface one click from a meaningful claim.
- Render route geometry according to `geometry_kind`; endpoints/schematic geometry must not masquerade as an observed track.

### Scope target

Do not chase the 10–20-vessel MVP target in this session. A few complete, correctly sourced records that exercise the data contracts are more valuable than a larger weak fixture.

### Acceptance

- Every public historical assertion exercised by the fixture traces to a source record.
- Source/rights metadata is validated deterministically.
- Browser loads only published/right-safe artifacts.
- No raw/staging data is committed or served.
- Map → entity → source is a complete working path.

---

## Session 4 — Timeline, context, and one historical visual source

### Outcome

Demonstrate that time and primary-source material deepen the map instead of decorating it.

### Build

- Implement the compact persistent timeline contract.
- Add one independently sourced contextual event; proximity must not imply causality.
- Add one rights-cleared period map/document/reference asset from the existing research registry.
- Record item-level attribution, source date, rights/reuse state, and any relationship between source date and the period/event it illustrates.
- Make the historical visual inspectable/toggleable rather than an anonymous distressed background.
- Respect reduced motion.

### Acceptance

- Timeline filters/selection do not erase provenance state.
- Historical layer/source has visible attribution and date.
- A later historical map, if used to discuss an earlier event, is explicitly labeled as a later representation.
- Context event and voyage evidence remain semantically distinct.

---

## Session 5 — Vertical-slice integration and quality pass

### Outcome

Make the small system feel intentionally designed and trustworthy before adding breadth.

### Build

- Integrate responsive behavior across map, inspector, timeline, provenance, and historical-source layer.
- Perform accessibility, keyboard, focus, contrast, map-attribution, reduced-motion, broken-link, and fixture-validation passes.
- Add focused automated tests for interaction/data behavior that has become nontrivial.
- Inspect the running product at desktop and narrow widths using real browser evidence where tooling allows.
- Remove starter artifacts, dead CSS, temporary development fixtures, and accidental generic-dashboard patterns.
- Update README/repo status from “pre-build stub” only after the vertical slice genuinely exists.

### Acceptance

A user can open the product, immediately understand that the map is primary, select a real entity, follow a meaningful connection, see its uncertainty, inspect the source evidence, change temporal context, and encounter a real historical visual source without being misled about what is known.

---

## After Session 5

Use `docs/ROADMAP.md` rather than automatically continuing into broad ingestion. The next most valuable task should be chosen from observed product/data gaps, not from agent momentum.