# Human Source Access & Credentials Checklist

**For:** Charted Currents  
**Last reviewed:** 2026-08-31  
**Purpose:** the small set of setup/actions that require a human account, API credential, permission request, or item-specific reproduction request.

Most Charted Currents sources do **not** require an account. Do not create accounts just because a service offers one.

## The short version

When you are back at your desk, the highest-value human actions are:

1. **Create/use an ORCID and sign into World Historical Gazetteer; generate a WHG API token.** WHG's 2026 authentication announcement uses ORCID; if the production login UI differs from the documentation, follow the live login flow.
2. **Create a free Europeana account and personal API key.**
3. **Optionally register a Smithsonian Open Access API key.** It is useful but not blocking because weekly bulk data is public on GitHub.
4. **Request a DPLA API key** by the documented email-based POST.
5. **Send a British Online Archives inquiry** about Naval Office Shipping Lists / `Power and Profit`.
6. **Send a Prize Papers structured-data inquiry.**
7. Do **not** request Protomaps or NYPL API credentials now.
8. Use PARES/BNE/ANOM/TNA/JCB reproduction requests only when a specific chosen asset needs higher resolution or explicit permission.
9. **Do not create accounts for BnF/Gallica or ANOM** for ordinary research/API access; both can be used without a key for our initial purposes.

Estimated active setup time, excluding waiting for replies: roughly 20-30 minutes.

---

## Credential table

| Source | Priority | What you need | Cost | Environment variable | Blocks v0.1? |
| --- | --- | --- | --- | --- | --- |
| **World Historical Gazetteer** | **Do first** | ORCID login/current WHG auth + WHG API token | Free | `WHG_API_TOKEN` | Not blocking, but very valuable |
| **Europeana** | High | Free account + personal API key | Free | `EUROPEANA_API_KEY` | No |
| **Smithsonian Open Access** | Medium | api.data.gov API key | Free | `SMITHSONIAN_API_KEY` | No - bulk GitHub data exists |
| **DPLA** | Medium | API key emailed after POST | Free | `DPLA_API_KEY` | No |
| Protomaps hosted API | Later | Only if hosted service chosen | Varies | `PROTOMAPS_API_KEY` | **No - do not create now** |
| NYPL Repo API | None | API retired 2026-08-01 | N/A | none | No |

Create a local `.env` from the repo's `.env.example`. **Never paste real keys into GitHub issues, documentation, commits, Gemini prompts, or screenshots.**

---

# 1. World Historical Gazetteer - do this first

WHG is likely to be the most useful credential because historical place-name normalization is a core problem.

Current docs:
https://docs.whgazetteer.org/content/technical/apis.html

Login:
https://whgazetteer.org/accounts/login/

### Steps

- [ ] If you already have an ORCID, use it.
- [ ] If not, WHG's March 2026 authentication announcement says you can create an ORCID during sign-in; ORCID is free and does not require academic affiliation.
- [ ] Use the **current production WHG login flow**. Some WHG documentation pages have been transitioning and may describe an older account path, so trust the live login screen over stale screenshots/text.
- [ ] Open your WHG **Profile**.
- [ ] Generate/copy your API token.
- [ ] Put it in local `.env` as:

```bash
WHG_API_TOKEN=...
```

- [ ] Record completion date below, but **not the token**.

Completion date: __________________

### Test later from the x600

The coding agent can use the token with the WHG Entity/Reconciliation API. Requests should include a descriptive User-Agent.

Recommended user-agent identity:
`charted-currents/<version> (independent historical-data project; contact via project GitHub)`

---

# 2. Europeana - create a personal key

Europeana is useful as a cross-European discovery layer for maps, paintings, prints, books, and maritime objects.

Key instructions:
https://www.europeana.eu/en/how-to-register-for-and-manage-an-api-key

### Steps

- [ ] Create/log into a free Europeana account.
- [ ] Open **My Profile**.
- [ ] Choose **Manage API key**.
- [ ] Accept the API key terms.
- [ ] Request a **personal API key**.
- [ ] Store locally:

```bash
EUROPEANA_API_KEY=...
```

Completion date: __________________

A project key is unnecessary for the initial build. Request one only if a live Charted Currents service later depends heavily on Europeana API volume.

