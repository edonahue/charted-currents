# Scholarly integrity

Charted Currents is a public historical research and exploration project. It is not a substitute for archival scholarship, and it does not claim peer review or expert certification unless that status is explicitly recorded for a specific output.

The project's credibility should come from **auditability, source fidelity, explicit uncertainty, reproducible transformations, and visible correction**, not from asking readers to trust an AI system or the maintainer's authority.

## North star: auditability before authority

A serious reader should be able to determine, for any consequential historical claim:

1. what the project is claiming;
2. what source record or records support it;
3. what the source actually says;
4. whether the project transformed, joined, normalized, resolved, inferred, or reconstructed anything;
5. what contrary or ambiguous evidence is known;
6. what was actually inspected;
7. what review has occurred;
8. what remains uncertain;
9. how to challenge or correct the claim.

A claim may still be uncertain after excellent review. Review quality does not convert weak evidence into strong evidence.

> **Review strength cannot upgrade evidence strength.**

An expert-reviewed `probable_match` remains a probable match. Multiple AI reviewers agreeing with an inference do not create independent historical corroboration.

## Integrity of the historical record

Charted Currents must preserve source evidence and disagreement rather than silently manufacturing a cleaner past.

- Do not fabricate or silently repair source facts.
- Do not suppress contrary evidence because it complicates a preferred interpretation.
- Do not convert archival silence into confident absence.
- Do not replace raw historical language with normalized language without preserving the raw reading and transformation.
- Do not claim direct manuscript inspection when only catalogue metadata or a scholarly derivative was inspected.
- Do not treat an upstream archival citation as an independently inspected source.
- Do not borrow a primary-source citation from secondary scholarship and present it as independently examined.

Contradictions are evidence. They may reveal source error, editorial normalization, multiple historical actors, changing terminology, cataloguing practice, or unresolved historical ambiguity. Preserve them long enough to understand what they mean.

## Source assertions, project assertions, and interpretation

Keep at least these categories conceptually separate:

### Source assertion

A bounded claim about what a source record states or depicts.

Example: a Crespo dataset row records `Bartolomé Antonio Garrote` in the master field.

### Project-derived assertion

A deterministic or reviewed result produced from source assertions.

Examples: a foreign-key join from a vessel row to a fleet row; a normalized search key; an explicitly counted set of database members.

### Project resolution

A project judgment that multiple occurrences probably, possibly, or definitively represent the same historical entity.

Example: four compatible master-name occurrences are treated as a `probable_match` person identity.

### Historical interpretation

An explanatory statement that goes beyond the literal record or deterministic derivation.

Example: a claim about the institutional importance of a convoy system or the significance of a person's career.

Interpretive prose should normally be supported by appropriate secondary scholarship or receive heightened review. If the evidence does not support the interesting sentence, omit the sentence.

## Evidence state is not review state

Charted Currents already distinguishes public evidence states such as `documented`, `probable_match`, `reconstructed`, and `contextual`.

Review status is a different dimension. A future record may be both:

- `evidence_state: probable_match`
- `review_state: expert_reviewed`

That means a qualified reviewer examined the project's probable-match judgment. It does **not** mean the identity became documented fact.

See `docs/HISTORICAL_ASSERTION_POLICY.md` and `docs/HISTORICAL_REVIEW_POLICY.md`.

## Scale through risk, not uniform manual review

The project is expected to grow beyond what one maintainer can inspect record-by-record. That is acceptable if review effort is concentrated where judgment matters.

Low-risk direct transcriptions and deterministic transformations may be validated through source-aware automation plus sampling. Identity resolution, interpretive prose, reconstruction, and causal claims require progressively stronger review.

The goal is not to eliminate human judgment. It is to reserve scarce human and expert attention for the claims where judgment can materially change historical meaning.

## AI's role

AI systems may:

- extract candidate facts from legitimately accessed sources;
- compare records;
- propose entity resolutions;
- search for contradictory evidence within available corpora;
- classify assertion risk;
- audit source fidelity;
- review prose for overstatement;
- summarize review bundles;
- identify cases that deserve escalation.

AI systems do not become historical authorities by performing these tasks.

Independent model review is **process QA**, not independent historical evidence.

## Corrections are part of credibility

Charted Currents should expect to be wrong sometimes, especially as source coverage expands.

Substantive corrections should be visible, attributable, and versioned rather than silently rewritten. A contested conclusion may be downgraded or withdrawn without treating the correction as project failure.

See `docs/CORRECTIONS_POLICY.md`.

## External scholarly review

The project should make it easy for historians, archivists, librarians, digital-humanities researchers, and other knowledgeable readers to challenge specific claims without first learning the internal data model.

Longer-term public surfaces should support:

- clear methodology;
- source and coverage documentation;
- uncertainty and resolution definitions;
- stable assertion/entity identifiers;
- a corrections history;
- a simple way to report a transcription, attribution, identity, citation, chronology, geography, or interpretation concern.

External reviewers should be invited to critique representative evidence chains and methodology. They should not be asked to certify the entire project.

## Standards and practices that inform this policy

Charted Currents does not claim formal compliance with these frameworks, but they provide useful models:

- American Historical Association, *Statement on Standards of Professional Conduct*: integrity of the historical record, clear evidentiary trails, accurate source use, reporting contrary evidence, and acknowledging uncertainty. <https://www.historians.org/resource/statement-on-standards-of-professional-conduct/>
- W3C PROV: provenance as a description of entities, activities, agents, and derivation processes. <https://www.w3.org/TR/prov-primer/>
- TEI Critical Apparatus: preserving variant readings and the witnesses supporting them rather than collapsing disagreement into one unqualified reading. <https://tei-c.org/release/doc/tei-p5-doc/en/html/TC.html>
- GO FAIR R1.2: detailed provenance for how data was generated, processed, transformed, and reused. <https://www.go-fair.org/fair-principles/r1-2-metadata-associated-detailed-provenance/>
- Journal of Open Humanities Data editorial/review practices: accurate data description, open/reproducible documentation, and independent review as useful quality benchmarks for future maturity. <https://openhumanitiesdata.metajnl.com/about/editorialpolicies>

These references are inspirations for project method, not badges of endorsement.
