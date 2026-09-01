# Source Rights and Ingestion Policy

**Last reviewed:** 2026-08-31

This document is project governance, not legal advice.

A source can be historically valuable without being suitable for automated ingestion, redistribution, or image reuse. Charted Currents therefore treats **access**, **factual data rights**, **database rights**, **metadata rights**, **transcription/text rights**, **scan/image rights**, and **derived-output rights** as separate questions.

## Core rule

> Never infer reuse rights from age, accessibility, or the fact that something is visible in a browser.

Store an explicit rights state at the source/item level.

## Rights states

Use one of:

- `open_public_domain`
- `open_cc0`
- `open_attribution`
- `open_noncommercial`
- `research_only`
- `permission_required`
- `mixed_item_level`
- `unknown_review_required`

If the state is `unknown_review_required`, the asset/data does not enter a public build.

---

## Source-specific posture

### CrespoDynCoopNet

The Spanish government catalog links the **Open Data Commons Database Contents License 1.0** and distributes the MDB directly.

**Allowed project posture:** local ingestion and research are clearly intended. Preserve source identifiers. Before distributing a substantial transformed bulk derivative, re-check the database-content license and document attribution/derivative obligations.

### International Maritime Labour Market, 1650-1815

UK Data Service / ReShare record (SN 852135, Van Lottum, Jelle) marks `Ship.csv` and `Crew.csv` open access and available to anyone without registration.

**Allowed project posture:** Approved by maintainer governance decision for small, attributed, derived factual publication in Charted Currents. Charted Currents does not assert or exercise bulk redistribution rights for the IMLM CSVs; bulk mirroring is outside the approved Packet 2 use. Attribution to Jelle Van Lottum / University of Birmingham and UK Data Service SN 852135 is mandatory. Historical facts from underlying TNA HCA 32 Prize Papers are classified as documented public domain.

### PARES / Spanish State Archives

PARES states:

- consultation is free and requires no registration;
- descriptive information and images of **public-domain** State Archive documents accessible through PARES can be reproduced and used without prior permission;
- required source attribution applies;
- non-public-domain documents require rights-holder permission for public dissemination;
- higher-quality or undigitized reproductions can be requested from the holding archive and may carry public reproduction fees.

**Allowed project posture:** public-domain item metadata/images can be used with the required archive/reference citation. Store item-level status. Never assume all PARES images are public domain.

### SlaveVoyages

SlaveVoyages distinguishes:
- facts transcribed from historical documents: **public domain**;
- imputed database values: **CC BY-NC 3.0 US**;
- site text and some other intellectual content: separate CC BY-NC terms;
- images: provider/holding-institution rights.

**Allowed project posture:** ingest historical facts while preserving documented vs imputed status. If using imputed values in a public derived dataset, retain their noncommercial license provenance. Do not republish SlaveVoyages images based only on the database license.

### Nationaal Archief

The Dutch National Archives publishes:
- most archive inventories as **CC0** EAD/XML via OAI-PMH;
- scans/digital objects as **Public Domain / CC0** when explicitly marked/open;
- machine-readable METS/file endpoints for open digital material.

It states that images with a download button and Public Domain/CC0 marking are reusable without restrictions. Items without the open/download state may remain copyrighted.

**Allowed project posture:** automate against open inventories and open scans; enforce item-level rights checking before copying scans into public assets. Credit is appreciated even where not legally required.

### Library of Congress

The loc.gov API is public/no-key, but rights remain item-specific.

**Allowed project posture:** ingest metadata and links; before using a visual, store the item Rights & Access/Rights Advisory. Prefer clearly public-domain/no-known-restriction historical maps and images.

### Greater Caribbean Mapping

Treat the downloadable CSV primarily as a **discovery catalog**. It points to many holding institutions.

**Allowed project posture:** ingest catalog metadata only after reviewing project terms; never interpret the catalog as granting rights to linked map images. Resolve rights at the holding institution/item.

### Rijksmuseum

Rijksmuseum's current policy makes much collection metadata and many high-resolution images available under Public Domain/CC0, while some material is CC BY 4.0 or restricted.

**Allowed project posture:** use the no-key APIs; store the per-object rights/licensing statement. Public-domain/CC0 images can be public assets. Credit the Rijksmuseum even when optional.

