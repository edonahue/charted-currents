# Historical Visual Source Access & Asset Publication Guide

**For:** Charted Currents  
**Last reviewed:** 2026-08-31  
**Purpose:** define how humans and research agents discover, access, clear, acquire, transform, georeference, and publish historical maps, manuscript/document scans, prints, photographs, and museum/material-culture imagery.

Read this with:

- `docs/ART_AND_MAP_SOURCES.md`
- `docs/VISUAL_ASSET_STRATEGY.md`
- `docs/SOURCE_RIGHTS.md`
- `docs/PRE_INGESTION_NORMALIZATION_POLICY.md`
- `research/art_sources.yml`
- `.env.example`

## Core rule

Historical visuals are evidence and design references, not generic atmosphere.

Use this preferred chain:

```text
discovery result
  -> holding institution item record
  -> item rights/reuse statement
  -> IIIF manifest/image service or institution download
  -> immutable source metadata record
  -> project derivative/crop/georeference with transformation metadata
  -> public asset only after explicit rights review
```

Do not save an anonymous web image and later try to reconstruct its provenance.

## Asset roles

Every candidate visual should be assigned one role before use:

- `design_reference_only` — informs typography, hierarchy, linework, spacing, color, cartographic grammar; never shipped merely because it looks good.
- `historical_source_evidence` — directly related to an entity/event/place/document represented in the product.
- `historical_context` — real historical source relevant to period/place but not claimed to depict the exact entity/event.
- `material_culture` — museum/repository object, instrument, model, artifact, artwork, or physical evidence.
- `georeference_candidate` — historical map/plan suitable for a documented overlay experiment.
- `public_product_asset` — rights-cleared derivative intentionally shipped in the public product.

A source may occupy more than one role, but `design_reference_only` must never silently become `historical_source_evidence`.

## No new mandatory visual credential

The visual lane currently adds no credential beyond the general source setup:

```text
EUROPEANA_API_KEY
SMITHSONIAN_API_KEY
DPLA_API_KEY
```

These remain local research credentials and must never be exposed through `PUBLIC_*` browser variables.

No key/account is currently required for the primary visual routes below:

- Library of Congress JSON/YAML + IIIF Image services
- John Carter Brown Library Americana
- Harvard Library public IIIF manifests / openly available public-domain reproductions
- Nationaal Archief open inventories/scans
- PARES normal access
- ANOM normal access
- BNE Digital / Biblioteca Digital Hispánica
- BnF / Gallica public APIs and IIIF
- Rijksmuseum Search/OAI/Linked Data/IIIF
- dLOC public item/METS-MODS access
- Wikimedia Commons read/API access
- Allmaps Editor/Viewer

Do not invent `LOC_API_KEY`, `BNF_API_KEY`, `JCB_API_KEY`, `PARES_API_KEY`, `RMG_API_KEY`, `RIJKSMUSEUM_API_KEY`, `WIKIMEDIA_API_KEY`, or `ALLMAPS_API_KEY`.

---

# 1. Asset metadata contract

Before a downloaded source image or derivative enters a public asset directory, preserve at least:

```yaml
asset_id:
role:
institution:
collection_or_division:
item_id:
accession_or_call_number:
item_permalink:
title:
creator:
source_date_or_range:
source_type:
source_language:
rights_uri_or_statement:
rights_state:
credit_line:
retrieved_at:
source_image_url:
iiif_manifest_url:
iiif_canvas_id:
iiif_image_service_url:
source_dimensions:
local_source_snapshot:
local_derivative:
derivative_format:
derivative_dimensions:
crop_region:
rotation:
color_or_tone_transform:
other_transformations:
georeference_annotation:
georeference_method:
review_notes:
```

Unknown fields may be null; do not fabricate them.

If a crop is used to support a specific assertion, preserve enough information to recover the crop from the institutional source (`canvas`, IIIF region/xywh, page/folio, or equivalent).

## Rights gate

A visual asset may ship only when:

1. the holding/source item is resolved;
2. the exact digital object's reuse statement is known;
3. required credit is recorded;
4. the source/derivative distinction is documented;
5. any crop/rotation/color change is recorded;
6. publication is compatible with the public site's intended use.

