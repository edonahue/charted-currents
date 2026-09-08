# Historical Review Dossier — Packet 11: First Bounded Privateering Encounter & Prize Connection

**Repository**: `edonahue/charted-currents`  
**Feature Branch**: `packet11-privateering-quality-instrumentation`  
**Base**: `origin/main` (`8b690135b1232f043ee1e6bb436aaae3aea4ee15`)  
**Corpus Version**: `0.7.0`  
**Corpus Title**: `The Greater Caribbean & Transatlantic Maritime Network (1666–1712)`  
**Lifecycle State**: `PACKET IMPLEMENTATION SELF-VERIFIED — EXTERNAL REVIEW REQUIRED`

---

## 1. Archival Provenance & Ingestion Context

Packet 11 introduces the project's first bounded, cross-archival privateering encounter and imperial petition connection. It enriches the existing corpus vessel `ship_richard_and_sarah_1705` (*Richard & Sarah of London*, 300 tons reported burden, voyage Jamaica → London, arrived disabled at Dartmouth, Devon in May 1705) by connecting two independent bureaucratic source traditions:

1. **The High Court of Admiralty Prize Proceedings**:
   * Upstream Repository: The National Archives (UK), Kew, `TNA HCA 32/80` (*High Court of Admiralty: Prize Court Papers*).
   * Scholarly Dataset Layer: UK Data Service `SN 852135` (*The international maritime labour market in Europe, relational database 1650–1815*, ed. Jelle van Lottum), `sr_imlm_ship_2052`.
   * Recorded Facts: Vessel name *Richard & Sarah of London*, English built, reported age 20, 300 tons burden, owner resident in London, voyage Jamaica to London, capture/arrival recorded at Dartmouth, Devon in May 1705, examinations of crew members John Bull (mate navis, b. North Bergen, subject of Denmark), Robert Ashworth (b. Dexlford, Kent), and Roger Prosser (b. Swansea, Wales).

2. **The Council of Trade and Plantations Report & Petition to Queen Anne**:
   * Upstream Manuscript Series: The National Archives (UK), Kew, `CO 138/11, pp. 417–419` (Board of Trade Jamaica Entry Book, Report to Secretary of State Robert Harley).
   * Published Surrogate Series: *Calendar of State Papers, Colonial Series, America and West Indies, Volume 22 (1704–1705)*, Item 1361 (5 Oct 1705), ed. Cecil Headlam (London: HMSO, 1916), accessed via British History Online (`sr_csp_colonial_v22_1361`).
   * Recorded Facts: On 5 October 1705, the Council of Trade and Plantations reported to Secretary Robert Harley upon the petition of the owners and freighters of the ship *Richard and Sarah of London*, 300 tons, bound from Jamaica to London with plantation goods. The vessel was attacked by a French privateer of 20 guns and 166 men, maintaining a six-hour engagement. During the fight, 9 of the 30 mariners mutinied or refused to fight, leaving 21 to defend the vessel until disabled. The vessel was plundered of its most valuable cargo before the remainder arrived in Dartmouth. In their petition, the owners sought imperial relief, noting that they had previously suffered extraordinary losses in the 1692 Port Royal earthquake and the 1703 fire at Jamaica.

* **Dual Archival Independence**: The two source records originate from entirely distinct administrative and legal processes. `HCA 32/80` represents the Prize Court's judicial depositions regarding the prize adjudication in Devon, while `CO 138/11` represents the Colonial Office's administrative review of a merchant petition to the Crown.
* **Inspection States**:
  * `sr_imlm_ship_2052`: `dataset_record_inspected` (relational database row inspected directly via UKDA SN 852135; physical manuscript `HCA 32/80` at Kew cited upstream).
  * `sr_csp_colonial_v22_1361`: `digital_content_inspected` (full digital calendar text inspected directly via British History Online; physical manuscript entry book `CO 138/11` cited upstream).
  * Physical manuscripts at Kew (`CO 138/11` and `HCA 32/80`) were not directly inspected in the workspace and are honestly marked as upstream citations.
* **Rights Posture**: Public domain. British History Online / HMSO Calendar text was published in 1916 with expired Crown copyright; open factual reuse with proper archival attribution.

---

## 2. Epistemic Classification of Added Assertions

All assertions added in Packet 11 are classified by epistemic risk in accordance with `docs/HISTORICAL_ASSERTION_POLICY.md`:

### Class A — Direct Archival Transcription / Calendar Extraction (6 assertions)
* `ast_rs_battle_engagement`: Verbatim report of six-hour battle with French privateer of 20 guns and 166 men (`sr_csp_colonial_v22_1361`, `risk_class: A`).
* `ast_rs_crew_resistance`: Verbatim report that 9 of 30 mariners mutinied or refused to fight while 21 maintained defense until disabled (`sr_csp_colonial_v22_1361`, `risk_class: A`).
* `ast_rs_plunder_cargo`: Verbatim report that the disabled vessel was plundered of its most valuable cargo at sea (`sr_csp_colonial_v22_1361`, `risk_class: A`).
* `ast_rs_jamaica_petition`: Verbatim report of owners' petition citing extraordinary prior losses sustained in the 1692 Port Royal earthquake and 1703 Jamaica fire (`sr_csp_colonial_v22_1361`, `risk_class: A`).
* `ast_rs_report_date`: Report date 5 October 1705 (`sr_csp_colonial_v22_1361`, `risk_class: A`).
* `ast_rs_upstream_co`: Citation of upstream manuscript series `CO 138/11, pp. 417–419` (`sr_csp_colonial_v22_1361`, `risk_class: A`).

