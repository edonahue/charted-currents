# Scripts

## Current bootstrap utilities

- `preflight.mjs` — zero-dependency check for the pinned Node version, required starter paths, and canonical npm scripts. Run with `npm run preflight` before dependency installation/Packet 1.
- `sync-visual-references.mjs` — deterministic, networked setup helper that reads the fixed reviewed list in `design/reference-board/manifest.json`, fetches ~1280px Wikimedia Commons derivatives, writes them under `design/reference-board/assets/`, and records SHA-256/check metadata in `checksums.json`. Run with `npm run refs:sync` after dependencies/setup networking are available.
- `capture-reviews.mjs` — headless browser verification and visual review capture harness. Starts a local static review server on an ephemeral port, drives headless Chromium via the Chrome DevTools Protocol, asserts strict `mapReady`/`mapIdle` states, verifies keyboard navigation, mobile bottom-sheet accessibility, and causal network-blocking fallback behavior, and regenerates verified screenshots in `design/reviews/`. Run with `npm run review:capture`.

`preflight.mjs` deliberately does not install packages, mutate files, contact services, or claim browser/deployment verification.

`sync-visual-references.mjs` deliberately has a narrow role: populate the already reviewed historical design-reference board. It is **not** a generic image scraper and does not make those derivatives automatically approved public-product assets. Review the generated files against the committed manifest before retaining them in Packet 1.

`capture-reviews.mjs` enforces non-zero exit codes on any failed behavioral assertion, timeout, or uncaught runtime exception, ensuring truthful local and staging verification.

## Expected data-pipeline areas

As the historical pipeline becomes real, expected areas include `ingest/`, `normalize/`, `resolve/`, `qa/`, `publish/`, and rights-aware `assets/` processing.

Ingestion should be idempotent where practical and record retrieval metadata/checksums. Do not create broad placeholder script frameworks before a real source adapter or publication requirement needs them.
