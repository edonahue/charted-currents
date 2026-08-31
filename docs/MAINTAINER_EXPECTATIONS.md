# Maintainer expectations for agentic work

This document records **project-working conventions**, not a personal profile. It exists because recurring choices about scope, review, verification, polish, and reporting are expensive for coding agents to rediscover.

These conventions are intentionally safe for a public repository. They should help an unfamiliar contributor or coding agent predict what kind of implementation will be considered strong without exposing private environment, account, employment, or personal information.

## Build the product path, not the largest architecture

Prefer a narrow, complete vertical slice over a broad framework full of placeholders.

A strong increment usually:

1. makes one user-visible or data-contract path materially better;
2. preserves existing behavior outside that path;
3. is independently reviewable;
4. has explicit acceptance criteria;
5. leaves worthwhile stretch work documented rather than half-built.

Do not interpret enthusiasm for future possibilities as permission to expand the current task. The repository roadmap and `docs/FOLLOWUPS.md` are the place to retain good ideas without derailing the current objective.

## Resolve cheap decisions; surface expensive ones

Do not ask for preference on every local implementation detail.

For a choice that is **local, reversible, low-risk, and consistent with existing conventions**, choose the simplest adequate option and continue.

Stop or plan explicitly when a choice affects:

- product behavior or visual identity across multiple surfaces;
- historical ontology, provenance, uncertainty, or entity resolution;
- public/private data boundaries;
- source or asset rights;
- deployment/runtime architecture;
- a new framework, database, service, queue, or other durable dependency;
- a settled ADR or other documented contract.

When escalating, identify the actual tradeoff rather than presenting a large menu of loosely relevant alternatives.

## Polish is part of implementation

A feature is not complete merely because it compiles or technically renders.

For user-facing work:

- inspect the real running interface when tooling allows;
- preserve the map-first hierarchy and editorial-historical character;
- check at least one ordinary desktop layout and a narrow phone layout when the change affects composition;
- treat spacing, hierarchy, typography, focus behavior, empty states, loading/error behavior, and reduced motion as implementation concerns;
- fix obvious generic-starter or dashboard-like presentation before declaring the work done.

Prefer a smaller polished surface over several unfinished surfaces.

## Keep one source of truth

When the same concept is consumed by multiple parts of the project, prefer one canonical representation and derive secondary artifacts from it.

Examples include:

- domain/evidence enums shared by validators and UI;
- source registries feeding publication checks;
- a manifest feeding discovery and validation;
- generated artifacts produced from a canonical template/configuration.

If a file becomes generated, mark that clearly and provide the generation command. Do not hand-edit generated output to make one test pass. Add drift validation when generated artifacts become important enough that silent divergence would be costly.

Do not duplicate durable policy across multiple agent instruction files. Point to the canonical document instead.

## Verification should have clear tiers

As the project grows, organize verification into increasingly expensive gates rather than one opaque command.

Recommended shape:

- **targeted** — the smallest tests/checks relevant to the change while iterating;
- **fast** — deterministic repository-wide checks appropriate before most commits/hand-offs;
- **full** — browser, accessibility, visual/integration, or larger data checks when the changed surface warrants them;
- **CI/deployment** — the authoritative remote result when a check depends on that environment.

Local commands should match CI semantics closely enough that important suites do not silently skip. A passing reduced local path must never be reported as though an unrun full/remote gate passed.

Until dedicated tiered commands exist, use the current verification baseline in `docs/IMPLEMENTATION_CONTRACT.md` and state exactly what was and was not exercised.

## Tests should protect behavior, not implementation theater

Prefer tests against meaningful contracts and real failure modes.

Good tests:

- exercise the same data path or state transition users rely on;
- cover concrete boundary cases;
- fail when a source-of-truth contract drifts;
- validate generated/published artifacts independently where practical;
- remain deterministic and reproducible.

Avoid tests that merely repeat constants from the implementation, assert incidental markup, or create a fake proof that the agent's own change is correct.

When a bug reveals a reusable invariant, encode that invariant in a validator/test or durable documentation rather than relying on future memory.

## Documentation must describe reality

Update documentation in the same change when behavior, commands, schemas, or architectural boundaries change.

Do not claim that a dataset, ingestion path, service, deployment, benchmark, visual state, source integration, or feature exists unless there is repository or runtime evidence for it.

Use precise qualifiers such as `prototype`, `sample`, `candidate`, `measured`, `projected`, `documented`, or `not yet verified` when they materially change meaning.

A technically successful change with inaccurate documentation is unfinished.

## Treat review feedback as evidence

Automated or human review comments are not a checklist to silence mechanically.

For substantive feedback:

1. understand the underlying invariant or failure mode;
2. inspect the relevant code/data/runtime evidence;
3. fix the root cause when the concern is valid;
4. add or improve regression coverage when worthwhile;
5. reject feedback only when repository evidence demonstrates it is incorrect or outside the intended contract.

Do not weaken a test, validator, security boundary, or historical-evidence rule merely to obtain a green result.

## Optimize measured problems

Performance matters, especially for maps, browser interaction, source processing, and larger analytical datasets, but optimization should be evidence-driven.

Prefer, in order:

1. correct and inspectable behavior;
2. measurement of the actual bottleneck;
3. structural wins such as batching, bounded concurrency, caching, lazy work, early termination, or reducing serialization/DOM work;
4. lower-level tuning only when a measured problem remains.

Record enough context for performance claims to be interpretable: input/data version, method, elapsed time, and relevant resource usage. Do not spend a session chasing a theoretical micro-optimization whose user-visible value has not been demonstrated.

## Fail gracefully and preserve useful partial work

External sources, browser features, and future optional infrastructure may fail. The core public experience should degrade honestly rather than becoming unavailable or fabricating replacement data.

Prefer:

- explicit empty/unavailable states;
- bounded retries where appropriate;
- reproducible cached/build-time artifacts when rights permit;
- optional enrichment rather than runtime hard dependency;
- actionable error messages without leaking private environment details.

## Handoffs should be concise and auditable

A strong coding-agent handoff reports:

- **Changed** — what materially changed;
- **Verified** — exact commands, browser states, source records, or other checks actually observed;
- **Unresolved** — blockers, caveats, or relevant checks not run;
- **Next** — one bounded next step, not an automatic scope expansion.

Prefer copy-pasteable commands when the maintainer must perform a local step.

## Definition of done

For a bounded session, “done” means more than “builds.” The intended user/data path works to the level promised by the session, verification evidence supports the claim, documentation matches reality, privacy/rights boundaries remain intact, and any remaining blocker or deliberate omission is explicit.
