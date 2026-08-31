# Working with coding agents

Start with `GEMINI.md` and `docs/AGENT_CONTEXT_INDEX.md`.

The durable rules that most often change implementation decisions are:

- `docs/MAINTAINER_EXPECTATIONS.md` — scope, review, polish, verification, optimization, handoff;
- `docs/IMPLEMENTATION_CONTRACT.md` — locked v0.1 engineering defaults;
- `docs/PUBLIC_PRIVATE_BOUNDARY.md` — what may safely enter this public repository;
- `docs/AGENT_EXECUTION_PLAYBOOK.md` — anti-swirl and verification behavior;
- `docs/FIRST_SESSIONS.md` — the current bounded build sequence.

Avoid duplicating these policies in new tool-specific files. Add a pointer/import when another harness needs an entry point.