`unknown_review_required`, private/research-only material, or ambiguous partner material stays out of public assets.

---

# 2. IIIF-first access policy

When the holding institution exposes IIIF, prefer it over ad-hoc screenshotting or manually scraping viewer tiles.

IIIF advantages for Charted Currents:

- stable image-service identifiers;
- reproducible crops/resizes;
- manifest/canvas structure for books and manuscripts;
- standardized links between image and metadata;
- easier future OpenSeadragon/Mirador integration;
- a clean path to Allmaps georeferencing;
- preservation of `rights` and attribution/`requiredStatement` when the manifest supplies them.

A IIIF endpoint is a delivery mechanism, not a license. Still inspect the item's rights statement.

Preferred stored identifiers:

```text
institution item permalink
IIIF manifest URL
canvas ID
IIIF image service/info.json URL
rights URI/statement
required attribution statement
```

Do not hotlink an institutional full-resolution image into the production UI merely because IIIF makes it technically possible. For stable small derivatives, generate/cache a rights-approved project derivative when permitted and useful; for deep zoom or evidence inspection, direct IIIF delivery may be preferable if institutional terms and service reliability support it.

---

# 3. Library of Congress — first-choice maps and charts

## Access

- Search manually at `https://www.loc.gov/` or programmatically through the public JSON/YAML API.
- Add `?fo=json` to many LOC search/item surfaces or use documented JSON/YAML endpoints.
- No API key/authentication is required.
- Rate limit politely, avoid deep paging, use facets and cache research responses.
- Eligible images expose LOC's IIIF Image service; many item pages also expose an IIIF Presentation Manifest.

## Recommended workflow

1. Search for a specific geography/time/function, not just `pirates`.
2. Open the canonical LOC item page.
3. Record LCCN/digital ID/call number, repository/division, creator/date, permalink.
4. Read `Rights & Access` / `Rights Advisory`.
5. If suitable, capture the IIIF manifest/service identifiers or use the institution download control.
6. Store the required credit line.
7. Create only the derivative actually needed by the product.

For Geography & Map Division digitized collections, LOC currently says content is free to use/reuse unless a Rights Advisory says otherwise. Preserve the item-specific result and credit line.

## Search lanes

- West Indies / Caribbean / Spanish Main, 1650-1730
- Port Royal / Jamaica
- Havana / Cuba
- Cartagena / Portobelo / Veracruz
- Curaçao / Dutch West Indies
- trade winds / galleon/flota tracks
- nautical charts / soundings / anchorages
- harbor plans / fortifications
- contemporary printed geography and sea atlases

## Design-reference rule

LOC maps may inform coastline hierarchy, engraved rules, labeling, inset language, line density and cartographic restraint. Do not copy a decorative cartouche or political claim into application chrome.

---

# 4. John Carter Brown Library Americana — unusually clean reuse path

Current Americana/JCB guidance states that items in its digital collections are licensed `CC BY 4.0`, with the requested credit line:

`Courtesy of the John Carter Brown Library`

No prior publication request is currently required for those digital-collection items.

## Workflow

1. Search Americana/JCB for a named place, title, cartographer, book, voyage or subject.
2. Prefer the current Americana item record over an orphaned/legacy viewer result.
3. Record the stable item URL, bibliographic identity, physical holding information and CC BY 4.0 status.
4. Download/use the institutional digital item according to the item interface.
5. Preserve the JCB credit and note transformations.

Use JCB especially for early Americas books, map plates, voyage narratives, city/port views and printed iconography that can sit beside map data without becoming generic decoration.

---

# 5. Harvard Library / Harvard Map Collection — useful no-account IIIF lane

Harvard Library exposes IIIF manifests for many publicly available digitized items. The Harvard Map Collection also offers scanned historical maps, including georeferenced scans/GeoTIFFs.

Harvard's public-domain reproduction policy allows free use of openly available digital reproductions of public-domain works, subject to item-specific/non-copyright restrictions and appropriate source citation.

## Workflow

