# Shipwrecks, archaeological sites, and museum collections

**Status:** secondary enrichment lane; promising, but not a Phase 1 dependency or MVP blocker.

## Why this belongs in Charted Currents

A vessel can leave several different kinds of historical trace:

1. documentary records while it was operating;
2. a documented loss event;
3. a physical wreck site discovered later;
4. archaeological investigations of that site;
5. recovered objects conserved or displayed by museums and repositories.

Connecting those layers fits the core Charted Currents thesis unusually well: records held by different institutions can describe the same historical world from different evidentiary angles. A ship inspector should eventually be able to continue past its last archival voyage into a carefully sourced **material afterlife** where evidence exists.

This is not a reason to turn the product into a shipwreck directory, treasure-hunting guide, or museum catalog. The value is the connection between a vessel already present in the historical graph and its later archaeological/material evidence.

## Feasibility: strong proof cases already exist

### Henrietta Marie — wrecked 1700

This is almost a model case for the feature and falls directly inside the project period.

The Mel Fisher Maritime Museum documents the English merchant-slaver *Henrietta Marie* sinking at New Ground Reef west of Key West in 1700 after a voyage tied to Jamaica. The wreck was found in 1972 and later identified through archaeological work, including the ship's inscribed bell and corroborating English/Jamaican records. The Mel Fisher Maritime Heritage Society received the recovered collection and continues research and exhibition work around it.

Why it matters for Charted Currents:

- core-period vessel;
- direct Greater Caribbean/Jamaica relevance;
- documentary voyage history can connect to a named archaeological site;
- the wreck produced substantial material evidence;
- recovered objects have a known institutional home;
- the ship's role in forced migration means the existing human-centered forced-migration model can connect to physical evidence without treating people as cargo.

Official starting points:

- https://www.melfisher.org/henrietta-marie-1700
- https://www.melfisher.org/copy-of-henrietta-marie-1700
- https://www.melfisher.org/research

### La Concorde / Queen Anne's Revenge — grounded 1718

The North Carolina Queen Anne's Revenge Project is an unusually rich example of archaeological evidence joining documentary history. Its official project site provides site mapping, technical and conservation reports, artifact categories, research publications, and the continuing conservation record. The Office of State Archaeology reports an assemblage of more than 400,000 individual artifacts; the North Carolina Maritime Museum is the designated repository for the collection.

This should eventually allow a vessel path such as:

`La Concorde voyage history -> capture/name change -> Queen Anne's Revenge -> 1718 loss/grounding -> archaeological wreck site -> artifact assemblage -> museum repository`

The archaeological-site-to-canonical-ship identification must still carry evidence and source records rather than being hard-coded because the name is famous.

Official starting points:

- https://www.qaronline.org/
- https://www.qaronline.org/conservation/artifacts
- https://www.qaronline.org/conservation/mapping-site
- https://www.qaronline.org/conservation/office-state-archaeology-conservation-lab

### Urca de Lima — 1715 fleet

The *Urca de Lima*, lost in the 1715 Spanish fleet disaster off Florida, demonstrates another useful branch: a vessel can have a documented wreck site and public archaeological interpretation even when a museum-object corpus is not the main product opportunity. Florida made the site its first Underwater Archaeological Preserve, and the National Park Service maintains a National Register record and public interpretation.

This makes `known final resting place` independently useful from `museum artifacts exist`.

Official starting points:

- https://www.nps.gov/articles/urcadelima.htm
- https://dos.fl.gov/historical/archaeology/underwater/underwater-preserves/

## Data-model principle: loss, wreck, and artifact are different things

Do not collapse these concepts.

### Ship loss event

A historical assertion that a vessel was lost, grounded, burned, abandoned, scuttled, captured and destroyed, etc. This can exist even when no physical wreck has been found.

Suggested fields:

```text
ship_loss_event
  loss_event_id
  ship_id
  event_date / date_range
  loss_kind
  reported_place_id
  reported_geometry
  circumstances
  source_assertions[]
```

