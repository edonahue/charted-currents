# Data model

## Rule: assertions before canonical entities

Historical sources are fragmentary. A source mentioning a vessel named *Providence* is not proof that every *Providence* record describes the same physical ship.

## Core layers

- **Source** — dataset, archive, book, transcription, item, scan, API.
- **Source record** — smallest source unit supporting assertions.
- **Assertion** — structured source-backed claim.
- **Occurrence** — a source-bounded appearance of an entity.
- **Canonical entity** — project-level entity created by resolving occurrences.

Core entities: ship, person, port/place, voyage, voyage leg, commodity, commercial event, forced-migration event, capture, commission/legal status, prize case, contextual event, environmental event, primary document/map.

## Ship identity

```text
ship_occurrence
  occurrence_id
  source_record_id
  raw_name
  raw_master
  raw_owner
  raw_tonnage
  raw_rig
  raw_origin
  raw_destination
  event_date

ship
  ship_id
  canonical_display_name

entity_resolution_edge
  occurrence_id
  ship_id
  resolution_state
  evidence[]
  resolver
  reviewed_at
```

Resolution states: `documented_identity`, `probable_match`, `unresolved`, `rejected_match`. Name similarity alone is never sufficient proof.

## Voyage geometry

`geometry_kind`: `endpoints_only`, `schematic`, `observed_track`, `reconstructed_route`.

## Cargo

Preserve source wording separately from normalized commodity categories and quantities.

## Forced migration

Do not represent enslaved people as generic cargo. Use a dedicated event model for vessel/voyage, embarkation/disembarkation, people counts, mortality where supported, source, and imputation status.

## Context

Contextual events have independent provenance. Spatiotemporal proximity does not imply causality.

## Primary source assets

Store item ID, title, creator, date, type, holding institution, item URL, image URL if used, rights status, and attribution.
