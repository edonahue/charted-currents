# Shipwreck, Archaeology & Museum Source Setup

**For:** Charted Currents  
**Last reviewed:** 2026-08-31  
**Purpose:** define the human setup, API/access posture, and data-handling rules for wreck-site discovery, archaeological investigation records, recovered objects, and museum/repository tracking.

Read this with `docs/SHIPWRECKS_AND_MUSEUMS.md` and `research/shipwreck_museum_sources.yml`.

## Human setup summary

### No additional must-create credential

The shipwreck/museum lane does **not** currently require a new Charted Currents API key beyond the broader discovery credentials already documented in `docs/HUMAN_SOURCE_SETUP.md`:

- `SMITHSONIAN_API_KEY`
- `EUROPEANA_API_KEY`
- `DPLA_API_KEY`

Those are useful for museum/object discovery, but none proves a wreck-to-ship identity or archaeological provenience.

Do **not** invent any of these variables:

```text
MASS_API_KEY
NOAA_API_KEY
RMG_API_KEY
QAR_API_KEY
MEL_FISHER_API_KEY
```

No such Charted Currents credential is currently required.

### No-account APIs/data worth using

1. **MaSS (Maritime Stepping Stones) API v1** — public JSON search/list/get/references API; no key. Stay below the published guidance of 720 queries/hour per IP. MaSS data is published as CC BY-SA. The service exposes latitude/longitude fields but MaSS explicitly says it does not intend to provide exact positions; treat those coordinates as the platform's published/generalized locator, never as a newly discovered exact archaeological position.
2. **NOAA ENC Direct / Wrecks and Obstructions** — public ArcGIS REST/MapServer data; no ArcGIS account or API key is required for current public services. Queryable outputs include JSON/GeoJSON where supported. Use for charted-feature candidate discovery/positional corroboration, not ship identity.
3. **Royal Museums Greenwich / National Maritime Museum collections API** — no key currently required. Current terms give a practical ceiling of about 3,000 calls/day and 1 request/second. Metadata and images must be handled under the museum's current terms; API images are generally non-commercial and item-specific restrictions can be stricter.
4. **Rijksmuseum Data Services** — current Collection Search API requires no key; OAI-PMH is the more appropriate route for larger metadata harvests. Preserve object-level rights and identifiers.
5. **Metropolitan Museum of Art Collection API** — optional broad material-culture discovery; no key. Use only when a real object relationship warrants it rather than adding another generic museum corpus.

### Account only if contributing, not researching

**MaSS registration is only useful if Charted Currents later chooses to contribute corrections/new sites.** Reading and API access do not require registration. Do not create a MaSS account now merely for research.

### Targeted human requests only after a proof case exists

- **Florida Master Site File:** anyone can request information free of charge, but archaeological site-location information is sensitive/restricted and there is no public self-service search. Request information only for a specific research question/site; never seek or republish a broad confidential coordinate dump.
- **Mel Fisher Maritime Museum:** public archaeology/research pages and searchable collections exist without a Charted Currents login. If `Henrietta Marie` becomes the first material-afterlife proof, ask the museum for accession-level/structured collection guidance only if the public records are insufficient. Do not scrape CAPTCHA/anti-bot collection surfaces.
- **Queen Anne's Revenge / North Carolina:** official QAR project pages and the North Carolina Maritime Museum provide the authoritative archaeology/repository path without an account. Ask the project/repository for accession-level export or clarification only when a bounded proof requires it.
- **Other national/state heritage authorities:** use UNESCO's current competent-authority directory and jurisdiction-specific heritage agencies to find the responsible authority. This is contact/discovery infrastructure, not a global wreck-location API.

## Source roles: never collapse them

### Wreck discovery/index

Examples: MaSS, NOAA ENC Direct, state inventories.

Use to answer:

- Is there a candidate site?
- What authority/site ID is associated with it?
- What public location precision is responsibly available?
- Which archaeological/source references should be checked next?

Do **not** infer canonical ship identity from a name/coordinate match alone.

