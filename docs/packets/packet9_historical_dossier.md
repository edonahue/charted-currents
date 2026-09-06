# Historical Review Dossier — Packet 9: Direct Prize Papers Documentary Thread via Nationaal Archief

**Repository**: `edonahue/charted-currents`  
**Feature Branch**: `packet9-dutch-documentary-thread`  
**Base**: `origin/main` (`533fb01c0cd81ca89a4b5feb477d4e6a2f0af62e`)  
**Corpus Version**: `0.7.0`  
**Corpus Title**: `The Greater Caribbean & Transatlantic Maritime Network (1666–1712)`  
**Lifecycle State**: `PACKET IMPLEMENTATION SELF-VERIFIED — EXTERNAL REVIEW REQUIRED`

---

## 1. Archival Provenance & Ingestion Context

Packet 9 introduces a direct Dutch archival documentary thread to Charted Currents, connecting Dutch archival finding aids with English prize court proceedings and the Spanish Atlantic maritime world.

* **Holding Institution**: Nationaal Archief, Den Haag, Netherlands (`NL-HaNA`)
* **Archival Series**: Archive `2.22.24` — *Inventaris van het archief van the High Court of Admiralty: Prize Papers (Sailing Letters), ca. 1564-1830*
* **Acquired Component Units**:
  * `HCA 32-11.380`: *Schip Nostra Seniiora Concepcion y St Joseph, van Cadiz, schipper Antonio de Witte; 1666* (Persistent Handle: `hdl:10648/aa19a57e-e115-094f-e053-09f0900ae341`, 5 physical digitized scans).
  * `HCA 32-11.391`: *Schip Nostra Seniora Concepcion y St Joseph, schipper Antonio de Witte; 1666* (Persistent Handle: `hdl:10648/aa19a57e-e120-094f-e053-09f0900ae341`, 7 physical digitized scans).
* **Upstream Archival Custody & Institutional Dependency**: The underlying physical seventeenth-century prize manuscripts and seized papers are held at **The National Archives (UK), Kew** in series `HCA 32` (*High Court of Admiralty: Prize Papers*). The photographic duplicate collection and archival finding aid entries in series `2.22.24` were created by the Nationaal Archief in cooperation with TNA. The Nationaal Archief holds photographic duplicates (microfilm/digital reproductions); the primary legal custody of the physical prize proceedings remains with TNA Kew.
* **Inspection State**: `metadata_only` (archival catalogue finding aid descriptions and verified METS structural metadata were examined; the physical manuscripts at Kew and individual letter contents have not yet been transcribed or indexed).
* **Rights Posture & Licensing Boundary**: `open_access_no_registration_required` (metadata accessible without registration via persistent handles). While the Nationaal Archief metadata is open, digitized image scans are licensed for **non-commercial research use only**. In strict accordance with `docs/PUBLIC_PRIVATE_BOUNDARY.md` and repository integrity rules, the project **fails closed**: no scan facsimiles are hosted locally in `public/assets/visuals/` or misattributed as Public Domain/CC0. Complete scans are accessed exclusively via deep links to the official Nationaal Archief digital viewer using persistent handles.

---

## 2. Epistemic Classification of Added Assertions

In accordance with `docs/HISTORICAL_ASSERTION_POLICY.md` and `docs/HISTORICAL_REVIEW_POLICY.md`, all 9 assertions added in Packet 9 are classified by epistemic risk and review burden:

### Class A — Direct Archival Transcription (8 assertions)
* `ast_na_380_title`: Finding aid title transcribed verbatim from Nationaal Archief EAD component `HCA 32-11.380` (`"Schip Nostra Seniiora Concepcion y St Joseph, van Cadiz, schipper Antonio de Witte; 1666"`).
* `ast_na_380_ship_name`: Vessel name transcribed preserving double-i spelling as recorded (`"Nostra Seniiora Concepcion y St Joseph"`).
* `ast_na_380_master`: Master name transcribed as recorded (`"Antonio de Witte"`).
* `ast_na_380_year`: Seizure / record year transcribed as recorded (`1666`).
* `ast_na_391_title`: Finding aid title transcribed verbatim from component `HCA 32-11.391` (`"Schip Nostra Seniora Concepcion y St Joseph, schipper Antonio de Witte; 1666"`).
* `ast_na_391_ship_name`: Vessel name transcribed preserving single-i spelling as recorded (`"Nostra Seniora Concepcion y St Joseph"`).
* `ast_na_391_master`: Master name transcribed as recorded (`"Antonio de Witte"`).
* `ast_na_391_year`: Record year transcribed as recorded (`1666`).

