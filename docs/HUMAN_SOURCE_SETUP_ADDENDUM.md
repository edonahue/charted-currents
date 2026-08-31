# Human Source Setup Addendum

**Last reviewed:** 2026-08-31

Read this with `HUMAN_SOURCE_SETUP.md`. The recovered main checklist remains valid; this addendum records the newest source research and a few clarifications found during re-verification.

## 1. World Historical Gazetteer: ORCID remains the intended current path

WHG's March 2026 authentication announcement says registered users/API users authenticate through ORCID, and its current API documentation says registered users generate tokens from the Profile page.

Action remains:

- [ ] use/create ORCID;
- [ ] sign in through the **current production WHG login screen**;
- [ ] Profile -> generate API token;
- [ ] store only in local `.env` as `WHG_API_TOKEN`;
- [ ] send a meaningful User-Agent in API requests.

Some WHG documentation pages appear to be in transition and can describe older account behavior. If documentation and the live sign-in screen disagree, follow the production sign-in flow and record what actually worked.

## 2. British Online Archives: ask before buying anything

The current `Power and Profit` collection overview presents institutional trial/sales access for that specific collection. Other BOA collections still advertise individual £40/week and £80/month licenses, so a generic BOA single-user offering should **not** be assumed to include `Power and Profit`.

The existing inquiry in `HUMAN_SOURCE_SETUP.md` is the right first move.

- [ ] Send the research/data-use inquiry.
- [ ] Ask specifically whether independent access to **Power and Profit** can be arranged.
- [ ] Ask about structured export/OCR/API and derived factual use before paying for access.

## 3. ANOM: no account or API key needed now

French Antilles research guide:
https://archives-nationales-outre-mer.culture.gouv.fr/faire-une-recherche/antilles-francaises

Reproduction service:
https://archives-nationales-outre-mer.culture.gouv.fr/infos-pratiques/obtenir-une-reproduction

There is no credential task for initial ANOM research.

When the project selects an exact undigitized/high-resolution item:

- [ ] record its full `FR ANOM` reference;
- [ ] confirm its rights/communicability state;
- [ ] submit a reproduction request only if needed;
- [ ] record cost/conditions and required credit.

ANOM's currently posted reproduction pricing makes a small number of targeted requests practical; do not order material before the project has identified a genuine use.

## 4. BnF / Gallica: no API key needed now

API portal:
https://api.bnf.fr/

Gallica's SRU/OAI, document/OCR and IIIF services are publicly documented without a project key requirement.

No account setup is needed for v0.1.

For each selected image/document:

- [ ] preserve the ARK/permalink;
- [ ] record whether the source is BnF or a partner institution;
- [ ] capture exact reuse terms;
- [ ] use the prescribed Gallica/BnF credit where applicable;
- [ ] re-check rights if the site's use later becomes commercial/promotional in a way not covered by the current free-reuse terms.

First research target:

- [ ] locate/select a Guillaume Delisle French Antilles map around 1717–1718 for comparison with Herman Moll ca. 1715.

## 5. Prize Papers: the existing request remains worth sending

Current Portal beta documentation still says future versions will allow structured data access for subsequent use. Current image terms still restrict TNA images to research/private study/education, directing other uses to The National Archives Image Library.

Recent Prize Papers materials still publicly list Dr Lucas Haasis as a project contact, but verify the current project contact page immediately before sending because addresses/roles can change.

The key distinction in the existing email is correct:

**ask for structured research data/metadata reuse, not blanket permission to republish scans.**

## 6. No-account source list: add these

Add to the main checklist's no-account sources:

- **Archives nationales d’outre-mer (ANOM)** — online research now; item reproduction request later only if needed.
- **BnF / Gallica** — public machine services; item/content rights still checked individually.

## Updated human action order

### At your desk: credentials and outbound requests

1. WHG / ORCID / API token.
2. Europeana personal API key.
3. Smithsonian key if convenient.
4. DPLA key request.
5. Send BOA inquiry.
6. Verify Prize Papers contact and send structured-data inquiry.

### During a longer source-research block

7. Explore ANOM Martinique/Guadeloupe/Petites Antilles records and select 3–5 core-period candidates.
8. Select at least one 1700–1720 French cartographic benchmark from Gallica/LOC/ANOM.
9. Request reproductions only after an exact item has earned a place in the product.

Do not create additional accounts simply because a cultural institution offers one.