### Archaeological authority/project

Examples: QAR Project / NC Office of State Archaeology, Florida Bureau of Archaeological Research, institutional excavation/conservation reports, Mel Fisher Maritime Museum archaeology program.

Use for:

- observed site history;
- investigation campaigns;
- identification evidence;
- conservation history;
- archaeological provenience;
- responsible location policy.

### Museum/repository collection

Examples: North Carolina Maritime Museum, Mel Fisher Maritime Museum, Smithsonian, RMG/NMM, Rijksmuseum, Europeana providers.

Use for:

- accession/catalog IDs;
- current holding institution/repository;
- object metadata/material/type;
- collection provenance;
- image/object rights;
- object-level source links.

`held by` is not automatically `owned by`.

## Canonical tracking requirements

For every wreck candidate preserve:

- source/authority site ID;
- source URL;
- site/wreck name and aliases;
- source-stated date/date range;
- source-stated type/classification;
- source location precision and project publication precision separately;
- source/retrieval/version date;
- ship-to-wreck resolution state;
- identification evidence and citations;
- responsible managing/archaeological authority;
- location-sensitivity policy.

For every museum/repository object preserve:

- holding institution ID/name;
- stable accession/catalog ID;
- stable object URL;
- object title/name/type/material;
- archaeological provenience if actually documented;
- relationship to wreck site and relationship to canonical ship as separate assertions;
- custody/ownership/loan status only when sourced and time-bounded;
- image URL separately from object record URL;
- image/object reuse terms and required credit;
- source/retrieval/version date.

Never generate a synthetic accession ID when the institution supplies one.

## Location-sensitivity rules

1. A public API coordinate is not automatically permission to publish an exact archaeological location.
2. Never publish more precision than the responsible archaeological/heritage authority intentionally makes public for responsible reuse.
3. If a discovery index says its positions are generalized, preserve that status even if numeric latitude/longitude is returned.
4. Never infer hidden coordinates from screenshots, map tiles, dive maps, or restricted site-file records.
5. Preserve `exact_public`, `generalized_public`, `named_area_only`, and `withheld_sensitive` as first-class publication states.
6. Do not add treasure values, salvage targeting, dive-to-loot guidance, or commercial artifact-market tracking.

## First proof-case setup

### Henrietta Marie

No account/key is required before research begins.

If the vessel appears naturally in the canonical corpus:

1. resolve documentary vessel identity first;
2. use Mel Fisher archaeology/research material for the wreck/site evidence;
3. inspect the museum's public collections/search records for accession-level objects;
4. only then contact the museum if a structured export/accession clarification would materially improve the proof;
5. keep forced-migration interpretation integrated with human history rather than presenting restraints/objects as treasure spectacle.

### La Concorde / Queen Anne's Revenge

No account/key is required before research begins.

Use the official QAR archaeological project and NC Maritime Museum repository trail first. Do not rely on pirate-history secondary sites for the wreck identification or artifact provenience.

### Urca de Lima

No account/key is required before research begins.

Use Florida's public Underwater Archaeological Preserve/NPS interpretation for the public site, and request Florida Master Site File/Bureau assistance only if a specific unresolved research question justifies it.

## Human action list

### Do now

- Nothing additional beyond the Smithsonian/Europeana/DPLA credentials already on the general source checklist.
- Keep QGIS available for inspecting public GIS/ArcGIS wreck layers.

### Do when wreck enrichment begins

- Test the MaSS API politely and record its returned per-record license and source references.
- Test NOAA ENC Direct query outputs for named U.S./Florida candidates.
- Test RMG and Rijksmuseum collection searches using validated ship aliases and wreck/project identifiers.

### Do only after a real proof case exists

- Contact Mel Fisher, QAR/NC Maritime Museum, Florida Master Site File/BAR, or another responsible authority for accession-level/site-file clarification.
- Request images/reproductions only after object selection and rights review.

No additional secret should be added to `.env` unless a future source changes its authentication requirements and the project documents that change first.
