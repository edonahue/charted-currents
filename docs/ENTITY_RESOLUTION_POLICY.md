# Entity resolution policy

Entity resolution is one of the highest-risk historical operations in Charted Currents because it can create relationships that no source directly asserts.

The project therefore treats identity as a reviewed claim, not a convenience for cleaning names.

This policy applies to people, vessels, places, organizations, events, and other canonical entities.

## Core rule

**Occurrences precede canonical entities.**

When a source says that a named person, vessel, or place appears in a particular record, preserve that occurrence before deciding whether it is the same physical/historical entity as another occurrence.

The preferred evidence path remains:

`Source → Source Record → Assertion → Occurrence → Resolution Edge → Canonical Entity`

Do not skip the occurrence layer merely because a normalized database or authority file already supplies an identity key.

## Name equality is candidate generation, not proof

Same or similar names may justify a comparison. They do not establish identity.

Resolution should consider discriminators appropriate to the entity type.

### Person discriminators

Potential positive/negative evidence includes:

- full/raw name forms;
- titles/ranks/offices;
- age;
- residence;
- birthplace/origin;
- nationality/subjecthood where source semantics are understood;
- employer/ship/organization;
- signatures;
- kinship/associates;
- chronology;
- geographic compatibility;
- archival/native identifiers;
- source editorial linking;
- conflicting given names or roles.

### Vessel discriminators

Potential evidence includes:

- raw vessel names/aliases;
- master/captain;
- tonnage/burden;
- construction place;
- reported age;
- flag/registry/legal status where source semantics are understood;
- route chronology;
- simultaneous/incompatible appearances;
- owners;
- archival identifiers;
- source editorial linking.

### Place discriminators

Potential evidence includes:

- historical spelling/endonym;
- jurisdiction/region;
- coordinates or geometry with known provenance;
- record context;
- contemporary map evidence;
- authority identifiers;
- historical boundary/date compatibility.

The absence of a discriminator is not evidence that two occurrences match.

## Resolution dossier

Non-trivial or consequential Class D resolutions should have a structured review dossier.

A dossier should be able to answer:

```text
Candidate entity
Occurrences compared
Source records
Raw names/readings
Positive evidence
Contradictory evidence
Discounted evidence and why
Missing discriminators
Chronology/geographic compatibility
Source dependencies
Proposed resolution state
Alternative resolution
Reviewer/audit findings
Final reviewed decision
```

The exact machine-readable schema should be established by the scholarly-review interstitial implementation. Preserve the conceptual content even if some elements remain references to existing assertions rather than duplicated fields.

## Contradiction engine

As scale increases, resolution candidates should be checked automatically for obvious contradictions before publication.

For people, useful checks may include:

- incompatible given names;
- impossible or implausible overlapping journeys;
- incompatible ages;
- conflicting signatures;
- mutually exclusive offices/residences;
- source identity keys that conflict with raw names.

For vessels:

- incompatible simultaneous routes;
- conflicting masters;
- materially conflicting tonnage/build place/age;
- different archival records suggesting separate physical objects.

These checks prioritize review. They do not mechanically determine identity unless the relevant historical rule is genuinely deterministic.

## Source-provided identity keys

A scholarly database, catalogue, authority file, or source may already link records to one normalized entity.

Treat that linkage as evidence about the source's editorial model, not automatic proof of historical identity.

Record:

- the native identity key;
- what table/authority defines it;
- whether the linked raw records are internally compatible;
- whether the source explains its resolution method;
- whether contradictory raw evidence exists.

If a source-level identity key conflicts with the source's own raw readings, preserve the conflict and discount the key as appropriate.

Do not silently repair the source's normalization.

## Resolution states

Use the project's canonical vocabulary. At minimum, preserve distinctions equivalent to:

### Documented/directly identified

Use only when the relevant source or authoritative evidence actually establishes the identity strongly enough for the project's documented state.

Do not use merely because an agent is confident.

### Probable match

Multiple compatible observations support one identity, but the source does not directly establish it or meaningful uncertainty remains.

### Unresolved / possible

Evidence is compatible but insufficient to publish one canonical identity confidently.

### Rejected / distinct occurrences

Evidence supports keeping occurrences separate, or a proposed match has been rejected.

The interstitial implementation should align exact review/resolution enums across schema, validator, UI, and review artifacts rather than creating parallel vocabulary.

## Each occurrence resolves independently

Prefer one resolution edge per occurrence → canonical entity when that is the existing domain contract.

Do not create an opaque multi-occurrence merge object merely for convenience if the current graph can express four occurrence-level decisions.

Occurrence-level edges make it possible to preserve different confidence/evidence for each link.

## Positive and negative evidence

A resolution rationale should never contain only supporting evidence when important counter-evidence is known.

For every consequential proposed match, ask:

- What supports identity?
- What argues against it?
- What evidence is being discounted?
- Why is it discounted?
- What information would most change the result?

If the answer to the second question is "nothing was checked," the review is incomplete.

## Source dependency

Do not count the same underlying archival chain multiple times.

Example:

`scholarly database row → AGI signatura → PARES catalogue representation`

may provide useful source-chain validation, but it does not automatically constitute three independent witnesses to identity.

A resolution dossier should identify when several pieces of evidence derive from one upstream historical record.

## AI-assisted resolution

AI may:

- generate candidate pairs/clusters;
- extract discriminators;
- rank likely matches;
- search the available corpus for contradictions;
- draft a dossier;
- perform adversarial review;
- propose a resolution state.

AI may not:

- silently merge occurrences into reviewed publication;
- strengthen a resolution because multiple models agree;
- suppress contradictory evidence;
- create missing biographical facts to make records align.

## Scaling policy

At scale:

- obvious non-matches should be filtered cheaply;
- exact deterministic authority mappings may be handled automatically only when the authority semantics are understood and appropriate;
- low-confidence and contradictory cases enter a review queue;
- high-impact network hubs deserve more scrutiny than isolated low-impact candidates;
- random sampling should still audit apparently easy automatic resolutions for systemic errors.

## Public presentation

The user interface should not make a `probable_match` person or vessel look identical in epistemic status to a directly documented entity.

Where useful, expose:

- resolution state;
- occurrence count;
- key supporting records;
- known conflict/uncertainty;
- a route to evidence/review details.

Do not overwhelm ordinary exploration with internal methodology, but make the evidentiary trail discoverable.

## Example: conflicting upstream agent key

If a scholarly database uses one agent ID for records containing conflicting given names, Charted Currents should:

1. preserve the database's agent ID as an upstream editorial link;
2. preserve every raw name occurrence;
3. record the inconsistency;
4. avoid using the upstream ID as definitive identity proof;
5. evaluate compatible occurrences independently;
6. publish a probable/unresolved project resolution only if the remaining evidence warrants it.

This kind of contradiction is precisely why occurrence-level evidence must survive normalization.
