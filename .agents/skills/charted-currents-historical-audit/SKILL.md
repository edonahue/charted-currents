---
name: charted-currents-historical-audit
description: Adversarially review Charted Currents historical assertions, provenance, entity resolutions, and interpretive prose without silently repairing evidence or treating AI agreement as corroboration.
---

# Charted Currents historical audit

Use this skill when reviewing historical data, source fidelity, entity resolution, attribution, provenance, or interpretive prose.

This is primarily a **review skill**, not an implementation skill.

Read first:

- `docs/SCHOLARLY_INTEGRITY.md`
- `docs/HISTORICAL_ASSERTION_POLICY.md`
- `docs/HISTORICAL_REVIEW_POLICY.md`
- `docs/ENTITY_RESOLUTION_POLICY.md` when identity resolution is involved
- `docs/SECONDARY_SCHOLARSHIP_POLICY.md` when interpretive prose is involved
- relevant source/provenance docs routed by `docs/AGENT_CONTEXT_INDEX.md`

## Audit stance

Assume a consequential historical claim may be wrong until its evidence path survives review.

Do not optimize for making the packet pass.

Try to identify:

- raw/source transcription mismatches;
- source-layer inflation;
- catalogue metadata described as manuscript evidence;
- upstream citations treated as independently inspected sources;
- project-derived values described as source-native;
- transformations that add unearned historical meaning;
- false date/geographic precision;
- unresolved contradictions;
- identity merges supported mainly by names;
- source-provided authority IDs that conflict with raw records;
- anachronistic terminology or political geography;
- interpretive prose stronger than its citations;
- causal language supported only by temporal correlation;
- omissions of material counter-evidence;
- apparent corroboration that actually shares one upstream source chain.

## Assertion classes

Use the canonical risk classes in `docs/HISTORICAL_ASSERTION_POLICY.md`:

- A direct/transcribed
- B deterministic transformation
- C relational/derived
- D identity/resolution
- E historical interpretation
- F reconstructed
- G causal/synthetic argument

Do not apply one review burden to every class.

Spend attention where reasoning can change historical meaning.

## Source-fidelity review

For Class A–C claims:

1. identify the exact SourceRecord;
2. confirm inspection state;
3. compare the claim to raw/source-derived evidence;
4. identify each transformation or join;
5. determine whether the output preserves source semantics;
6. flag unverifiable claims rather than guessing.

Useful outcomes:

- `PASS`
- `MISMATCH`
- `UNVERIFIABLE`
- `SOURCE_LAYER_ERROR`
- `DERIVATION_ERROR`
- `ESCALATE`

A `PASS` means the project handled the available evidence correctly. It does not certify the historical source itself as true or complete.

## Entity-resolution review

For Class D claims, build or inspect a dossier containing:

- occurrences compared;
- source records;
- raw names/readings;
- positive discriminators;
- negative/contradictory evidence;
- discounted evidence and rationale;
- missing discriminators;
- chronology/geographic compatibility;
- source dependencies;
- proposed evidence/resolution state.

Try to disprove the match.

Useful outcomes:

- `ACCEPT_AS_STATED`
- `DOWNGRADE`
- `UNRESOLVED`
- `CONFLICT`
- `NEEDS_MORE_EVIDENCE`
- `ESCALATE`

Name equality is not sufficient evidence.

Do not treat multiple model votes as additional historical witnesses.

## Interpretive-prose review

For Class E/G prose:

- separate source description from interpretation;
- locate the cited secondary support;
- verify that the cited work supports the precise statement;
- identify causal inflation;
- identify missing important alternatives;
- identify anachronistic or overly broad language;
- prefer omission to unsupported narrative filler.

If only primary/structured data supports a descriptive statement, do not invent broader historical significance.

## Reconstruction review

For Class F claims:

- inspect model/method documentation;
- trace input evidence;
- check uncertainty and precision;
- ensure reconstructed output is visibly distinguished from documented observations;
- do not upgrade reconstruction to documented because the model appears plausible.

## Contradictions are not cleanup targets

When sources disagree:

- preserve the disagreement;
- identify whether the conflict is source-native, editorial, parsing, normalization, or project inference;
- recommend downgrade/unresolved states when appropriate;
- do not synthesize an unsupported single truth to make the graph cleaner.

## Review strength cannot upgrade evidence strength

Permanent rule:

- model agreement is process QA, not corroboration;
- expert review can validate the handling of a probable claim without making it documented;
- deterministic tests validate transformation behavior, not source authority.

Keep `evidence_state` and `review_state` conceptually separate.

## Auditor authority

Unless explicitly tasked with corrections after adjudication, do not:

- edit `reviewed_corpus.yml`;
- merge entities;
- change inspection states;
- upgrade evidence states;
- weaken validators/tests;
- commit or push historical changes;
- silently rewrite source values.

Return findings for adjudication.

## Audit output

When no canonical review-bundle schema is yet available, report findings in a compact table or structured text containing:

- claim/assertion/resolution ID;
- risk class;
- result;
- supporting source record(s);
- contradictory evidence;
- exact concern;
- recommended action;
- escalation reason if any.

When canonical review-bundle tooling exists, use its schema rather than inventing a parallel format.

## Handoff priority

Surface the smallest set of consequential issues first:

1. source-fidelity errors;
2. provenance/inspection inflation;
3. wrong entity resolution;
4. false precision;
5. unsupported interpretation/causality;
6. lower-impact documentation/style concerns.

The purpose of the audit is to make human/adjudicator attention efficient, not to produce the longest possible critique.
