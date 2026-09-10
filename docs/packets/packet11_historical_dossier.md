# Historical Review Dossier — Packet 11: First Bounded Privateering Encounter & Prize Connection

**Repository**: `edonahue/charted-currents`  
**Feature Branch**: `packet11-privateering-quality-instrumentation`  
**Base**: `origin/main` (`8b690135b1232f043ee1e6bb436aaae3aea4ee15`)  
**Corpus Version**: `0.7.0`  
**Corpus Title**: `The Greater Caribbean & Transatlantic Maritime Network (1666–1712)`  
**Lifecycle State**: `PACKET 11 ACCEPTED — MERGED — HOSTED VERIFIED`

---

## 1. Archival Provenance & Ingestion Context

Packet 11 introduces the project's first bounded, cross-archival privateering encounter and imperial petition connection. It enriches the existing corpus vessel `ship_richard_and_sarah_1705` (*Richard & Sarah of London*, 300 tons reported burden, voyage Jamaica → London, with Dartmouth, Devon recorded as capture location in May 1705) by connecting two independent bureaucratic source traditions:

1. **The High Court of Admiralty Prize Proceedings**:
   * Upstream Repository: The National Archives (UK), Kew, `TNA HCA 32/80` (*High Court of Admiralty: Prize Court Papers*).
   * Scholarly Dataset Layer: UK Data Service `SN 852135` (*The international maritime labour market in Europe, relational database 1650–1815*, ed. Jelle van Lottum), `sr_imlm_ship_2052`.
   * Recorded Facts: Vessel name *Richard & Sarah of London*, English built, reported age 20, 300 tons burden, owner resident in London, voyage Jamaica to London, capture location recorded as Dartmouth, Devon in May 1705, examinations of crew members John Bull (mate navis, b. North Bergen, subject of Denmark), Robert Ashworth (b. Dexlford, Kent), and Roger Prosser (b. Swansea, Wales).

2. **The Council of Trade and Plantations Reports & Merchant Petitions to Queen Anne**:
   * Upstream Manuscript Series: The National Archives (UK), Kew:
     - `CO 138/11, pp. 415–419` (Board of Trade Jamaica Entry Book, petition entry and report to Secretary of State Robert Harley).
     - `CO 137/7, Nos. 12, 12.i` (Original Correspondence, Jamaica).
   * Published Surrogate Series: *Calendar of State Papers, Colonial Series, America and West Indies, Volume 22 (1704–1705)*, ed. Cecil Headlam (London: HMSO, 1916), accessed via British History Online:
     - `sr_csp_colonial_v22_1352`: Item 1352 (23 Sept 1705, Windsor, p. 628). Petition of 43 merchants trading to Jamaica to Queen Anne asking for the Crown's 1/8th part of the ship *Richard and Sarah*, "captured by a French privateer and recaptured by H.M.S. Rochester."
     - `sr_csp_colonial_v22_1361`: Item 1361 (5 Oct 1705, Whitehall, pp. 629–630). Report of the Council of Trade and Plantations upon Item 1352, detailing the six-hour engagement, mariner resistance, cargo plunder, and petition context citing Jamaica fire and earthquake losses.

* **Dual Archival Independence**: The two source records originate from entirely distinct administrative and legal processes. `HCA 32/80` represents the Prize Court's judicial depositions regarding the prize adjudication in Devon, while `CO 137/7` and `CO 138/11` represent the Colonial Office's administrative review of a merchant petition to the Crown concerning the Queen's one-eighth share.
* **Inspection States**:
  * `sr_imlm_ship_2052`: `dataset_record_inspected` (relational database row inspected directly via UKDA SN 852135; physical manuscript `HCA 32/80` at Kew cited upstream).
  * `sr_csp_colonial_v22_1352` & `sr_csp_colonial_v22_1361`: `digital_content_inspected` (full digital calendar text inspected directly via British History Online; physical manuscript series `CO 137/7` and `CO 138/11` cited upstream).
  * Physical manuscripts at Kew (`CO 137/7`, `CO 138/11`, and `HCA 32/80`) were not directly inspected in the workspace and are honestly marked as upstream citations.
* **Rights Posture**: Public domain. British History Online / HMSO Calendar text was published in 1916 with expired Crown copyright; open factual reuse with proper archival attribution.

---

## 2. Epistemic Classification of Added Assertions

All assertions added in Packet 11 are classified by epistemic risk in accordance with `docs/HISTORICAL_ASSERTION_POLICY.md`:

### Class A — Direct Archival Transcription / Calendar Extraction (9 assertions)
* **Item 1361 (Council of Trade Report, 5 Oct 1705)**:
  * `ast_rs_battle_engagement`: Verbatim raw report: `"The ship had 20 guns and 30 men (9 of which refused to fight). The rest maintained a fight of six hours with a French privateer of 20 guns and 166 men etc."` (`sr_csp_colonial_v22_1361`, `risk_class: A`).
  * `ast_rs_crew_resistance`: Verbatim raw report: `"The ship had 20 guns and 30 men (9 of which refused to fight). The rest maintained a fight of six hours"` (`sr_csp_colonial_v22_1361`, `risk_class: A`).
  * `ast_rs_plunder_cargo`: Verbatim raw report: `"The ship is disabled and the privateer took the most valuable part of the cargo out of her."` (`sr_csp_colonial_v22_1361`, `risk_class: A`).
  * `ast_rs_jamaica_petition`: Verbatim raw report: `"Petitioners have also suffered heavily in Jamaica by extraordinary accidents of fire and earthquakes. They are fit objects for H.M. grace etc."` (`sr_csp_colonial_v22_1361`, `risk_class: A`).
  * `ast_rs_report_date`: Verbatim raw date: `"Whitehall, Oct. 5, 1705"` (`sr_csp_colonial_v22_1361`, `risk_class: A`).
  * `ast_rs_upstream_co`: Citation of upstream manuscript series: `"C.O. 138, 11. pp. 417-419"` (`sr_csp_colonial_v22_1361`, `risk_class: A`).