### Wreck / archaeological site

A physical site observed or investigated in the present/recent past. It is not automatically the same thing as the historical vessel it has been proposed to represent.

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

Suggested `publication_precision` values:

- `exact_public`
- `generalized_public`
- `named_area_only`
- `withheld_sensitive`

Never infer publication permission from the existence of coordinates in a source.

### Ship-to-wreck resolution

Use an explicit reversible edge:

```text
ship_wreck_resolution
  wreck_site_id
  ship_id
  resolution_state
  evidence[]
  resolver
  reviewed_at
```

Reuse the project's identity vocabulary where practical: `documented_identity`, `probable_match`, `unresolved`, `rejected_match`.

Evidence can include inscriptions, bells, maker/date marks, archival loss location, cargo assemblage, armament, hull construction, dendrochronology, site chronology, and archaeological reports. Geographic proximity or a matching ship name alone is not enough.

### Archaeological investigation

Treat surveys, excavations, recovery campaigns, conservation work, and site reports as source-backed events rather than flattening them into one `discovered` field.

```text
archaeological_investigation
  investigation_id
  wreck_site_id
  investigation_kind
  date_range
  institution_or_team
  report_source_ids[]
```

### Museum / repository object

Recovered material culture deserves its own object identity and accession-level provenance.

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
```

Link the object separately:

```text
object_relation
  object_id
  relation_kind
  target_id
  evidence_state
  source_assertions[]
