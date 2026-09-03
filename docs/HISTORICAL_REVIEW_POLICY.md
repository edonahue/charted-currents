# Historical review policy

Charted Currents should scale historical review by concentrating expensive judgment on the claims most likely to change historical meaning.

The project does **not** require the maintainer to hand-review every source row. It does require a review system that can show how large batches were checked, what was sampled, what was escalated, and what remains uncertain.

## Core review model

Historical review should be:

- **diff-based** — review what a packet changes, not the entire corpus every time;
- **risk-stratified** — use the assertion classes in `docs/HISTORICAL_ASSERTION_POLICY.md`;
- **source-aware** — low-risk review still compares claims against real source-derived evidence;
- **adversarial for inference** — try to falsify identity/interpretive claims rather than merely confirm them;
- **non-destructive** — auditors report findings; they do not silently rewrite historical evidence;
- **auditable** — record enough metadata to reproduce what was reviewed;
- **separate from publication authority** — AI review is process QA, not historical corroboration.

## Development flow and historical publication flow are separate

Historical review should not unnecessarily block unrelated engineering work.

A productive future flow is:

```text
implementation / research
        ↓
candidate + reviewed-data delta
        ↓
historical review bundle
        ├── structural/source QA
        ├── sampling
        ├── adversarial AI audit
        └── high-risk dossiers
        ↓
review summary / escalation
        ↓
maintainer or external adjudication where needed
        ↓
publication of reviewed claims
```

While a historical bundle is being audited, development may continue on UI, adapters, performance, source profiling, or later candidate research when doing so does not silently publish the unreviewed claims.

The thing that should block is **promotion of inadequately reviewed historical claims**, not all development activity.

## Review burden by assertion class

See `docs/HISTORICAL_ASSERTION_POLICY.md` for definitions.

### Class A — direct/transcribed

Expected controls:

- 100% structural/referential validation;
- 100% deterministic comparison when machine-readable source fixtures make that practical;
- random source-fidelity sampling;
- batch escalation if sampled mismatches exceed the accepted threshold.

Do not manually inspect every Class A claim by default.

### Class B — deterministic transformation

Expected controls:

- unit/property tests of transformation rules;
- preservation of raw inputs;
- targeted boundary cases;
- sampled output review.

Review the rule more heavily than every output instance.

### Class C — relational/derived

Expected controls:

- deterministic join/aggregation tests;
- referential integrity;
- explicit handling of duplicate, missing, one-to-many, and conflicting keys;
- targeted review of anomalies;
- sampling of ordinary successful joins.

### Class D — identity/resolution

Expected controls:

- a resolution dossier for non-trivial or consequential cases;
- automatic contradiction search over available discriminators;
- adversarial review of the proposed match;
- explicit review of negative/conflicting evidence;
- reversible resolution state.

Low-confidence or unusual Class D cases should normally receive 100% review.

### Class E — interpretation

Until a mature secondary-scholarship workflow exists, review all new public Class E claims.

Review should ask:

- does the cited scholarship actually support this statement?;
- is the language stronger than the evidence?;
- are alternative interpretations material?;
- is the prose merely plausible model completion?;
- should the claim be omitted rather than weakened into vague filler?

### Class F — reconstruction

Review model assumptions, input evidence, uncertainty, and public labeling. Sample outputs where appropriate, but do not treat output volume as independent evidence.

### Class G — causal/synthetic argument

Highest burden. Prefer explicit maintainer/adjudicator review and qualified external review for consequential claims.

## Sampling policy

Sampling exists to make high-volume low-risk review tractable. It is not permission to ignore systemic extraction errors.

For a homogeneous ingestion batch, a future review bundle should record at least:

- batch/source identifier;
- total claims by assertion class;
- deterministic checks performed;
- sampling method;
- random seed where reproducibility matters;
- sample size;
- pass/mismatch/unverifiable counts;
- known anomalies;
- escalation decision.

Initial default posture for large Class A/B batches may use a small random sample or fixed minimum rather than a hard universal percentage. The interstitial scholarly-review implementation should calibrate sensible thresholds against real project data before freezing them into code.

### Escalate rather than average away failures

If a sample finds meaningful source-fidelity errors:

1. stop treating the batch as routine;
2. identify whether the failure is systematic or isolated;
3. expand review around the relevant rule/source subset;
4. fix the extraction/transformation root cause;
5. regenerate the candidate/publication delta;
6. re-run the sample.

Do not compensate for a known systematic problem by increasing sample size and accepting an average success rate.

## Historical review bundle

The project should eventually generate a review bundle from the historical delta between a trusted base and a candidate branch/output.

A useful conceptual bundle may contain:

```text
review/historical/<packet-or-batch>/
  summary.json
  changed-assertions.ndjson
  source-fixtures-or-references/
  resolution-dossiers/
  interpretive-prose.json
  audit-results/
```

