# Antigravity setup for sustained Charted Currents work

This file documents the recommended local workstation posture. Do not commit your real global Antigravity settings, tokens, authentication files, source downloads, conversation transcripts, or `.agent/` packet state.

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

## Use worktrees for substantial packets

For larger packets, prefer Antigravity's **New Worktree** project/conversation mode or create a Git worktree manually. This keeps the canonical main checkout separate from the agent implementation workspace.

Desired shape:

```text
~/projects/charted-currents/                   # normal main checkout
~/projects/charted-currents-worktrees/packet5 # feature worktree
```

The active Antigravity conversation should target the packet worktree, not the main checkout.

## Workspace packet hooks

The repository commits `.agents/hooks.json` and `scripts/agent-policy-hook.py`.

They are intentionally inert unless this ignored local file exists:

`.agent/active-packet.json`

When active, the hooks:

- log observed packet commands locally under `.agent/command-log/`;
- prevent an unaccepted packet from switching/merging/pushing `main`;
- keep `git push main` human-visible even after acceptance;
- force explicit review for destructive/privileged commands;
- prevent the agent execution loop from stopping while required packet proof commands are missing;
- stop at `REVIEW_PENDING`, not self-acceptance.

The entire `.agent/` directory is gitignored.

## Packet activation

1. Copy `docs/packets/PACKET_CONTRACT_TEMPLATE.json` to the active packet contract, e.g.:

```bash
cp docs/packets/PACKET_CONTRACT_TEMPLATE.json docs/packets/PACKET_05.json
```

2. Edit the committed contract with the approved packet number/title/base/branch/acceptance criteria and required commands.

3. Start/use the feature branch or worktree.

4. Activate the local hook state:

```bash
python3 scripts/agent-packet-state.py start \
  --contract docs/packets/PACKET_05.json \
  --branch packet5-example
```

5. Start Antigravity in plan or accept-edits mode as appropriate.

The Stop hook will require the contract's `required_commands` to have been observed successfully during the active session before the agent can transition out of implementation.

## Self-verification and external review

After Gemini has completed the implementation and required proof:

```bash
python3 scripts/agent-packet-state.py self-verified
npm run packet:report
```

This moves the ignored local state to `review_pending` and allows the agent to stop.

It does **not** accept the packet.

After external/maintainer review explicitly accepts the exact feature-branch head, the maintainer may run:

```bash
python3 scripts/agent-packet-state.py accept
```

Only then should merge/main publication be performed.

After hosted verification of the accepted commit:

```bash
python3 scripts/agent-packet-state.py deployed
```

When the packet is fully closed:

```bash
python3 scripts/agent-packet-state.py clear
```

## Inspect hooks

Antigravity supports workspace hook configuration in `.agents/hooks.json`. Use `/hooks` in the TUI to inspect loaded/active hooks.

If the hook configuration is not picked up in an already-running conversation, start a fresh conversation after pulling the governance commit.

## Execution modes

Use plan mode for:

- new packets;
- source/data-model changes;
- architecture/dependency changes;
- entity resolution;
- difficult debugging;
- final correction planning.

Use accept-edits for an already approved bounded implementation packet while keeping command permissions/sandbox rules active.

Do not use `--dangerously-skip-permissions` as the routine project posture.

## Publication and GitHub

The local packet hook is a workstation guard, not the only publication control. Main should also be protected through GitHub branch/ruleset settings so packet work normally reaches production through a PR and successful CI.

For a solo-maintainer repository, requiring the PR/check boundary is more important than requiring a second human reviewer.

## Local-only telemetry (optional)

Antigravity hooks receive conversation/session/transcript metadata. If you later want to measure agent reliability, store only public-safe derived metrics under a local ignored directory such as `.agent/telemetry/` or `~/.local/state/charted-currents-agent/`.

Useful metrics include:

- first-pass review acceptance;
- forced-continue closeout count;
- blocked direct-main attempts;
- post-review correction size;
- source/provenance corrections;
- completion-summary factual corrections.

Do not commit raw Antigravity transcripts merely to collect these metrics.
