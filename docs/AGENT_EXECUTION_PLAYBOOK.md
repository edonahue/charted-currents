# Agent execution playbook

Charted Currents is intentionally set up so a fast coding agent can execute **large bounded work packets** without being asked to rediscover product strategy, historical policy, maintainership conventions, or architecture on every turn.

This playbook is optimized for the Antigravity CLI and Gemini Flash-class coding models, but the rules apply to any coding agent.

## Division of labor

The repository owns durable decisions. The coding agent owns implementation within them.

**Do not reopen by default:** product identity, historical scope, evidence states, static-first architecture, Astro/TypeScript, MapLibre, Python/DuckDB pipeline, warm editorial-atlas direction, inspector-first interaction, source-rights policy, public/private boundary, or the principle that AI output is not historical authority.

`docs/MAINTAINER_EXPECTATIONS.md` defines the expected implementation/review style. It is project process context, not permission to infer additional personal preferences.

Escalate only when implementation exposes a real contradiction, irreversible choice, rights/privacy question, or material scope change.

## Work-packet model

`docs/FIRST_SESSIONS.md` defines the initial work as a few larger packets rather than many small sessions.

For each packet:

1. plan the **whole packet** once;
2. execute through its documented subsections without asking for a fresh approval at ordinary milestones;
3. use targeted checks during iteration;
4. run the packet acceptance/verification gates at the end;
5. hand off once with `changed / verified / unresolved / next`.

A packet is a review boundary, not every component inside it.

Do not stop merely because one subsection is complete. Stop only for a documented escalation condition, a permission gate that is intentionally human-controlled, or a genuine blocker after evidence-based diagnosis.

## Context discipline

A large context window is not a reason to load the whole repository.

Use `docs/AGENT_CONTEXT_INDEX.md` to route into the minimum useful context. For an ordinary implementation packet, the common core is:

1. `GEMINI.md`;
2. `docs/MAINTAINER_EXPECTATIONS.md`;
3. `docs/IMPLEMENTATION_CONTRACT.md`;
4. the current packet in `docs/FIRST_SESSIONS.md`;
5. only the product/design/data/source docs relevant to the files being changed.

For the initial local harness setup, use `docs/ANTIGRAVITY_SETUP.md`.

For deployment readiness or hosted verification, use `docs/CLOUDFLARE_DEPLOYMENT.md`.

Read `docs/PUBLIC_PRIVATE_BOUNDARY.md` before work that can place environment, source, benchmark, screenshot, config, log, location, or data artifacts in Git.

Do not load every large source dossier for CSS/layout work.

## Recommended Antigravity workflow

### Planning or difficult decisions

Use `plan` mode and higher reasoning effort for:

- the first pass over a new work packet;
- data-contract changes;
- architecture or dependency changes;
- entity-resolution logic;
- public/private or source-rights boundary changes;
- difficult debugging after the straightforward fix has failed;
- final review of a large diff.

Planning must end in one bounded implementation proposal tied to the packet acceptance criteria, not a list of every possible enhancement.

### Routine execution

Use normal editable mode at medium reasoning effort for a well-specified packet. Fast iteration is valuable once decisions are constrained.

Prefer reviewable diffs. Automatic edit acceptance is appropriate only when the permission posture remains sandboxed/scoped and verification remains mandatory.

### Permission posture

Use the recommended scoped setup in `docs/ANTIGRAVITY_SETUP.md` rather than weakening all permissions.

Routine sandboxed npm/build/read-only-git commands should not require repeated human confirmation. Keep `git push`, unsandboxed execution, destructive Git, privilege escalation, and broad non-workspace access gated or denied by default.

A permission prompt is not itself a reason to restructure the product task. If the operation is a known routine safe command, improve the scoped permission configuration rather than turning one work packet into many tiny prompts.

### Environment safety

On Linux, use the CLI sandbox where practical. Keep non-workspace file access disabled unless the task explicitly needs it. Do not weaken shell permissions simply to make a command succeed.

Never print, commit, or copy secrets/private environment details into documentation or fixtures. Follow `docs/PUBLIC_PRIVATE_BOUNDARY.md` rather than inferring what is safe from whether a file is locally accessible.

## Anti-swirl rules

