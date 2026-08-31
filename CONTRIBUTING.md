# Contributing

Charted Currents is currently an early research and product-design project. Contributions are welcome when they strengthen the historical evidence, source handling, data engineering, accessibility, or exploratory experience without weakening provenance standards.

## Before contributing

Read these first:

- [`docs/PROJECT_BRIEF.md`](docs/PROJECT_BRIEF.md)
- [`docs/PRODUCT_PRINCIPLES.md`](docs/PRODUCT_PRINCIPLES.md)
- [`docs/PROVENANCE_AND_UNCERTAINTY.md`](docs/PROVENANCE_AND_UNCERTAINTY.md)
- [`docs/SOURCE_RIGHTS.md`](docs/SOURCE_RIGHTS.md)
- [`docs/CONTENT_AND_HISTORICAL_ETHICS.md`](docs/CONTENT_AND_HISTORICAL_ETHICS.md)
- [`docs/PUBLIC_PRIVATE_BOUNDARY.md`](docs/PUBLIC_PRIVATE_BOUNDARY.md)

For agent-assisted implementation, also use [`docs/AGENT_CONTEXT_INDEX.md`](docs/AGENT_CONTEXT_INDEX.md) and [`docs/MAINTAINER_EXPECTATIONS.md`](docs/MAINTAINER_EXPECTATIONS.md).

## Historical claims

A contribution must not introduce an unsourced historical fact. New records, entity links, contextual events, transcriptions, or derived claims should carry enough provenance to trace them back to the underlying source and should preserve the project's evidence states: **Documented**, **Probable Match**, **Reconstructed**, and **Contextual**.

AI-assisted extraction is welcome as a research aid, but AI output is a candidate assertion rather than historical authority. See [`docs/AI_AND_EXTRACTION_POLICY.md`](docs/AI_AND_EXTRACTION_POLICY.md).

## Source rights

Do not add copied datasets, scans, maps, images, or transcriptions merely because they are accessible online. Verify reuse rights at the source/item level and record them in the source registry when appropriate. Code licensing does not automatically extend to historical content. See [`DATA_LICENSE.md`](DATA_LICENSE.md).

## Public repository boundary

Do not commit secrets, private/local infrastructure details, restricted source payloads, private logs/screenshots, unrelated personal information, or sensitive heritage-site geometry. Public fixtures must be synthetic/reproducible or real/publishable with provenance and rights. See [`docs/PUBLIC_PRIVATE_BOUNDARY.md`](docs/PUBLIC_PRIVATE_BOUNDARY.md).

## Development posture

The initial build should remain static-first and deliberately small. Prefer a compelling, polished, well-sourced vertical slice over prematurely adding infrastructure or a large low-confidence corpus.

For multi-file implementation work, describe the intended bounded change before expanding scope substantially. Keep generated or downloaded working data out of Git unless its redistribution rights and repository role are explicit.

When a change modifies documented commands, schemas, generated-file rules, public behavior, or architectural boundaries, update the relevant canonical documentation in the same change.
