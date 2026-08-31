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

Follow `docs/ANTIGRAVITY_SETUP.md` once on the development machine.

Recommended posture:

- terminal sandbox enabled;
- `proceed-in-sandbox` for normal tool execution;
- artifact review set to `agent-decides`;
- non-workspace access disabled;
- routine npm/build/read-only-git commands allowed;
- `git push`, unsandboxed commands, privilege escalation, destructive Git, and broad filesystem access remain gated or denied.

This packet changes no project code.

---

## Packet 1 — Bootstrap to a public interactive shell

### Outcome

Go from documentation stub to a real, polished, deployable Astro/MapLibre application that proves the primary interaction model and is ready for its first Cloudflare Pages deployment.

This packet intentionally combines the former foundation and interaction-spine sessions. The first public deployment should happen **after this packet**, before real-corpus work becomes a dependency.

### Build foundation

- Initialize Astro in the existing repository without disturbing docs/research.
- Use npm, strict TypeScript, static output, and the locked dependency rules.
- Add MapLibre GL JS and only dependencies that are concretely required.
- Create `BaseLayout`, global design tokens, global styles, and the map-dominant page composition.
- Establish the warm editorial-atlas / Atlantic / ink visual direction from `docs/DESIGN_DIRECTION.md`.
- Create a real `MapViewport` and initialize MapLibre with correct attribution.
- Build the supporting inspector and compact timeline regions as part of the composition rather than isolated placeholder cards.

### Build the interaction spine

- Define typed selection primitives for `ship`, `port`, `voyage`, `person`, and `event`.
- Implement one shared selection path/state contract.
- Wire a clearly synthetic/non-historical development feature or empty-map interaction to `EntityInspector` so map → selection → inspector is exercised without invented history.
- Implement accessible close/back/focus behavior.
- Add `EvidenceBadge` semantics for the public uncertainty vocabulary.
- Implement honest loading, empty, and error states.

### Prepare for root deployment now and subpath flexibility later

The first public deployment will be at the Cloudflare Pages project root. Do **not** prematurely set Astro's `base` to `/labs/charted-currents/`.

Instead:

- avoid scattered hard-coded root-relative asset/data URLs;
- centralize URL/base-path handling where useful;
- keep code compatible with a later non-root deployment if the project is eventually mounted below another site;
- do not add Worker/proxy infrastructure for that future possibility during this packet.

### Public-shell posture

The first deployed shell is a research prototype, not a claim that the historical corpus exists.

Until Packet 2 provides a real evidence-backed corpus:

- show a restrained visible prototype/status treatment rather than fake data;
- keep historical content empty or explicitly development-only;
- use `noindex`/equivalent indexing posture for the early Pages shell unless a real canonical/public-launch decision has been made;
- do not advertise unimplemented data/source features as live.

### Deployment readiness

Before handoff:

- `npm run check` passes;
- `npm run build` passes and produces `dist/`;
- the app runs locally without console-breaking errors;
- desktop and narrow-phone layouts are inspected;
- the map remains visually primary;
- the selection/inspector path works by keyboard;
- no historical fact was invented for the demo;
- no secret/private/local material is present in the build;
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

- Formalize the first published-artifact schemas/validators around `manifest`, `ports`, `routes`, `entities`, `events`, and `sources`.
- Build or manually curate the smallest useful **verified** fixture from already approved/reusable sources.
- Preserve source IDs/URLs, retrieval/version metadata where relevant, rights state, and evidence state.
- Implement `loadPublished` and remove any historical-looking development fixture.
- Implement `SourceDrawer` or equivalent provenance surface one click from meaningful claims.
- Render route geometry according to `geometry_kind`.

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

- Every public historical assertion exercised by the fixture traces to a source record.
- Source/rights metadata is validated deterministically.
- Browser loads only deliberately published/right-safe artifacts.
- No raw/staging/private/restricted data is served or committed.
- Map → entity → source is complete.
- Timeline/context remains semantically distinct from voyage evidence.
- The historical visual is dated and attributed.
- Full current verification and real browser inspection pass.

---

## Packet 3 — Public-beta quality and first meaningful corpus

### Outcome

Turn the technically complete small vertical slice into something worth linking publicly and expanding.

### Integrate and polish

- Perform responsive integration across map, inspector, timeline, provenance, and historical-source surfaces.
- Perform keyboard, focus, contrast, reduced-motion, attribution, broken-link, and publication-fixture validation passes.
- Add focused automated tests for behavior that has become nontrivial.
- Inspect real browser behavior at desktop and narrow widths.
- Remove starter artifacts, dead CSS, temporary development fixtures, and generic-dashboard drift.

### Grow only enough to make the slice meaningful

- Expand toward the documented ~10–20-vessel v0.1 target only where sources support it.
- Prefer repeated-vessel histories and useful connections over raw record count.
- Keep unresolved identities unresolved.

### Public-release posture

Once real evidence/provenance paths work:

- decide whether to remove the early noindex posture;
- update README/status from pre-build language;
- verify the production Pages deployment from `main`;
- use a PR/preview deployment for larger later changes rather than treating every agent commit as an intentional production release;
- decide whether the durable public URL should remain `*.pages.dev`, move to a project subdomain, or later integrate with the personal site's `/labs/...` path.

The URL decision must not force new runtime infrastructure merely for aesthetics.

### Acceptance

A user can open the public product, immediately understand that the map is primary, select a real entity, follow a meaningful connection, see uncertainty, inspect source evidence, change temporal context, and encounter a real historical visual source without being misled about what is known.

---

## After Packet 3

Use `docs/ROADMAP.md` and observed product/data gaps rather than continuing from agent momentum.
