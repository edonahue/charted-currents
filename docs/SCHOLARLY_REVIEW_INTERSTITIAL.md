# Scholarly review interstitial — implementation brief

This is the bounded brief for the planned scholarly-integrity session between feature packets, currently expected after Packet 5 and before Packet 6 analytical scale.

The purpose is to make historical review **more scalable and more credible without turning Charted Currents into a review-framework project or blocking normal development**.

Do not execute this brief automatically merely because it exists. It becomes active only when the maintainer explicitly starts the interstitial session.

## Why this interstitial exists

Packet 4–5 source work demonstrated that the project's most consequential errors are not ordinary code defects. They include:

- provenance inflation;
- source/editorial layer confusion;
- source-native identity IDs that conflict with raw records;
- overconfident entity resolution;
- plausible but unsupported historical prose;
- transformations that accidentally become historical facts;
- completion summaries stronger than repository evidence.

The repository now defines the principles in:

- `docs/SCHOLARLY_INTEGRITY.md`
- `docs/HISTORICAL_ASSERTION_POLICY.md`
- `docs/HISTORICAL_REVIEW_POLICY.md`
- `docs/ENTITY_RESOLUTION_POLICY.md`
- `docs/SECONDARY_SCHOLARSHIP_POLICY.md`
- `docs/CORRECTIONS_POLICY.md`

This interstitial should convert the smallest useful subset of those policies into reproducible project machinery.

## Success criterion

After the interstitial, a future packet that changes historical content should be able to generate a compact, source-grounded review package that answers:

1. what historical claims changed;
2. what risk class they belong to;
3. what was checked deterministically;
4. what low-risk claims were sampled;
5. what high-risk claims need dossiers/audit;
6. what contradictions were detected;
7. what requires maintainer/adjudicator attention;
8. what remains unreviewed or unresolved.

The system should reduce review effort for large batches, not create a new ceremony for every small change.

## Non-goals

Do NOT use the interstitial to:

- replace the existing packet roadmap;
- redesign the public site;
- expand the historical corpus;
- ingest a new source family;
- build a backend or browser database;
- build generic workflow/orchestration infrastructure;
- require worktrees;
- revive packet-state hooks/rules enforcement;
- require every direct source assertion to receive manual review;
- build a full citation-management application;
- create a universal ontology for all possible historical claims;
- automatically publish external-agent corrections;
- attempt formal academic peer review;
- make Packet 6 dependent on a huge new framework.

## Implementation posture: observe first, gate later

The initial system should be introduced in **observation/advisory mode** wherever practical.

### Immediately enforceable

It is appropriate to hard-fail deterministic historical integrity errors such as:

- missing SourceRecord references;
- invalid assertion references;
- impossible review/evidence enum values;
- provenance-free published derived fields where the schema requires provenance;
- raw values overwritten by known project-normalized sentinels;
- direct source assertions that cannot trace to their declared source record.

### Advisory initially

The first interstitial should normally report rather than hard-block on:

- assertion-risk classification gaps;
- sampling thresholds;
- model-audit disagreement;
- interpretive-prose review status;
- resolution-dossier completeness for legacy records;
- external expert review.

Do not make the entire existing corpus fail CI because new scholarly-review metadata has not been retrofitted everywhere.

Use incremental adoption around changed/new claims.

## Preferred first implementation slice

The interstitial should evaluate and, if justified, implement a minimal path approximately like:

```text
trusted base/public corpus
        +
candidate branch/reviewed corpus
        ↓
historical delta extraction
        ↓
claim/risk classification
        ↓
review bundle
        ├── changed low-risk assertions
        ├── source references/fixtures
        ├── resolution dossiers
        ├── changed interpretive prose where detectable
        └── summary / exception queue
        ↓
read-only audit agents
        ↓
review summary for adjudication
```

Use existing reviewed-corpus/source/assertion structures rather than inventing a parallel historical database.

## Review-bundle command

Evaluate a command such as:

```text
npm run historical:review-bundle -- --base <trusted-ref>
```

The exact name/arguments are not locked by this brief.

It should preferably:

- compare historical source-of-truth inputs and/or generated artifacts against a trusted ref;
- identify changed/new assertions, occurrences, entities, resolutions, source records, and historical copy;
- classify or request classification by A–G assertion class where meaningful;
- produce deterministic public-safe review metadata;
- avoid copying restricted/raw source material into a committed bundle;
- produce enough source references for a reviewer to retrieve the approved fixture/evidence;
- summarize counts and escalations.

Do not make the command responsible for deciding historical truth.

## Assertion-risk adoption

Use `docs/HISTORICAL_ASSERTION_POLICY.md` as the canonical taxonomy.

The interstitial should decide the least invasive representation of claim class.

Possibilities include:

- metadata on assertions;
- metadata in generated review records;
- rule-based classification for known assertion fields;
- explicit classification only for high-risk/project-generated claims.

Do not add A–G fields to every existing object solely for schema symmetry.

The representation should make future review possible with minimal duplication.

## Review-state adoption

