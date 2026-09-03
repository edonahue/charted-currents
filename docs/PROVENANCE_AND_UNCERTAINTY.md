# Provenance and uncertainty

## Public evidence states

### Documented
Directly supported by a cited source record.

### Probable Match
A project-level identity/relationship inference supported by multiple compatible observations but not directly asserted by the source.

### Reconstructed
Produced by an explicit historical/computational model, such as reconstructed climate or a future route model.

### Contextual
A separately sourced fact overlapping time/place without a claim of direct effect.

## Candidate extraction state

AI/automated extraction state is separate: `proposed`, `validated`, `rejected`.

## Review state is separate from evidence state

Historical review describes what quality-control/adjudication process a claim has undergone. It does not change what kind of evidence supports the claim.

A future claim may be both:

- `evidence_state: probable_match`
- `review_state: expert_reviewed`

That means the probable-match judgment was reviewed. It does not make the identity documented fact.

Permanent rule:

> **Review strength cannot upgrade evidence strength.**

Multiple AI reviewers agreeing is process QA, not independent historical corroboration.

See `docs/HISTORICAL_ASSERTION_POLICY.md` and `docs/HISTORICAL_REVIEW_POLICY.md`.

## Assertion risk is separate again

The A–G historical assertion classes describe the reasoning operation and review burden: direct transcription, deterministic transformation, relational derivation, identity resolution, interpretation, reconstruction, and causal argument.

They do not replace public evidence state or review state.

## Research View

May expose source IDs, source record IDs, permitted snippets, resolution evidence, transformation steps, coverage, rights notes, contradiction references, assertion class, and review state where implemented.

## Coverage

Store source coverage by source, geography, interval, record type, known gaps, and completeness only where defensible. Missing activity during a known source gap is not evidence of no activity.

## Contradictions

Preserve competing source assertions rather than synthesizing one unsupported truth.

Contradictions are review inputs, not cleanup targets. When material to a Class D–G claim, they should remain discoverable in the relevant dossier/review artifact rather than being buried only in prose notes.

## Dates

Support exact, month-only, year-only, ranges, circa, and before/after bounds. Do not manufacture day-level precision.

Review or model confidence does not justify increasing source precision.
