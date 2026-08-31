# Data Sources: Operational Research Dossier

**Last reviewed:** 2026-08-31

This document is an operational source inventory for Charted Currents. It answers five questions for each source:

1. What can the source contribute to the historical model?
2. How close is its coverage to the initial Greater Caribbean / 1650-1730 scope?
3. Can it be obtained programmatically?
4. What rights or provenance constraints matter?
5. What should the project do next?

Source availability and terms change. Re-check access and rights before first ingestion and again before public redistribution. The machine-readable registry is in `research/sources.yml`; visual sources are also tracked in `research/art_sources.yml`.

## Priority map

| Priority | Source | Primary role | Human setup |
| --- | --- | --- | --- |
| **P0** | CrespoDynCoopNet | Spanish-Atlantic ships, routes, goods, agents, legal/illicit trade | None |
| **P0** | International Maritime Labour Market, 1650-1815 | Real ship/crew sample; 1702-1712 overlaps MVP | None |
| **P0** | PARES / Archivo General de Indias | Primary records, fleet registers, maps, source verification | None for normal access |
| **P0** | Nationaal Archief open data | Prize Papers/Sailing Letters inventories, Dutch archival material, maps, open scans | None |
| **P0** | SlaveVoyages | Forced-migration voyage evidence; vessel/route context | None |
| **P0** | Natural Earth | Modern base geometry for map | None |
| **P1** | World Historical Gazetteer | Historical place reconciliation and authority IDs | ORCID + free API token |
| **P1** | NOAA ICOADS | Observed marine weather where early observations exist | None |
| **P1** | Prize Papers Portal | Ships, journey legs, captures, prize-court context | Request structured-data access/reuse clarification |
| **P1** | Naval Office Shipping Lists | Extremely rich port/ship/cargo traffic | Request research/data-use clarification |
| **P1** | Library of Congress | Historical maps, manuscript/maps metadata, primary assets | None |
| **P1** | Greater Caribbean Mapping | Cross-institution map discovery catalog | None |
| **P1** | Rijksmuseum | Dutch maritime art/material culture and metadata | None |
| **P1** | John Carter Brown Library | Early-Americas maps/books/visual primary sources | None for current open material; check item rights |
| **P1** | BNE / Biblioteca Digital Hispánica | Spanish maps, books, prints, public-domain imagery | None |
| **P2** | Smithsonian Open Access | Maritime/material culture discovery | Optional free API key |
| **P2** | Europeana | Cross-European cultural-heritage discovery | Free account + API key |
| **P2** | DPLA | Cross-US library/archive discovery and metadata | Free emailed API key |
| **P2** | NYPL Digital Collections | Public-domain maps/images; manual discovery | No API setup: API retired 2026-08-01 |
| **P2** | dLOC | Caribbean collections, maps, newspapers, books | None; item/partner rights vary |
| **P3** | STRO 2.0 | Comparative/denominator European shipping network | None |
| **P3** | CLIWOC | Ship-log/weather methodology; period starts 1750 | None |
| **P3** | EKF400v2 | Monthly climate reconstruction/context | None |
| **P3** | Wikidata | Supplemental people/place/political authority graph | None |

---

## P0 - sources to inspect or ingest first

### 1. CrespoDynCoopNet / CrespoDATABASEAtlanticTrade

**Why it matters**

This is the best immediately downloadable structured backbone discovered so far. It covers 1648-1778 and was designed around a GIS-oriented conceptual model. The catalog describes agents, commercial activities, maritime routes, freight, ships, monopolistic companies, businesses, goods, events, cooperation among trade networks, legal trade, smuggling, illicit trade, and Spanish Indies trade.

That is unusually close to the ontology Charted Currents wants.

**Access**

- Catalog: https://datos.gob.es/en/catalogo/ea0041268-crespodyncoopnet-data-collections
- DOI: https://doi.org/10.20350/digitalCSIC/212
- Direct MDB: https://digital.csic.es/bitstream/10261/28394/1/CrespoDynCoopNetDATASETS.mdb
- Documentation and Spanish-English glossary are linked from the catalog.
- No account or API key is required.

**Rights**

The government catalog links the Open Data Commons Database Contents License 1.0. Preserve source IDs and citations. Before publishing a transformed bulk derivative, re-read the database-content license and document our interpretation in `SOURCE_RIGHTS.md`.

