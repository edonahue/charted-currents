# Agent execution playbook

Charted Currents is intentionally configured so a fast coding agent can execute large bounded packets without repeatedly rediscovering strategy. The repository owns durable decisions; the agent owns implementation within them.

## 1. Start with the contract, not the whole repo

For substantial work:

1. inspect current branch, `git status --short`, and relevant diff;
2. read `GEMINI.md`;
3. read `docs/AGENT_CONTEXT_INDEX.md`;
4. read `docs/MAINTAINER_EXPECTATIONS.md`, `docs/IMPLEMENTATION_CONTRACT.md`, and `docs/AGENT_PACKET_LIFECYCLE.md`;
5. read the active packet contract under `docs/packets/` when present;
6. load only source/design/runtime docs relevant to the packet;
7. use the relevant `.agents/skills/` skill.

Do not load the whole research library for ordinary UI work.

## 2. Plan the whole packet once

A packet plan must identify:

- exact objective;
- bounded scope and non-goals;
- acceptance IDs/criteria;
- proof class for each difficult criterion;
- source/rights/privacy implications;
- expected files and generated artifacts;
- branch/preview/deployment gates.

Do not produce a menu of speculative enhancements. Prefer the simplest reversible option consistent with locked decisions.

## 3. Identify the hardest proof before coding

For each nontrivial acceptance item, ask:

> What independent observation would prove this condition?

Do not substitute an easier operation later.

Examples:

- source profiling requires schema/row inspection, not only checksum verification;
- source ingestion requires values derived from the source, not copied into adapter constants;
- browser exclusion requires a negative assertion;
- native keyboard behavior requires native keyboard activation;
- discrete samples cannot become continuous coverage merely because they have min/max dates.

If the requested proof is unavailable, leave the item unresolved and report the blocker.

## 4. Execute continuously inside the approved packet

Once approved, implement through routine subsections without manufacturing checkpoints.

- preserve existing architecture and canonical sources of truth;
- prefer local reversible changes;
- do not opportunistically redesign product, ontology, palette, build system, or source model;
- do not hand-edit generated outputs;
- do not expand historical scope to make a demo look fuller;
- use `docs/FOLLOWUPS.md` as the pressure valve for good out-of-scope ideas;
- update docs when commands/schema/behavior change.

After two materially different failed approaches to the same blocker, diagnose actual runtime/source evidence before attempting again.

## 5. Historical/source work has a stricter boundary

Use the staged source flow:

`raw acquisition → source-specific extraction → candidate → review → reviewed corpus → public build`

Rules:

- historical values may not live as fixture dictionaries inside adapter source code;
- preserve raw spellings/values independently from normalization;
- direct inspection, metadata inspection, scholarly extraction, and upstream citation are distinct evidence layers;
- source chain does not equal independent corroboration;
- do not force voyage registers, archival catalogues, etc. into Prize-Paper-specific fields;
- entity resolution remains explicit and reviewable;
- unresolved identity is preferable to a plausible merge.

Use `.agents/skills/charted-currents-source-adapter/SKILL.md` for new source-family work.

## 6. Verification tiers and evidence classes

Use targeted checks while iterating, then packet-level proof at closeout.

Classify evidence as:

- **structural** — schema, references, deterministic artifacts;
- **source** — independent source row/unit/extraction/rights evidence;
- **behavioral** — real user interaction/browser state;
- **hosted** — observed deployed origin/commit.

Never promote one class into another in the handoff.

A self-authored unit test can prove transformation behavior but cannot, by itself, prove the historical input originated in the external source.

## 7. Adversarial self-review before closeout

Before saying the implementation is ready for review, inspect the diff as though another reviewer wrote it.

Look specifically for:

- goal substitution;
- hard-coded historical facts in adapter logic;
- source-specific schema coercion;
- unsupported narrative prose;
- invalid source-record references;
- source-chain provenance described as corroboration;
- tests that duplicate implementation constants;
- continuous visual semantics applied to discrete evidence;
- native-interaction claims proved by synthetic events;
- branch/deployment claims that exceed what was observed;
- documentation that overstates reality.

Fix valid findings at the invariant level and add negative/regression coverage when useful.

## 8. Packet state and branch discipline

Use:

`PLANNED → APPROVED → IMPLEMENTING → SELF_VERIFIED → REVIEW_PENDING → ACCEPTED → DEPLOYED`

The implementation agent may reach `REVIEW_PENDING`. It cannot accept its own packet.

For substantial packet implementation:

- use a feature branch/worktree;
- push the feature branch after self-verification when authorized;
- use PR/preview review;
- do not merge/push `main` before external acceptance.

The committed workspace hook policy can enforce this when a local `.agent/active-packet.json` is enabled; see `docs/ANTIGRAVITY_SETUP.md`.

## 9. Completion report must be data-derived

Run:

```bash
npm run packet:report
```

Use the resulting branch/SHA/corpus/source facts in the handoff rather than recreating them from memory.

The report intentionally does not claim test, CI, or deployment status; those must be listed from actual observed commands/runs.

Handoff structure:

- **Changed**
- **Verified**
- **Unresolved**
- **Report**
- **State: PACKET IMPLEMENTATION SELF-VERIFIED — EXTERNAL REVIEW REQUIRED**

Do not begin the next packet automatically.

## 10. Permission and publication gates

Use scoped Antigravity permissions/sandboxing rather than broad bypasses. Keep destructive Git, privilege escalation, unsandboxed execution, and publication operations deliberately gated.

A permission prompt is not a reason to split a coherent packet into microtasks.

For deployment, distinguish:

- local deployment readiness;
- remote CI success;
- preview deployment;
- production deployment matching the accepted commit.

## Stop conditions

Stop rather than guess when:

- historical identity is unresolved;
- source rights are unclear;
- source extraction cannot be reproduced;
- requested geometry would overstate evidence;
- a source-specific model cannot represent a new record without inventing fields;
- an operation would expose private/restricted material;
- continuing requires destructive unrelated workspace changes.
