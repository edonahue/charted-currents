# Human Source Access, Credentials & Research-Tool Checklist

**For:** Charted Currents  
**Last reviewed:** 2026-08-31  
**Canonical status:** this file replaces the former `HUMAN_SOURCE_SETUP_ADDENDUM.md`.  
**Purpose:** define the human accounts, API credentials, outbound access requests, no-account sources, and local research tools that should be prepared for source work after Packet 1.

Most Charted Currents sources do **not** require an account. Do not create accounts simply because a service offers one, and do not make a new hosted platform part of the application unless a documented requirement justifies it.

Packet 1 requires **none of these credentials**. They are preparation for Packet 2+ research/ETL and can be completed in parallel with the UI build.

---

## 1. Canonical credential contract for Gemini and local tooling

`.env.example` is the canonical list of environment-variable names. Agents/scripts must **not invent alternate names**.

### Recommended research credentials to prepare now

| Service | Canonical environment variable | Priority | Purpose | Browser/public app? |
| --- | --- | --- | --- | --- |
| World Historical Gazetteer | `WHG_API_TOKEN` | **Highest** | historical-place entity/reconciliation API | **Never** |
| GeoNames | `GEONAMES_USERNAME` | **High** | independent modern gazetteer/place lookup and fallback | **Never as a secret/public config** |
| Europeana | `EUROPEANA_API_KEY` | High | cultural-heritage discovery/metadata/IIIF discovery | **Never** |
| Smithsonian Open Access | `SMITHSONIAN_API_KEY` | Medium | museum/material-culture discovery and metadata | **Never** |
| DPLA | `DPLA_API_KEY` | Medium | US cultural-institution discovery/metadata | **Never** |

### Optional/later credentials — names reserved, not expected for Packet 2 startup

| Service | Reserved environment variable | Why later |
| --- | --- | --- |
| US National Archives Catalog API | `NARA_API_KEY` | valid read-only research API, but lower priority for the 1650–1730 Greater Caribbean core |
| ArcGIS Location Platform | `ARCGIS_API_KEY` | only if an Esri secure location service becomes genuinely useful; public ArcGIS REST datasets often need no key |
| Protomaps hosted service | `PROTOMAPS_API_KEY` | only if the project deliberately adopts a hosted Protomaps service; current MapLibre/OpenFreeMap path does not need it |

### Agent rules for credentials

- Never ask the human to paste a real secret into a Gemini/AGY prompt.
- Never commit `.env`, tokens, usernames tied to a private account, or authentication responses.
- Never rename a variable because another SDK/example uses a different convention; adapt at the source adapter boundary.
- Do not prefix research credentials with Astro `PUBLIC_`; they are for **local research/ETL scripts**, not browser JavaScript.
- Do not expose a secret in `public/`, `src/pages/`, client-side scripts, screenshots, logs, or generated review artifacts.
- When debugging, report `credential present` / `credential missing`, never the credential value.
- Missing optional credentials must not block unrelated work.
- A key allows access; it does **not** establish reuse/publication rights for returned records or media.

Create local secrets once:

```bash
cp .env.example .env
```

Then fill only the credentials actually obtained.

---

## 2. Recommended human action order

### Do now / before Packet 2

1. [ ] Use/create an **ORCID**, sign into World Historical Gazetteer, and generate a WHG API token.
2. [ ] Create a **GeoNames** account, confirm the email, and enable free web services.
3. [ ] Create a free **Europeana** account and personal API key.
4. [ ] Get a **Smithsonian Open Access** API key if convenient.
5. [ ] Request a **DPLA** API key.
6. [ ] Send the **British Online Archives / Power and Profit** independent-research + derived-data inquiry.
7. [ ] Verify the current **Prize Papers** research contact and send the structured-data/reuse inquiry.
8. [ ] Install **OpenRefine** and **QGIS** locally; no account/API key is required for either.

### Useful but not urgent

9. [ ] Optionally request a read-only **NARA Catalog API** key.
10. [ ] Optionally create a free **ArcGIS Location Platform** account for Map Viewer / Esri research tooling; do **not** make it an application dependency or enable paid services merely for Charted Currents setup.
11. [ ] Try **Allmaps** with one IIIF-compatible historical map when period-map georeferencing work begins; no Charted Currents credential is currently planned for it.

### Do only after a specific item/use case exists

- PARES / ANOM / BnF partner / TNA / JCB reproduction or image-use requests.
- TNA Discovery API access (IP-based access request; not a normal key in `.env`).
- Hosted Protomaps credentials.
- ArcGIS API key credentials for secure Esri services.
- Paid archive subscriptions.

---

# 3. World Historical Gazetteer (WHG) — first priority

Why it matters: historical place-name resolution is a core Charted Currents problem. WHG can return place entities with names, geometry, temporal bounds, authority links, and linked-place metadata, and its reconciliation service is designed to work with OpenRefine.

