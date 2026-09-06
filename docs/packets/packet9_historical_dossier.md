# Historical Review Dossier — Packet 9: First Dutch Atlantic Documentary Thread

**Repository**: `edonahue/charted-currents`  
**Feature Branch**: `packet9-dutch-documentary-thread`  
**Base**: `origin/main` (`533fb01c0cd81ca89a4b5feb477d4e6a2f0af62e`)  
**Corpus Version**: `0.7.0`  
**Lifecycle State**: `PACKET IMPLEMENTATION SELF-VERIFIED — EXTERNAL REVIEW REQUIRED`

---

## 1. Archival Provenance & Ingestion Context

Packet 9 introduces the first Dutch Atlantic documentary thread to Charted Currents, connecting Dutch archival finding aids with English prize court proceedings and the Spanish Carrera de Indias.

* **Holding Institution**: Nationaal Archief, Den Haag, Netherlands (`NL-HaNA`)
* **Archival Series**: Archive `2.22.24` — *Inventaris van het archief van de High Court of Admiralty: Prize Papers (Sailing Letters), ca. 1564-1830*
* **Acquired Component Units**:
  * `HCA 32-11.380`: *Schip Nostra Seniora Concepcion y St Joseph van Cadiz onder leiding van Antonio de Witte; 1666* (Persistent Handle: `hdl:10648/aa19a57e-e115-094f-e053-09f0900ae341`, 15 digitized scans).
  * `HCA 32-11.391`: *Schip Nostra Seniora Concepcion y St Joseph onder leiding van Antonio de Witte; 1666* (Persistent Handle: `hdl:10648/aa19a57e-e120-094f-e053-09f0900ae341`, 21 digitized scans).
* **Upstream Archival Custody**: The physical 17th-century prize manuscripts and seized papers are held at **The National Archives (UK), Kew** in series `HCA 32` (*High Court of Admiralty: Prize Papers*). The photographic duplicate collection and archival finding aid were created by the Nationaal Archief in cooperation with TNA.
* **Inspection State**: `digital_content_inspected` (the finding aid entries, METS manifests, and digital facsimile scans were inspected; the physical manuscripts at Kew were not independently examined).
* **Rights Posture**: `open_public_domain` / `cc0_and_public_domain` (verified via METS `RightsDeclarationMD RIGHTSCATEGORY="PUBLIC DOMAIN"` and Nationaal Archief Open Data API).

---

## 2. Epistemic Classification of Added Assertions

In accordance with `docs/HISTORICAL_ASSERTION_POLICY.md` and `docs/HISTORICAL_REVIEW_POLICY.md`, all 9 assertions added in Packet 9 are classified by risk and review burden:

### Class A — Direct Archival Transcription (7 assertions)
* `ast_na_380_title`: Finding aid title transcribed verbatim from Nationaal Archief EAD component `HCA 32-11.380` (`"Schip Nostra Seniora Concepcion y St Joseph van Cadiz onder leiding van Antonio de Witte; 1666"`).
* `ast_na_380_ship_name`: Vessel name transcribed as `"Nostra Seniora Concepcion y St Joseph"`.
* `ast_na_380_master`: Master name transcribed as `"Antonio de Witte"`.
* `ast_na_380_year`: Seizure / record year transcribed as `1666`.
* `ast_na_391_title`: Finding aid title transcribed verbatim from component `HCA 32-11.391` (`"Schip Nostra Seniora Concepcion y St Joseph onder leiding van Antonio de Witte; 1666"`).
* `ast_na_391_ship_name`: Vessel name transcribed as `"Nostra Seniora Concepcion y St Joseph"`.
* `ast_na_391_master`: Master name transcribed as `"Antonio de Witte"`.

### Class B — Deterministic Transformation (2 assertions)
* `ast_na_380_dep_cadiz`: Extraction of departure port `Cádiz` from Dutch prepositional phrase `"van Cadiz"`. Normalized to canonical place ID `place_cadiz` (attestation added with `raw_name: "Cadiz"`, `language: "nl"`).
* `ast_na_380_prize_context`: Categorization of legal/operational context as Second Anglo-Dutch War prize seizure based on archive series `2.22.24` (High Court of Admiralty Sailing Letters) and year `1666`.

### Class D — Identity Resolution (1 resolution edge / entity pair)
* **Vessel Resolution**: `occ_ship_nostra_seniora_concepcion_380` is resolved as a distinct canonical vessel `ship_nostra_seniora_concepcion_1666` (`evidence_state: documented`).
  * *Negative proof / conflation prevention*: Although the name *Nuestra Señora de la Concepción* is extraordinarily common in Spanish transatlantic navigation, this vessel is strictly segregated by year (1666), master (Antonio de Witte), and archival provenance (HCA 32-11.380/391). It is not conflated with any other vessel in the corpus.