1. Find an item in HOLLIS/Harvard Library Viewer or the Harvard Map Collection/Geospatial Library.
2. Confirm the item is openly accessible and the underlying work is public domain for the intended use.
3. Retrieve the IIIF manifest from the Viewer where available.
4. Preserve the source library/repository, HOLLIS/item identifier, manifest URL and item rights information.
5. Use georeferenced GeoTIFFs only with their accompanying metadata; do not treat a modern georeference as part of the historical source.

No Harvard account/API key is recommended solely for Charted Currents visual research.

---

# 6. Nationaal Archief — Dutch maps, records and open scans

## Access

Use the public catalogue plus the open-data routes already documented in `docs/DOCUMENTARY_SOURCE_ACCESS.md` / `docs/ART_AND_MAP_SOURCES.md`.

A practical publication test is simple: Nationaal Archief states that scans with a download button and a `Public Domain` or `CC0` mark are available for unrestricted reuse. If the download button is absent, do not copy the scan into public assets on the assumption that age makes it free.

## Workflow

1. Resolve archive name/catalogue reference/inventory number.
2. Confirm the scan has an open download state and explicit Public Domain/CC0 marking.
3. Download from the institution, not a repost.
4. Preserve catalogue identifiers and recommended credit.
5. For documents/maps, credit with archive/collection/catalogue/inventory identity even where credit is not legally required.

High-value targets: Old WIC, Sailing Letters/Prize Papers, admiralty records, Curaçao/Suriname material, manuscript charts, maps and ship-related papers.

---

# 7. PARES / Archivo General de Indias — Spanish manuscript evidence

PARES requires no account for normal consultation and provides descriptive records plus digitized images where available.

## Access workflow

1. Search documents and authority records in PARES.
2. Open the descriptive record and retain the full archive name and archival `signatura`/reference code.
3. Inspect the image viewer when digitized.
4. For research/private consultation, images can be saved/printed using PARES controls.
5. For public publication, determine whether the document is public domain and apply the current PARES reuse rules.
6. Public-domain descriptions/images accessible in PARES may currently be reused without prior permission, but the required Ministry/archive/reference citation must be preserved.
7. For undigitized items or higher-quality reproductions, contact the holding State Archive; PARES documents the request route and possible reproduction fees.

Do not use a PARES watermarked viewer capture as the preferred public product asset when a proper higher-quality/public-domain reproduction can be obtained.

---

# 8. ANOM — French Antilles maps, plans and manuscripts

ANOM is a high-value source for Martinique, Guadeloupe, Lesser Antilles, French imperial administration, fortifications and manuscript cartography.

## Access workflow

1. Use ANOM's online inventories/cartothèque to identify the exact archive reference.
2. Record `FR ANOM`, date, reference, creator/title where available, and stable catalogue/item route.
3. Determine whether the document/visual is reusable under public-information rules or contains third-party copyright/unknown-author constraints.
4. Preserve the required precise origin/holding credit.
5. When a needed document is not suitably digitized, use ANOM's photographic reproduction service; small standard digitization requests may be free under current fee schedules while larger/complex formats can incur charges.

Unknown-author/unknown-death-date photographs or other copyrighted visual works require particular caution; ANOM explicitly warns that holding an image does not mean ANOM owns all underlying rights.

---

# 9. BNE Digital / Biblioteca Digital Hispánica

For public-domain works in BNE Digital/BDH, BNE currently states that public use is free, requires no prior authorization, and is supplied under CC BY 4.0 or equivalent with required BNE source credit.

## Workflow

1. Resolve the bibliographic record and digital item.
2. Confirm the work/image is in the public-domain reuse lane.
3. Record BNE identifier/permalink, creator/title/date and credit.
4. Prefer the institution's downloadable digital reproduction rather than a screenshot.
5. If an item is not digitized or a publication-quality reproduction is needed, use the BNE reproduction request route.

Use for Spanish printed charts, atlases, engravings, nautical books and port/city imagery.

---

# 10. BnF / Gallica — machine-friendly French maps and documents

Gallica exposes public APIs including IIIF Image/Presentation and document/OCR services.

Useful identifiers include the Gallica `ark:/12148/...` identifier; preserve the ARK rather than only a transient viewer URL.

## Workflow