Current docs:
https://docs.whgazetteer.org/content/technical/apis.html

Authentication announcement:
https://blog.whgazetteer.org/2026/03/20/whg-transitions-to-orcid-authentication/

### Human setup

- [ ] Use an existing ORCID or create one during/for WHG sign-in.
- [ ] Sign into the **current production WHG login flow**.
- [ ] Open WHG Profile.
- [ ] Generate/copy the API token.
- [ ] Store locally:

```bash
WHG_API_TOKEN=...
```

- [ ] Copy/save the WHG-provided OpenRefine reconciliation service URL for later human reconciliation work.

WHG requires a suitable User-Agent for API calls. Recommended project identity:

```text
charted-currents/<version> (independent historical-data project; https://github.com/edonahue/charted-currents)
```

Do not expose `WHG_API_TOKEN` in the public application.

Completion date: __________________

---

# 4. GeoNames — prepare alongside WHG

Why it matters: GeoNames is a useful independent modern gazetteer for place lookup, hierarchy, coordinates, nearby-place queries, and cross-checking. WHG can reconcile against GeoNames, but direct access gives the local pipeline a second deterministic path.

Web-service docs:
https://www.geonames.org/export/web-services.html

### Human setup

- [ ] Register a GeoNames username.
- [ ] Confirm the email.
- [ ] Enable the account for web services from the GeoNames account page.
- [ ] Store locally:

```bash
GEONAMES_USERNAME=...
```

GeoNames requires the `username` parameter on requests and explicitly says not to use its shared `demo` account for applications/tests.

`GEONAMES_USERNAME` is not an API secret in the same sense as a bearer token, but keep it in local `.env` so adapters use one canonical configuration path and the public repository does not need to encode a personal account identity.

The Packet 1 development-anchor coordinates already carry source/CC BY attribution separately; this username is for future research calls, not for changing that provenance.

Completion date: __________________

---

# 5. Europeana — high-value discovery key

Europeana is useful as a cross-European discovery layer for maps, prints, books, museum objects, and IIIF-capable cultural-heritage records.

Key instructions:
https://www.europeana.eu/en/how-to-register-for-and-manage-an-api-key

### Human setup

- [ ] Create/log into a free Europeana account.
- [ ] Open **My Profile → Manage API key**.
- [ ] Accept the terms.
- [ ] Request a **personal API key**.
- [ ] Store locally:

```bash
EUROPEANA_API_KEY=...
```

A personal key is appropriate for exploration and development. Do not request a project key unless Charted Currents later relies on Europeana operationally at higher volume.

Completion date: __________________

---

# 6. Smithsonian Open Access — useful, non-blocking

Developer tools:
https://www.si.edu/openaccess/devtools

Smithsonian provides:

- weekly refreshed Open Access data on GitHub — **no key**;
- public API access through api.data.gov — free key.

### Human setup

- [ ] Register through the Smithsonian/api.data.gov API-key path.
- [ ] Store locally:

```bash
SMITHSONIAN_API_KEY=...
```

This key is convenient for focused queries; bulk/open data means it should never block the project.

Completion date: __________________

---

# 7. DPLA — easy discovery key

Policy/key instructions:
https://pro.dp.la/developers/policies

Request a key by POSTing an email address:

```bash
curl -X POST "https://api.dp.la/v2/api_key/YOUR_EMAIL@example.com"
```

Then:

- [ ] Receive the 32-character key by email.
- [ ] Store locally:

```bash
DPLA_API_KEY=...
```

DPLA is a discovery/metadata source. Rights for images/items remain source-institution/item-specific.

Completion date: __________________

---

# 8. US National Archives (NARA) — valid optional key, lower initial priority

Catalog API:
https://www.archives.gov/research/catalog/help/api

Anyone may request a read-only Catalog API key; the current default limit is 10,000 queries/month. NARA is not a first-line source for the project's 1650–1730 Caribbean core, so this is useful preparation rather than a Packet 2 prerequisite.

If obtained, store as:

```bash
NARA_API_KEY=...
```

Use a read-only key only. Do not request contribution/write capability for Charted Currents.

Before building a large ingestion path, re-check NARA's current API/data-use terms and whether bulk/open datasets are a better fit for reproducible local ETL.

Completion date: __________________

---

# 9. ArcGIS / Esri — optional research account, not an app dependency

Esri developer docs:
https://developers.arcgis.com/documentation/mapping-and-location-services/get-started/

A free **ArcGIS Location Platform** account can be useful for exploring Esri-hosted services, Map Viewer workflows, and optional secure geocoding/location services.

Recommendation:

- [ ] Creating the free account is reasonable if useful to the human research workflow.
- [ ] Do **not** enable pay-as-you-go solely for this project setup.
- [ ] Do **not** generate/use an API key unless a specific secure Esri service earns a place in the research pipeline.
- [ ] Do **not** replace MapLibre/OpenFreeMap or introduce ArcGIS SDKs merely because the account exists.

If a future approved adapter needs a key, its reserved variable is:

```bash
ARCGIS_API_KEY=...
```

Many public government ArcGIS REST FeatureServer/MapServer endpoints can be queried without any ArcGIS account; prefer direct open-service access when appropriate.

---

# 10. British Online Archives — send access/data-use inquiry now

**Priority:** high because `Power and Profit: British Colonial Trade in America and the Caribbean, 1678–1825`, especially the Naval Office Shipping Lists, contains unusually relevant voyage fields.

Collection:
https://britishonlinearchives.com/collections/68/power-and-profit-british-colonial-trade-in-america-and-the-caribbean-1678-1825

General inquiries:
`info@britishonlinearchives.com`

Current public collection access is presented primarily through institutional trial/sales. Ask before purchasing unrelated/general access.

### Ask specifically

- Can an independent researcher obtain temporary access to **Power and Profit**?
- Is structured metadata, OCR/HTR, export, MARC/collection metadata, or any research-data/API access available beyond the public collection-level downloads?
- Can normalized factual fields such as vessel, master, origin/destination, tonnage, crew, guns, cargo, owner, and dates be used in an openly accessible noncommercial derived research dataset/site?
- What attribution, retention, or redistribution limits apply?
- How should the project distinguish underlying archival/public-sector information from BOA scans/transcriptions/presentation?

### Draft inquiry

**Subject:** Independent research/data-use inquiry — Naval Office Shipping Lists / Power and Profit

Hello British Online Archives team,

I am building an independent, open, noncommercial digital-history project called **Charted Currents** focused initially on the maritime Greater Caribbean, 1650–1730. The project connects provenance-aware records of ships, voyages, ports, cargo, privateering/piracy, and historical context in an interactive map and research interface.

Your **Power and Profit: British Colonial Trade in America and the Caribbean, 1678–1825** collection, particularly the Naval Office Shipping Lists, is exceptionally relevant.

Before using the collection, I would like to clarify what forms of research and derived-data use you can permit. I am interested in normalized factual fields such as vessel name, master, origin/destination, tonnage, crew, guns, cargo, owners, and dates. I am **not** seeking to republish BOA scans/page images or create a substitute copy of the collection.

Could you advise on independent-research access, any structured metadata/data/OCR export or API, permission for an openly accessible noncommercial derived factual dataset/site with attribution, and any limits or preferred licensing route?

The public project repository is:
https://github.com/edonahue/charted-currents

Thank you,
Erich Donahue

- [ ] Sent: __________________
- [ ] Reply received: __________________
- [ ] Outcome/restrictions recorded in `research/sources.yml`: __________________

---

# 11. Prize Papers Project — send structured-data inquiry now

Portal:
https://portal.prizepapers.de/

Project:
https://www.prizepapers.de/

The Prize Papers model is unusually aligned with Charted Currents: ships, aliases, journey legs, captures, masters, places, flags/authorities, lading, court processes, and digitized source material. Public project materials have described structured-data reuse/access as an intended portal capability.

The goal is **structured metadata/research data**, not blanket permission to republish TNA scans.

Verify the current project contact immediately before sending. Recent public project materials list Dr Lucas Haasis as a project contact.

### Draft inquiry

**Subject:** Structured data access/reuse inquiry — Prize Papers and Charted Currents

Hello Prize Papers team,

I am developing an independent open digital-history project, **Charted Currents**, focused initially on the maritime Greater Caribbean around 1650–1730.

The project connects source-provenanced records of ships, journey legs, ports, cargo, captures, people, and historical context in a map-first exploratory interface. The Prize Papers ship/journey/capture data model is especially relevant.

Could you advise whether a structured export, API, dump, or research-data release is currently available or planned; what terms apply to those structured data; whether they may be used in an openly accessible noncommercial derived project preserving Prize Papers identifiers/links/attribution/uncertainty; and any preferred citation, versioning, rate-limit, or collaboration practices?

For clarity, I am treating **document images separately** and would follow The National Archives/image-use requirements rather than assuming metadata terms apply to scans.

Project repository:
https://github.com/edonahue/charted-currents

Thank you,
Erich Donahue

- [ ] Current contact verified: __________________
- [ ] Sent: __________________
- [ ] Reply received: __________________
- [ ] Outcome/restrictions recorded in `research/sources.yml`: __________________

---

# 12. UK National Archives Discovery API — do not request by default

Current terms/access:
https://www.nationalarchives.gov.uk/terms-and-conditions/discovery-for-developers-about-the-application-programming-interface-api/

Discovery API access currently requires contacting TNA and supplying the IP address from which requests will be sent. It is therefore **not represented by a canonical API-key environment variable**.