* **Person Resolution**: `occ_person_antonio_de_witte_380` is resolved as a distinct canonical person `person_antonio_de_witte_1666` (`evidence_state: documented`).
  * *Negative proof / conflation prevention*: Antonio de Witte is recorded as master (*onder leiding van*) of this specific 1666 voyage. He is not merged with any other merchant or mariner named De Witte.

### Class E — Project Display Labels & Disambiguation (1 prose unit)
* Subtitle display: `"(1666, Master Antonio de Witte)"`
* Burden display: `"Burden unrecorded in Dutch inventory"`
* Voyage display: `"Cádiz → Unrecorded destination (1666)"`
* Capture display: `"Prize Papers seized 1666 (Second Anglo-Dutch War, HCA 32-11.380)"`
* Register display: `"NL-HaNA 2.22.24, inv. nr. HCA 32-11.380 / 11.391"`

---

## 3. Constitutional Invariants Audit

| Constitutional Invariant | Status | Verification Evidence |
| :--- | :--- | :--- |
| **1. Never invent history** | **PASS** | Destination port is preserved as `null` / unrecorded. No speculative transatlantic route lines or coordinates were added. Vessel tonnage, dimensions, or crew complements were omitted rather than fabricated. |
| **2. Evidence precedes entities** | **PASS** | Validated unbroken chain: `Source (src_na_2_22_24_sailing_letters) → Source Records (sr_na_hca32_11_380, sr_na_hca32_11_391) → Assertions (9) → Occurrences (ship & person) → Canonical Entities`. |
| **3. Raw values immutable** | **PASS** | Original Dutch finding aid string `"Schip Nostra Seniora Concepcion y St Joseph van Cadiz onder leiding van Antonio de Witte; 1666"` is preserved verbatim in `ast_na_380_title`. |
| **4. Do not silently merge entities** | **PASS** | *Nostra Seniora Concepcion* and master Antonio de Witte remain standalone documented entities bound to their specific 1666 archival occurrence. |
| **6. Honest inspection state** | **PASS** | Source records declare `inspection_state: digital_content_inspected`. Upstream notes clarify that physical manuscripts at Kew were not examined directly. |
| **8. Respect rights and boundaries** | **PASS** | Curated single facsimile scan (`public/assets/visuals/na_hca32_11_380_facsimile.jpg`, 527 KB) verified Public Domain (`RIGHTSCATEGORY="PUBLIC DOMAIN"`). Full 36-scan set linked via persistent handles without git repo bloat. |
| **10. Uncertainty in route geometry** | **PASS** | Because destination is unrecorded, zero artificial route geometry was generated in `routes.geojson`. Vessel appears truthfully as a documented departure at Cádiz without a phantom trajectory. |

---

## 4. Verification & Behavioral Test Summary

All verifications executed cleanly against local runtime and Chrome DevTools Protocol:

* **Offline Acquisition Verification**: `python3 scripts/acquire-na-sailing-letters.py --verify-only` (PASS)
* **Corpus Pipeline Compilation**: `python3 data/pipeline/build_corpus.py && python3 scripts/build-dataset-context.py` (PASS)
* **Artifact Schema & Relational Validation**: `node scripts/validate-published-data.mjs && node scripts/validate-dataset-context.mjs` (PASS, 0 errors across 8 published files)
* **Python Domain Invariants**: `python3 -m unittest discover tests` (55 tests PASSED)
* **Negative Mutation Testing**: `node tests/test_validator_negative.mjs` (28 negative invariants PASSED)
* **TypeScript & Static Production Build**: `astro check && astro build` (34 files PASSED with 0 errors, 0 warnings)
* **Historical Review Bundle**: `node scripts/generate-review-bundle.mjs` (Generated `data/review/bundles/packet9/review_bundle.json`, 0 exception queue items)
* **CDP Behavioral Test & Multi-Viewport Review**: `node scripts/capture-reviews.mjs --packet=packet9` (258 PASSED, 0 failed, 0 runtime exceptions)

---

## 5. Review Artifacts Captured

1. `design/reviews/packet9-nostra-seniora-inspector-1440x900.png` (536,107 bytes): Demonstrates vessel selection in EntityInspector, showing canonical title, subtitle, master Antonio de Witte, Cádiz departure origin, unrecorded destination, and network connections.
2. `design/reviews/packet9-nostra-seniora-source-drawer-1440x900.png` (614,488 bytes): Demonstrates SourceDrawer evidence card showing Nationaal Archief 2.22.24 finding aid, Open Public Domain rights posture, persistent handle link (`hdl:10648/...`), 15 scans readout, and high-resolution primary archival facsimile scan with direct deep-link to the Nationaal Archief digital viewer.
