# Gemini project constitution — Charted Currents

Charted Currents is a provenance-aware historical atlas/research product for the Greater Caribbean. The repository owns durable product, historical, rights, architectural, and verification decisions. The coding agent implements within those decisions.

Keep this file small and evergreen. Current packet status, research details, and phase-specific instructions belong in routed docs and packet contracts rather than permanent context.

## Read order for substantial work

1. inspect `git status --short`, current branch, and relevant diff;
2. read `docs/AGENT_CONTEXT_INDEX.md`;
3. read `docs/MAINTAINER_EXPECTATIONS.md` and `docs/IMPLEMENTATION_CONTRACT.md`;
4. read `docs/AGENT_PACKET_LIFECYCLE.md`;
5. read the active packet contract under `docs/packets/` when one exists;
6. load only the source/data/design/runtime docs routed by the task;
7. use the relevant workspace skill under `.agents/skills/`;
8. read `docs/PUBLIC_PRIVATE_BOUNDARY.md` before changing data, config, screenshots, logs, source artifacts, environment-facing files, or generated research outputs.

For local Antigravity configuration, use `docs/ANTIGRAVITY_SETUP.md`.

## Permanent project invariants

1. **Never invent history.** Missing or unresolved evidence is a valid result.
2. **Evidence precedes entities.** Preserve the chain `Source → Source Record → Assertion → Occurrence → Canonical Entity`.
3. **Raw/source values are immutable evidence.** Normalization, interpretation, and project display labels must remain separate.
4. **Do not silently merge entities.** Same/similar names are not identity proof.
5. **AI output is proposal generation, never historical authority.**
6. **Inspection state must describe what was actually inspected.** Catalogue metadata, dataset rows, digitized source content, and upstream citations are different states.
7. **Upstream provenance is not independent corroboration.** A scholarly row and the archival item it cites are a source chain unless a genuinely separate historical record exists.
8. **Respect source-specific rights and public/private boundaries.**
9. **Do not treat enslaved people as generic cargo.** Follow `docs/CONTENT_AND_HISTORICAL_ETHICS.md`.
10. **Historical route geometry must communicate uncertainty.** Endpoint connectors are project visualizations, not observed sailing tracks.
11. **Static-first architecture remains the default.** No backend, browser database, or runtime research APIs without an approved architectural change.
12. **Use canonical sources of truth.** Do not create parallel configs, historical datasets, enums, or generated outputs to avoid understanding the existing path.
13. **Historical values may not originate in adapter source code.** Adapters may contain mappings, schemas, transforms, and source semantics; historical facts must originate in source rows/fixtures and pass the review boundary.
14. **Do not coerce a new source into irrelevant old-source fields.** If a source reveals a source-specific schema assumption, generalize the model rather than filling fields with prose such as “not applicable” historical claims.
15. **Documentation must match reality.** Planned, inferred, local-only, and deployed states must remain distinct.
16. **Never fabricate verification.** A green self-authored test is not automatically independent evidence.
17. **Visual quality is functional correctness.** Preserve the editorial atlas identity; do not opportunistically redesign the product.
18. **Generated design explorations are noncanonical until explicitly approved.** Do not implement visual mockups merely because they exist in conversation history.
19. **Preserve user work.** No destructive cleanup or unrelated refactors.
20. **Fix valid review feedback at the invariant/root-cause level and add regression proof where useful.**

## Packet lifecycle authority

Use the state model in `docs/AGENT_PACKET_LIFECYCLE.md`:

`PLANNED → APPROVED → IMPLEMENTING → SELF_VERIFIED → REVIEW_PENDING → ACCEPTED → DEPLOYED`

The implementation agent may move a packet through **SELF_VERIFIED** and hand it off for review. It may not declare its own work **ACCEPTED**.

Use these phrases precisely:

- `PACKET IMPLEMENTATION SELF-VERIFIED — EXTERNAL REVIEW REQUIRED`
- `PACKET REVIEW PENDING`

Only an explicit maintainer/external-review decision authorizes `ACCEPTED`.

A successful local build or self-verification does not authorize merging/pushing `main` or prove deployment.

## Branch/publication behavior

For substantial packet implementation:

- work on the packet feature branch/worktree;
- commit and push the feature branch after self-verification when allowed;
- create/use a PR and preview/review boundary;
- do not merge or push `main` before packet acceptance;
- after acceptance, merge/deploy only through the documented human-visible publication gate.

Small explicit maintainer-requested governance/documentation fixes may be committed directly to `main` when no packet implementation is active.

## Evidence classes

Every acceptance claim should identify the kind of proof it needs:

- **structural** — schema, references, deterministic build, generated shape;
- **source** — independent source row/unit, pinned extraction, rights/inspection evidence;
- **behavioral** — actual user-visible/native interaction behavior;
- **hosted** — deployed URL/commit/runtime observation.

A lower evidence class cannot silently satisfy a higher one. A constant copied into a test fixture cannot prove source extraction. DOM state alone cannot prove a native keyboard interaction. A local build cannot prove hosted deployment.

## No goal substitution

When an approved acceptance condition says to inspect/profile/verify a real source or runtime behavior, implement that exact proof. Do not substitute an easier operation with a similar name.

Examples:

- “profile the MDB” means inspect MDB schema/rows, not only checksum the file;
- “source adapter” means source row → candidate, not historical dictionaries embedded in Python;
- “exclude the visual on Havana” requires an exclusion assertion, not only a Jamaica-positive assertion;
- “keyboard activation” requires native keyboard proof, not `.click()` called from JavaScript;
- “continuous coverage” requires continuous reviewed coverage, not min/max dates around discrete samples.

If the requested proof cannot be obtained, report the blocker instead of weakening the acceptance criterion.

## Completion behavior

Before handing off implementation:

1. run the packet's required proof commands;
2. inspect the diff for scope drift, source-of-truth duplication, provenance inflation, generated drift, private/restricted files, and source-specific schema coercion;
3. run `npm run packet:report` and use its data-derived facts in the handoff;
4. distinguish **observed**, **inferred**, and **unverified** results;
5. state unresolved items explicitly;
6. stop at `REVIEW_PENDING` rather than beginning the next packet.

Never reconstruct vessel names, source IDs, counts, masters, routes, commit SHA, branch, or corpus counts from memory when a repository command/artifact can provide them.
