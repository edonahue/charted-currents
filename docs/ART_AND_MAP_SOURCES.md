# Art, Maps, and Primary-Source Visual Resources

**Last reviewed:** 2026-08-31

Charted Currents should use historical maps, documents, prints, maritime objects, and other primary-source imagery as part of the research experience, not as generic “pirate texture.”

The visual-source strategy is:

1. prefer public-domain / CC0 / clearly open assets;
2. preserve the exact holding institution and item permalink;
3. separate discovery metadata from image rights;
4. show primary sources in context: why this map/document/object matters to the currently selected place, voyage, date, or historical question;
5. never assume that an aggregator has the right to relicense the image it indexes.

## Visual-source tiers

| Source | Best use | Machine access | Reuse posture | Account/key |
| --- | --- | --- | --- | --- |
| **Library of Congress** | Caribbean charts/maps, prints, books/manuscripts | JSON/YAML + IIIF-like image services | item-level check; many historical G&M items reusable | None |
| **Greater Caribbean Mapping** | discovery index for circum-Caribbean maps | weekly full CSV | catalog for discovery; resolve image rights at holder | None |
| **Nationaal Archief** | Dutch charts, maps, documents, open scans | EAD/OAI-PMH + METS/files | PD/CC0 when explicitly marked/downloadable | None |
| **PARES** | Spanish archival maps/plans/documents | portal + targeted downloads | public-domain material reusable with citation | None |
| **Rijksmuseum** | maritime art, ships, model ships, ports, navigational objects | Search API, OAI-PMH, Linked Data, downloads | PD/CC0 or indicated item license | None |
| **John Carter Brown Library** | early-Americas books/maps/prints | Americana/manual digital access | current open-access material generally reusable with credit; check item | None |
| **BNE Digital / BDH** | Spanish maps, books, engravings | digital collections/data exports | public-domain images reusable, generally CC BY 4.0/equivalent | None |
| **Smithsonian Open Access** | material culture, navigation, maritime objects | API + weekly GitHub data | Open Access CC0 assets where supplied | Optional API key |
| **Europeana** | cross-institution European discovery | API | media rights per provider/item | Free API key |
| **DPLA** | US archive/library discovery | API + bulk metadata | metadata permissive; media rights per provider | Free API key |
| **NYPL Digital Collections** | public-domain maps/books/prints | website/manual; API retired 2026-08-01 | PD high-res reusable without permission | No key worth creating |
| **dLOC** | highly relevant Caribbean maps/books/newspapers | item metadata, sometimes METS/MODS | partner/item-specific | None |

---

## 1. Library of Congress - primary v0.1 visual source

**Why it fits**

The Geography & Map Division has exactly the kind of visual material we want: seventeenth- and eighteenth-century West Indies charts, port plans, trade-route maps, and historical geography. LOC also has prints, books, manuscripts, and related material.

Priority reference already identified:

- Herman Moll, *A map of the West-Indies... also ye trade winds, and ye several tracts made by ye galeons and flota...*, ca. 1715
- https://www.loc.gov/item/gm71005442/

This is conceptually almost a visual manifesto for Charted Currents because it combines geography, political space, trade winds, and fleet tracks.

**Programmatic access**

- API docs: https://www.loc.gov/apis/json-and-yaml/
- No API key/authentication required.
- Current JSON/YAML rate limit: 20 requests/minute; image/media services have separate higher limits.
- Use facets instead of deep paging.
- Item endpoints expose resources and image links.
- LOC image services support IIIF Image API patterns for eligible resources.

**Rights workflow**

Never rely on “old map = automatically safe” as a code assumption. Read the item's Rights & Access / Rights Advisory and store it.

For assets approved for publication, store:

```yaml
institution: Library of Congress
division: Geography and Map Division
item_id:
item_permalink:
title:
creator:
date:
rights_statement:
credit_line:
retrieved_at:
local_derivative:
```

**Good search lanes**

- West Indies / Caribbean maps 1650-1730
- Jamaica / Port Royal plans
- Havana / Cuba
- Cartagena / Portobelo / Veracruz
- trade winds / currents / sailing tracks
- Spanish Main
- navigation / sea charts
- naval battle / privateering prints
- merchant vessels and harbor scenes

---

## 2. Greater Caribbean Mapping, 1450-1850 - our map discovery index

This Johns Hopkins project is almost tailor-made for research discovery. It catalogs maps of the circum-Caribbean as primary historical evidence and tracks attributes such as map type/function, date, region, holding location, digital link, decorative features, scale, bibliography, and notes.

**Data**

- https://greatercaribbeanmaps.org/
- Full catalog: https://greatercaribbeanmaps.org/overview/data-download/
- Entire catalog is downloadable as CSV and refreshed weekly.

