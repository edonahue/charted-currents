# AI and extraction policy

AI is a development/research/review tool, not the public thesis and not a historical authority.

## Allowed

AI may help:

- write code/tests/docs;
- propose source adapters;
- extract candidate fields from legitimately accessed primary or scholarly sources;
- propose aliases/entity matches;
- classify candidate relationships;
- suggest anomalies;
- assist translation/transcription review;
- summarize source material for internal research;
- classify historical assertions by review risk;
- compare published claims to source fixtures;
- search available corpora for contradictory evidence;
- audit entity-resolution dossiers;
- review historical prose for source inflation, false precision, anachronism, unsupported interpretation, or causal overstatement;
- summarize review findings for maintainer/adjudicator attention.

## Publication rule

**No model-generated historical fact is authoritative by itself.** Every public assertion needs source provenance, a documented reconstruction/derivation method, or appropriate contextual/secondary support.

Model agreement is not historical corroboration.

A second or third model reviewing the same evidence may improve process QA, but it does not create additional historical witnesses or strengthen the underlying evidence state.

## Workflow

```text
source item
  -> candidate extraction
  -> proposed record/assertion
  -> structural/source validation
  -> risk-appropriate review
  -> validated/rejected/unresolved/contested decision
  -> reviewed publication where warranted
```

For scalable review, follow:

- `docs/SCHOLARLY_INTEGRITY.md`
- `docs/HISTORICAL_ASSERTION_POLICY.md`
- `docs/HISTORICAL_REVIEW_POLICY.md`

## Entity resolution

AI may aggressively propose candidate identities and may perform adversarial review, but merges/resolutions must be reversible; weak matches remain unresolved; name similarity alone is insufficient.

For non-trivial cases follow `docs/ENTITY_RESOLUTION_POLICY.md`.

A source-provided authority/entity ID is evidence about that source's editorial model. It is not automatically historical proof when raw records conflict.

## Interpretive prose

AI may draft historical prose, but plausible language is not evidence.

If source assertions only support description, do not generate broader historical significance merely to make the product more interesting.

Class E/G interpretive or causal prose should follow `docs/SECONDARY_SCHOLARSHIP_POLICY.md`.

## Audit-agent authority

Unless explicitly tasked with implementing an adjudicated correction, an AI historical auditor should report findings rather than mutate reviewed historical data.

Auditors should not autonomously:

- merge canonical entities;
- upgrade evidence states;
- change inspection states;
- rewrite raw/source values;
- weaken validators;
- commit/push historical corrections;
- treat their own `PASS` as publication permission.

## Prohibited

AI must not:

- invent dates, cargo, identities, quotations, observed weather, or observed route geometry;
- fill missing historical fields with plausible defaults;
- hide contradictions;
- manufacture source-native titles/values not present in the source;
- describe catalogue metadata as inspected manuscript content;
- treat upstream citations as independent corroboration;
- fabricate secondary citations or page references;
- scrape sources whose terms/rights prohibit automated collection;
- silently convert review consensus into stronger historical certainty.

## Corrections

AI may identify and propose corrections. Substantive published historical corrections should follow `docs/CORRECTIONS_POLICY.md` and leave an auditable trail.