More importantly, current Discovery API terms say not to cache/store returned API content. That is a poor fit for Charted Currents' preferred reproducible local source-snapshot → normalization → publication pipeline.

Use Discovery interactively/catalogue-first, Prize Papers structured-data channels where available, and source-specific/bulk routes where possible. Request Discovery API access only if a bounded discovery task demonstrates a need compatible with its current terms.

---

# 13. Local research tools to install before serious source work

## OpenRefine

Use for messy archival names, tabular cleaning, and human-reviewed reconciliation. WHG provides a personalized OpenRefine reconciliation service URL from the WHG profile.

- [ ] Install before large place/person/source reconciliation work.
- [ ] No account/key required.
- [ ] Keep accepted/rejected reconciliation decisions as explicit project artifacts rather than silently overwriting source strings.

## QGIS

Use for inspecting GeoJSON/GeoPackage/raster data, government ArcGIS REST services, coordinate systems, transformations, and eventual historical-map georeferencing QA.

- [ ] Install before Packet 2/period-map geospatial work becomes substantial.
- [ ] No account/key required.
- [ ] QGIS output is research tooling; publication still follows project provenance/rights/precision policy.

## Allmaps

Useful later for IIIF-based historical-map georeferencing/annotation and MapLibre-compatible experiments.

- [ ] No Charted Currents credential expected now.
- [ ] Test only after a real IIIF map has been selected and its rights/provenance are understood.

---

# 14. No-account / no-key sources — nothing to prepare

Do **not** spend setup time creating credentials for these initial access paths:

- Library of Congress JSON/YAML API — no key.
- PARES / Spanish State Archives — ordinary online research does not require registration.
- ANOM — normal online research; reproduction request only for selected items.
- BnF / Gallica — public SRU/OAI/document/OCR/IIIF services for initial use; item-level reuse terms still matter.
- Rijksmuseum search/open-data services under the current documented open access path.
- Nationaal Archief open data / OAI-METS-file access for open material.
- BNE Digital / Biblioteca Digital Hispánica normal open discovery.
- John Carter Brown Library / Americana initial discovery/open material.
- Natural Earth — public-domain geospatial data.
- Wikidata SPARQL — public; respect service limits.
- NOAA public data / public ArcGIS REST services used by the project.
- SlaveVoyages open research database/access paths used by the project.
- CrespoDynCoopNet direct data download.
- International Maritime Labour Market 1650–1815 open data.
- Greater Caribbean Mapping catalog/data downloads already identified in project research.

No-account does **not** mean no-rights-check: every public historical asset/record still follows `docs/SOURCE_RIGHTS.md`, provenance, and item-level publication rules.

---

# 15. Item-specific reproduction/licensing only after selection

Do not open broad licensing workflows in advance. For a specific item that has earned a place in the product, record the stable source identifier/permalink, holding institution, exact page/folio/crop, rights state, proposed public use, request date, fee/conditions, and required credit.

This applies especially to:

- PARES / holding Spanish archive;
- ANOM;
- BNE/BnF partner material where terms require it;
- The National Archives Image Library for selected Prize Papers/TNA scans;
- JCB or other institutional reproduction services where the item record requires permission.

Historical document-image rights are separate from permission to use factual/structured metadata.

---

# 16. Do not set these up yet

## NYPL Repo API

The repo's prior source research records the public Repo API as retired on 2026-08-01 with no public replacement planned. Use current Digital Collections/open-download paths rather than preparing a dead credential.

## Protomaps hosted API

Current Packet 1 uses MapLibre + OpenFreeMap. Do not create hosted-map credentials until measured product requirements justify a different service.

Reserved future variable only:

```bash
PROTOMAPS_API_KEY=...
```

## Paid archive access without a rights answer

Do not buy access merely to discover afterward that derived-data publication is outside the license. Ask first, especially for BOA.

---

# 17. Local `.env` reference

Recommended-now configuration:

```bash
WHG_API_TOKEN=
GEONAMES_USERNAME=
EUROPEANA_API_KEY=
SMITHSONIAN_API_KEY=
DPLA_API_KEY=
```

Optional/later reserved names:

```bash
# NARA_API_KEY=
# ARCGIS_API_KEY=
# PROTOMAPS_API_KEY=
```

There is intentionally no `TNA_API_KEY`, `LOC_API_KEY`, `GALLICA_API_KEY`, `PARES_API_KEY`, or similar variable in the current contract.

Checklist:

- [ ] `.env` is ignored by Git.
- [ ] No real secret appears in prompts/screenshots/logs.
- [ ] Local adapters read the canonical names above.
- [ ] Browser code receives none of these credentials.
- [ ] Credential presence never substitutes for source-rights validation.
- [ ] If a secret ever enters Git history, rotate/revoke it immediately.
