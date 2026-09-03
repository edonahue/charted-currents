# Antigravity setup for sustained Charted Currents work

This file documents an optional defensive workstation posture. Do not commit your real global Antigravity settings, tokens, authentication files, source downloads, conversation transcripts, or `.agent/` packet state.

## Current maintainer posture

The maintainer is **not currently requiring worktrees, packet-state hooks, or additional agent-rules/ruleset setup** for normal Charted Currents feature development.

For the current ordinary workflow:

- use normal feature branches;
- keep Gemini/Antigravity as the primary implementation environment;
- stop substantial historical work for external review before treating it as accepted;
- use `docs/LOCAL_GEMINI_SCHOLARLY_REVIEW_SETUP.md` for the current scholarly-review and parallel-auditor workflow;
- do not spend feature-packet scope building or repairing agent-governance machinery unless separately requested.

The worktree/hook material below remains available as an optional stronger posture if the maintainer later chooses to revive it.

## Recommended execution posture

Use Antigravity's sandboxed execution and scoped permissions rather than broad bypasses.

Global CLI settings live at:

`~/.gemini/antigravity-cli/settings.json`

A reasonable baseline is:

```json
{
  "toolPermission": "proceed-in-sandbox",
  "artifactReviewPolicy": "agent-decides",
  "permissions": {
    "allow": [
      "command(git (status|diff|log|show|rev-parse|branch))",
      "command(npm run (preflight|verify|check|build|data:build|data:validate|data:summary|data:test|data:test-negative|packet:report|review:capture.*))"
    ],
    "deny": [
      "command(sudo)",
      "command(rm -rf)",
      "command(git (reset|clean))",
      "write_file(.git/)"
    ],
    "ask": [
      "command(git push)",
      "command(git commit)",
      "unsandboxed(*)"
    ]
  }
}
```

Antigravity permission precedence is `deny > ask > allow`; do not add a broad `command(*)` ask rule if you expect the narrow allow rules above to remain automatic.

Adjust the exact command allowlist only after a repository command exists and its behavior is understood.

For historical audit agents, do not loosen these permissions merely to make review convenient. Read-only review should not require commit/push authority.

## Ordinary current branch workflow

The current maintainer-approved default is an ordinary feature branch in the main checkout.

Example shape:

```text
main
  -> packet5-carrera-depth
  -> implementation/self-verification
  -> external review
  -> explicit maintainer acceptance
  -> merge/publication
```

A worktree is not required.

## Optional worktrees for substantial packets

If deliberately revisiting the stronger isolation posture, Antigravity's **New Worktree** project/conversation mode or a manual Git worktree can keep the canonical main checkout separate from the agent implementation workspace.

Possible shape:

```text
~/projects/charted-currents/                   # normal main checkout
~/projects/charted-currents-worktrees/packetN # optional feature worktree
```

Do not interpret this section as the current packet requirement.

## Optional workspace packet hooks

The repository commits `.agents/hooks.json` and `scripts/agent-policy-hook.py`.

They are intentionally inert unless this ignored local file exists:

`.agent/active-packet.json`

When deliberately activated, the hooks can:

- log observed packet commands locally under `.agent/command-log/`;
- prevent an unaccepted packet from switching/merging/pushing `main`;
- keep `git push main` human-visible even after acceptance;
- force explicit review for destructive/privileged commands;
- prevent the agent execution loop from stopping while required packet proof commands are missing;
- stop at `REVIEW_PENDING`, not self-acceptance.

The entire `.agent/` directory is gitignored.

**Do not activate this machinery for ordinary feature work or scholarly review unless the maintainer explicitly chooses to use it.**

## Optional packet activation

If the maintainer deliberately revives packet-hook enforcement:

1. Copy `docs/packets/PACKET_CONTRACT_TEMPLATE.json` to the active packet contract, e.g.:

```bash
cp docs/packets/PACKET_CONTRACT_TEMPLATE.json docs/packets/PACKET_05.json
```

2. Edit the committed contract with the approved packet number/title/base/branch/acceptance criteria and required commands.

3. Start/use the feature branch or optional worktree.

4. Activate the local hook state:

```bash
python3 scripts/agent-packet-state.py start \
  --contract docs/packets/PACKET_05.json \
  --branch packet5-example
```

5. Start Antigravity in plan or accept-edits mode as appropriate.

The Stop hook will require the contract's `required_commands` to have been observed successfully during the active session before the agent can transition out of implementation.

Again: this activation is optional under the current maintainer posture.

## Self-verification and external review

Whether or not hooks are enabled, the semantic distinction remains useful:

- implementation agent self-verification;
- external/maintainer review;
- acceptance;
- hosted verification.

A self-verified implementation is not automatically historically accepted.

If packet hooks are deliberately active, the optional state commands are:

```bash
python3 scripts/agent-packet-state.py self-verified
npm run packet:report
```

After explicit external/maintainer acceptance:

```bash
python3 scripts/agent-packet-state.py accept
```

After hosted verification:

```bash
python3 scripts/agent-packet-state.py deployed
```

When closed:

```bash
python3 scripts/agent-packet-state.py clear
```

Without active hooks, use the same concepts in the handoff without pretending the local state mechanism is active.

## Inspect hooks

Antigravity supports workspace hook configuration in `.agents/hooks.json`. Use `/hooks` in the TUI to inspect loaded/active hooks if deliberately using them.

If the hook configuration is not picked up in an already-running conversation, start a fresh conversation after pulling the relevant governance commit.

## Execution modes

Use plan mode for:

- new packets;
- source/data-model changes;
- architecture/dependency changes;
- entity resolution;
- difficult debugging;
- scholarly-review protocol design;
- final correction planning.

Use accept-edits for an already approved bounded implementation packet.

Do not use `--dangerously-skip-permissions` as the routine project posture.

## Scholarly review agents

Read `docs/LOCAL_GEMINI_SCHOLARLY_REVIEW_SETUP.md` before changing local settings for historical auditors.

Current principle:

- builder agents may need repository write access;
- historical audit agents should normally be read-only and report findings;
- no reviewer needs broader permissions merely because its model/harness is different.

Only add future historical review commands to the local allowlist after the commands actually exist and have been inspected.

## Publication and GitHub

The current maintainer has deferred additional GitHub ruleset/worktree enforcement setup.

Do not treat missing branch-rule automation as permission for an implementation agent to self-accept historical changes.

Use explicit maintainer/external review before substantial historical publication.

## Local-only telemetry (optional)

Antigravity hooks receive conversation/session/transcript metadata. If you later want to measure agent reliability, store only public-safe derived metrics under a local ignored directory such as `.agent/telemetry/` or `~/.local/state/charted-currents-agent/`.

Useful metrics include:

- first-pass review acceptance;
- post-review correction size;
- source/provenance corrections;
- completion-summary factual corrections;
- historical assertions escalated by class;
- audit-agent disagreement rate.

Do not commit raw Antigravity transcripts merely to collect these metrics.