---

# 3. Smithsonian Open Access - optional but useful

Developer tools:
https://www.si.edu/openaccess/devtools

Smithsonian provides two relevant access paths:
- weekly refreshed Open Access data on GitHub - **no key**;
- public API via api.data.gov - free key.

### Recommendation

Get the free key if convenient, but do not let it delay work.

- [ ] Register for Smithsonian's public API key through its api.data.gov link.
- [ ] Store as:

```bash
SMITHSONIAN_API_KEY=...
```

Completion date: __________________

---

# 4. DPLA - easy optional key

Policy/key instructions:
https://pro.dp.la/developers/policies

DPLA sends a key by email after an HTTP POST containing your email address.

From your terminal:

```bash
curl -X POST "https://api.dp.la/v2/api_key/YOUR_EMAIL@example.com"
```

Then:

- [ ] Wait for the DPLA email.
- [ ] Store the 32-character key locally:

```bash
DPLA_API_KEY=...
```

Completion date: __________________

DPLA is a discovery/metadata source. Image rights still come from the contributing institution/item.

---

# 5. British Online Archives - send this inquiry

**Priority:** high because Naval Office Shipping Lists may be the best British shipping source for the initial period.

Collection:
https://britishonlinearchives.com/collections/68/power-and-profit-british-colonial-trade-in-america-and-the-caribbean-1678-1825

General inquiries:
`info@britishonlinearchives.com`

Independent-research trial page:
https://sales.britishonlinearchives.com/trials

Important: the current `Power and Profit` overview presents **institutional trial/sales access** rather than a clearly available individual purchase for this specific collection. Other BOA collections do offer short-term single-user licenses, which makes it especially important not to buy a generic/other collection license assuming it covers `Power and Profit`. Ask first.

### What we need to learn

- Can an independent researcher obtain temporary research access?
- Is any structured export, metadata export, OCR/HTR export, or API available?
- Would BOA authorize a **noncommercial open derived dataset of factual ship/voyage fields** from this collection?
- What attribution and publication conditions would apply?
- How do they distinguish underlying TNA historical facts from BOA scans/transcriptions/presentation for reuse purposes?

### Draft email

**Subject:** Independent research/data-use inquiry - Naval Office Shipping Lists / Power and Profit

Hello British Online Archives team,

I am building an independent, open, noncommercial digital-history project called **Charted Currents** that explores the maritime Greater Caribbean, initially around 1650-1730. The project connects provenance-aware records of ships, voyages, ports, cargo, privateering/piracy, and historical context in an interactive map and research interface.

Your **Power and Profit: British Colonial Trade in America and the Caribbean, 1678-1825** collection, particularly the Naval Office Shipping Lists, is exceptionally relevant to the project.

Before I make any use of the collection, I would like to clarify what forms of research and derived-data use you can permit. I am specifically interested in factual fields such as vessel name, master, origin/destination, tonnage, crew, guns, cargo, owners, and dates. I am **not** looking to republish BOA scans, page images, or a substitute copy of the collection.

Could you advise on:

1. whether independent-research access to Power and Profit is available;
2. whether any structured metadata/data export, OCR/HTR export, or API exists;
3. whether BOA could authorize use of normalized factual fields in an openly accessible, noncommercial derived research dataset/site with attribution;
4. any limits, attribution requirements, or data-retention conditions you would want applied; and
5. whether you have a preferred research/data-use licensing route for a project of this kind?

The project repository is public and is designed to keep source provenance and rights information visible at the record level. I would be happy to share a more detailed description of the planned use.

Thank you,

Erich Donahue  
Charted Currents  
https://github.com/edonahue/charted-currents

- [ ] Sent: __________________
- [ ] Reply received: __________________
- [ ] Outcome / restrictions recorded in `research/sources.yml`: __________________

---

# 6. Prize Papers Project - send structured-data inquiry

Portal:
https://portal.prizepapers.de/

Project:
https://www.prizepapers.de/

The Portal's beta documentation says future versions will allow access to the project's structured data for subsequent use. The data model is unusually aligned with Charted Currents: ships, aliases, journey legs, captures, masters, places, flags/authorities, lading, and court processes.