1. **Existing decision beats new preference.** If the repository has already chosen an approach, implement it unless concrete evidence shows it cannot satisfy the task.
2. **Prefer reversible simplicity.** When two undecided approaches are both adequate, choose the smaller local/reversible one and continue.
3. **Two failed approaches trigger diagnosis.** After two materially different failed attempts at the same blocker, inspect actual error/runtime state and either make one evidence-based next attempt or report the blocker.
4. **No opportunistic redesign.** A component task is not permission to change architecture, palette, ontology, or build system.
5. **Do not solve missing history with prose generation.** Missing evidence is a data/research task, not a creative-writing task.
6. **Use `docs/FOLLOWUPS.md` as the pressure valve.** Record a good out-of-scope idea and return to the objective.
7. **One source of truth.** Do not create a parallel enum/config/manifest/generator merely to avoid understanding the existing canonical path.
8. **Do not game verification.** Fix the root cause of valid test/review failures instead of weakening the check.
9. **Do not manufacture checkpoints.** Continue through the current packet unless a real stop condition exists.

## Verification tiers

Prefer explicit tiers as the repository matures:

- **targeted:** smallest relevant checks during iteration;
- **fast:** deterministic repository-wide checks before ordinary handoff/commit;
- **full:** browser/accessibility/integration or larger data checks warranted by the changed surface;
- **CI/deployment:** authoritative remote checks when environment-specific.

Until dedicated tiered commands exist, use the baseline in `docs/IMPLEMENTATION_CONTRACT.md`.

Never report a targeted or reduced check as though an unrun full/CI gate passed. Local checks should converge on CI semantics; important suites must not silently skip without being reported.

## Evidence before “done”

A completion claim must separate:

- **Observed:** commands run, tests passed, page rendered, source record inspected, measurement captured, or hosted deployment opened.
- **Inferred:** conclusions drawn from those observations.
- **Unverified:** anything the available tools could not actually check.

Never manufacture proof. In particular:

- do not describe a screenshot that was not captured from the running application;
- do not create an SVG/mock image and call it a screenshot;
- do not write a test that merely asserts a value copied from implementation and treat that as independent validation;
- do not claim a source supports a historical fact without opening/recording the supporting source unit;
- do not declare a visual issue fixed solely because CSS compiled;
- do not claim a performance improvement without comparable measurement;
- do not claim Cloudflare deployment success because `npm run build` succeeded locally.

For browser-visible layout changes, inspect at least one normal desktop and one narrow phone layout when tooling permits.

For data work, add deterministic schema/fixture/source-ID/publication checks appropriate to the adapter.

For deployment work, distinguish local deployment readiness from an observed hosted Pages deployment and matching commit.

## Review feedback

Treat substantive human or automated review as evidence to investigate, not a checklist to silence.

When feedback is valid, fix the underlying invariant and add regression coverage when useful. Reject feedback only when repository/runtime/source evidence demonstrates it is incorrect or outside the agreed contract. Never weaken a privacy, security, rights, provenance, or historical-evidence boundary merely to get green output.

## Performance work

Optimize measured problems. Favor structural wins such as batching, bounded concurrency, caching, lazy work, early termination, and reduced serialization/DOM work before micro-optimization.

A meaningful benchmark should identify the input/data version, method, elapsed time, and relevant resource usage. Keep environment reporting public-safe per `docs/PUBLIC_PRIVATE_BOUNDARY.md`.

## Historical-data stop conditions

Stop and leave the record unresolved rather than guessing when:

- two same-named vessels cannot be distinguished with available evidence;
- a date/place/person/route is absent from the source unit;
- a source or image reuse right is unclear;
- a generated extraction cannot be traced back to source text/metadata;
- a route is known only by endpoints but requested geometry implies an actual track;
- contextual proximity is being mistaken for causation;
- a wreck/site identity is not sufficiently supported;
- exact heritage-site location should not be publicly disclosed.

A visible gap is a correct result. An elegant invented connection is a defect.

## Packet closeout

Before ending a work packet:

1. run applicable checks at the appropriate tier;
2. inspect `git diff` for scope expansion, duplicate sources of truth, generated drift, and secret/private/restricted files;
3. verify no new historical assertion lacks provenance;
4. verify rights-sensitive assets and published data have the required metadata;
5. verify documentation still matches commands, schemas, behavior, deployment assumptions, and current limitations;
6. update `docs/FOLLOWUPS.md` only for genuinely deferred work;
7. report: **changed / verified / unresolved / next**.

Do not begin the next packet simply because context remains. Do not push unless explicitly authorized.