### Class B — Deterministic Geographic / Temporal Transformations
* Origin place mapping: `place_jamaica` (derived from recorded origin Jamaica).
* Destination place mapping: `place_london` (derived from recorded destination London).
* Arrival place mapping: `place_dartmouth` (derived from arrival port Dartmouth, Devon).
* Event date mapping: `1705-05` (derived from recorded arrival date May 1705).

### Class D — Entity Resolution Dossier
* **Occurrences Modeled**:
  * `occ_ship_imlm_2052`: Prize Court record for *Richard & Sarah of London*, 300 tons, Jamaica → London, Dartmouth May 1705 (derived from `sr_imlm_ship_2052` / `HCA 32/80`).
  * `occ_ship_csp_1361`: Council of Trade petition record for *Richard and Sarah of London*, 300 tons, Jamaica → London, arrived Dartmouth May 1705 (derived from `sr_csp_colonial_v22_1361` / `CO 138/11`).
* **Canonical Entity**: `ship_richard_and_sarah_1705` (`evidence_state: documented`).
* **Resolution State**: `documented_identity` (supported by concordance across exact vessel name, exact 300-ton burden, exact Jamaica-to-London route, exact May 1705 arrival at Dartmouth, Devon, and the presence of prize/privateer proceedings in both records).
* **Counter-Hypothesis Analysis**: Could these represent two different vessels named *Richard & Sarah* arriving at Dartmouth from Jamaica in May 1705? This is vanishingly improbable: both records document a 300-ton London merchantman homeward bound from Jamaica encountering enemy interdiction and arriving at Dartmouth in the exact same month of May 1705. The resolution edge is explicitly preserved and reversible.

---

## 3. Epistemic Boundaries & Ethics

1. **Privateer Status Epistemic Restraint**:
   The attacking vessel is recorded in source text as a "French privateer" of 20 guns and 166 men. The project does not assert an audited letter of marque or declare the vessel a confirmed legitimate combatant under French prize law; it records the attacking vessel as characterized in the official English petition and Board of Trade report.
2. **Owners' Petition as Source Claim**:
   The claims of prior losses in the 1692 earthquake and 1703 fire are explicitly framed as assertions made by the petitioners to the Crown in seeking relief.
3. **Preservation of Disasters as Historical Context**:
   The explicit mention of the 1692 Port Royal earthquake and 1703 fire connects the maritime interdiction directly to the environmental and urban vulnerability of late seventeenth- and early eighteenth-century Jamaica without synthetic narrative invention.

---

## 4. Constitutional Invariants Audit

| Constitutional Invariant | Status | Verification Evidence |
| :--- | :--- | :--- |
| **1. Never invent history** | **PASS** | Battle details, crew counts (9 mutinied, 21 resisted), gun counts (20 guns), and disaster losses are directly quoted from CSP Colonial Item 1361. No route waypoints or mid-ocean coordinates were fabricated. |
| **2. Evidence precedes entities** | **PASS** | Validated chain: `Sources (src_imlm_ukda_852135, src_csp_colonial_vol22) → Source Records (sr_imlm_ship_2052, sr_csp_colonial_v22_1361) → Assertions (13 total) → Occurrences (occ_ship_imlm_2052, occ_ship_csp_1361) → Class D Edges (2) → Canonical Entity (ship_richard_and_sarah_1705)`. |
| **3. Raw values immutable** | **PASS** | Verbatim wording preserved in Class A assertions; derived labels are strictly separated. |
| **4. Do not silently merge entities** | **PASS** | Multi-occurrence resolution is explicitly recorded in `entity_resolution_edges`. |
| **6. Honest inspection state** | **PASS** | `sr_csp_colonial_v22_1361` is marked `digital_content_inspected`; `sr_imlm_ship_2052` is marked `dataset_record_inspected`. Upstream manuscripts `CO 138/11` and `HCA 32/80` are marked as upstream citations. |
| **7. Dual archival independence** | **PASS** | Corroborated across two independent archival streams (`CO 138/11` vs `HCA 32/80`). |
| **8. Respect rights and boundaries** | **PASS** | Expired Crown copyright; open factual reuse with archival citations. |
| **10. Route geometry uncertainty** | **PASS** | Route line connects Jamaica and London as `endpoints_only` without synthetic tracks. |
| **24. Review burden rises with inference** | **PASS** | Factual transcriptions are Class A; entity concordance is Class D with documented criteria. |
| **25. Interpretive prose restraint** | **PASS** | Prose reports what petitioners and Board of Trade stated, avoiding unevidenced causal claims. |

---

## 5. Verification Summary

* **Build & Validation**: `python3 data/pipeline/build_corpus.py && npm run data:validate` (PASS, 0 errors across 8 published artifacts).
* **Python Invariants**: `python3 -m unittest discover tests` (PASS, 60 tests passed).
* **Astro Verification**: `npm run verify` (PASS, 0 errors, 0 warnings across 35 files).