1. Search Gallica for the specific map/book/manuscript/item.
2. Record the ARK, title/creator/date, source institution and partner status.
3. Use the IIIF Presentation manifest when available to preserve page/canvas structure.
4. Use the IIIF Image API for deterministic crops/resizes rather than browser screenshots.
5. OCR/ALTO may be used for discovery/extraction on printed works but remains an OCR layer, not primary text.
6. Inspect Gallica's reuse conditions and whether the item is BnF-held or a partner-institution item.

Current Gallica terms generally allow free non-commercial reuse of BnF public-domain reproductions with source attribution; commercial reuse is a different licensing route, and partner items may carry separate terms. If Charted Currents later becomes commercial/monetized, re-review Gallica assets before continued public use.

Recommended credit pattern where applicable: `Source gallica.bnf.fr / BnF` plus item-specific source information.

---

# 11. Rijksmuseum — objects, art, models and IIIF

Rijksmuseum currently provides:

- no-key Search API;
- OAI-PMH / dumps for larger metadata needs;
- Linked Data identifiers;
- IIIF Image API;
- IIIF Presentation API.

## Workflow

1. Use Search API for discovery, not bulk synchronization.
2. Resolve returned persistent object identifiers to complete object metadata.
3. Inspect object-level rights/availability.
4. Use IIIF for high-resolution display/crops where appropriate.
5. Preserve object number/accession, persistent ID, image rights, credit and IIIF identifiers separately.

This is particularly useful for maritime paintings/prints, navigational instruments, ship models, Dutch Atlantic material and visual culture around the WIC.

---

# 12. Smithsonian Open Access

Two supported routes:

- weekly refreshed open JSON data on GitHub — no key;
- focused Open Access API — `SMITHSONIAN_API_KEY`.

Use the key for targeted discovery if obtained, but do not block visual research on it because bulk open data is available.

Only media supplied as Open Access/CC0 should be promoted as public reusable imagery without a separate rights route. A metadata record for a restricted object is not permission to copy its media.

---

# 13. Europeana — discovery and IIIF aggregator

Use `EUROPEANA_API_KEY` for programmatic discovery.

Europeana requires every digital object supplied by partners to carry a standardized rights statement, but that statement must still be preserved and interpreted per item. Europeana is usually a discovery/aggregation layer, not the holding institution.

## Workflow

1. Search Europeana.
2. Retrieve the detailed Record API result.
3. Preserve the standardized rights URI.
4. Follow through to the provider/holding institution record.
5. Prefer the provider's canonical item and IIIF route for publication-quality use.
6. Use Europeana IIIF where useful, but do not erase provider provenance.

Personal keys are for exploration/development; request a project key only if Europeana becomes an operational production dependency.

---

# 14. DPLA — US institutional discovery

Use `DPLA_API_KEY` to discover maps, books, manuscripts and images across U.S. institutions.

Treat DPLA as a metadata/discovery layer. Follow the record to the contributing institution and resolve media rights there before publication.

Do not ingest an image merely because the DPLA API returned an image URL.

---

# 15. dLOC — Caribbean-specific discovery with item-level rights

The Digital Library of the Caribbean is unusually valuable geographically, but its post-custodial model means partners retain rights to their materials.

Useful features include:

- Caribbean Map Collection;
- location-based search;
- partner archive collections;
- complete METS/MODS and MARC XML links on many item records.

## Workflow

1. Find the item through topical/geographic search.
2. Preserve dLOC item ID plus source institution and holding location.
3. Read the `Rights Management` field.
4. Capture METS/MODS for machine-readable metadata when useful.
5. Follow partner/holding institution restrictions before copying media.

A dLOC item may be public domain, research-only, or otherwise restricted. Never infer collection-wide rights.

---

# 16. Wikimedia Commons — reference convenience, not source authority

Wikimedia Commons is useful for:

- building a deterministic visual reference board from already reviewed historical works;
- finding a derivative when the underlying institution is known;
- quick low-friction design research;
- locating public-domain reproductions that link back to authoritative institutions.

It should not replace the holding institution as provenance when a canonical institutional record exists.

## Access

