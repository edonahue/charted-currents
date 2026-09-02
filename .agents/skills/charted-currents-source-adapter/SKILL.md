---
name: charted-currents-source-adapter
description: Build or review a Charted Currents historical source adapter with reproducible acquisition, raw-value preservation, candidate staging, provenance, rights, and human promotion boundaries.
---

# Charted Currents source adapter

Use this skill whenever a new historical source family or a new adapter/extraction path is in scope.

## Required flow

`acquisition → pinned raw snapshot → source profile → source-row extraction → candidate fixture → review decision → reviewed_corpus.yml → deterministic public build`

No stage may silently collapse into the next.

## Adapter invariant

Historical facts may not originate in adapter source code.

Adapter code may contain:

- field mappings;
- type/precision rules;
- source-specific schema semantics;
- normalization functions;
- candidate-envelope construction;
- deterministic validation.

Adapter code may NOT contain the packet's vessel/person/place/route fixture as historical dictionaries/constants used as if extracted from the source.

If clean CI cannot access the raw source, commit a small rights-safe derived source-row fixture generated from the pinned source and test the adapter against that fixture. Preserve source-native IDs and raw values.

## Acquisition and profiling

Separate:

1. **acquisition verification** — file/version/URL/size/checksum;
2. **source profiling** — real tables/schema/row counts/date bounds/field semantics;
3. **row extraction** — exact source-native records used by the packet.

Do not call checksum verification a schema profile.

## Provenance layers

Keep distinct:

- scholarly dataset value;
- dataset metadata;
- archival catalogue metadata;
- digitized archival content actually inspected;
- upstream archival citation only;
- project normalization/interpretation.

A scholarly database row and the archival record it cites form a source chain. They are not independent corroboration unless a genuinely separate historical record is present.

## Raw values and normalization

Preserve raw spelling/value exactly. Normalized search keys, canonical labels, language/endonym relationships, and project disambiguators are separate fields.

Normalization must be a tested function, not a hand-entered value that merely resembles normalization.

## Source-neutral modeling

Do not force a new source into irrelevant fields inherited from an older source family.

Examples:

- a voyage register need not have capture fields;
- a master is not an owner-residence value;
- “not captured” is not a historical fact unless the source actually establishes that claim;
- source date, event date, capture date, and publication date are distinct temporal roles.

Generalize the occurrence/public model when necessary while preserving compatibility for existing sources.

## Candidate and promotion boundary

Candidates remain non-public until reviewed.

Candidate records should preserve at least:

- adapter/source ID;
- native source record ID;
- raw source values;
- temporal value + precision/calendar/basis;
- candidate vessel/person/place/relationships;
- source citation/reference;
- inspection state;
- rights state;
- transformation notes;
- proposed canonical links;
- reconciliation status.

The adapter must not write directly into public artifacts.

## Entity resolution

Similarity may rank candidates; it may not establish identity.

Preserve agreements and conflicts. Use explicit reviewed states such as unreviewed/rejected/possible/probable/accepted according to project vocabulary.

Same name alone is never enough.

## Tests

Use independent or source-derived oracles.

Required classes where applicable:

- acquisition checksum/version;
- actual source profile;
- exact extracted source rows;
- transform tests against committed derived fixture;
- raw-value preservation;
- referential provenance;
- negative tests for invalid source IDs/layers;
- deterministic candidate generation;
- no direct publication bypass.

Do not treat a test of a Python constant as proof that the external source contains that value.

## Handoff

At closeout report separately:

- source snapshot observed;
- source rows observed;
- transformation behavior tested;
- review decisions made;
- public claims generated;
- anything not independently re-verified.
