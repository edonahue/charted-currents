---
name: charted-currents-build
description: Execute bounded Charted Currents implementation packets within the repository's locked architecture, provenance, visual-quality, public/private, and packet-lifecycle rules.
---

# Charted Currents bounded build

Use this skill for ordinary Astro/MapLibre/UI/published-data implementation after a packet plan is approved.

## Start

1. inspect branch, `git status --short`, and relevant diff;
2. read `GEMINI.md` and `docs/AGENT_PACKET_LIFECYCLE.md`;
3. read the active packet contract when present;
4. route into only the additional docs needed for this task;
5. if historical source ingestion is in scope, use `charted-currents-source-adapter` as the specialist workflow;
6. if closing a packet, use `charted-currents-packet-closeout`.

## Execute

- implement the whole bounded approved packet without manufacturing ordinary checkpoints;
- preserve canonical architecture/config/data paths;
- prefer small reversible changes;
- do not opportunistically redesign unrelated product surfaces;
- do not invent historical facts or fill gaps with plausible prose;
- do not hand-edit generated public artifacts;
- do not add dependencies without a concrete requirement;
- keep private/raw/restricted material outside public Git;
- update docs when commands, schema, behavior, or architectural boundaries change.

## Proof before convenience

Before coding a difficult acceptance item, identify the observation that would independently prove it. Do not substitute an easier operation later.

Examples:

- real source profiling, not just a checksum;
- real negative UI assertion, not only a positive one;
- native keyboard activation, not synthesized `.click()`;
- source-row extraction, not fixture dictionaries embedded in adapter code.

If proof is unavailable, report the blocker.

## Visual/runtime changes

Use the existing editorial-atlas design system and required viewports. Generated design mockups are exploratory unless explicitly approved as canonical direction.

Browser-visible acceptance needs runtime/browser evidence; compilation is insufficient.

## Historical/data changes

Verify source ID, source record, assertion provenance, evidence/inspection state, rights posture, raw-value preservation, and source-neutral schema behavior.

Never coerce a new source family into an irrelevant old-source field merely to reuse a component.

## Closeout

Do not declare a packet accepted. Reach `SELF_VERIFIED`, run the closeout skill/report, and hand off for external review.

Required final state wording:

`PACKET IMPLEMENTATION SELF-VERIFIED — EXTERNAL REVIEW REQUIRED`
