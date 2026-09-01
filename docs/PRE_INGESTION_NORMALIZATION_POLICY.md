# Pre-Ingestion Historical Normalization Policy

**For:** Charted Currents  
**Last reviewed:** 2026-08-31  
**Purpose:** prevent historically meaningful source differences from being erased by technically convenient normalization.

This policy applies before any source adapter promotes raw/source-bounded data into canonical assertions or entities.

## Core rule

> Preserve what the source actually says first. Normalize second, explicitly, reversibly, and with a recorded method.

A clean normalized table is not trustworthy if it silently changes a date, historical unit, place identity, legal status, translation, or evidence class.

---

## 1. Source-role classification

Every source record should identify its role. Suggested values:

- `primary_original`
- `contemporary_copy`
- `archival_description`
- `archival_calendar_or_abstract`
- `modern_scholarly_dataset`
- `authority_index`
- `imputed_or_reconstructed`
- `modern_context`
- `digitization_carrier`

These roles can coexist in one provenance chain. Example:

```text
1698 manuscript
  -> nineteenth-century CSP abstract
  -> modern scan of printed volume
  -> OCR
  -> candidate extraction
  -> Charted Currents assertion
```

Do not flatten that chain into `source = CSP`.

---

## 2. Dates and calendars

Charted Currents' period crosses calendar and year-style systems.

Never store only a modern ISO date when the original source used another calendar/year style or has uncertain precision.

Preserve at least:

```text
date_as_recorded
calendar_system
year_style
date_precision
normalized_date_start
normalized_date_end
normalization_method
normalization_confidence
```

### Required behaviors

- Preserve the literal/edited source date separately from normalized bounds.
- Distinguish Julian/Old Style, Gregorian/New Style, unknown, and source-editor normalized dates when known.
- Treat English/British Old Style year numbering carefully before the 1752 reform; dates between 1 January and 24 March can carry a year-number ambiguity relative to modern convention.
- Do not infer the calendar merely from language or repository; use source/editorial evidence.
- If a scholarly edition silently modernizes dates, record that the date comes through an editorial normalization layer.
- Support exact date, month-only, year-only, ranges, circa, before/after bounds, and unresolved dates without manufacturing precision.

Public UI may display a normalized date for readability only if Research View can expose the source date/method where the distinction matters.

---

## 3. Historical quantities, tonnage, currency, and units

Never overwrite source units with modern units.

For any historically significant quantity preserve:

```text
raw_value
raw_unit
raw_wording
source_jurisdiction_or_measure_system
normalized_value
normalized_unit
conversion_method
conversion_reference
conversion_uncertainty
```

Examples include:

- ship burden/tonnage;
- cargo weights/volumes/counts;
- currency;
- distance/depth;
- customs duties;
- armament counts/calibres where supplied;
- crew/person counts.

### Rules

- `tons burden` is not silently converted to metric tonnes.
- Historical tonnage formulas can differ by period/jurisdiction/source; preserve the source measure even if no defensible conversion exists.
- Commodity measures can be commodity-specific and locality-specific.
- Currency values should preserve denomination and context before any modern-value comparison.
- A normalized value may be null when conversion would imply false precision.

---

## 4. Ship/person/entity names

Preserve source-bounded occurrences before canonical identity.

For ships preserve at least raw name plus source context such as master/commander, owner, date, tonnage/burden wording, route, flag/authority, rig/type where present.

Name similarity alone cannot merge ships.

For people preserve original spelling and editorial/transcribed spelling separately where possible. Anglicized, translated, abbreviated, phonetic, or OCR-variant names remain aliases/occurrences, not silent corrections.

Authority IDs such as VIAF/Wikidata/WHG/GeoNames can support candidate resolution but do not prove a historical relationship asserted elsewhere.

---

## 5. Places and political jurisdiction

Navigation can use modern canonical place names, but historical assertions must preserve historical naming and jurisdiction separately.

Preserve:

```text
raw_place_name
source_place_description
candidate_canonical_place_id
historical_jurisdiction_assertion
jurisdiction_date_or_range
geometry_source
geometry_precision
resolution_state
```

### Rules

- A modern GeoNames/WHG coordinate is not automatically the historical port geometry.
- Place identity and political jurisdiction are different assertions.
- Boundaries, sovereignty, colonial control, occupation, capture, and administrative responsibility must be time-bounded and sourced.
- Do not back-project modern municipal boundaries into the seventeenth century.
- Port/harbor morphology may have changed; preserve source geometry and publication precision separately.