- no account/key required for normal read/API access;
- automated calls must use a meaningful User-Agent and polite request behavior;
- cache responses and avoid large parallel request storms.

## Rights

Every Commons file has its own license/PD assertion. Wikimedia explicitly warns users to verify license information themselves. Preserve the file-page license/author attribution, but for Charted Currents historical-source assets also resolve the original holding institution/item whenever possible.

Do not hotlink Commons production images by default; download a reviewed, license-compatible derivative when reuse is approved.

---

# 17. Allmaps — georeferencing tool, not a rights-clearing service

Allmaps Editor can open any compatible IIIF Image/Manifest URL and currently requires no account. Georeference annotations created in the public Editor are saved/published as CC0 open data.

This has an important consequence:

> Do not use the public Allmaps Editor for a private/restricted map, sensitive unpublished geometry, or a source whose terms prohibit that public annotation/reuse path.

For an open historical map:

1. resolve and rights-clear the institutional map first;
2. copy the IIIF Manifest/Image URL;
3. open it in Allmaps Editor;
4. create the mask/GCPs;
5. download/save a local copy of the resulting Georeference Annotation;
6. record the original IIIF resource, annotation version/retrieval date and who performed/reviewed the georeference;
7. validate in QGIS and/or MapLibre before treating it as a project overlay.

Allmaps georeference data is a modern project/research annotation. It does not become part of the historical map itself and must not be presented as historical evidence of surveyed coordinates.

---

# 18. Design-asset policy

## Preferred design assets

Packet/product chrome should primarily use:

- locally bundled Libre Caslon Text / Inter / IBM Plex Mono;
- CSS rules, spacing, typography and restrained paper values;
- MapLibre-native line/circle/symbol layers;
- small project-owned SVG/marks when a semantic need exists;
- real historical imagery only when it has a defined source role.

## Avoid

Do not source or generate:

- fake parchment textures;
- distressed-paper stock images;
- decorative skull/anchor/ship-wheel/compass clip art;
- generic AI-generated historical ships, ports, maps or manuscripts;
- anonymous engravings from Pinterest/blogs/image search;
- modern illustrations presented as period evidence;
- generic icon packs as the project's historical semantics.

Historical character should come from actual historical sources plus project-owned contemporary design—not costume assets.

## Generated imagery

Generative imagery must not be used to fabricate historical evidence, primary-source appearance, a named ship/person/place depiction, or a map that could be mistaken for a period source.

If generative imagery is ever used for an explicitly non-evidentiary experiment, label and segregate it from historical-source assets; default product direction is to avoid it.

---

# 19. Gemini / agent acquisition instructions

When asked to source a visual:

1. Start from the relevant source registry and this guide.
2. Search institution-first; use aggregators to discover, not to erase provenance.
3. Prefer a real item strongly connected to the represented place/entity/event over a prettier generic image.
4. Resolve the canonical item page before downloading anything.
5. Record item ID, title, creator/date, holding institution, permalink and rights.
6. Prefer IIIF or institutional downloads over screenshots.
7. Never bypass authentication, watermarks, CAPTCHA, download restrictions or anti-bot controls.
8. Do not assume an image is reusable because the underlying historical work is old.
9. Do not assume an aggregator's metadata license applies to the media.
10. Do not publish partner/restricted content without resolving the provider/item rights.
11. Create only necessary derivatives; retain transformation metadata.
12. Keep raw/source-resolution downloads out of `public/` until rights review.
13. Do not commit huge master files simply because they are available. Use institutional delivery for deep zoom where appropriate and create responsive derivatives for ordinary UI.
14. Do not introduce OpenSeadragon/Mirador/image-processing dependencies until a real approved asset/use case demonstrates the need.
15. For georeferenced maps, keep the source map, georeference annotation, transformation method and uncertainty/provenance separable.

## Candidate handoff

For every proposed public visual, report:

```text
Item
Why it belongs
Holding institution
Stable identifier/permalink
Source date
Rights/reuse status
Required credit
IIIF/download route
Planned crop/derivative
Historical relationship: direct / contextual / design-reference
Anything still unverified
```

Do not call an asset approved while any publication-rights field is unresolved.
