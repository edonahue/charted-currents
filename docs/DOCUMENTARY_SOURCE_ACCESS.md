# Documentary & Archival Source Access Guide

**For:** Charted Currents  
**Last reviewed:** 2026-08-31  
**Purpose:** give humans and research agents a practical route from a research question to the relevant catalogue, series, item, copy/reproduction, and stable archival identifier for high-value documentary sources.

Read this with:

- `docs/DATA_SOURCES.md`
- `docs/HUMAN_SOURCE_SETUP.md`
- `docs/PRE_INGESTION_NORMALIZATION_POLICY.md`
- `docs/SOURCE_RIGHTS.md`
- `research/documentary_sources.yml`

## Core access rule

A convenient search/calendaring platform is not automatically the underlying historical source.

Prefer this chain when possible:

```text
search/discovery layer
  -> archival series + stable document reference
  -> original manuscript / authoritative digitization / ordered copy
  -> source record
  -> extracted assertion
```

Preserve every useful identifier encountered along the way. Do not throw away the calendar item number, archival series reference, catalogue URL, manuscript folio/page, or later digitization identifier merely because a normalized record exists.

No new Charted Currents API credential is required for the documentary sources in this guide unless separately stated in `.env.example` / `docs/HUMAN_SOURCE_SETUP.md`.

---

# 1. The National Archives (UK) Discovery — core catalogue access

Main catalogue:

https://discovery.nationalarchives.gov.uk/

Research guides:

https://www.nationalarchives.gov.uk/help-with-your-research/research-guides/

## Account / key

- Public catalogue searching: **no account or API key required**.
- Do not request the TNA Discovery API by default; its access/retention terms are handled separately in `docs/HUMAN_SOURCE_SETUP.md`.
- A normal browser search is sufficient for targeted source discovery in Packet 2.

## How to use it

1. Start from the relevant TNA research guide below rather than a global keyword search when the record series is already known.
2. Search/browse the specific series by date, colony, ship, commander/master, port, or other supported catalogue term.
3. Preserve the exact TNA reference, e.g. `HCA 26/2/150`, `CO 1/...`, `CO 5/...`, `E 190/...`.
4. Preserve the Discovery item/series URL and date accessed.
5. Record whether the catalogue entry is only descriptive metadata or whether an image/digital surrogate is actually available.
6. If the original is not online, record the access path: Kew consultation, copy order, published/calendar surrogate, or another archive holding a copy.

Do not cite a search-result URL as if it were the archival identifier. The series/document reference is the durable archival identity.

---

# 2. Calendar of State Papers Colonial (CSP Colonial), America & West Indies

TNA guide:

https://www.nationalarchives.gov.uk/help-with-your-research/research-guides/america-west-indies-calendar-state-papers-colonial-1573-1739/

Broader colonial guide:

https://www.nationalarchives.gov.uk/help-with-your-research/research-guides/american-and-west-indian-colonies-before-1782/

Coverage relevant to Charted Currents: **1574–1739**.

## What it is

CSP Colonial is an editorial calendar: detailed transcripts/abstracts/summaries of original colonial-era documents, arranged chronologically and indexed by people, places, and events. It is an excellent discovery and documentary-context layer, but the calendar entry and original manuscript remain distinct source records.

## Access

TNA states that the calendar is available online through **Colonial State Papers** and **British History Online**, as well as in printed volumes held by academic/specialist libraries and TNA. Access conditions can vary by platform/volume.

For Charted Currents:

1. Search the online calendar for specific names/aliases, places, events, privateering/piracy terms, governors, ships/masters, storms/disasters, customs/trade, etc.
2. Capture:
   - calendar volume/year;
   - calendar item/page number;
   - calendar wording/abstract as a source layer;
   - the archival reference printed with the entry;
   - stable online URL when available.
3. Resolve the calendar reference to the modern TNA `CO` reference before treating it as an archival pointer.
4. Consult/order the original only when the historical question requires the manuscript wording, enclosure, handwriting, marginalia, exact ambiguity, or other evidence lost in the calendar abstraction.

## Critical reference-conversion rule

TNA documents three periods:

- **through 1699:** calendar entries use older references that must be converted to modern TNA references;
- **1700:** the 1700 volume has its own conversion key;
- **1701 onward:** the modern `CO 1/...` or `CO 5/...` reference is generally supplied directly.

