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

For local Antigravity configuration, use `docs/ANTIGRAVITY_SETUP.md`. For the current maintainer posture around scholarly-review agents and deferred worktree/rules setup, use `docs/LOCAL_GEMINI_SCHOLARLY_REVIEW_SETUP.md`.

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
21. **Review strength cannot upgrade evidence strength.** More reviewers, stronger models, or expert review can validate handling of evidence; they do not turn a probable inference into a direct historical assertion.
22. **AI agreement is process QA, not historical corroboration.** Multiple models agreeing do not create additional historical witnesses.
23. **Contradictory evidence is part of the record.** Preserve and review it rather than optimizing it away to simplify an entity or narrative.
24. **Review burden rises with inference.** Direct transcription, deterministic transformation, relational derivation, identity resolution, interpretation, reconstruction, and causal argument require different review intensity. Follow `docs/HISTORICAL_ASSERTION_POLICY.md`.
25. **Interpretive prose must not outrun its support.** If sources establish only a bounded descriptive statement, do not generate a broader historical interpretation merely because it sounds plausible; use appropriate secondary scholarship or omit the claim.

For substantial historical publication or review work, follow `docs/SCHOLARLY_INTEGRITY.md` and `docs/HISTORICAL_REVIEW_POLICY.md` in addition to the source/provenance documents routed by `docs/AGENT_CONTEXT_INDEX.md`.

## Packet lifecycle authority

Use the state model in `docs/AGENT_PACKET_LIFECYCLE.md`:

`PLANNED → APPROVED → IMPLEMENTING → SELF_VERIFIED → REVIEW_PENDING → ACCEPTED → DEPLOYED`

The implementation agent may move a packet through **SELF_VERIFIED** and hand it off for review. It may not declare its own work **ACCEPTED**.

Use these phrases precisely:

- `PACKET IMPLEMENTATION SELF-VERIFIED — EXTERNAL REVIEW REQUIRED`
- `PACKET REVIEW PENDING`

Only an explicit maintainer/external-review decision authorizes `ACCEPTED`.

A successful local build or self-verification does not authorize merging/pushing `main` or prove deployment.

The lifecycle is a review/communication contract even when optional local packet hooks are not activated.

## Branch/publication behavior

For substantial packet implementation:

- work on the packet feature branch;
- a worktree is optional, not a current maintainer requirement;
- commit and push the feature branch after self-verification when allowed;
- stop for external review before treating the packet as accepted;
- use a PR/preview boundary when the maintainer requests it or when it materially improves review; do not treat a local merge as a substitute for historical review;
- after acceptance, merge/deploy only through an explicit maintainer-visible publication step.

Small explicit maintainer-requested governance/documentation fixes may be committed directly to `main` when no packet implementation is active.

## Evidence classes

Every acceptance claim should identify the kind of proof it needs:

- **structural** — schema, references, deterministic build, generated shape;
- **source** — independent source row/unit, pinned extraction, rights/inspection evidence;
- **behavioral** — actual user-visible/native interaction behavior;
- **hosted** — deployed URL/commit/runtime observation.

A lower evidence class cannot silently satisfy a higher one. A constant copied into a test fixture cannot prove source extraction. DOM state alone cannot prove a native keyboard interaction. A local build cannot prove hosted deployment.

Historical assertion risk classes (A–G) are separate from these verification evidence classes. Use `docs/HISTORICAL_ASSERTION_POLICY.md` rather than conflating them.

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
3. when historical publication changed, classify/inspect the changed claims using the scholarly-integrity/review policy appropriate to the packet's current tooling;
4. run `npm run packet:report` and use its data-derived facts in the handoff;
5. distinguish **observed**, **inferred**, and **unverified** results;
6. state unresolved items explicitly;
7. stop at `REVIEW_PENDING` rather than beginning the next packet.

Never reconstruct vessel names, source IDs, counts, masters, routes, commit SHA, branch, or corpus counts from memory when a repository command/artifact can provide them.