### John Carter Brown Library

Current JCB/Americana messaging describes broad Open Access and asks users to credit the John Carter Brown Library. Some **legacy Brown CDS/LUNA item pages still carry older permission-required language**.

**Allowed project posture:** prefer current Americana/JCB item records and inspect the item rights. If a candidate asset is surfaced through a legacy interface with restrictive language, do not assume it is cleared; contact JCB if needed.

### Biblioteca Nacional de España / BNE Digital

BNE states that public-domain images available in its digital repositories may be publicly reused, including commercial and academic use, without prior authorization, generally under **CC BY 4.0 or equivalent**, with required source credit.

**Allowed project posture:** use clearly public-domain/open BNE Digital/BDH items with the required credit and item permalink. Check any item-specific conditions.

### Smithsonian Open Access

Open Access assets are offered under CC0 where supplied; non-open media may expose metadata without media files.

**Allowed project posture:** ingest Open Access metadata and CC0 assets. Do not treat all Smithsonian objects as Open Access simply because metadata is returned.

### Europeana

Europeana is an aggregator. API access requires a key, but the media rights statements come from providers/items.

**Allowed project posture:** use as discovery/metadata. Resolve and preserve the Europeana rights URI and preferably the provider's original rights record before public image use.

### DPLA

DPLA's API/bulk data is intended for reuse and discovery. DPLA items point back to contributing institutions.

**Allowed project posture:** use DPLA metadata/discovery; image/media reuse depends on provider/item rights.

### NYPL Digital Collections

Public-domain/no-known-US-copyright items can be downloaded in high resolution and reused without NYPL permission; NYPL metadata is CC0. The Repo API was retired 2026-08-01.

**Allowed project posture:** manual discovery and reuse of explicitly public-domain assets with item permalink/rights statement. Do not build new API dependency.

### dLOC

Rights are partner/item-specific.

**Allowed project posture:** use for discovery and metadata; only copy an image after item-level rights review.

### Natural Earth

Natural Earth vector/raster data is public domain.

**Allowed project posture:** freely use and transform as map base geometry.

---

## Restricted / permission-first sources

### Prize Papers Portal

The Portal is open for research and has a rich structured model, but:

- current public Terms of Use restrict TNA images to research/private study/education;
- public use of images outside those purposes goes through The National Archives Image Library;
- the Portal states that a future version will allow access to its structured data for subsequent use.

**Policy:** do not scrape the Portal to simulate a bulk API. Request structured-data access/reuse terms. Treat metadata, structured research data, transcriptions, and scans as separate rights components.

### Naval Office Shipping Lists / British Online Archives

BOA is a licensed publisher/platform. Its terms permit reasonable quantities for research but do not grant bulk extraction/republication rights. Its `Power and Profit` collection is extraordinarily relevant but should not become a gray-market source.

**Policy:** do not automate or scrape BOA paid content. Request research access and a clear position on structured/derived factual use. In parallel, investigate original TNA records/microfilm and produce our own documented transcription where feasible.

### The National Archives image licensing

When an image from TNA/Prize Papers is not covered for public use, obtain the required image permission/license before committing it as a public web asset.

---

## Data facts vs presentation copyright

Historical facts themselves may be uncopyrightable/public domain while a database selection, transcription, OCR layer, image, or editorial presentation may have separate rights.

That distinction is **not** permission to reverse-engineer restricted databases.

Project rule:

> If our factual record originates through a restricted presentation, either obtain permission for the intended use or independently derive/verify the fact from an appropriately accessible source.

---

## Publication gate

Before a source can feed production, its registry record must specify:

```yaml
access_status:
automation_status:
metadata_rights:
historical_fact_rights:
transcription_rights:
image_rights:
derived_data_rights:
attribution:
redistribution:
last_rights_review:
review_notes:
```

For every public image, store an asset-level record.

For every bulk-derived dataset, include a machine-readable attribution/source manifest in the public release.

---

## Secrets and licensed files

Never commit:
- API tokens;
- login cookies;
- paid archive downloads;
- restricted scans;
- unlicensed OCR/transcriptions;
- raw local data whose redistribution has not been cleared.

The `.gitignore` intentionally excludes raw/staging/working data directories. Public derived artifacts must be deliberately placed outside those ignored paths only after rights review.
