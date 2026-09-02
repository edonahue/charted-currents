# Agent packet lifecycle

This document defines the execution state machine for substantial Charted Currents work. It exists to prevent a fast implementation agent from conflating “my changes look complete” with “the packet has been independently accepted.”

## States

`PLANNED → APPROVED → IMPLEMENTING → SELF_VERIFIED → REVIEW_PENDING → ACCEPTED → DEPLOYED`

### PLANNED

A packet objective, scope, non-goals, and acceptance criteria exist, but implementation is not authorized.

### APPROVED

The maintainer has approved one bounded implementation plan. The active packet contract should be created from `docs/packets/PACKET_CONTRACT_TEMPLATE.json` and committed when useful.

### IMPLEMENTING

The coding agent may edit within the approved packet. Routine milestones do not require fresh permission. Scope expansion, source-rights ambiguity, irreversible architecture changes, or unavailable evidence do.

### SELF_VERIFIED

The coding agent has run the approved local proof commands and inspected its own diff. This is a claim about implementation readiness only.

Required wording:

`PACKET IMPLEMENTATION SELF-VERIFIED — EXTERNAL REVIEW REQUIRED`

The coding agent must not call this state “complete,” “accepted,” or “production verified.”

### REVIEW_PENDING

The feature branch/PR and evidence are ready for maintainer/external review. Review may discover defects that the implementation agent's own tests missed.

### ACCEPTED

A maintainer/external review has explicitly accepted the packet or accepted a final correction pass. Only this state authorizes merge/deployment according to repository policy.

### DEPLOYED

The accepted commit is actually observed on the intended hosted origin and the hosted acceptance checks pass.

## Authority boundaries

The implementation agent can autonomously transition:

`APPROVED → IMPLEMENTING → SELF_VERIFIED → REVIEW_PENDING`

It cannot autonomously transition:

`REVIEW_PENDING → ACCEPTED`

Acceptance requires an external decision.

Deployment is separate from acceptance. A local build or green CI does not prove hosted deployment.

## Packet contract

Use `docs/packets/PACKET_CONTRACT_TEMPLATE.json` as a concise machine-readable contract. Keep it bounded. It should record:

- packet identifier/title;
- objective;
- base commit;
- working branch;
- acceptance items;
- required evidence class per item;
- required proof commands where deterministic;
- explicit non-goals.

Acceptance items should have stable IDs such as `P5-A01` so review feedback can point to a contract rather than paraphrasing a long prompt.

## Evidence classes

### structural

Appropriate for:

- schema shape;
- referential integrity;
- deterministic generation;
- generated/public artifact contents;
- source-of-truth drift.

Structural proof may be a unit/invariant/negative test if its oracle is meaningfully independent of the code path under test.

### source

Appropriate for:

- native source values;
- source extraction;
- archival identifiers;
- inspection state;
- rights/reuse claims;
- provenance chains.

Source evidence must trace to an independent source unit, pinned raw snapshot, or small derived fixture produced from that source. A value embedded in adapter code cannot prove that the adapter extracted that value.

### behavioral

Appropriate for:

- map filtering;
- inspector states;
- keyboard/pointer modality;
- focus lifecycle;
- responsive layout;
- visual exclusion/inclusion;
- route interaction.

Prefer native browser/CDP behavior. Directly mutating a store or invoking `.click()` may be useful test setup, but it must not be mislabeled as proof of native user interaction.

### hosted

Appropriate for:

- exact deployed commit;
- production/preview HTTP behavior;
- deployed data artifact availability;
- deployed indexing metadata;
- hosted runtime exceptions;
- external links actually present in production.

A local build cannot satisfy hosted evidence.

## Goal-substitution check

Before implementation and again at closeout, identify the hardest acceptance conditions and ask:

> What observation would prove this condition independently of the implementation I am about to write?

If implementation changes the requested proof into something easier, stop and correct the plan.

Common forbidden substitutions:

- checksum verification for schema profiling;
- hand-authored historical constants for source extraction;
- min/max dates for continuous evidence coverage;
- one positive UI assertion for positive-and-negative behavior;
- compilation for browser appearance;
- DOM state for native keyboard behavior;
- upstream citation for independent corroboration;
- test data copied from implementation for independent source proof.

## Source adapter boundary

For a new source family, preserve this staged flow:

`acquisition → raw snapshot → source-specific extraction → candidate fixture → review decision → reviewed corpus → deterministic public build`

Rules:

- raw historical values originate in source material, never adapter constants;
- adapters contain mappings/transforms/schema semantics, not the packet's historical fixture;
- candidate outputs do not publish directly;
- direct archival inspection and scholarly-dataset extraction remain distinct evidence layers;
- new source types may leave irrelevant fields absent; do not manufacture “not applicable” historical values to satisfy an old source-specific schema;
- fuzzy/entity resolution is reviewable proposal generation, never automatic truth.

## Packet handoff

The coding agent's handoff should contain only:

- **Changed** — concise implementation result;
- **Verified** — exact observations and commands;
- **Unresolved** — anything not proven;
- **Report** — output/facts derived from `npm run packet:report`;
- **State** — `SELF_VERIFIED / REVIEW_PENDING`.

Do not begin the next packet in the same execution merely because context remains.

## Publication workflow

For substantial packets:

1. implement on a feature branch/worktree;
2. push feature branch;
3. open/review PR and preview where available;
4. transition to `REVIEW_PENDING`;
5. external review decides `ACCEPTED` or requests correction;
6. only accepted work merges to `main`;
7. verify the hosted origin before declaring `DEPLOYED`.

Small explicit maintainer-requested governance/docs changes may bypass this packet workflow when no active implementation packet exists.
