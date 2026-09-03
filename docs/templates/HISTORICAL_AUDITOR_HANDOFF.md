# Historical auditor handoff templates

Use these prompts with a separate Gemini conversation, OpenCode, Freewheel, or another review harness.

The reviewer is a **read-only process auditor**. It is not a historical source and has no publication authority.

Give the reviewer the smallest relevant bundle plus the policy files it needs. Do not ask it to reverse-engineer the whole application.

## Common rules for every auditor

Include these rules in every review task:

> You are auditing Charted Currents historical claims. Assume consequential claims may be wrong. Compare claims to the supplied evidence and policy. Report findings; do not edit reviewed historical data, merge entities, change inspection/evidence states, weaken validators, commit, or push. Missing or contradictory evidence is a valid outcome. Multiple model reviewers agreeing do not create historical corroboration. Do not fill gaps from plausibility or general historical knowledge unless the task explicitly asks for outside research, and clearly separate any such outside research from bundle-derived evidence.

## Source-fidelity auditor

Use primarily for Class A–C claims.

### Input

Provide:

- review-bundle summary;
- sampled changed assertions;
- relevant SourceRecord metadata;
- approved source fixture or exact retrieval reference;
- transformation/join metadata where applicable;
- `docs/HISTORICAL_ASSERTION_POLICY.md`;
- `docs/HISTORICAL_REVIEW_POLICY.md`.

### Prompt

> Audit each supplied claim against its attached source evidence. For direct claims, verify raw value, source record, evidence layer, and inspection state. For transformed claims, verify that the transformation is deterministic, preserves the raw input, and adds no historical meaning. For relational claims, verify the exact join/aggregation and distinguish project-derived values from source-native values. Flag false precision, source-layer inflation, unverifiable references, and source-chain evidence presented as independent corroboration. Do not judge whether the historical source itself is ultimately true; judge whether Charted Currents represented the available evidence faithfully.
>
> Return one row per reviewed claim with: claim/assertion ID, class, result, source record(s), exact concern, and recommended action.
>
> Allowed results: PASS, MISMATCH, UNVERIFIABLE, SOURCE_LAYER_ERROR, DERIVATION_ERROR, ESCALATE.

## Adversarial entity-resolution auditor

Use for consequential Class D dossiers.

### Input

Provide:

- one or more resolution dossiers;
- referenced source/assertion evidence;
- `docs/ENTITY_RESOLUTION_POLICY.md`;
- `docs/HISTORICAL_ASSERTION_POLICY.md`.

### Prompt

> Try to disprove each proposed identity resolution. Evaluate positive discriminators, contradictory evidence, discounted evidence, missing discriminators, chronology, geography, and source dependencies. Name equality is candidate generation, not proof. A source-provided authority/entity ID is evidence about that source's editorial model and must be discounted if it conflicts with raw records. Do not reward a clean graph over historical ambiguity.
>
> For every dossier, return: proposed state, strongest supporting evidence, strongest counter-evidence, source-dependency concerns, missing evidence that would most change the decision, result, and recommended action.
>
> Allowed results: ACCEPT_AS_STATED, DOWNGRADE, UNRESOLVED, CONFLICT, NEEDS_MORE_EVIDENCE, ESCALATE.

## Interpretive-prose auditor

Use for Class E/G public copy.

### Input

Provide:

- exact changed prose/claim;
- source assertions it describes;
- relevant secondary scholarship citation plus the inspected pages/excerpts/notes available to the project;
- `docs/SECONDARY_SCHOLARSHIP_POLICY.md`;
- `docs/HISTORICAL_ASSERTION_POLICY.md`.

### Prompt

> Audit the historical prose for claims stronger than its support. Separate direct evidence description from interpretation and causality. Check whether the cited secondary scholarship supports the precise sentence, whether important alternatives are omitted, whether terminology/geography is anachronistic, whether a primary citation was borrowed through a secondary work without disclosure, and whether plausible model-generated connective prose is being presented as history. Prefer omitting an unsupported sentence to manufacturing a weaker-sounding but still unsupported one.
>
> Return each claim/sentence with: class, support status, citation/source issue, overstatement or causality issue, recommended action, and escalation reason if any.

Suggested results: SUPPORTED_AS_WRITTEN, NARROW_WORDING, ADD_CITATION, SOURCE_LAYER_ERROR, OMIT, CONTESTED, ESCALATE.

## Reconstruction auditor

Use for Class F work after reconstructed movement research begins.

### Prompt

> Audit the reconstruction method rather than treating model output as source evidence. Verify inputs, assumptions, temporal/geographic precision, uncertainty representation, and separation between observed historical points and reconstructed movement. Flag any reconstructed geometry/value styled or described as directly documented. Review cannot upgrade reconstructed evidence to documented.

## Adjudication handoff

When several auditors have completed work, do not choose by vote.

Give the adjudicator:

- the review report/exception queue;
- relevant claim/dossier;
- source evidence;
- all materially different auditor findings;
- repository policy;
- exact publication decision being requested.

Ask:

> Reconcile the evidence and review findings. Do not count model votes as historical evidence. Decide whether the project has represented the sources responsibly and whether the public claim should remain as stated, be narrowed/downgraded, remain unresolved, be quarantined, or be escalated for qualified external review. Identify the smallest required correction.

## Efficient model allocation

Current intended workflow:

- Gemini/Antigravity: primary Charted Currents builder and first-line researcher;
- a separate Gemini context or cheap/free OpenCode/Freewheel model: source-fidelity/adversarial bulk review;
- ChatGPT: higher-order repository/source review and adjudication of difficult disagreements;
- external historians/archivists/domain specialists: narrow expert review where it adds real historical value.

This allocation is a workflow convention, not a hierarchy of historical authority.

## Output hygiene

Until a canonical machine-readable review report exists:

- keep auditor output local/ignored or in the conversation;
- do not commit raw model transcripts;
- do not include secrets, local paths, restricted source contents, or sensitive archaeology data;
- commit a review artifact only when the scholarly-review protocol defines it as durable and public-safe.