Do not invent a modern `CO` reference from an old calendar citation. Preserve the old reference and mark the archival target unresolved until it has been converted by an authoritative key/workflow.

## Source-role treatment

Record the calendar entry as `archival_calendar_or_abstract`. Record the original `CO` manuscript, if inspected, as `primary_original` or appropriate equivalent.

A quotation from the calendar is a quotation from the calendar/editorial transcription, not automatically a literal transcription of the manuscript.

---

# 3. Colonial Office / Board of Trade record series

Useful series named in TNA's colonial research guide include:

- `CO 1` — America and West Indies, Colonial Papers, 1574–1757
- `CO 5` — America and West Indies, Original Correspondence, 1606–1822
- `CO 318` — West Indies, Original Correspondence
- `CO 323` — Colonies, Original Correspondence
- `CO 389` — Board of Trade, Entry Books, 1660–1803
- `CO 390` — Board of Trade, Miscellanea, 1654–1799
- `CO 391` — Board of Trade journal / Commissioners for Trade and Plantations

## Access workflow

1. Use CSP Colonial to discover a relevant document or use Discovery directly when the series/reference is already known.
2. Preserve the `CO` series/document reference.
3. Use the relevant series-level Discovery catalogue to determine whether the piece/item is digitized or requires Kew/copy access.
4. For Board of Trade workflow after 1704, pair incoming colonial correspondence with the published/archival Board journal where useful to trace how the communication was handled.

## Board of Trade journals

The published **Journals of the Commissioners for Trade and Plantations** begin in 1704. TNA identifies the Board's journal as `CO 391`; through April 1704 material is represented in CSP Colonial, with the journal published separately thereafter.

Use the journal for administrative/action context such as receipt, discussion, referral, order, or recommendation. Do not silently transform a Board journal mention into the content of the underlying colonial letter.

---

# 4. HCA 26 — Letters of Marque / legal privateering status

TNA catalogue hierarchy:

`HCA 26` — High Court of Admiralty: Prize Court: Registers of Declarations for Letters of Marque

Public Discovery browse/search is available without a key.

Known item-level descriptions can expose fields such as:

- commander;
- ship name;
- burden/tonnage wording;
- crew;
- lieutenant/master/gunner/boatswain/carpenter/doctor/cook;
- armament;
- owners;
- date;
- folio.

## Access workflow

1. Browse/search `HCA 26`, especially item-level descriptions under `HCA 26/2` for the late 17th/early 18th century.
2. Search candidate ship/commander aliases and relevant dates.
3. Save the exact item reference and all source-described fields exactly as recorded.
4. Treat the record as evidence of a commission/declaration at a particular time, not a permanent ship/person category.
5. Cross-check the commissioned vessel/person against HCA 32, CSP Colonial, Prize Papers/Maritime Labour data, customs records, or other independent occurrences before resolving ship identity.

Never normalize `privateer` into `pirate`. Legal status is jurisdiction- and time-bounded.

---

# 5. HCA 32 — Prize Court / Prize Papers direct archival route

TNA HCA guide:

https://www.nationalarchives.gov.uk/help-with-your-research/research-guides/high-court-admiralty-records/

Relevant arrangement:

- `HCA 32/1–45` — pre-1700; court papers, ships' papers, some mail in transit
- `HCA 32/46–93` — **1702–1733, War of the Spanish Succession**; court papers, ships' papers, some mail in transit

This means HCA 32 directly overlaps Charted Currents' strongest initial 1685–1720 slice.

## Access workflow

1. Search/browse HCA 32 in Discovery using date, ship, master, nationality, voyage/capture terms where cataloguing supports them.
2. Preserve the exact `HCA 32/...` reference even when a Prize Papers Portal record also exists.
3. Preserve the Prize Papers identifier separately as a scholarly-project/digitization identifier when present.
4. If the item is not digitized publicly, use the catalogue reference to plan Kew consultation/copy ordering or to find a scholarly derivative/transcription.
5. Keep court papers, ships' papers, captured mail, and later scholarly metadata as separate source components.

The Prize Papers Portal is a powerful structured discovery/enrichment project; it does not replace the archival identity of the TNA records.

---

# 6. E 190 Port Books — customs/trade corroboration

TNA guide:

https://www.nationalarchives.gov.uk/help-with-your-research/research-guides/merchant-trade-records-port-books-1565-1799/

