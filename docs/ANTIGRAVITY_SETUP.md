# Antigravity CLI setup for sustained Charted Currents work

**Purpose:** reduce repetitive permission prompts while keeping destructive operations, publication, non-workspace access, and unsandboxed execution intentionally gated.

This is a public-safe configuration guide. Do not commit the actual global Antigravity settings file from a personal machine.

## Why this matters

Antigravity CLI defaults are intentionally cautious. For a repository like Charted Currents, workspace file reads/writes are already low-friction, but repeated terminal and web approvals can break a long implementation packet into many small interruptions.

The preferred solution is not `--dangerously-skip-permissions`. Use the Linux terminal sandbox plus scoped permissions for routine commands.

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
- `agent-decides` avoids an artifact-review interruption for every ordinary file change while preserving discretion for larger artifacts;
- the Linux sandbox confines agent-launched commands;
- non-workspace access remains off, which matches this repository's public/private policy.

Do not use `always-proceed` or `--dangerously-skip-permissions` as the routine project setup.

## Suggested scoped permission policy

Merge a policy like this into the existing `permissions` object rather than blindly replacing unrelated personal settings:

```json
{
  "permissions": {
    "allow": [
      "command(git (status|diff|log|show|rev-parse))",
      "command(npm (install|ci))",
      "command(npm run (check|build|test|lint|typecheck|format:check|dev|preview))",
      "read_url(registry.npmjs.org)"
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

The exact scripts available will evolve. Add a routine project command to `allow` only after it exists and its behavior is understood.

### Important precedence rule

Antigravity evaluates conflicting rules as:

`deny > ask > allow`

Do **not** add a broad `ask` rule such as:

```text
command(*)
```

if the goal is to auto-approve the scoped command allowlist above. The broad ask rule would win and restore prompts for every command.

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

The first packet needs npm package installation. If sandboxed npm access still prompts or fails because outbound network access is not yet permitted, grant the narrow npm registry domain rather than general web/network access.

Do not add broad `read_url(*)` or `execute_url(*)` merely to make installation convenient.

## Browser/web research

Historical source research and live web verification should remain more deliberate than local coding. Add source domains to the allowlist only when repeated access during a bounded research task justifies it.

Never allow a model's ability to reach a URL to substitute for the source-rights/publication checks in this repository.

## Recommended launch pattern

For the first implementation packet:

```bash
agy --mode=plan --model=gemini-3.7-flash-high
```

Use the planning turn to inspect the repo and produce one bounded plan for the **entire current packet**.

Then execute the approved packet in editable mode at medium/high effort as appropriate. The prompt should explicitly say:

> Execute the entire current work packet without stopping between its documented subsections. Make routine local and reversible choices yourself. Stop only for a documented escalation condition, a real blocker after evidence-based diagnosis, or an operation that the permission policy intentionally gates. Do not begin the next packet.

This is preferable to prompting separately for every component or subtask.

## Permissions manager

Antigravity's `/permissions` command can edit the global allow/deny/ask lists interactively. Use it when one recurring safe command is generating avoidable prompts rather than granting broad permissions during a transient approval dialog.

## Project boundary

The global Antigravity settings are workstation configuration, not project source. This repository should contain only this documented recommended policy; never commit the real `~/.gemini/antigravity-cli/settings.json`, authentication files, tokens, or local filesystem details.