A current public research contact in recent project materials is Dr Lucas Haasis (`lucas.haasis@uol.de`). **Verify the project's current contact page before sending**, because project roles/addresses can change.

### What we need

We want structured **metadata/research data**, not permission to bulk republish TNA scans.

### Draft email

**Subject:** Structured data access/reuse inquiry - Prize Papers and Charted Currents

Hello Dr Haasis / Prize Papers team,

I am developing an independent open digital-history project, **Charted Currents**, focused initially on the maritime Greater Caribbean around 1650-1730.

The project is intended to connect source-provenanced records of ships, journey legs, ports, cargo, captures, people, and historical context in a map-first exploratory interface. The Prize Papers Portal's ship/journey/capture data model is especially relevant, and I noticed the beta documentation states that future Portal versions will allow access to the structured data for subsequent use.

I would be grateful for guidance on the current or planned route for researchers to obtain and reuse that structured data.

Specifically:

1. Is a structured export, API, dump, or research-data release currently available or planned?
2. What license/terms apply or are expected to apply to the ship, journey, capture, court-process, and related metadata?
3. Would those structured data be usable in an openly accessible, noncommercial derived research project that preserves Prize Papers identifiers, links, attribution, and uncertainty?
4. Are there preferred citation, update/versioning, rate-limit, or data-retention practices?
5. If public structured access is not available yet, would the team be open to a small research collaboration or sample export for a Caribbean-focused feasibility prototype?

For clarity, I am treating **document images separately** and would follow The National Archives' image-use requirements rather than assuming the metadata/data terms apply to scans.

The public project stub is here:
https://github.com/edonahue/charted-currents

Thank you for any direction you can provide.

Best,
Erich Donahue

- [ ] Current contact verified: __________________
- [ ] Sent: __________________
- [ ] Reply received: __________________
- [ ] Outcome / restrictions recorded: __________________

---

# 7. PARES - no account now; request only specific assets

PARES:
https://pares.cultura.gob.es/pares/en/inicio.html

No registration is required for ordinary viewing/research.

### When to make a reproduction request

Only after we identify a specific document that:
- is not digitized; or
- needs a higher-resolution copy for public presentation; or
- has rights conditions that require authorization.

PARES says to contact the archive holding the original and include identity details plus the document reference/signature and title. For publication, include the page/folio and publication title.

### Request record

Asset/document: __________________  
Holding archive: __________________  
Reference/signature: __________________  
PARES permalink: __________________  
Purpose: __________________  
Public-domain status: __________________  
Request sent: __________________  
Fee/conditions: __________________

---

# 8. ANOM — no account; request reproductions only after item selection

Research guide:
https://archives-nationales-outre-mer.culture.gouv.fr/faire-une-recherche/antilles-francaises

Reproduction service:
https://archives-nationales-outre-mer.culture.gouv.fr/infos-pratiques/obtenir-une-reproduction

ANOM requires no API key/account for the ordinary online research we need. Its French Antilles holdings should be actively researched because they balance the British/Spanish/Dutch source lanes.

When a specific undigitized or higher-resolution item is selected:

- [ ] record the full `FR ANOM` archival reference;
- [ ] confirm communicability/public-domain or other rights status;
- [ ] use ANOM's reproduction form/service if a better file is needed;
- [ ] record any fee and conditions;
- [ ] retain the required source credit in the public asset record.

Current reproduction pricing is modest for ordinary requests, so **requesting a handful of genuinely important documents/maps is realistic** once we know exactly what we want.

---

# 9. BnF / Gallica — no key; rights-review selected images

API/data portal:
https://api.bnf.fr/

Gallica provides public SRU/OAI, document/OCR and IIIF services without a project API credential in the current documentation. No account setup is needed for the initial research pipeline.

For each selected visual asset:

- [ ] preserve the Gallica ARK/permalink;
- [ ] note whether the source is BnF itself or a partner institution;
- [ ] record the exact reuse terms;
- [ ] use the required source credit (`Source gallica.bnf.fr / BnF` for applicable BnF material);
- [ ] flag any intended commercial/promotional reuse for a fresh rights check.

A first human-curated target should be a French Antilles map around 1700–1720 to sit beside the Herman Moll 1715 benchmark.

