# Scripts

## Current bootstrap utility

- `preflight.mjs` — zero-dependency check for the pinned Node version, required starter paths, and canonical npm scripts. Run with `npm run preflight` before dependency installation/Packet 1.

It deliberately does not install packages, mutate files, contact services, or claim browser/deployment verification.

## Expected data-pipeline areas

As the historical pipeline becomes real, expected areas include `ingest/`, `normalize/`, `resolve/`, `qa/`, `publish/`, and rights-aware `assets/` processing.

Ingestion should be idempotent where practical and record retrieval metadata/checksums. Do not create broad placeholder script frameworks before a real source adapter or publication requirement needs them.
