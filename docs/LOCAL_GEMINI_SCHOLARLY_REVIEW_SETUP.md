# Local Gemini / scholarly-review setup

This file is the maintainer-facing checklist for any **local** Gemini/Antigravity settings, permissions, or parallel-review setup needed by Charted Currents' scholarly-integrity workflow.

Do not commit real global settings, tokens, authentication files, model-provider credentials, transcripts, private source downloads, or local review scratch data.

## Current maintainer decision: keep the development workflow simple

For the current project phase:

- **do not require Git worktrees**;
- **do not require new Antigravity rules/rulesets**;
- **do not require packet-state hook activation**;
- **do not build a new governance/permissions framework**;
- continue using Gemini/Antigravity as the primary Charted Currents implementation environment on ordinary feature branches;
- use external/parallel agents primarily as read-only historical auditors, not competing implementation agents.

The repository's existing packet hook machinery remains available but is optional. It is inert unless `.agent/active-packet.json` is deliberately created.

Do not activate `.agent/active-packet.json` merely to perform scholarly review.

## Before the scholarly-integrity interstitial session

Required local action:

```bash
git checkout main
git pull --ff-only
```

Then start a fresh Gemini/Antigravity conversation so the updated `GEMINI.md`, context index, and workspace skills are loaded.

No global Gemini settings change is required merely to read and plan the new scholarly-review protocol.

## Recommended Gemini role split

Keep one project as the primary implementation context:

### Primary Gemini builder

Use for:

- packet planning;
- source profiling;
- adapters/extraction;
- domain/publication implementation;
- UI work;
- generation of historical review bundles when that tooling exists;
- applying corrections after review.

Use ordinary plan mode for historical/model/schema decisions and accept-edits only after a bounded implementation plan is approved.

### Separate Gemini audit conversation

Use a separate conversation/context for historical audit when independence from the builder's compressed context is useful.

The audit conversation should be instructed to:

- read the historical-review bundle and relevant policy docs;
- assume consequential claims may be wrong;
- compare claims to supplied source evidence;
- search for contradictions;
- report findings only;
- avoid edits unless explicitly asked to produce a local report artifact.

Do not ask the builder to role-play both implementer and independent auditor in the same context when the claim is high risk.

## Local Antigravity permissions

Canonical baseline setup remains documented in `docs/ANTIGRAVITY_SETUP.md`.

For scholarly review, the desired behavior is simpler than implementation:

- reads and deterministic review commands may proceed normally;
- writes should remain human-visible;
- `git commit` and `git push` should remain gated;
- destructive commands remain denied/asked;
- an audit agent should not need permission to publish or mutate reviewed historical data.

### Do not loosen global permissions for review agents

A reviewer that cannot complete its task without broad repository write permissions is probably being asked to do the wrong job.

Prefer a read-only prompt/task boundary over changing global settings.

### If a future review command is added

Only after commands such as these actually exist and have been inspected:

```text
npm run historical:review-bundle
npm run historical:review
npm run historical:sample
```

may you choose to add those exact commands to the narrow `allow` list in:

`~/.gemini/antigravity-cli/settings.json`

Do not add hypothetical commands to permissions before they exist.

Do not add a broad `command(*)` permission solely to make historical review frictionless.

## Existing worktree/hook guidance is optional

`docs/ANTIGRAVITY_SETUP.md` contains a more defensive worktree + packet-hook workflow developed during Packet 4.

That workflow is **not the current maintainer requirement**.

For now:

- ordinary feature branches are acceptable;
- the maintainer/external review remains the publication decision;
- do not activate packet hooks unless deliberately revisiting that governance experiment;
- do not spend a feature packet implementing or repairing agent-governance machinery unless separately requested.

## Parallel auditors with other tools

The project may later use OpenCode, Freewheel, or another inexpensive/local/remote model harness for bulk review.

Their role should be narrow and asymmetric to Gemini's builder role.

Recommended use:

### Source-fidelity audit

Input:

- a generated historical review bundle;
- sampled Class A/B/C assertions;
- attached source-row fixtures/references;
- `docs/HISTORICAL_ASSERTION_POLICY.md`;
- `docs/HISTORICAL_REVIEW_POLICY.md`.

Prompt goal:

> Compare each claim to its attached evidence. Return PASS, MISMATCH, UNVERIFIABLE, SOURCE_LAYER_ERROR, or ESCALATE. Do not edit project data.

### Adversarial resolution audit

Input:

- Class D resolution dossiers;
- supporting and contradictory assertions;
- relevant source fixtures.

Prompt goal:

> Try to disprove each proposed identity. Return ACCEPT_AS_STATED, DOWNGRADE, UNRESOLVED, CONFLICT, NEEDS_MORE_EVIDENCE, or ESCALATE. Do not merge or rewrite entities.

### Interpretive-prose audit

Input:

- changed Class E/G prose;
- cited secondary scholarship excerpts/metadata available to the review workflow.

Prompt goal:

> Identify statements stronger than their cited support, missing counter-interpretations, false causality, anachronism, or source laundering. Do not rewrite the history merely to make the prose smoother.

## Reviewer output location

Until the interstitial session implements a canonical review-bundle/report path:

- do not invent a new committed review-data architecture;
- keep ad-hoc auditor outputs local/ignored or in the agent conversation;
- pass the resulting report to the adjudicating review step;
- commit a review artifact only when the protocol explicitly defines it as durable project evidence.

The interstitial session should establish the first canonical review-bundle/report conventions.

## Model/provider separation

Current intended project allocation:

- **Gemini/Antigravity** — primary Charted Currents builder and first-line project researcher;
- **parallel cheap/free agents** — optional bulk source-fidelity and adversarial review;
- **ChatGPT** — higher-order adversarial review/adjudication of the repository, audit reports, and difficult historical claims;
- qualified external historians/archivists/domain specialists — narrow expert review when a claim or method warrants it.

This division is workflow preference, not evidence. No model's agreement counts as historical corroboration.

## Efficient maintainer workflow once review tooling exists

Target routine:

1. Gemini implements a packet on a normal feature branch.
2. Gemini generates the historical review bundle from the branch delta.
3. Deterministic/source QA runs.
4. One or more read-only audit agents review samples and high-risk dossiers in parallel.
5. Audit reports are summarized into an exception queue.
6. ChatGPT/maintainer adjudicates disagreements and high-risk cases.
7. The maintainer answers only the small number of decisions that need human judgment.
8. Gemini applies approved corrections.
9. Normal technical + hosted review occurs before publication.

The goal is for maintainer effort to grow with **novel source rules, ambiguous identities, interpretations, and anomalies**, not linearly with raw record count.

## When to revisit local settings

Revisit this file only when one of these becomes true:

- a canonical historical review command is implemented;
- parallel agents need an intentional local report directory;
- reviewer permissions are causing repeated friction;
- a local model/provider is added specifically for bulk review;
- automated review orchestration becomes worthwhile;
- the maintainer chooses to revive worktrees/packet hooks/rules enforcement.

Until then, keep the local environment boring.

## Never put these in the repository

- real API/model-provider keys;
- private global Gemini settings;
- authentication/session tokens;
- raw Antigravity/OpenCode/Freewheel transcripts;
- private workstation paths beyond generic documented examples;
- private archival downloads that are not approved for publication;
- unreviewed model outputs presented as historical evidence.
