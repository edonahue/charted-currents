# Historical review report template

Use this template to summarize deterministic checks, sampling, parallel audits, and adjudication needs for a changed historical bundle.

The report is an input to publication decisions. It is not independent historical evidence.

## Review identity

- **Packet / batch:**
- **Trusted base ref:**
- **Candidate/head ref:**
- **Corpus/version:**
- **Review bundle ID/path:**
- **Generated at:**

## Historical delta summary

| Assertion class | Changed/new claims | Deterministic checks | Sampled/audited | Escalated |
| --- | ---: | --- | ---: | ---: |
| A — direct/transcribed | | | | |
| B — deterministic transform | | | | |
| C — relational/derived | | | | |
| D — identity/resolution | | | | |
| E — interpretation | | | | |
| F — reconstruction | | | | |
| G — causal/synthetic | | | | |

## Source and provenance changes

- new source families:
- new SourceRecords:
- changed inspection states:
- changed source-rights/public-use posture:
- source-chain/corroboration concerns:
- unverifiable source references:

Any change to inspection state or rights posture should receive explicit attention.

## Deterministic/source QA

| Check | Result | Scope | Notes |
| --- | --- | --- | --- |
| referential integrity | | | |
| raw/source value preservation | | | |
| transformations | | | |
| joins/aggregations | | | |
| provenance trace | | | |
| false precision checks | | | |

## Sampling

- **Eligible population:**
- **Classes/source subset:**
- **Selection method:**
- **Random seed (if used):**
- **Sample size:**

| Outcome | Count |
| --- | ---: |
| PASS | |
| MISMATCH | |
| UNVERIFIABLE | |
| SOURCE_LAYER_ERROR | |
| DERIVATION_ERROR | |
| ESCALATE | |

### Sampling verdict

- routine batch accepted for current review level:
- expanded review required:
- systematic defect suspected:
- affected subset:

A known systematic problem must be fixed and regenerated; do not average it away.

## Class D resolution review

| Dossier / entity | Proposed state | Audit result | Contradiction present | Adjudication needed |
| --- | --- | --- | --- | --- |
| | | | | |

## Interpretive / causal prose review

| Claim/copy location | Class | Supporting scholarship/evidence | Finding | Action |
| --- | --- | --- | --- | --- |
| | | | | |

If no support justifies the interpretation, omission is a valid action.

## Parallel auditor reports

| Auditor/run | Scope | Model/tool | Findings count | Escalations |
| --- | --- | --- | ---: | ---: |
| | | | | |

Model/tool identity is workflow metadata only. Multiple agreeing auditors do not create historical corroboration.

## Contradictions and anomalies

List consequential anomalies even if publication remains possible.

1.
2.
3.

## Maintainer / adjudicator exception queue

Keep this section short. It should contain only decisions that genuinely require judgment.

### Case 1

- **Claim/entity:**
- **Why escalated:**
- **Evidence supporting:**
- **Evidence against:**
- **Recommended options:** accept | downgrade | unresolved | remove | seek more evidence | external expert review

### Case 2

- **Claim/entity:**
- **Why escalated:**
- **Evidence supporting:**
- **Evidence against:**
- **Recommended options:**

## External specialist review candidates

List only claims/methods where qualified historical/domain review would materially improve credibility.

| Claim/method | Specialist expertise | Exact review ask | Blocking publication? |
| --- | --- | --- | --- |
| | | | |

Do not ask a specialist to certify the whole project.

## Publication recommendation

Choose one:

- `READY_FOR_HISTORICAL_PUBLICATION`
- `READY_WITH_DOCUMENTED_UNCERTAINTIES`
- `CORRECTIONS_REQUIRED`
- `PARTIAL_QUARANTINE`
- `HISTORICAL_REVIEW_BLOCKED`

### Rationale


## Claims intentionally left unresolved

Unresolved is an acceptable scholarly outcome.

- 

## Corrections required before publication

- 

## Review limitations

State what the review did **not** establish.

Examples:

- archival manuscripts not directly inspected;
- sampling rather than exhaustive transcription review;
- no qualified specialist review;
- source family coverage incomplete;
- secondary literature search bounded.
