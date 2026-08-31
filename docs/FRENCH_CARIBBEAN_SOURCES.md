# French Caribbean Sources

**Last reviewed:** 2026-08-31

This dossier exists to prevent Charted Currents from becoming a British/Spanish/Dutch maritime reconstruction with French Caribbean material added only as decorative context. French administration, cartography, commerce, slavery, privateering, war, and inter-island movement were structurally important to the Greater Caribbean in the project's 1650–1730 core period.

## 1. Archives nationales d’outre-mer (ANOM) — P0 primary-source lane

ANOM is now a first-tier Charted Currents source.

French Antilles research guide:
https://archives-nationales-outre-mer.culture.gouv.fr/faire-une-recherche/antilles-francaises

Cartothèque:
https://archives-nationales-outre-mer.culture.gouv.fr/faire-une-recherche/la-cartotheque

Reuse policy:
https://archives-nationales-outre-mer.culture.gouv.fr/faire-une-recherche/la-reutilisation-des-archives

### Core-period holdings directly relevant to Charted Currents

ANOM's current guide identifies, among other series:

- central outgoing colonial correspondence, **1654–1816**;
- Guadeloupe correspondence, **1649–1815**;
- Martinique and Îles du Vent correspondence, **1635–1815**;
- Petites Antilles material, **1626–1809**, including Saint-Christophe, Sainte-Lucie, Tobago, Saint-Vincent and other islands;
- the Moreau de Saint-Méry collection, **1492–1817**;
- South America / foreign Antilles map-and-fortification material from **1666**;
- South America / French Antilles map-and-fortification material from **1666**;
- Martinique maps from **1660** and Guadeloupe maps from **1665**;
- Marie-Galante material from **1698** and Saint-Martin from **1717**;
- seventeenth/eighteenth-century Moreau de Saint-Méry atlas material.

The correspondence is valuable beyond political administration. ANOM describes reports, memoranda, decisions, financial material and local proceedings touching commerce, slavery, land, defense and events in the colonies.

### What we should extract first

Create a manually curated seed set before attempting automation:

1. Martinique / Îles du Vent reports around 1685–1720 involving shipping, provisioning, war or privateering.
2. Guadeloupe correspondence in the same window.
3. Petites Antilles records involving Saint-Christophe and neighboring inter-imperial routes.
4. Maps/plans from the 1660–1730 window.
5. Documents that name ships, masters, ports, cargoes, seizures, convoy activity or maritime disruptions.
6. Context events that can be attached to ports/regions with exact archival references.

### Rights and reproduction

ANOM states that freely communicable public information in its archival holdings can be reused freely, commercially or noncommercially, when no third-party intellectual-property rights apply, provided source and integrity requirements are respected. Its legal notice generally places metadata/public data under France's Open Licence unless another right applies.

For public use, retain exact archival references and the required institutional credit, including `Archives nationales d’outre-mer (France)` / `FR ANOM` where appropriate.

Do not infer that every image is open merely because it is old or viewable. Unknown creators/copyright status still require review.

ANOM also offers a practical reproduction service for identified items. Current posted pricing makes small, targeted orders realistic once the project has selected exact documents rather than requesting material speculatively.

## 2. Bibliothèque nationale de France / Gallica — P1 visual and textual source

API/data portal:
https://api.bnf.fr/

Gallica:
https://gallica.bnf.fr/

IIIF documentation:
https://api.bnf.fr/fr/api-iiif-de-recuperation-des-images-de-gallica

Document/OCR API:
https://api.bnf.fr/fr/api-document-de-gallica

BnF/Gallica adds something distinct from ANOM: large-scale discovery and machine retrieval of published maps, atlases, printed books and searchable OCR/text.

### Machine access

Current BnF documentation exposes:

- SRU/OAI metadata/search;
- document metadata services;
- OCR/plain-text retrieval for supported documents;
- IIIF image and presentation services over Gallica imagery.

No project API key is indicated for these public services.

### Rights

BnF descriptive metadata is under France's Open Licence, with source/date requirements.

Gallica digitized content has separate rules. Public-domain BnF reproductions are generally free for noncommercial and academic/scientific reuse with the prescribed Gallica/BnF source credit. Commercial use can require a license, and partner-supplied or copyrighted items may have separate conditions.

Because Charted Currents is presently an open hobby/research project but also a public portfolio project, store the exact item/source reuse statement rather than assuming today's noncommercial use automatically covers every future promotional or revenue-generating use.

## 3. First French cartographic benchmark

### Guillaume Delisle — *Carte des Antilles françoises et des isles voisines*, 1717 / ca. 1718

Greater Caribbean Mapping / LOC discovery record:
https://greatercaribbeanmaps.org/maps/carte-des-antilles-franc%CC%A7oises-et-des-isles-voisines-2/

BnF catalog example:
https://catalogue.bnf.fr/ark:/12148/cb449322487

This is an unusually good design/research companion to Herman Moll's ca. 1715 West Indies map. It is roughly contemporary but organized around the French Lesser Antilles and therefore exposes different names, political assumptions, geographic emphasis and cartographic priorities.

**Design principle:** do not flatten those differences into one supposedly neutral historical basemap. The competing representations are themselves evidence.

## 4. Related French / multinational sources

### Navigocorpus

https://navigocorpus.org/

Navigocorpus is mostly later than Charted Currents' MVP, so it should not be treated as a 1650–1730 foundation. It is nevertheless a highly relevant methodological precedent.

Its public documentation models chronologically ordered ship movements, cargo/taxes, loss/capture events, ship characteristics, captains and places, and describes persistent identifiers created while preserving raw source spelling. Its ship-identity work uses combinations of name, class, tonnage, flag, ports and chronology — closely paralleling Charted Currents' chosen `source assertion -> ship occurrence -> probable/canonical ship` architecture.

Use it to challenge our data model and entity-resolution method. Verify the exact dataset/version license before any substantial bulk ingestion.

### French local archives

ANOM explicitly notes that local colonial-administration archives for Martinique and Guadeloupe are preserved in territorial archives rather than entirely at ANOM. These should become later targeted partners/sources when the first corpus reveals specific gaps.

## 5. French-source balance rule

Before calling a Port Royal-centered vertical slice historically representative enough for public interpretation, check whether nearby French-controlled places and actors are visible through actual French evidence rather than only through British references to them.

At minimum, the serious first corpus should have:

- a French map or chart in the benchmark visual set;
- at least several French archival assertions/documents relevant to the same temporal/geographic network;
- French historical place-name variants in the place authority table;
- explicit documentation of remaining French-source coverage gaps.
