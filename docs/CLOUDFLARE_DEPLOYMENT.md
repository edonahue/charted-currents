# Cloudflare Pages deployment

**Current Production State:**
- **Canonical Production Domain**: [`https://charted-currents.com/`](https://charted-currents.com/)
- **Cloudflare Pages Service Hostname**: [`https://charted-currents.pages.dev/`](https://charted-currents.pages.dev/)
- **Production Branch**: `main`
- **Automatic Pages Deployments**: Enabled
- **Custom Domain Status**: Active / SSL enabled (attached on Cloudflare Pages `charted-currents` project)
- **Current Indexing Posture**: Public (`<meta name="robots" content="index,follow" />`, `robots.txt` `Allow: /`)
- **Git Integration**: Active from `edonahue/charted-currents` branch `main`
- **Historical Milestone**: Initial deployment verified on 2026-09-01 (see [`design/reviews/packet1-hosted-review.md`](../design/reviews/packet1-hosted-review.md))

**Goal:** keep the verified Charted Currents shell deployable directly from `main` without requiring complex server/adapter overhead.

## Initial deployment strategy

Use **Cloudflare Pages Git integration** directly from this repository.

For the first public deployment:

- production branch: `main`;
- framework: Astro;
- build command: `npm run build`;
- output directory: `dist`;
- repository root as build root;
- Node: pinned by the repository `.nvmrc` (`22.23.1`);
- dependency versions: pinned in `package.json`, with `package-lock.json` committed;
- no build secrets/environment variables required for the initial shell.

The first durable target is the Pages-provided `*.pages.dev` hostname. Do not delay first deployment to solve the final canonical URL.

## Static Pages means no Cloudflare adapter yet

Packet 1 is a prerendered static Astro application. It does **not** need:

- `@astrojs/cloudflare`;
- a Worker entrypoint;
- `wrangler.toml` / `wrangler.jsonc`;
- `npm create cloudflare`;
- server/on-demand rendering;
- a Pages Function.

Cloudflare Pages only needs the generated `dist/` directory for this architecture. Do not accidentally follow Cloudflare **Workers/SSR Astro** instructions for this static Pages project.

If a later requirement genuinely needs server rendering or Workers primitives, treat that as an architecture change rather than bootstrap cleanup.

## One-time human setup

After Packet 1 builds locally and has been pushed to GitHub:

1. Open Cloudflare **Workers & Pages**.
2. Create a Pages application using **Connect to Git**.
3. Authorize/select `edonahue/charted-currents`.
4. Use `main` as the production branch.
5. Select the Astro preset or enter:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: repository root/default
6. Do not add environment variables unless the build has developed a real requirement for one.
7. Save and deploy.
8. Open the assigned production URL and verify the real deployed page, MapLibre surface, attribution, selection behavior, and narrow layout.
9. Record the actual deployed URL in the README only after it exists.

Git integration is intentional: after setup, pushes to `main` become production deployments and non-production branches/PRs can receive preview deployments.

## Why deploy before the real corpus

The first public shell proves several risks cheaply:

- pinned Astro/Cloudflare build compatibility;
- lockfile-based dependency reproducibility;
- MapLibre/OpenFreeMap assets/runtime behavior on the real origin;
- static URL/path assumptions;
- responsive behavior outside localhost;
- deployment permissions/integration;
- whether the product already reads as intentional rather than generic.

*(Historical note: During the initial Packet 1 prototype, `BaseLayout.astro` emitted noindex metadata and `public/robots.txt` disallowed crawling. Starting with Packet 3 and public beta, the project moved to public indexing: `<meta name="robots" content="index,follow" />` and `robots.txt Allow: /`.)*

## Canonical domain attachment

*(Historical note: During early packets, the deployment operated directly on the `*.pages.dev` service origin while custom domain attachment was deferred.)*

The maintainer has attached `https://charted-currents.com/` as an active custom domain with SSL enabled on the Cloudflare Pages project.

- **Canonical URL**: `https://charted-currents.com/`
- **Astro Config**: `site: "https://charted-currents.com"`
- **Canonical Metadata**: Emitted via `<link rel="canonical" href="https://charted-currents.com/" />` on root and corresponding paths
- **Preview Origins**: Feature and pull-request preview URLs (`*.pages.dev`) remain functional and resolve canonical tags to `https://charted-currents.com/` without redirect loops

## Base-path rule

Packet 1 deploys at the Pages project root. Keep the app capable of later base-path adaptation, but do not configure Astro with `/labs/charted-currents/` as its base before that deployment model actually exists.

Use `src/lib/paths.ts` for public data/asset paths that may later need the Astro base. Avoid parallel path helpers or scattered hard-coded `/data/...` assumptions.

## Production vs previews

For the initial launch, a verified Packet 1 push to `main` may be deployed directly for speed.

After the site exists publicly:

- use short-lived branches for substantial later packets;
- use Cloudflare preview deployments to inspect the real hosted result;
- merge to `main` when the packet is ready for production.

This gives the agent one large local work interval and the maintainer one hosted review point instead of many production deploys during implementation.

## Build-trigger posture

Do not optimize build-watch paths initially. Source/research files may later become build inputs. Bigger work packets and branch previews are the primary way to reduce noisy deployments.

Only add path-based build exclusions after the repository's real build dependency graph makes them safe.

## First-deploy acceptance

The first public deployment is successful when:

- Cloudflare reports a successful build from `main`;
- the deployment corresponds to the intended Git commit;
- the assigned public URL loads without a fatal console/runtime error;
- the real MapLibre/OpenFreeMap surface renders with required attribution;
- map → selection → inspector behavior works;
- desktop and narrow-phone layouts are usable;
- the early noindex posture is intact;
- no secret/private/restricted artifact is present;
- the shell does not imply that unimplemented historical data exists.

A local `npm run build` or `npm run verify` is necessary but is not evidence that the Cloudflare deployment itself succeeded.

## Later hardening

Addressed / mature:
- GitHub Actions CI / local verification parity is implemented via `.github/workflows/ci.yml`.
- Headless browser verification and review capture harness is implemented via `npm run review:capture`.
- Canonical metadata and public production indexing (`https://charted-currents.com/`, `index,follow`).
- Custom domain active with SSL on Cloudflare Pages (`https://charted-currents.com/`).

Remaining as the public slice matures:
- security headers appropriate to the final asset/runtime needs;
- build-watch optimization.