* **Item 1352 (Merchants' Petition to the Queen, 23 Sept 1705)**:
  * `ast_rs_recapture`: Verbatim raw statement: `"captured by a French privateer and recaptured by H.M.S. Rochester"` (`sr_csp_colonial_v22_1352`, `risk_class: A`).
  * `ast_rs_salvage_petition`: Verbatim raw petition: `"Merchants trading to Jamaica to the Queen. Pray H.M. to give them her 1/8th part of their ship Richard and Sarah, captured by a French privateer and recaptured by H.M.S. Rochester. 43 Signatures."` (`sr_csp_colonial_v22_1352`, `risk_class: A`).
  * `ast_rs_1352_date`: Verbatim raw date: `"Subscribed, Windsor, Sept. 23, 1705"` (`sr_csp_colonial_v22_1352`, `risk_class: A`).

### Class B — Deterministic Geographic / Temporal Transformations
* Origin place mapping: `place_jamaica` (derived from recorded origin Jamaica in IMLM; CSP Items 1352 and 1361 establish Jamaica trade and merchant disaster context but do not explicitly record vessel voyage origin).
* Destination place mapping: `place_london` (derived from recorded destination London in IMLM).
* Arrival place mapping: `place_dartmouth` (derived from arrival port Dartmouth, Devon in IMLM).
* Event date mapping: `1705-05` (derived from recorded arrival date May 1705 in IMLM).

### Class D — Entity Resolution Dossier
* **Occurrences Modeled**:
  * `occ_ship_imlm_2052`: Prize Court record for *Richard & Sarah of London*, 300 tons, Jamaica → London, Dartmouth May 1705 (derived from `sr_imlm_ship_2052` / `HCA 32/80`).
  * `occ_ship_csp_1361`: Council of Trade report for *Richard and Sarah*, Jamaica provenance, 20 guns, 30 men (derived from `sr_csp_colonial_v22_1361` / `CO 138/11`).
  * `occ_ship_csp_1352`: Merchants' petition concerning the Queen's 1/8th share of the *Richard and Sarah*, captured by French privateer and recaptured by HMS Rochester (derived from `sr_csp_colonial_v22_1352` / `CO 137/7` & `CO 138/11`).
* **Canonical Entity**: `ship_richard_and_sarah_1705` (`evidence_state: documented`).
* **Resolution State**:
  * `occ_ship_imlm_2052` → `ship_richard_and_sarah_1705`: `documented_identity`.
  * `occ_ship_csp_1361` → `ship_richard_and_sarah_1705`: `probable_match`.
  * `occ_ship_csp_1352` → `ship_richard_and_sarah_1705`: `probable_match`.
* **Resolution Rationale**: Matches vessel name, Jamaica trade provenance, and 1705 wartime context between HCA prize examination papers and Board of Trade petition reports. However, because the archival linkage between Colonial Office entry books (`CO 138/11`, `CO 137/7`) and High Court of Admiralty records (`HCA 32/80`) relies on shared vessel identity rather than explicit reciprocal administrative docket numbers, the resolution is honestly classified as `probable_match` rather than `documented_identity`.
* **Counter-Hypothesis Analysis**: Could these represent two different vessels named *Richard & Sarah* in Jamaica trade in 1705? While homeward-bound London merchantmen occasionally shared names, the concurrence of a privateering interdiction, cargo plunder, and Dartmouth capture record in mid-1705 strongly supports identity. The resolution edge is explicitly preserved, occurrence-level, and reversible.

---

## 3. Epistemic Boundaries & Ethics

1. **Privateer Status Epistemic Restraint**:
   The attacking vessel is recorded in source text as a "French privateer" of 20 guns and 166 men. The project does not assert an audited letter of marque or declare the vessel a confirmed legitimate combatant under French prize law; it records the attacking vessel as characterized in official English petitions and Council of Trade reports.
2. **Owners' Petition as Source Claim**:
   The claims of prior losses in Jamaica fire and earthquakes are explicitly framed as assertions made by the petitioners to the Crown in seeking relief. The raw Class A text contains no synthetic dates (the source text says "extraordinary accidents of fire and earthquakes" without mentioning years 1692 or 1703).
3. **Capture Record Semantics vs Engagement Location**:
   Event `event_capture_richard_and_sarah_1705` is entitled `Recorded Capture Record of the Richard & Sarah — Dartmouth`. The summary strictly reflects the inspected IMLM dataset field citing HCA 32/80 upstream, which records Dartmouth, Devon as the capture location in May 1705. The inspected calendar entries (CSP Colonial Items 1352 & 1361) record the six-hour engagement, plunder by a French privateer, and recapture by HMS *Rochester*, but do not record the geographic location of that engagement/recapture.

---

## 4. Constitutional Invariants Audit

| Constitutional Invariant | Status | Verification Evidence |
| :--- | :--- | :--- |
| **1. Never invent history** | **PASS** | Battle details (20 guns, 30 men, 6-hour engagement), resistance (9 refused to fight; the rest defended), plunder, and disaster losses are directly quoted from CSP Colonial Items 1352 & 1361. No route waypoints or mid-ocean coordinates were fabricated. |
| **2. Evidence precedes entities** | **PASS** | Validated chain: `Sources (src_imlm_ukda_852135, src_csp_colonial_vol22, src_tna_co_137, src_tna_co_138, src_tna_hca_32) → Source Records (sr_imlm_ship_2052, sr_csp_colonial_v22_1352, sr_csp_colonial_v22_1361) → Assertions (16 total) → Occurrences (occ_ship_imlm_2052, occ_ship_csp_1352, occ_ship_csp_1361) → Class D Edges (3) → Canonical Entity (ship_richard_and_sarah_1705)`. |
| **3. Raw values immutable** | **PASS** | Pure verbatim wording preserved in Class A assertions; derived labels and mathematical inferences (e.g. 21 mariners) are strictly separated. |
| **4. Do not silently merge entities** | **PASS** | Occurrences are modeled independently; CSP occurrences are classified as `probable_match`. |
| **6. Honest inspection state** | **PASS** | `sr_csp_colonial_v22_1352` & `sr_csp_colonial_v22_1361` are marked `digital_content_inspected`; `sr_imlm_ship_2052` is marked `dataset_record_inspected`. Upstream manuscripts `CO 137/7`, `CO 138/11`, and `HCA 32/80` are marked as upstream citations. |
| **7. Dual archival independence** | **PASS** | Corroborated across two independent archival streams (`CO 137/138` vs `HCA 32`). |
| **8. Respect rights and boundaries** | **PASS** | Expired Crown copyright; open factual reuse with archival citations. |
| **10. Route geometry uncertainty** | **PASS** | Route line connects Jamaica and London as `endpoints_only` without synthetic tracks. |
| **24. Review burden rises with inference** | **PASS** | Factual transcriptions are Class A; entity concordance is Class D `probable_match` with documented criteria. |
| **25. Interpretive prose restraint** | **PASS** | Prose reports what petitioners and Board of Trade stated, avoiding unevidenced causal claims. |

---

## 5. Verification Summary

* **Build & Validation**: `python3 data/pipeline/build_corpus.py && node scripts/validate-published-data.mjs` (PASS, 0 errors across 8 published artifacts).
* **Python Invariants**: `python3 -m unittest discover tests` (PASS, 75 tests passed in 1.6s).
* **Negative Validator Tests**: `node tests/test_validator_negative.mjs` (PASS, 30 tests passed).
* **Packet Report Integrity**: `python3 tests/test_packet_report_integrity.py` (PASS, 6 tests passed in 0.2s).
* **Astro Verification**: `npm run verify` (PASS, 0 errors, 0 warnings across 38 files).
* **Behavioral Review Suite**: `npm run review:behavioral` (PASS, 238 tests passed).
* **Quality Audit (CI Mode)**: `npm run review:quality` (PASS in 19.38s, 0 critical, 0 unallowed serious, 4/4 journeys passed).
* **Quality Audit (Full Mode)**: `npm run review:quality:full` (PASS in 24.38s, 5 viewports across 3 states, 7 screenshots generated, 4/4 journeys passed).