Exact committed/local paths and schemas should be established during the interstitial implementation rather than assumed from this document.

The important contract is that an auditor can review the changed historical claims **without reverse-engineering the entire application**.

### Review summary

A high-level summary should make the maintainer's workload obvious, for example:

```text
842 Class A direct assertions
61 Class B transformations
94 Class C relations
12 Class D resolutions
7 Class E interpretations
0 Class F reconstructions
0 Class G causal claims

Automated/source QA: pass
Sampled low-risk review: 48/50 pass, 2 escalated
High-risk cases requiring adjudication: 4
```

The numbers above are illustrative only.

## Parallel-agent roles

Parallel agents are encouraged for review because they can reduce self-confirmation by the implementation agent.

### Primary implementation agent

May research, propose, implement, and generate review artifacts. It should also run self-audit, but its self-audit is not sufficient independent process review for consequential Class D–G claims.

### Source-fidelity auditor

Purpose: compare published/candidate claims against attached source evidence.

Typical outputs:

- `PASS`
- `MISMATCH`
- `UNVERIFIABLE`
- `SOURCE_LAYER_ERROR`
- `ESCALATE`

This auditor should not rewrite `reviewed_corpus.yml` or silently repair the source record.

### Adversarial historical auditor

Purpose: try to falsify higher-risk claims.

Questions include:

- what evidence contradicts this identity?;
- does chronology make the match impossible or less plausible?;
- is source dependency being mistaken for corroboration?;
- is precision stronger than any source supports?;
- is modern terminology being projected backward?;
- does explanatory prose exceed its citations?;
- is an alternative interpretation at least as plausible?

Typical outputs:

- `ACCEPT_AS_STATED`
- `DOWNGRADE`
- `UNRESOLVED`
- `CONFLICT`
- `NEEDS_MORE_EVIDENCE`
- `ESCALATE`

### Adjudicator

A maintainer, designated reviewing model, or qualified external reviewer evaluates disagreements and escalated cases.

The adjudicator should inspect the claim, evidence, and audit findings—not merely count model votes.

## AI agreement is not corroboration

This is a permanent rule.

If three models agree that a person identity is probable, that means the reasoning received three process reviews. It does not add three historical witnesses.

Auditor identity/model diversity may reduce correlated review errors, but it does not change the claim's evidence state.

## Auditor permissions

Review agents should default to read-only behavior.

They may:

- read source fixtures and reviewed artifacts;
- run deterministic review commands;
- create a local/report artifact in an explicitly approved review output area;
- search approved sources when the review task permits external research.

They should not by default:

- edit reviewed historical data;
- merge entity resolutions;
- alter validators to make a review pass;
- commit/push code or data;
- change source inspection states;
- upgrade evidence states;
- publish corrections autonomously.

See `docs/LOCAL_GEMINI_SCHOLARLY_REVIEW_SETUP.md` for the maintainer's local workflow.

## Review states

Exact implementation vocabulary should be settled in the interstitial protocol session, but any future review state must remain distinct from evidence state.

Candidate vocabulary to evaluate:

- `extracted`
- `structurally_validated`
- `source_qa_passed`
- `ai_audit_passed`
- `maintainer_reviewed`
- `expert_reviewed`
- `contested`
- `withdrawn`

Do not interpret this as a linear truth ladder. A claim can be `expert_reviewed` and still remain `probable_match` or `reconstructed`.

## Quarantine and escalation

A batch or claim should be quarantined from publication when:

- source fidelity cannot be established;
- a source rights/inspection state is unclear;
- deterministic extraction produces unexplained mismatches;
- a supposedly direct assertion actually requires interpretation;
- identity resolution has material unresolved contradictions;
- causal/interpretive prose lacks appropriate support;
- audit agents disagree in a way that exposes a real historical ambiguity.

Quarantine is not failure. It is an expected outcome of serious historical review.

## Maintainer review should be an exception inbox

The desired scaling outcome is that the maintainer sees a concise set of consequential decisions rather than thousands of routine rows.

A mature review summary should answer:

- what changed?;
- what was automatically/source-validated?;
- what was sampled?;
- what failed or conflicted?;
- what needs a human judgment?;
- what would benefit from a qualified external specialist?;
- what can safely remain unresolved?

The maintainer should not need to reconstruct these questions from raw logs.

## External expert review

External review is most useful when narrowly scoped.

Prefer asking an historian/archivist/domain expert to review:

- the methodology for one source family;
- one representative provenance chain;
- one difficult identity dossier;
- one reconstruction method;
- a small group of interpretive claims.

Do not ask an expert to certify the whole project or imply endorsement beyond what they actually reviewed.

## Review output has no authority by itself

A review report is an input to publication decisions.

Audit agents must not treat their own `PASS` as permission to merge, publish, or strengthen a historical claim.