### Class B — Deterministic Transformation (1 assertion)
* `ast_na_380_origin_cadiz`: Extraction of provenance descriptor from Dutch prepositional phrase `"van Cadiz"`. Recorded as `field: recorded_origin_descriptor` with `raw_value: "van Cadiz"` and display `"Recorded origin: Cádiz"`. This assertion is linked to `place_cadiz.source_assertion_ids` as vessel origin evidence. In accordance with P9-R6, the modern Dutch toponym attestation (`raw_name: "Cadiz"`, `language: "nl"`) was removed from `place_cadiz` so that only seventeenth-century historical attestations remain on the canonical entity.

### Class D — Identity Resolution Dossier (2 canonical entities, 4 resolution edges)
* **Vessel Resolution**: Two separate archival occurrences are modeled:
  * `occ_ship_nostra_seniiora_380`: Raw name `"Nostra Seniiora Concepcion y St Joseph"`, recorded origin Cádiz (`"van Cadiz"`), master Antonio de Witte, year 1666 (from `sr_na_hca32_11_380`).
  * `occ_ship_nostra_seniora_391`: Raw name `"Nostra Seniora Concepcion y St Joseph"`, master Antonio de Witte, year 1666 (from `sr_na_hca32_11_391`).
  * **Canonical Resolution**: Both occurrences are resolved to `ship_nostra_seniora_concepcion_1666` (`evidence_state: probable_match`).
  * **Resolution Edges**: 2 resolution edges, each explicitly marked `resolution_state: probable_match`.
  * **Scholarly Resolution Rationale & Counter-Hypothesis Analysis**:
    1. *Identity Hypothesis*: The near-identical Spanish religious invocation (*Nostra Seniiora / Seniora Concepcion y St Joseph*), exact master name (*Antonio de Witte*), identical year (*1666*), and adjacent archival storage in TNA HCA 32 Box 11 strongly indicate that items .380 and .391 represent papers from the same captured voyage or prize process.
    2. *Counter-Hypothesis*: The two inventory numbers could theoretically represent distinct packets of intercepted letters forwarded under different legal proceedings, or two related vessels in a convoy bearing the same patronal name. Neither inventory entry contains an explicit cross-reference affirming they are the exact same physical hull.
    3. *Classification Decision*: Per `docs/HISTORICAL_ASSERTION_POLICY.md`, inferring single-hull identity across separate archival inventory descriptions without an explicit source assertion is a Class D inference. Therefore, the entity and edges are classified as `probable_match`, not `documented_identity`.

* **Person Resolution**: Two separate archival person occurrences are modeled:
  * `occ_person_antonio_de_witte_380`: Raw name `"Antonio de Witte"`, role `"master"`, vessel `"Nostra Seniiora Concepcion y St Joseph"`, year 1666.
  * `occ_person_antonio_de_witte_391`: Raw name `"Antonio de Witte"`, role `"master"`, vessel `"Nostra Seniora Concepcion y St Joseph"`, year 1666.
  * **Canonical Resolution**: Both occurrences are resolved to `person_antonio_de_witte_1666` (`evidence_state: probable_match`).
  * **Resolution Edges**: 2 resolution edges, each explicitly marked `resolution_state: probable_match`.
  * **Conflation Prevention**: Antonio de Witte is recorded as master of this specific 1666 vessel. He is strictly segregated from any other merchants or mariners named De Witte in Dutch or Flemish Atlantic records.

### Class E — Project Display Labels & Disambiguation
* Subtitle display: `"(1666, Master Antonio de Witte)"`
* Burden display: `"Burden unrecorded in Dutch inventory"`
* Voyage display: `"Recorded origin: Cádiz · Destination unrecorded (1666)"`
* Capture display: `"High Court of Admiralty prize papers (1666, HCA 32-11.380 / 11.391)"`
* Register display: `"NL-HaNA 2.22.24, inv. nr. HCA 32-11.380 / 11.391"`
* **Causal Prose Neutrality**: In accordance with P9-R7, all interpretive claims linking the capture to the Second Anglo-Dutch War were removed (`ast_na_380_prize_context` deleted). The capture is described strictly as an HCA prize papers proceeding without unevidenced military causal narrative.

---

## 3. Constitutional Invariants Audit

