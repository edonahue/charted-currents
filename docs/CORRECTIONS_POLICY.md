# Corrections and historical challenges policy

Charted Currents should expect substantive historical corrections as source coverage, expertise, and public scrutiny improve.

The existence of a correction is not a credibility failure. Hiding, minimizing, or silently rewriting a material error is.

## Core rule

**Substantive historical corrections should leave an auditable trail.**

A reader should be able to determine:

- what the project previously claimed;
- what changed;
- why it changed;
- what evidence prompted the change;
- which corpus/release first contains the correction;
- whether the prior claim was wrong, overstated, unresolved, or superseded by better evidence.

## What counts as a substantive historical correction

Examples include:

- correcting a source transcription;
- changing a date, place, person, vessel, role, cargo, or other historical value;
- changing source inspection state because prior wording overstated what was inspected;
- changing provenance from direct evidence to upstream-cited-only or vice versa;
- splitting or merging canonical identities;
- downgrading `documented`/`probable_match`/other evidence state;
- withdrawing unsupported interpretive prose;
- correcting attribution, citation, rights, or source-chain claims;
- changing a reconstructed result because method/input evidence changed materially.

Minor spelling, layout, code, or non-historical copy fixes need not create a historical correction record unless they change meaning.

## Never silently rewrite a contested conclusion

When a material challenge is received:

1. preserve the current claim/version long enough to identify what was challenged;
2. record the challenge and supporting citation/evidence;
3. inspect the relevant source chain;
4. determine whether the issue is a transcription, provenance, resolution, interpretation, source-quality, or other problem;
5. correct, downgrade, contest, withdraw, or reject the challenge with documented rationale;
6. add a regression invariant/test when the failure class is machine-checkable.

Do not edit historical data merely to make the challenge disappear.

## Suggested future claim states

The scholarly-review interstitial implementation should align exact vocabulary with existing project schemas, but the system should be capable of representing outcomes equivalent to:

- `published`
- `contested`
- `corrected`
- `withdrawn`

These are publication/correction states, not evidence states.

A claim may be both `probable_match` and `contested`.

## Challenges from external reviewers

The project should eventually provide a low-friction way to challenge a specific assertion/entity/resolution.

A useful challenge should capture:

- stable assertion/entity/resolution ID;
- corpus/version or URL;
- concern category;
- explanation;
- supporting source/citation where available;
- optional suggested correction.

Useful concern categories include:

- source transcription;
- citation/provenance;
- inspection-state overstatement;
- identity/entity resolution;
- chronology/calendar;
- geography;
- terminology/translation;
- historical interpretation;
- missing contradictory evidence;
- rights/attribution;
- other.

A future GitHub issue template or lightweight form may implement this. The policy does not require that UI immediately.

## Expert review and attribution

If an external historian, archivist, librarian, or other specialist materially resolves a challenge or improves a methodology, acknowledge the assistance with the scope actually provided.

Do not imply endorsement of the whole project because someone reviewed one record, source family, or method.

Record expert review only when the person knowingly provided that review. Do not infer expert status from a citation or casual public comment.

## Correction records

A future machine-readable correction entry should be able to contain:

```text
correction_id
changed_object_ids
previous_state_or_release
new_state_or_release
reason
supporting_source_or_issue_refs
review/adjudication note
first_corrected_version
```

Do not duplicate entire historical records inside the correction log if versioned data/repository history already preserves them. Prefer stable references.

## Versioning

As the public corpus matures, meaningful releases should be identifiable so historical corrections can point to a before/after state.

The project does not need heavyweight formal release management immediately. At minimum:

- deterministic public artifacts;
- corpus version metadata;
- repository history;
- clear correction notes for substantive changes.

Later analytical/public data releases may warrant immutable snapshots and formal release notes.

## Downgrades are valid corrections

New evidence does not always produce a cleaner answer.

A correction may change:

- `probable_match` → `unresolved`;
- one canonical vessel → two occurrences with unresolved physical identity;
- an exact date → year-only;
- explanatory prose → no interpretation;
- a source claim → `unverifiable` pending access.

Do not preserve false precision or certainty merely because it makes the product feel more complete.

## Rejected challenges

Not every challenge is correct.

When rejecting a substantive challenge:

- inspect the cited evidence;
- explain why the existing claim remains supported;
- distinguish disagreement in interpretation from factual/source-fidelity error;
- preserve the discussion when it would help future reviewers understand the decision.

Do not use model consensus as the reason for rejecting a source-based challenge.

## Sensitive historical subjects

Corrections involving slavery, forced migration, Indigenous peoples, violence, legal status, contested identity, or dehumanizing historical terminology deserve particular care.

Follow `docs/CONTENT_AND_HISTORICAL_ETHICS.md` and prefer corrections that improve both source fidelity and respectful contextualization without rewriting the historical record.

## Regression learning

Every substantive error should prompt one question:

> Can this failure class become an epistemic invariant, validator rule, extraction test, review-bundle check, or agent instruction?

When practical, encode the lesson so future reviewers can spend their time on the next genuinely difficult historical problem rather than rediscovering the same mechanical mistake.