Series: `E 190`.

## Access reality

TNA says most port books are **not available to view online**. Once an `E 190` document reference has been identified, consultation generally requires:

- visiting TNA at Kew; or
- ordering a copy where the record can be copied; or
- using an existing published transcription/calendar where one exists.

Some port books are held by local archives rather than TNA.

## Search workflow

1. Search the `E 190` series by:
   - head port / lesser port;
   - date;
   - customs official type (`collector`, `controller`, `searcher`);
   - trade type (`overseas`, `coastal`, `import`, `export`).
2. Record the exact E 190 reference.
3. Before spending money on copies, search for published transcriptions and local-archive versions.
4. Use port books mainly as targeted corroboration after a ship/master/merchant candidate is known.

## Interpretation warnings that must survive extraction

TNA explicitly notes that:

- the recorded date can be the **date duty was paid**, not arrival/unloading;
- a declared next destination can be false;
- smuggling/fraud/evasion make the books incomplete measures of actual traffic;
- more than one ship can share the same name;
- foreign names may be anglicized/misheard;
- historical goods/quantities require period-specific interpretation.

Do not convert an E 190 customs transaction directly into an observed voyage-arrival event without evidence.

---

# 7. CUST import/export registers from 1696

TNA's Port Books guide identifies Board of Customs import/export registers beginning in **1696**, including `CUST 2–17` and `CUST 22–37`.

## Access workflow

1. Use TNA Discovery to search the relevant CUST series by year; the online catalogue may not support rich commodity/ship-level searching.
2. Preserve series/piece reference and year.
3. Treat these as customs/accounting records, not automatically as exact voyage chronology.
4. Use them as a complement to colonial shipping lists, HCA/Prize Papers records, and individual port books.

No additional Charted Currents account/key is required for catalogue research.

---

# 8. Privy Council / colonial appeals

TNA guide:

https://www.nationalarchives.gov.uk/help-with-your-research/research-guides/privy-council-since-1386/

Key series:

- `PC 1` — Privy Council correspondence
- `PC 2` — Privy Council registers/transcripts
- `PC 4` — surviving minutes from 1670 onward

TNA notes a subject index for `PC 2` covering **1660–1714** and points researchers to the Ames Foundation's online resource for **Appeals to the Privy Council from the American colonies, 1680–1775**.

## Access workflow

1. Use the Ames Foundation resource as a discovery/digitization aid for a known colonial appeal.
2. Preserve the underlying TNA `PC 1` / `PC 2` reference when supplied.
3. Use TNA Discovery/research guides to locate related Council correspondence/orders/minutes.
4. Treat Ames/editorial descriptions and TNA records as separate source layers.
5. Review Ames reuse terms before automated harvesting or redistribution; do not assume that an online discovery resource grants bulk-data rights.

---

# 9. Jamaica Archives and Records Department (JARD)

Holdings:

https://www.jard.gov.jm/pages/holdings-archives

Research service:

https://www.jard.gov.jm/pages/what-we-do-archives

Contact:

https://www.jard.gov.jm/contact

## Why it matters

JARD holds locally generated Jamaican records, including court material beginning in the 17th century and central/local administrative collections. This is a critical counterweight to London-centered Colonial Office records for a Port Royal/Jamaica-first project.

## Access

JARD provides public research/reference service:

- onsite in its reading room;
- written/mail/email requests;
- telephone requests;
- paid duplication/digitization services where available.

No API key is needed.

## Recommended first inquiry

Ask the **Jamaica Archives Unit** for finding-aid guidance for approximately **1685–1720**, especially:

- Port Royal / Kingston / St Catherine maritime activity;
- Grand Court / Assize / Chancery or other court material relevant to merchants, mariners, privateering or prize disputes;
- Island/central administrative correspondence;
- House of Assembly / governmental proceedings where relevant;
- customs, shipping, port, fortification, harbor, disaster and map/plan material;
- reproduction/digitization options once specific references are identified.

Do not ask staff for a broad undifferentiated scan of "everything about pirates." Give bounded date/place/topic requests.

## What to preserve

- JARD finding-aid/reference number;
- collection/supra-fonds and creating agency;
- item description/date;
- copy/reproduction terms;
- contact/research-request date;
- rights/publication conditions attached to supplied scans.

---