| Constitutional Invariant | Status | Verification Evidence |
| :--- | :--- | :--- |
| **1. Never invent history** | **PASS** | Destination port is preserved as `null` / unrecorded. No speculative transatlantic route lines or coordinates were added. Vessel tonnage, dimensions, or crew complements were omitted rather than fabricated. |
| **2. Evidence precedes entities** | **PASS** | Validated unbroken chain: `Source (src_na_2_22_24_sailing_letters) → Source Records (sr_na_hca32_11_380, sr_na_hca32_11_391) → Assertions (9) → Separate Occurrences (2 ship occs, 2 person occs) → Class D Edges → Canonical Entities`. |
| **3. Raw values immutable** | **PASS** | Double-i spelling `"Nostra Seniiora Concepcion y St Joseph"` preserved on .380; single-i spelling `"Nostra Seniora Concepcion y St Joseph"` preserved on .391. Dutch prepositional phrase `"van Cadiz"` preserved as immutable raw value. |
| **4. Do not silently merge entities** | **PASS** | Occurrences are modeled separately before resolution; resolution edges are explicitly recorded with reversible `probable_match` status. |
| **6. Honest inspection state** | **PASS** | Source records declare `inspection_state: metadata_only`. Upstream custody at TNA Kew is explicitly documented. |
| **8. Respect rights and boundaries** | **PASS** | Non-commercial image scans are not hosted locally in repository; direct deep-links to the official Nationaal Archief viewer via persistent handles are provided. |
| **10. Route geometry uncertainty** | **PASS** | Destination is unrecorded; zero synthetic route geometry was generated in `routes.geojson`. Vessel appears truthfully as Recorded Origin at Cádiz without a phantom trajectory. |
| **21. Review cannot upgrade evidence** | **PASS** | Inter-record resolution is classified as `probable_match` despite high circumstantial confidence. |
| **23. Preserve contradictory evidence** | **PASS** | Orthographic variation between .380 (`Seniiora`) and .391 (`Seniora`) is preserved rather than standardized away. |
| **25. Interpretive prose restraint** | **PASS** | Second Anglo-Dutch War causal narrative removed; capture display describes documented archival proceeding only. |

---

## 4. Verification & Behavioral Test Summary

All verifications executed cleanly against local runtime and Chrome DevTools Protocol:

* **Offline Acquisition Verification**: `python3 scripts/acquire-na-sailing-letters.py --verify-only` (PASS, 5 scans in .380, 7 scans in .391, EAD fixture checksum verified)
* **Corpus Pipeline Compilation**: `python3 data/pipeline/build_corpus.py && python3 scripts/build-dataset-context.py` (PASS)
* **Artifact Schema & Relational Validation**: `node scripts/validate-published-data.mjs && node scripts/validate-dataset-context.mjs` (PASS, 0 errors across 8 published files)
* **Python Domain Invariants**: `python3 -m unittest discover tests` (PASS, 55 tests passed)
* **Negative Mutation Testing**: `node tests/test_validator_negative.mjs` (PASS, 28 negative invariants passed)
* **TypeScript & Static Production Build**: `npm run check && npm run build` (PASS, 34 files checked with 0 errors, static build completed)
* **Historical Review Bundle**: `node scripts/generate-review-bundle.mjs` (PASS, `data/review/bundles/packet9/review_bundle.json`, 0 exception queue items)
* **CDP Behavioral Test & Multi-Viewport Review**: `node scripts/capture-reviews.mjs --packet=packet9` (PASS, 257 passed, 0 failed, 0 runtime exceptions)
* **Packet Closeout Reporting**: `npm run packet:report` (PASS, data-derived facts synchronized)

---

## 5. Review Artifacts Captured

1. `design/reviews/packet9-nostra-seniora-inspector-1440x900.png` (538,209 bytes): Demonstrates vessel selection in EntityInspector, showing canonical title, subtitle, master Antonio de Witte, Recorded Origin at Cádiz, unrecorded destination, `Probable Match` evidence badge, and network connections.
2. `design/reviews/packet9-nostra-seniora-source-drawer-1440x900.png` (493,588 bytes): Demonstrates SourceDrawer evidence card showing Nationaal Archief 2.22.24 finding aid, Open access rights posture, persistent handle link (`hdl:10648/...`), 5 scans readout (Non-commercial access via Nationaal Archief), and direct deep-link to the Nationaal Archief digital viewer without local image hosting.
