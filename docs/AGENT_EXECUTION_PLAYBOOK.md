# Agent execution playbook

Charted Currents is intentionally set up so a fast coding agent can execute bounded work without being asked to rediscover product strategy, historical policy, or architecture on every turn.

This playbook is optimized for the Antigravity CLI and Gemini Flash-class coding models, but the rules apply to any coding agent.

## Division of labor

The repository already owns the durable decisions. The coding agent owns implementation within them.

**Do not reopen by default:** product identity, historical scope, evidence states, static-first architecture, Astro/TypeScript, MapLibre, Python/DuckDB pipeline, warm editorial-atlas direction, inspector-first interaction, source-rights policy, or the principle that AI output is not historical authority.

Escalate only when implementation exposes a real contradiction, irreversible choice, rights question, or material scope change.

## Context discipline

A large context window is not a reason to load the whole repository.

For ordinary UI implementation, read:

1. `GEMINI.md`;
2. `docs/INITIAL_BUILD_BRIEF.md`;
3. `docs/IMPLEMENTATION_CONTRACT.md`;
4. the current session in `docs/FIRST_SESSIONS.md`;
5. only the product/design/data docs directly relevant to the files being changed.

For source ingestion or historical-data work, additionally read the relevant source registry and rights/provenance documents. Do not load every 10–20 KB source dossier for a CSS, layout, or component task.

## Recommended Antigravity workflow

### Planning or difficult decisions

Use `plan` mode and higher reasoning effort for:

- the first pass over a new multi-file session;
- data-contract changes;
- architecture changes;
- entity-resolution logic;
- difficult debugging after the straightforward fix has failed;
- final review of a large diff.

Planning must end in a bounded implementation proposal tied to acceptance criteria, not a list of every possible enhancement.

### Routine execution

Use the normal editable mode at medium reasoning effort for a well-specified session. Fast iteration is valuable once the decisions are constrained.

Prefer reviewable diffs early in the project. Automatic edit acceptance is appropriate only when the task is narrow and the verification commands remain mandatory.

### Environment safety

On Linux, use the CLI sandbox where practical. Keep non-workspace file access disabled unless the task explicitly needs it. Do not weaken shell permissions just to make a command succeed.

Project source credentials in `.env` are separate from Antigravity/Gemini authentication. Never print, commit, or copy secrets into documentation or generated fixtures.

## Anti-swirl rules

1. **Existing decision beats new preference.** If the repository has already chosen an approach, implement it unless there is concrete evidence it cannot satisfy the task.
2. **Prefer reversible simplicity.** When two undecided approaches are both adequate, choose the smaller local/reversible one and continue.
3. **Two failed approaches trigger diagnosis.** Do not keep cycling libraries or rewrites. After two materially different failed attempts at the same blocker, inspect the actual error/state, state the suspected cause, and either make one evidence-based next attempt or report the blocker.
4. **No opportunistic redesign.** A component task is not permission to change the architecture, palette, data ontology, or build system.
5. **Do not solve missing history with prose generation.** Missing evidence is a data/research task, not a creative-writing task.
6. **Use `docs/FOLLOWUPS.md` as the pressure valve.** Record a good out-of-scope idea and return to the current objective.

## Evidence before “done”

A completion claim must separate three things:

- **Observed:** commands run, tests passed, page rendered, source record inspected.
- **Inferred:** conclusions drawn from those observations.
- **Unverified:** anything the available tools could not actually check.

Never manufacture proof. In particular:

- do not describe a screenshot that was not captured from the running application;
- do not create an SVG/mock image and call it a screenshot;
- do not write a test that merely asserts a value copied from the implementation and treat that as independent validation;
- do not claim a source supports a historical fact without opening/recording the supporting source unit;
- do not declare a visual issue fixed solely because CSS compiled.

For web-code sessions, run the verification baseline in `docs/IMPLEMENTATION_CONTRACT.md`. For data work, add deterministic schema/fixture/source-ID checks appropriate to the adapter.

## Historical-data stop conditions

Stop and leave the record unresolved rather than guessing when:

- two same-named vessels cannot be distinguished with available evidence;
- a date/place/person/route is absent from the source unit;
- a source or image reuse right is unclear;
- a generated extraction cannot be traced back to source text/metadata;
- a route is known only by endpoints but the requested geometry implies an actual track;
- contextual proximity is being mistaken for causation.

A visible gap is a correct result. An elegant invented connection is a defect.

## Session closeout

Before ending a bounded session:

1. run applicable checks;
2. inspect `git diff` for accidental scope expansion and generated/secret files;
3. verify no new historical assertion lacks provenance;
4. verify rights-sensitive assets have metadata before publication;
5. update `docs/FOLLOWUPS.md` only for genuinely deferred work;
6. report: **changed / verified / unresolved / next**.

Do not begin the next session simply because context remains.