**Initial engineering experiment**

1. Download the MDB locally.
2. Inventory tables/fields/relationships.
3. Convert losslessly into DuckDB/Parquet staging tables.
4. Profile missingness and geographic coverage.
5. Filter a first Greater Caribbean window, with special attention to Jamaica, Curaçao, Cartagena, Veracruz, Havana, Campeche, Bay of Honduras, and Atlantic North American connections.
6. Preserve raw source keys in every normalized assertion.

**Key question:** Does the source contain enough direct voyage/ship/commodity granularity to seed the map, or is it strongest as a merchant-network/context layer?

---

### 2. International Maritime Labour Market in Europe, relational database 1650-1815

**Why it matters**

This open UK Data Service dataset is a particularly good feasibility source because one of its Prize Papers-derived sample periods is **1702-1712**, directly overlapping the MVP. It provides two simple CSV files (`Ship.csv` and `Crew.csv`) and does not require registration.

The ship data includes route/port information, tonnage, ownership/nationality context, and related variables; the crew data contains ranks and biographical/social variables.

**Access**

- https://reshare.ukdataservice.ac.uk/852135/
- Open access to any user; no registration required.

**Use in Charted Currents**

- prove the source-assertion -> ship occurrence -> candidate canonical ship pipeline;
- test historical place reconciliation;
- establish one or more evidence-rich ship profiles;
- examine route and crew context;
- create an early Prize Papers-derived slice without depending on the Portal's future structured export.

**Caveat**

This is a research sample, not a complete denominator for Caribbean traffic. Do not infer regional prevalence or capture rates from it.

---

### 3. PARES / Spanish State Archives, especially Archivo General de Indias

**Why it matters**

PARES is our best direct route into Spanish imperial primary records. It contains descriptive records and digitized images from Spanish State Archives, including fleet and ship registers, administrative correspondence, maps/plans, and related documentation.

For Charted Currents it can serve three roles:

- primary-source verification;
- targeted manual/AI-assisted extraction;
- historically grounded maps/documents shown alongside structured records.

**Access**

- https://pares.cultura.gob.es/pares/en/inicio.html
- Free and open consultation; no registration required.
- PARES HTR is available for selected documentary series.

**Reuse posture**

PARES states that descriptions and images of **public-domain** State Archive documents accessible through the portal may be reproduced and used without prior permission, with required source citation. Higher-quality copies or non-digitized documents may be requested from the holding archive. Non-public-domain material requires rights-holder authorization for public dissemination.

**Required citation pattern**

Record the Ministry of Culture, full archive name, reference code/signature, persistent PARES URL, and access date. Keep archive reference codes as first-class IDs in our source table.

**Initial research targets**

- `registros de navíos`
- `registros de ida y vuelta`
- fleets to/from New Spain / Veracruz
- Havana assembly/return-fleet documents
- Cartagena / Portobelo related records
- maps and plans of Caribbean ports
- letters, orders, customs/fleet administration around 1685-1720

---

### 4. Nationaal Archief open data and Sailing Letters / Prize Papers inventories

**Why it matters**

The Dutch National Archives is more useful than a simple visual archive. A large share of inventories and scans is available as true open data.

Important capabilities:

- archive inventories as **CC0 EAD/XML via OAI-PMH**;
- open scans/digital objects as **Public Domain / CC0**;
- METS files giving machine-readable file locations;
- downloadable JPEG/TIFF scans where an item is rights-free;
- a dedicated inventory for **High Court of Admiralty Prize Papers (Sailing Letters), ca. 1564-1830**;
- Dutch maritime, WIC/VOC, admiralty, map, and correspondence collections.

**Access**

Open-data documentation:
https://www.nationaalarchief.nl/onderzoeken/open-data/archiefinventarissen-digitale-objecten-en-scans-van-archieven

Sailing Letters inventory:
https://www.nationaalarchief.nl/onderzoeken/archief/2.22.24

No account or API key is required for open data.

**Engineering value**

This is a strong target for an automated archival-discovery adapter:

`EAD inventory -> inventory item -> METS -> scan files -> rights state -> source assertion`

Do not assume every Nationaal Archief item is open. The project should require an explicit Public Domain/CC0 or equivalent open indicator before copying a scan into public assets.