---

## 6. Legal maritime status

`pirate`, `privateer`, `commissioned vessel`, `prize`, `enemy vessel`, `neutral`, `smuggler`, etc. are not timeless identity labels.

Represent legal/status claims as dated/jurisdiction-specific assertions supported by a source such as a letter of marque, prize-court record, government order, or other documentary evidence.

A letter of marque can document authorization under a specific sovereign/commission/date. It does not establish how every other authority or later source classified the same person/vessel.

---

## 7. Documentary abstractions and quotations

Distinguish:

- original manuscript wording;
- contemporary copy;
- editorial transcript;
- editorial summary/calendar;
- OCR;
- AI-generated candidate transcription/translation.

A quotation should identify which layer it comes from.

Never quote an editorial calendar as if the words were verified against the original manuscript unless they actually were.

OCR is a discovery/extraction aid. Important quotations and identity-bearing text should be checked against a page image/manuscript/transcription of known provenance.

---

## 8. Language and translation

Preserve original-language source text/snippets where rights permit and where useful for verification.

Store translations separately:

```text
original_text
original_language
transcription_source
translation_text
translation_method
translator_or_model
review_state
```

AI translation may propose a candidate interpretation but cannot silently replace ambiguous historical terminology.

Terms for vessel type, legal status, race/status, occupation, commodity, institution, and geography can be historically specific; prefer a glossary/taxonomy plus raw wording rather than forced one-to-one translation.

---

## 9. Documented, imputed, reconstructed, contextual

Preserve evidence origin at field/assertion level where the source mixes them.

Example with SlaveVoyages:

```text
source = SlaveVoyages
source_variable = <variable>
evidence_origin = documented | imputed
rights_component = <applicable component rights>
```

Do not copy an imputed field into a canonical assertion and later present it as directly documented.

Project public evidence states remain:

- `Documented`
- `Probable Match`
- `Reconstructed`
- `Contextual`

Source-level imputation/extraction state is separate from those public presentation states.

---

## 10. Field/component-level rights

One source record can contain components with different rights.

Track separately where needed:

```text
metadata_rights
historical_fact_rights
transcription_rights
image_rights
imputed_value_rights
derived_data_rights
required_attribution
```

A permissive API key or public webpage does not establish image/transcription/derived-data rights.

---

## 11. Archive and authority identifiers

Prefer native/stable IDs over locally invented IDs for source records:

- TNA series/item references (`HCA`, `CO`, `E`, `CUST`, `PC`)
- archive call/reference numbers
- museum accession/catalog IDs
- WHG/GeoNames identifiers for place-candidate resolution
- VIAF/Wikidata IDs for supplemental authority crosswalks
- DOI/ARK/Handle/PURL where supplied
- IIIF manifest/canvas IDs for digital cultural-heritage resources

Project IDs may exist in addition, but never replace or discard native source identifiers.

---

## 12. Cross-source corroboration strategy

The first real corpus should deliberately exercise overlap rather than rely on one large dataset.

Preferred early pattern:

```text
source occurrence
  -> candidate ship/person/place
  -> independent occurrence in another source family
  -> reversible entity-resolution edge
```

Useful combinations include:

- HCA 26 commission + HCA 32 prize papers;
- HCA/Prize Papers + CSP Colonial / Board of Trade;
- maritime labour dataset + archival occurrence;
- SlaveVoyages vessel occurrence + independent ship/master/port evidence;
- customs/port-book occurrence + known ship/master candidate;
- London/imperial correspondence + Jamaica/Curaçao/Barbados local archive evidence.

Absence in a source is not negative evidence unless the source's coverage/completeness makes that interpretation defensible.

---

## 13. Adapter gate

Before a source adapter can promote records into normalized staging/assertions, document:

- [ ] source role(s);
- [ ] source/edition/version;
- [ ] calendar/date conventions;
- [ ] unit/quantity conventions;
- [ ] place-name/jurisdiction conventions;
- [ ] known editorial/OCR/imputation layers;
- [ ] relevant rights by component;
- [ ] native identifiers preserved;
- [ ] source coverage and known gaps;
- [ ] whether automated access is permitted;
- [ ] field mappings that preserve raw values;
- [ ] transformations/conversions and tests;
- [ ] unresolved semantics that must remain unresolved.

If these are unknown, ingest into raw/research staging only. Do not promote the uncertain normalization into public/canonical data simply to keep the pipeline moving.