# Antigravity CLI setup for sustained Charted Currents work

**Purpose:** reduce repetitive permission prompts while keeping destructive operations, publication, non-workspace access, and unsandboxed execution intentionally gated.

This is a public-safe configuration guide. Do not commit the actual global Antigravity settings file from a personal machine.

## Why this matters

Antigravity CLI defaults are intentionally cautious. For a repository like Charted Currents, workspace file reads/writes are already low-friction, but repeated terminal and file-edit approvals can break a long implementation packet into many small interruptions.

The preferred solution is not `--dangerously-skip-permissions`. Use the Linux terminal sandbox, scoped command permissions, and Antigravity's `accept-edits` execution mode for the approved implementation packet.

The repository has a bootable scaffold and a small canonical command surface, which means the allowlist can stay narrow rather than granting arbitrary shell access.

## Recommended global posture

In `~/.gemini/antigravity-cli/settings.json`, prefer:

```json
{
  "toolPermission": "proceed-in-sandbox",
  "artifactReviewPolicy": "agent-decides",
  "enableTerminalSandbox": true,
  "allowNonWorkspaceAccess": false
}
```

Why:

- `proceed-in-sandbox` lets normal sandboxed terminal work proceed without a review stop;
- `agent-decides` avoids unnecessary artifact-level interruptions while preserving discretion for larger artifacts;
- the Linux sandbox confines agent-launched commands;
- non-workspace access remains off, matching the repository's public/private policy.

Do not use `always-proceed` or `--dangerously-skip-permissions` as the routine project setup.

## Suggested scoped permission policy

Merge a policy like this into the existing `permissions` object rather than blindly replacing unrelated personal settings:

```json
{
  "permissions": {
    "allow": [
      "command(git (status|diff|log|show|rev-parse))",
      "command(npm (install|ci))",
      "command(npm run (preflight|verify|check|build|test|lint|typecheck|format:check|dev|preview|refs:sync))",
      "read_url(registry.npmjs.org)",
      "read_url(commons.wikimedia.org)",
      "read_url(upload.wikimedia.org)"
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

The Commons domains are present only for the deterministic `refs:sync` helper whose file list is fixed by `design/reference-board/manifest.json`; they are not permission for open-ended web research.

The exact scripts available will evolve. Add a routine project command to `allow` only after it exists and its behavior is understood.

### Important precedence rule

Antigravity evaluates conflicting rules as:

`deny > ask > allow`

Do **not** add a broad `ask` rule such as:

```text
command(*)
```

if the goal is to auto-approve the scoped command allowlist above. The broad ask rule would win and restore prompts for every command.

## Execution mode is separate from command permissions

Antigravity execution modes control file-edit review, while the permission rules above continue to govern shell commands.

For Charted Currents Packet 1:

1. start in `plan` mode for the one packet-level plan;
2. once that plan is approved, switch to **`accept-edits`** for implementation;
3. keep the sandbox and scoped command policy active;
4. keep commit/push intentionally gated.

`accept-edits` is what prevents Antigravity from pausing for every file creation/replacement. Remaining in `default` mode would reintroduce the exact per-file diff confirmations this setup is trying to avoid.

You can switch modes in-place with `Shift+Tab`, or start an execution session directly with:

```bash
agy --mode=accept-edits --model=gemini-3.7-flash-high
```

## What remains intentionally gated

### `git push`

A push can trigger the public Cloudflare deployment after Git integration exists. Keep this as a human-visible gate by default.

### `git commit`

Keeping commit gated early in the project gives one natural review point at the end of a large packet. If this proves unnecessarily tedious later, allowing `git commit` is substantially lower risk than allowing `git push`.

### unsandboxed execution

Do not grant `unsandboxed(*)` globally. Approve a one-off escape only when the sandbox itself is the demonstrated blocker.

### destructive Git and privilege escalation

`git reset`, `git clean`, `rm -rf`, and `sudo` are not normal implementation needs. The repository already instructs agents to preserve unrelated work.

## Network/package installation

The scaffold pins the web toolchain in `package.json`; Gemini should not need `npm create astro`, `npm create cloudflare`, or an interactive package-selection flow.

The first local setup is:

```bash
npm install
npm run refs:sync
```

`npm install` should generate `package-lock.json`, which Packet 1 should keep and commit for reproducible local/Cloudflare installs.

`refs:sync` uses a fixed reviewed Commons file list to populate the local design-reference board. It should not be generalized into an arbitrary image downloader.

If sandboxed npm access still prompts or fails because outbound network access is not yet permitted, grant the narrow npm registry domain rather than general web/network access.

Do not add broad `read_url(*)` or `execute_url(*)` merely to make installation convenient.

## Browser/web research

Historical source research and live web verification should remain more deliberate than local coding. Add source domains to the allowlist only when repeated access during a bounded research task justifies it.

The initial modern basemap decision is already documented in `docs/BASEMAP_RUNTIME.md`; Packet 1 should not conduct a new provider survey unless that provider demonstrably blocks the packet.

The initial visual vocabulary is already locally synced from `design/reference-board/`; Packet 1 should not conduct a new image hunt merely to choose an aesthetic.

Never allow a model's ability to reach a URL to substitute for the source-rights/publication checks in this repository.

## Recommended launch pattern

Follow `docs/KICKOFF.md` for the exact first-run sequence and prompts.

For the first implementation packet, start with:

```bash
agy --mode=plan --model=gemini-3.7-flash-high
```

Use the planning turn to inspect the repo and produce one bounded plan for the **entire current packet**. Then switch to `accept-edits` and execute the approved packet without stopping between routine subsections.

## Permissions manager

Antigravity's `/permissions` command can edit the global allow/deny/ask lists interactively. Use it when one recurring safe command is generating avoidable prompts rather than granting broad permissions during a transient approval dialog.

## Project boundary

The global Antigravity settings are workstation configuration, not project source. This repository should contain only this documented recommended policy; never commit the real `~/.gemini/antigravity-cli/settings.json`, authentication files, tokens, or local filesystem details.