**How to use it**

Do ingest the catalog metadata after a terms check.

Do not copy all linked images.

Instead:

`GCM map record -> holding institution -> holding item -> rights assessment -> approved visual asset`

This source can power a future **Historical Map Finder** within Charted Currents and can also help Gemini/research scripts discover period-appropriate cartographic references for specific cities and years.

---

## 3. Nationaal Archief - open maps and archival scans

The Dutch National Archives has unusually useful machine-readable open-data plumbing.

Open archive inventories:
- CC0
- EAD/XML
- OAI-PMH

Open scans/digital objects:
- Public Domain / CC0 where explicitly marked
- METS gives file endpoints
- JPEG/TIFF download available for many open scans

Open data docs:
https://www.nationaalarchief.nl/onderzoeken/open-data/archiefinventarissen-digitale-objecten-en-scans-van-archieven

Terms for scans:
https://www.nationaalarchief.nl/en/research/terms-of-use-for-scans-of-documents-maps-and-photos

**Rule**

Only copy a scan into the public site if the item has the download/open indicator and is marked Public Domain/CC0 or otherwise clearly open.

**High-interest collection lanes**

- Prize Papers / Sailing Letters inventory `2.22.24`
- early West India Company material
- admiralty records
- Curaçao/Suriname/Caribbean correspondence
- ship journals
- nautical charts and manuscript maps
- Leupe foreign maps / sea atlases

This source can supply both evidence and site imagery with unusually clean provenance.

---

## 4. PARES / Archivo General de Indias - Spanish primary visuals

PARES should be one of the project's defining visual/evidentiary sources rather than a background research site.

Potential material:

- port plans;
- fortifications;
- charts;
- fleet/ship registers;
- handwritten cargo/ship records;
- correspondence;
- administrative orders;
- maps and plans from Archivo General de Indias.

**Use**

A ship/voyage page can show the actual relevant document or a nearby contemporary record where rights allow, with:
- archive/reference code;
- item title;
- date;
- source excerpt/transcription;
- why it connects;
- permalink.

For high-quality publication copies or undigitized items, use the holding archive's reproduction request process.

---

## 5. Rijksmuseum Data Services - Dutch maritime visual culture

Rijksmuseum's current data platform is unusually friendly:

- Search API: no key
- OAI-PMH: no key
- Linked Data
- large metadata and image holdings
- most freely available public-domain/CC0 images can be reused, including commercially; item restrictions are clearly marked.

Data services:
https://data.rijksmuseum.nl/

Search:
https://data.rijksmuseum.nl/docs/search

Policy:
https://data.rijksmuseum.nl/policy/

**Strong search concepts**

- ships / model ships
- naval battles
- merchant vessels
- harbors
- Curaçao / West India Company
- navigation instruments
- sea charts
- captains/admirals/merchants
- maritime allegories
- Caribbean / Atlantic trade imagery

These images are especially useful for editorial/entity pages where a literal map scan would be repetitive.

---

## 6. John Carter Brown Library / Americana

The JCB's collecting focus on the early Americas makes it one of the most thematically relevant visual archives available.

Current JCB messaging describes Americana as an open-access digital gateway and says its materials can be used with credit, commonly:
`Image courtesy of the John Carter Brown Library.`

**Important caveat**

Older Brown Center for Digital Scholarship/LUNA records can still show legacy reproduction-permission language. Therefore:

- prefer current **Americana/JCB** item records;
- record item-level rights/usage language;
- do not assume an old Brown CDS page has been superseded without checking.

This is a likely source for:
- printed Caribbean maps;
- early colonial books and illustrations;
- voyage narratives;
- city/port views;
- empire/trade imagery;
- maps of the Spanish Main and Americas.

No API key should be required for initial use.

---

## 7. Biblioteca Nacional de España - BNE Digital / Biblioteca Digital Hispánica

A very strong Spanish visual counterpart to LOC/JCB.

BNE says public-domain works/images accessible in BNE Digital/BDH can be publicly reused for noncommercial, commercial, or academic purposes without prior authorization. Public-domain images are under CC BY 4.0 or equivalent, with required source credit such as:

`Image taken from the holdings of the Biblioteca Nacional de España.`

Start:
https://www.bne.es/

Reuse information:
https://www.bne.es/en/node/3020

**Useful material**

- Spanish sea charts;
- printed Caribbean maps;
- atlases;
- books and engravings;
- nautical works;
- port/city imagery;
- voyage/trade texts.

For items not already digitized, BNE has a reproduction request process.

---

## 8. Smithsonian Open Access