Evidence state, extraction state, and review state must remain distinct.

The interstitial should choose one canonical review-state vocabulary and one source of truth.

Candidate terms from policy are advisory rather than pre-approved schema:

- extracted
- structurally_validated
- source_qa_passed
- ai_audit_passed
- maintainer_reviewed
- expert_reviewed
- contested
- withdrawn

Avoid a misleading linear score or `reviewed: true` boolean.

Do not require review state to appear in the public UI unless there is a clear product reason.

## Resolution dossiers

Use Packet 5's Bartolomé Antonio Garrote probable-match case as a representative Class D test if it exists in the accepted corpus by then.

The first dossier format should be small and reference existing assertions rather than duplicating all data.

It should capture:

- candidate/canonical target;
- occurrence IDs;
- supporting assertion IDs;
- contradicting assertion/source references;
- discounted evidence and rationale;
- missing discriminators where important;
- source dependency/corroboration notes;
- proposed/final resolution state;
- audit findings.

Also test against a known non-merge case such as the two 1684 `Nuestra Señora de la Estrella` occurrences if still relevant.

## Sampling

Do not lock arbitrary percentages into code immediately.

Use a reproducible pilot against real existing Class A/B/C claims to determine a useful initial sample strategy.

A first implementation may expose:

- total eligible claims;
- deterministic checks;
- selected sample IDs;
- seed;
- PASS/MISMATCH/UNVERIFIABLE outcomes;
- escalation summary.

Sampling should test extraction quality, not provide a statistical-sounding badge unsupported by calibration.

## Parallel-agent protocol

The interstitial should produce reusable, model-agnostic prompts/templates for at least:

### Source-fidelity auditor

Input: review bundle subset + source fixtures/references.

Output statuses:

- PASS
- MISMATCH
- UNVERIFIABLE
- SOURCE_LAYER_ERROR
- DERIVATION_ERROR
- ESCALATE

### Adversarial resolution auditor

Input: Class D dossier.

Output statuses:

- ACCEPT_AS_STATED
- DOWNGRADE
- UNRESOLVED
- CONFLICT
- NEEDS_MORE_EVIDENCE
- ESCALATE

### Interpretive-prose auditor

Input: changed Class E/G claim + cited scholarship/evidence.

Output: exact overstatement/citation/causality/anachronism findings.

Review agents should not edit reviewed historical data.

See `docs/LOCAL_GEMINI_SCHOLARLY_REVIEW_SETUP.md`.

## Maintainer exception queue

The highest-value output is a concise adjudication queue.

A future packet review should be able to say something like:

```text
1,327 changed claims
1,281 passed deterministic/source QA
31 passed sampled low-risk audit
9 Class D resolutions reviewed
4 cases require adjudication
2 cases recommended for qualified external review
```

Illustrative only.

The maintainer should then inspect the 4–6 consequential cases, not all 1,327 claims.

## Secondary scholarship

The interstitial may establish a **minimal** secondary-source registry/schema if required to review current interpretive prose.

Do not build a comprehensive bibliography manager.

Prioritize:

- stable scholarly citation;
- exact pages/sections where a specific interpretation depends on them;
- claim/topic linkage;
- inspection/access note;
- prevention of primary-source citation laundering.

See `docs/SECONDARY_SCHOLARSHIP_POLICY.md`.

## Corrections/challenges

The interstitial may define the first machine-readable correction/challenge schema or GitHub issue template if that is cheap and clearly useful.

Do not build a public corrections UI unless separately scoped.

See `docs/CORRECTIONS_POLICY.md`.

## Public/private and rights

Historical review tooling must obey `docs/PUBLIC_PRIVATE_BOUNDARY.md` and `docs/SOURCE_RIGHTS.md`.

A review bundle must not become a loophole for committing:

- restricted raw datasets;
- manuscript images without publication rights;
- sensitive archaeology coordinates;
- credentials;
- local workstation/session paths;
- unreviewed AI conclusions presented as evidence.

Prefer stable IDs/references to duplicating source payloads.

## Verification

The interstitial should test itself against existing accepted historical data and known prior failure modes.

At minimum consider regression examples for:

- catalogue metadata vs digital manuscript inspection;
- source-chain validation vs independent corroboration;
- raw vs normalized place/name values;
- discrete vs continuous coverage;
- conflicting entity identity evidence;
- project-derived values vs raw source assertions;
- false precision;
- unsupported interpretive prose.

## Handoff

At completion report:

- what review machinery actually exists;
- what remains policy-only;
- what is hard-gated vs advisory;
- how to generate a review bundle;
- how to run a parallel auditor;
- what local setup, if any, the maintainer must perform;
- how a normal Packet 6 implementation proceeds without unnecessary new ceremony.

## Final design principle

The scholarly-integrity system succeeds when it allows Charted Currents to scale **more confidently and faster**, because routine source handling becomes cheaper to verify and human attention is reserved for consequential historical judgment.

If the new protocol makes every ordinary packet dramatically slower without finding materially better historical errors, simplify it.
