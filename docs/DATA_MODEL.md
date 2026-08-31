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

Secondary enrichment entities may include: ship loss event, wreck/archaeological site, archaeological investigation, museum/repository object, and holding institution. These are useful when they extend a vessel already present in the main historical graph; they are not required to build the initial corpus.

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

## Secondary material-afterlife model

See `docs/SHIPWRECKS_AND_MUSEUMS.md` for source research and policy.

A historical ship loss, a physical wreck site, and a recovered museum object are separate entities/evidence layers. Do not collapse them into one ship record.

### Ship loss event

A sourced historical event can exist without a discovered wreck.

```text
ship_loss_event
  loss_event_id
  ship_id
  event_date_or_range
  loss_kind
  reported_place_id
  reported_geometry
  circumstances
  source_assertions[]
```

### Wreck / archaeological site

A physical site does not automatically identify a canonical ship.

```text
wreck_site
  wreck_site_id
  site_name
  site_authority_ids[]
  discovery_date
  site_period
  observed_geometry_private_or_source
  publication_geometry
  publication_precision
  location_policy
  site_status
  managing_authority
  source_assertions[]
```

`publication_precision`: `exact_public`, `generalized_public`, `named_area_only`, `withheld_sensitive`.

Exact/private research geometry and public geometry must be separable. The existence of source coordinates is not publication permission.

### Ship-to-wreck resolution

```text
ship_wreck_resolution
  wreck_site_id
  ship_id
  resolution_state
  evidence[]
  resolver
  reviewed_at
```

Use `documented_identity`, `probable_match`, `unresolved`, or `rejected_match`. Evidence can include inscriptions, site chronology, archival loss location, artifact assemblage, armament, hull construction, scientific dating, and archaeological reports. Name/proximity alone is insufficient.

### Archaeological investigations

Surveys, excavations, recovery campaigns, and conservation work are sourced events.

```text
archaeological_investigation
  investigation_id
  wreck_site_id
  investigation_kind
  date_range
  institution_or_team
  report_source_ids[]
```

### Museum / repository objects

Recovered material culture gets accession-level provenance and rights.

```text
museum_object
  object_id
  holding_institution_id
  accession_or_catalog_id
  title_or_object_name
  object_type
  material
  object_url
  image_url
  image_rights
  source_record_id

object_relation
  object_id
  relation_kind
  target_id
  evidence_state
  source_assertions[]
```

Suggested relation kinds: `recovered_from_wreck_site`, `associated_with_ship`, `depicts_ship`, `commemorates_ship`, `document_from_or_about_ship`.

Only `recovered_from_wreck_site` implies archaeological provenience. A museum holding an object does not necessarily mean the museum owns it; custody, repository status, loan, and ownership should remain distinct sourced assertions.