The Smithsonian can add **material culture** to a project otherwise dominated by paper:

- navigation instruments;
- ship models;
- maritime artifacts;
- maps/art;
- colonial objects;
- coins/medals/objects relevant to commerce and empire.

Open Access assets are CC0 where provided.

Two access paths:

1. weekly-refreshed public GitHub Open Access data - no key;
2. public API on api.data.gov - free API key.

Developer tools:
https://www.si.edu/openaccess/devtools

An API key is helpful but **not a blocker**, because the bulk GitHub data exists.

---

## 9. Europeana - discovery multiplier

Europeana aggregates cultural heritage from thousands of European institutions.

Use it primarily to **find the object and its holding institution**, then follow through to the provider record and inspect rights.

Account/key:
- free Europeana account;
- Profile -> Manage API key -> request personal API key;
- project key can be requested later if Charted Currents becomes a live service with heavier usage.

https://www.europeana.eu/en/how-to-register-for-and-manage-an-api-key

Do not treat Europeana's aggregation as a universal media license.

---

## 10. DPLA - US discovery multiplier

DPLA can surface maps/books/manuscripts in US libraries that would otherwise take many institution-specific searches.

API:
https://pro.dp.la/developers/

Key request is unusually simple: an HTTP POST containing your email. The key is sent by email.

Use DPLA metadata to locate records. Media/image rights remain those of the contributing provider.

---

## 11. NYPL Digital Collections - valuable, but manual now

NYPL has hundreds of thousands of public-domain/no-known-US-copyright items and high-resolution downloads that can be reused without permission.

However, **do not create an NYPL API account/token now.** NYPL's API documentation states that the Repo API was retired on **August 1, 2026**, with no public replacement planned.

Current use:
- manual/web discovery;
- public-domain filter;
- download eligible high-resolution assets;
- store item permalink and rights statement.

https://digitalcollections.nypl.org/

This source is still useful; only the machine-ingestion path has closed.

---

## 12. Digital Library of the Caribbean (dLOC)

dLOC is geographically exceptional for this project: Caribbean maps, newspapers, books, photographs, and partner-institution collections.

Treat it as **rights-fragmented**:
- dLOC is an aggregator/host;
- individual partners/items may have different permissions;
- some older materials are clearly public domain;
- metadata can expose useful structured formats such as MODS/METS on individual records.

Use for:
- targeted discovery;
- item-level primary-source context;
- links to Caribbean partner institutions;
- manually cleared assets.

Do not assume collection-level reuse rights.

---

## Visual asset provenance contract

Every asset committed to `public/` should have a sidecar metadata record, manifest entry, or equivalent with:

```yaml
asset_id:
local_path:
title:
creator:
date:
institution:
collection:
source_item_id:
source_permalink:
original_file_url:
rights_statement:
license_uri:
public_domain: true|false|unknown
attribution_required:
credit_line:
downloaded_at:
transformations:
notes:
```

### Transformations to record

- crop;
- resize;
- contrast/levels;
- color treatment;
- georeferencing;
- tile generation;
- overlay opacity;
- annotation.

Never overwrite the archival original in our local source cache with a transformed derivative.

---

## Aesthetic research lanes to build deliberately

### Period cartography
Look for:
- rhumb lines;
- compass roses;
- coastal hachures;
- engraved wave/water treatments;
- cartouches;
- inset harbor plans;
- fleet/sailing tracks;
- trade-wind arrows;
- typography hierarchy;
- political boundary/color conventions.

Use as **design vocabulary**, not a pretext for unreadable antique UI.

### Documents as evidence
Find:
- manifests;
- ship registers;
- letters of marque;
- prize proceedings;
- customs/shipping lists;
- letters;
- court papers;
- port administration;
- logbooks.

The website should be able to say “show me the document behind this fact.”

### Maritime material culture
Find:
- model ships;
- compasses;
- astrolabes/octants;
- charts;
- cannons/armament;
- coins;
- cargo containers;
- navigational instruments;
- port/harbor paintings.

### Romantic pirate imagery
Howard Pyle and later pirate art can be used sparingly and explicitly as **later pirate memory/imagination**, not as a visual record of 1690.

---

## v0.1 visual benchmark set

Before styling the site, collect a rights-cleared benchmark folder containing roughly:

1. 3-5 period Greater Caribbean charts/maps;
2. 2 port plans (ideally Port Royal plus a Spanish/Dutch counterpart);
3. 2 ship/harbor artworks;
4. 2 manuscript/manifest/register images;
5. 1 navigation instrument/object;
6. 1 contextual disaster/weather document/map if available.

Do not use all of them on the site. The purpose is to give the design agent a historically coherent reference board with traceable provenance.