# 10. Nationaal Archief Curaçao

Main site:

https://nationaalarchief.cw/

Contact/research information:

https://nationaalarchief.cw/contact/

Early Curaçao Papers notice:

https://nationaalarchief.cw/curacao-papers-1640-1655-online/

## Access

- Archive consultation is generally free.
- The archive provides an archive overview and selected digital resources.
- Researchers may visit the reading room; the current public site says no appointment is normally required during opening hours, though contacting the archive in advance is sensible for a focused research question.
- Staff-assisted research/copies can carry fees.
- A valid ID is required for first-time onsite registration.
- No Charted Currents API key is required.

The archive's holdings include material from the period of the West India Company on Curaçao, plus maps/drawings and private/government archives.

## First research strategy

1. Inspect the archive overview/digital resources for WIC/Curaçao administration and maritime/commercial records.
2. Use the publicly linked **Curaçao Papers 1640–1655** as an early methodology/authority example, not as a substitute for later 1650–1730 holdings.
3. Contact the archive with a bounded request for finding aids relevant to approximately 1650–1730 maritime trade, WIC administration, port/harbor, privateering/conflict, shipping, customs, Curaçao–New Netherland/Caribbean connections, and maps/plans.
4. Ask explicitly what later 17th/early 18th-century series are digitized, remotely reproducible, or only available onsite.

Preserve archive reference numbers and repository-provided reproduction conditions separately from any translation/transcription we create.

---

# 11. Barbados Department of Archives

Official Barbados Government department page:

https://www.gov.bb/Departments/archives

The department makes archival information available within legal limits and publishes current contact details through the Government of Barbados site.

## Access posture

No Charted Currents API key is needed. Treat this as an **archive/reference-service relationship**, not a scrape/API target.

## Recommended inquiry

Once Barbados becomes part of a real source slice, ask for finding aids covering approximately **1678–1730**, particularly:

- shipping/customs/port records;
- merchants and shipmasters;
- colonial administration and Assembly/Council records;
- courts/probate/deeds where they help identify merchants/owners;
- Bridgetown harbor/fortification/map material;
- records that can corroborate Naval Office Shipping Lists.

Ask about remote reference service, copy/reproduction options, and publication/credit conditions before requesting scans.

Preserve Barbados archive reference numbers as first-class source identifiers rather than storing only local filenames.

---

# 12. Published calendars, digitizations, HathiTrust/Internet Archive/library copies

For public-domain printed calendars/journals/guides, a modern scan host may be the easiest way to search/read the volume.

Treat the layers separately:

```text
archival manuscript
  != printed calendar/journal edition
  != modern scan host
  != OCR text
```

When a scan host is used:

- preserve bibliographic edition/volume/year;
- preserve stable scan URL and page/canvas where possible;
- preserve the underlying archival reference printed in the edition;
- record OCR as a convenience layer, not authoritative transcription;
- verify important quotations against page image and, when necessary, the manuscript.

Do not cite an OCR search hit as if it were a verified transcription.

---

# 13. Access checklist for a new documentary source

Before an agent writes an adapter or a human pays for copies, answer:

- [ ] What exact question will this source answer?
- [ ] Is this the original source, an archival description, an editorial calendar, or a scholarly derivative?
- [ ] What repository/series/item identifiers exist?
- [ ] Is the relevant content actually online?
- [ ] If not, can it be ordered remotely or must it be viewed onsite?
- [ ] Is there a published transcription/calendar that should be checked first?
- [ ] Are access rights and publication/reuse rights different?
- [ ] What image/text/transcription restrictions apply?
- [ ] What date/calendar and historical-unit conventions apply?
- [ ] Is automated access allowed, or should this remain targeted/manual?
- [ ] What source gaps/known biases make absence non-evidence?
- [ ] Which independent source could corroborate the resulting assertion?

## Packet 2 strategy

Do not begin by harvesting every possible documentary source.

Prefer a small cross-source proof:

```text
3–5 named vessels / people / events
  -> HCA 26 / HCA 32 where relevant
  -> CSP Colonial / Board of Trade context
  -> Prize Papers / Maritime Labour / SlaveVoyages where relevant
  -> WHG/place resolution
  -> targeted customs/local-archive corroboration
```

The goal of the first documentary spike is to prove the provenance/entity-resolution architecture, not to maximize row count.