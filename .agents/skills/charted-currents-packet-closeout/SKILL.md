---
name: charted-currents-packet-closeout
description: Adversarially close a Charted Currents packet by comparing the approved contract to the actual diff/evidence, running data-derived reporting, and stopping at REVIEW_PENDING rather than self-acceptance.
---

# Charted Currents packet closeout

Use this skill after implementation is functionally complete and before claiming packet completion.

## 1. Re-read the contract, not the implementation story

Inspect:

- active packet contract;
- current branch/base/head;
- git diff;
- changed generated artifacts;
- exact source fixtures/proofs relevant to historical changes.

For every acceptance item ask:

> What independent observation proves this?

Look specifically for implementation that preserved the feature's shape while weakening the invariant.

## 2. Goal-substitution audit

Search for common substitutions:

- checksum called a profile;
- source records embedded as adapter constants;
- self-referential fixtures used as source proof;
- positive-only browser tests for a positive/negative contract;
- synthetic `.click()` used as keyboard proof;
- min/max span used as continuous evidence coverage;
- upstream citation described as independent corroboration;
- local build described as hosted verification;
- hard-coded summary facts instead of generated facts.

Any valid substitution blocks self-verification.

## 3. Diff audit

Check for:

- scope expansion/non-goals violated;
- duplicate source-of-truth files;
- raw/staging/private/restricted material committed;
- invalid source-record references;
- source-specific schema coercion;
- unsourced narrative claims;
- generated drift;
- docs that overstate reality;
- packet review artifacts overwriting earlier packet evidence.

## 4. Evidence classes

Classify each acceptance item:

- structural;
- source;
- behavioral;
- hosted.

Do not allow a lower class to satisfy a higher one.

## 5. Verification

Run the contract's required commands at the intended tier. Distinguish local, CI, preview, and production observations.

Then run:

```bash
npm run packet:report
```

Use its branch/SHA/corpus/source output in the handoff. Do not recreate those facts from memory.

## 6. State transition

If local proof is complete:

`IMPLEMENTING → SELF_VERIFIED → REVIEW_PENDING`

The implementation agent must not transition to `ACCEPTED`.

Required wording:

`PACKET IMPLEMENTATION SELF-VERIFIED — EXTERNAL REVIEW REQUIRED`

If any acceptance item remains unproved, report it as unresolved rather than weakening the contract.

## 7. Git discipline

For an active substantial packet:

- stay on the feature branch/worktree;
- push the feature branch when allowed;
- open/use PR/preview review;
- do not checkout/merge/push main before external acceptance.

Workspace hooks can enforce this when the local packet marker is active.

## 8. Final handoff format

### Changed
Short factual implementation summary.

### Verified
Exact commands/source units/browser/CI observations actually seen.

### Unresolved
Anything not proved or any external-review decisions still needed.

### Report
Paste or summarize only the data-derived facts from `npm run packet:report`.

### State
`PACKET IMPLEMENTATION SELF-VERIFIED — EXTERNAL REVIEW REQUIRED`

Stop. Do not begin the next packet.