---

# 10. TNA Image Library - only for selected Prize Papers images

Prize Papers Portal image terms:
https://portal.prizepapers.de/termsofuse/

Portal scans reproduced from The National Archives are restricted to research/private study/education under the Portal terms; other uses are directed to the TNA Image Library.

Do **not** open a general licensing process now.

When a specific Prize Papers scan becomes important enough for the public site:
- record the HCA reference;
- record the Portal item/permalink;
- identify the exact crop/page;
- contact the TNA Image Library for the intended web/public use;
- store the written permission/license terms in the private project records and a non-secret summary in `research/art_sources.yml`.

---

# No-account sources - nothing to set up

Do not spend time creating credentials for these:

- **CrespoDynCoopNet** - direct MDB download.
- **International Maritime Labour Market 1650-1815** - open CSV download, no registration.
- **PARES** - open/free research access.
- **SlaveVoyages** - open database access.
- **NOAA ICOADS** - public data.
- **Library of Congress loc.gov API** - no key.
- **Greater Caribbean Mapping CSV** - direct catalog download.
- **Rijksmuseum Search/OAI APIs** - no key under the current data services.
- **Nationaal Archief open data** - public OAI/METS/file access for open material.
- **Natural Earth** - public-domain download.
- **BNE Digital / Biblioteca Digital Hispánica** - no key for normal open access.
- **BnF / Gallica** - public SRU/OAI/Document/IIIF services; no key indicated for initial use.
- **Archives nationales d’outre-mer (ANOM)** - no key/account for normal online research; reproduction requests only after selecting items.
- **John Carter Brown Library / Americana** - no key for initial open-access discovery/use.
- **Wikidata** - public SPARQL; be polite with query limits.

---

# Do not bother setting these up yet

### NYPL Repo API

The NYPL API documentation says the Repo API was deprecated and ceased availability on **2026-08-01**, with no public replacement planned. Use the Digital Collections website and public-domain downloads instead.

### Protomaps hosted/API account

Not needed for v0.1. We can:
- use Natural Earth;
- create our own project layers;
- later extract a regional PMTiles archive from public Protomaps builds if OSM detail is desired;
- host PMTiles ourselves/static-first.

Only create hosted-map credentials if the technical prototype demonstrates a real need.

### Paid archive subscriptions without a rights answer

Do not purchase access merely to discover afterward that our intended derived-data workflow is outside the license. Ask BOA first.

---

# Local secret handling

The repository should contain only `.env.example`.

Local `.env`:

```bash
WHG_API_TOKEN=
EUROPEANA_API_KEY=
SMITHSONIAN_API_KEY=
DPLA_API_KEY=

# Later only:
# PROTOMAPS_API_KEY=
```

Checklist:
- [ ] `.env` is ignored by Git.
- [ ] Never include full tokens in screenshots.
- [ ] Never paste keys into Gemini or other hosted-model prompts.
- [ ] When debugging, log “credential present/missing,” not the credential.
- [ ] Rotate a key if it ever enters Git history.

---

# Account/request status sheet

| Source | Setup/request date | Status | Follow-up date | Notes |
| --- | --- | --- | --- | --- |
| WHG | | | | |
| Europeana | | | | |
| Smithsonian | | | | |
| DPLA | | | | |
| British Online Archives | | | | |
| Prize Papers | | | | |
| PARES item request | | | | |
| ANOM item/reproduction request | | | | |
| BnF/Gallica rights review | | | | |
| TNA image request | | | | |

---

# Recommended order when you return to the desk

**First 10 minutes**
1. WHG / ORCID / token.
2. Europeana personal API key.

**Next 5 minutes**
3. Smithsonian key if convenient.
4. DPLA curl request.

**Next 10 minutes**
5. Send BOA inquiry.
6. Verify current Prize Papers contact and send structured-data inquiry.

**When you have a longer research block**
7. Bookmark ANOM French Antilles + cartothèque searches and identify 3–5 core-period candidates.
8. Use Gallica/BnF to identify at least one 1700–1720 French Antilles map/atlas item for the visual benchmark set.

Then stop. Do not create more accounts until the actual ingestion prototype proves they are useful.