```

Useful `relation_kind` values include:

- `recovered_from_wreck_site`
- `associated_with_ship`
- `depicts_ship`
- `commemorates_ship`
- `document_from_or_about_ship`

Only `recovered_from_wreck_site` should imply archaeological provenience, and even then the wreck-to-ship identity remains a separate edge.

## Source tiers

### Tier A — authoritative archaeological/project sources

Prefer these for ship-wreck identification, archaeological context, site history, and recovered-object provenience.

- Queen Anne's Revenge Project / North Carolina Office of State Archaeology
- state/national archaeological inventories and National Register records
- institutional excavation reports
- museum archaeology programs such as the Mel Fisher Maritime Museum when they are the research/repository institution

### Tier B — heritage wreck discovery indexes

Useful for candidate discovery and external authority IDs, not automatic canonical identity.

#### MaSS — Maritime Stepping Stones

The Cultural Heritage Agency of the Netherlands maintains MaSS as a reviewed public database of wrecks and other underwater cultural-heritage sites. It includes international material and a Dutch Caribbean theme. MaSS explicitly says it does **not** intend to provide exact positions. Contributions are reviewed before publication.

- https://mass.cultureelerfgoed.nl/en/about
- https://english.cultureelerfgoed.nl/topics/m/maritime-heritage/mass

Use: discovery, Dutch/Dutch-Caribbean wreck context, references, authority link.

Do not assume an undocumented bulk API or scrape aggressively; inspect access/terms before automation.

#### NOAA Wrecks and Obstructions / ENC Direct to GIS

NOAA's current charting data includes wrecks and obstructions and can be useful around U.S. waters and territories. NOAA explicitly warns that exact positions can be difficult to determine because of environmental change, survey methods, and error. The older AWOIS service is retired; NOAA directs users to ENC Direct for current charted features.

- https://www.fisheries.noaa.gov/inport/item/70439
- https://www.nauticalcharts.noaa.gov/data/wrecks-and-obstructions.html

Use: candidate discovery and positional corroboration.

Do not use: sole authority for historical vessel identity or archaeological significance.

#### Florida Division of Historical Resources

The Florida Master Site File is the state's official cultural-resource inventory and includes archaeological resources, but archaeological location data can be restricted and public self-service search is intentionally limited. Florida's public Underwater Archaeological Preserves are a safer/public subset for direct product linking.

- https://dos.fl.gov/historical/preservation/master-site-file
- https://dos.fl.gov/historical/archaeology/underwater/underwater-preserves/

Use targeted requests only when a specific vessel/site warrants it.

### Tier C — museum and collections discovery

Museum data can answer a different question: **where is the material evidence now?**

Existing Charted Currents sources already help:

- Smithsonian Open Access — API/bulk metadata and CC0 assets where marked;
- Rijksmuseum — maritime/material-culture metadata and item-level rights;
- Europeana — cross-institution discovery with provider/item rights preserved.

Add Royal Museums Greenwich / National Maritime Museum as a useful maritime-specific discovery source. Its current terms describe a collections API; collection images require credit/linking and available API images are generally non-commercial with item-specific restrictions. Treat metadata and image rights separately.

- https://www.rmg.co.uk/policies/terms-conditions
- https://collections.rmg.co.uk/

Museum discovery should search by stable ship names/aliases, wreck-site names, excavation project IDs, accession provenance, and named archaeological collections. A text hit for a ship name is only a candidate relation.

## Location, legal, and ethical policy

Underwater cultural heritage is unusually vulnerable to looting and commercial exploitation. The project should follow the spirit of the UNESCO 2001 Convention even where its rules are not directly binding in a particular jurisdiction:

- in-situ preservation is the preferred first option;
- commercial exploitation and dispersal of underwater heritage are incompatible with responsible preservation;
- responsible public access can be valuable;
- human remains require respect;
- inventories and research should aid protection, not facilitate looting.

Reference:
https://www.unesco.org/en/underwater-heritage/principles-2001

### Charted Currents rules

1. Never publish a more precise wreck location than the responsible authority/source makes public for reuse.
2. Support generalized or withheld coordinates as first-class data states.
3. Do not derive hidden exact coordinates from maps/screenshots and republish them.
4. Do not add artifact market values, auction aggregation, treasure estimates, or salvage-targeting features.
5. Prefer archaeological repositories and accredited/public heritage institutions over commercial treasure-sale catalogs as evidence sources.
6. Preserve excavation/recovery provenance and collection integrity where known.
7. Treat legal ownership, sovereign claims, salvage claims, and custody as time-bounded sourced assertions, not timeless facts.
8. Do not equate `artifact held by museum` with `artifact owned by museum`; loans, state ownership, repositories, and touring exhibitions differ.
9. For wrecks connected to forced migration, shipboard objects and restraints are human historical evidence and must remain integrated with the project's dedicated forced-migration interpretation rather than becoming treasure/object spectacle.

## Product opportunities — later, not MVP requirements

A ship inspector could eventually contain a compact **Fate & material evidence** section:

- last documented voyage/activity;
- loss event;
- `wreck located` / `possible wreck` state;
- public/generalized wreck location where appropriate;
- discovery and investigation timeline;
- selected recovered objects;
- museum/repository link;
- archaeological reports and source records.

Potential interactions:

- **Follow this ship to its final known site**
- **Objects recovered from this wreck**
- **Where these objects are held today**
- **Why archaeologists think this wreck is this ship**

These are strong inspector/research-view enrichments. They should not add a global `show all treasure wrecks` layer or distract from the project's broader commercial, labor, environmental, and imperial maritime system.

## Recommended sequencing

### Now

- preserve the model extension in documentation;
- maintain a secondary source registry;
- note candidate vessels during normal source research;
- do not make wreck/museum enrichment a Phase 1 acceptance criterion.

### After a real corpus exists

Run a targeted enrichment pass over canonical ships and aliases:

1. search Tier A archaeological projects/inventories;
2. search MaSS/NOAA/state heritage sources for candidates;
3. validate ship-to-wreck identity;
4. search museum/repository collections using the validated site/project IDs and aliases;
5. ingest only accession-level objects with traceable provenance and rights.

### First proof spike

If *Henrietta Marie* appears naturally in the project's source corpus, use it as the preferred first end-to-end material-afterlife proof because it tests nearly every important requirement at once: voyage history, Jamaica, forced migration, named wreck, archaeological identification, artifact provenience, museum custody, ethical interpretation, and a coherent present-day endpoint.