**Research targets**

- Sailing Letters / HCA Prize Papers inventory
- early Dutch West India Company material
- admiralty correspondence and journals
- manuscript nautical maps and plans
- Suriname/Curaçao/Caribbean records
- ship-name/master occurrences that can corroborate another source

---

### 5. SlaveVoyages

**Why it matters**

SlaveVoyages supplies a structured vessel/voyage view of forced migration that is essential to a historically credible Caribbean maritime system. It also has a unique voyage ID and rich ship/route variables suitable for linking.

**Rights distinction that must survive ingestion**

- Historical data transcribed from primary documents: **public domain**
- Imputed fields: **CC BY-NC 3.0 US**
- Images: source-institution-specific

Do not flatten documented and imputed values into one field. Store source variable status or a derived `evidence_origin` flag.

**Access**

- https://www.slavevoyages.org/
- Legal guidance: https://legacy.slavevoyages.org/blog/legal
- No signed license or account required for the database.

**Presentation rule**

People subject to forced migration are not generic cargo. Vessel/voyage information can connect into the general maritime graph, while the human event model and UI remain explicitly human-centered.

---

### 6. Natural Earth

**Role**

Use public-domain Natural Earth vectors/raster as the dependable base geometry for early map experiments: land, coastline, graticules, physical features, and low-detail modern reference layers.

**Access and rights**

https://www.naturalearthdata.com/about/terms-of-use/

All Natural Earth raster/vector data are public domain. No account, key, or permission is required.

**Why not start with a hosted commercial basemap**

Charted Currents wants a designed historical-cartographic surface, not an off-the-shelf navigation map. Natural Earth plus project-specific styling gives us a clean foundation with no account dependency. PMTiles/OSM can be added later if more detail is useful.

---

## P1 - high-value sources to activate deliberately

### 7. World Historical Gazetteer (WHG)

**Role**

Historical place-name reconciliation is one of the hardest problems in the project. WHG's 2026 API supports entity lookup and reconciliation with names, geometries, temporal bounds, source namespaces, and linked resources.

Use it for candidate place resolution, not as unquestioned truth.

**Human setup required**

- WHG now uses ORCID authentication.
- Anyone can obtain an ORCID; academic affiliation is not required.
- Sign into WHG via ORCID.
- Generate an API token from the WHG Profile page.
- Store locally as `WHG_API_TOKEN`.
- API requests should include an identifying User-Agent.

Docs:
https://docs.whgazetteer.org/content/technical/apis.html

**Resolution rule**

A WHG hit can support a candidate canonical place. Preserve the original source spelling, source coordinates (if any), WHG ID, candidate score/reasoning, and human validation state.

---

### 8. NOAA ICOADS

**Role**

Actual surface-marine observations, with coverage extending to 1662. Early observations are sparse; the source is valuable precisely because it can sometimes provide observed conditions rather than a modern climatological guess.

**Access**

https://www.ncei.noaa.gov/products/international-comprehensive-ocean-atmosphere-data-set

No project account should be required for public/bulk products. Prefer documented public interfaces and cache locally.

**UI rule**

Never convert an observation near a voyage into “the weather experienced by this ship” unless the observation is actually attributable to the ship/position/time in question. Otherwise it remains regional observed context.

---

### 9. Prize Papers Portal

**Why it is strategically important**

The Portal's own beta data model is extremely close to Charted Currents:

- ships with alternate/former names and types;
- voyages recorded leg-by-leg as journeys;
- departure/arrival places and dates;
- masters/commanders, crew, flags/authorities, lading;
- captures;
- forced/capture journeys;
- prize-court processes;
- explicit approximate places/dates.

The Portal states that future versions will allow access to the structured data for subsequent use.

**Access posture**

Do not scrape the portal UI to manufacture a bulk dataset. Send a collaboration/data-access inquiry first.

- Portal: https://portal.prizepapers.de/
- Beta data model: https://portal.prizepapers.de/beta
- Project: https://www.prizepapers.de/

**Images**

Portal terms restrict TNA images to research/private study/education; other public uses go through The National Archives Image Library. Treat metadata/data rights and image rights as separate.

**Human request goal**

Ask for the current/forthcoming structured-data pathway, license, attribution requirements, and whether open noncommercial public derivatives of ship/journey/capture metadata are permitted.

---

### 10. Naval Office Shipping Lists / British Online Archives

**Why this is the most tempting restricted source**

BOA's `Power and Profit: British Colonial Trade in America and the Caribbean, 1678-1825` exposes the exact facts we want: vessel, home port/colony, construction, owners, tonnage, guns, crew, cargo, and shipping-list chronology. Coverage includes Barbados from 1678, Nevis 1704-1729, Bermuda from 1715, Bahamas from 1721, and South Carolina from 1716, among other locations.

**But**

BOA is a licensed publication platform. Its current terms permit reasonable research use, not bulk data extraction/republication. The Power and Profit collection currently says single-user licenses are unavailable and institutional licensing is the standard path, although BOA's trial page invites independent researchers to explain their work and says it will try to help where possible.

**Do not scrape it.**

**Human action**

Contact `info@britishonlinearchives.com` and ask about:

1. independent-research access to Power and Profit;
2. whether structured metadata/OCR/export is available;
3. whether BOA can license or authorize a noncommercial derived factual dataset containing normalized ship/voyage facts with attribution;
4. what BOA regards as permissible derivative use of facts transcribed from the underlying TNA records;
5. whether there is an API/data-service route.

**Fallback / parallel path**

Investigate original TNA references, microfilm holdings, and our own transcription from legally accessed original/public records. The long-term goal should be source-independent provenance, not dependence on a proprietary presentation layer.

---

## Data context and comparison sources

### 11. STRO 2.0

Sound Toll Registers re-engineered shipping data, CC BY 4.0, downloadable from Figshare. It is not Caribbean-centered but may be useful for external-network methodology and comparative denominators.

Keep outside MVP unless a specific question needs it.

### 12. CLIWOC

Historical ship-log climate/weather observations, primarily 1750-1854. Valuable for methodology and a later extension, but chronologically too late for the core 1650-1730 build.

### 13. EKF400v2

Monthly climate reconstruction from the early seventeenth century onward. Useful as a later `Reconstructed` Context Stack source.

Never display model output as exact day/ship weather.

### 14. Wikidata

Useful for supplemental authority matching, dates, political entities, people, and links. Public SPARQL endpoint, no key.

Use as an authority/enrichment layer, not sole evidence for narrow historical claims.

---

## Cultural heritage discovery APIs used partly as data

The following are detailed in `ART_AND_MAP_SOURCES.md` because their strongest use is visual/primary-source discovery, but they also supply machine-readable metadata:

- Library of Congress
- Greater Caribbean Mapping
- Rijksmuseum Data Services
- John Carter Brown Library / Americana
- Biblioteca Nacional de España / BNE Digital
- Smithsonian Open Access
- Europeana
- DPLA
- NYPL Digital Collections (manual only after API retirement)
- Digital Library of the Caribbean
- Nationaal Archief open scans/inventories

---

## Ingestion contract for every source

Each adapter should emit an immutable source layer before entity normalization.

Minimum fields:

```text
source_id
source_record_id
source_url_or_persistent_id
source_archive_reference
source_accessed_at
source_version_or_release
source_rights_state
source_field
source_value_raw
source_value_normalized_candidate
evidence_state
extraction_method
validation_state
```

For AI-assisted extraction also store:

```text
model_or_tool
prompt_or_extractor_version
candidate_value
supporting_span_or_page
review_status
```

A canonical entity must never erase the source assertion that created it.

---

## Next research sequence

When work resumes on the x600:

1. **Crespo**: download MDB and create a schema/profile report.
2. **UK Data Service 1702-1712 sample**: download `Ship.csv` and `Crew.csv`; prove entity-resolution/data contracts.
3. **Nationaal Archief**: write an EAD/METS proof-of-concept against Sailing Letters.
4. **WHG**: activate token and run historical port-name reconciliation on a controlled list.
5. **PARES**: build a human-curated seed set of Spanish ship/fleet records with permanent references.
6. **SlaveVoyages**: ingest a narrow period/geographic sample, preserving imputed/documented distinctions.
7. **BOA + Prize Papers**: send access/reuse inquiries while the open-source vertical slice proceeds.
8. Only after those tests, decide what actually belongs in v0.1 and which sources remain research-only.
