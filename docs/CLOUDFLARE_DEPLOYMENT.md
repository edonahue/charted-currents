# Cloudflare Pages deployment

**Goal:** get the first verified Charted Currents shell onto a public URL as soon as Packet 1 is complete, without making custom-domain/path integration a prerequisite.

## Initial deployment strategy

Use **Cloudflare Pages Git integration** directly from this repository.

For the first public deployment:

- production branch: `main`;
- framework: Astro;
- build command: `npm run build`;
- output directory: `dist`;
- repository root as build root;
- Node: pinned by the repository `.nvmrc` (`22`);
- no build secrets/environment variables required for the initial shell.

The first durable target is the Pages-provided `*.pages.dev` hostname. Do not delay first deployment to solve the final canonical URL.

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

- Astro/Cloudflare build compatibility;
- MapLibre assets/runtime behavior on the real origin;
- static URL/path assumptions;
- responsive behavior outside localhost;
- deployment permissions/integration;
- whether the product already reads as intentional rather than generic.

It does **not** prove the historical corpus. The Packet 1 UI should say so honestly and remain in an early/noindex posture until Packet 2 provides real evidence-backed content.

## Do not block on `/labs/charted-currents/`

The existing personal website is a separate Cloudflare Pages project. Cloudflare Pages custom domains attach at the hostname level; a separate Pages application cannot simply claim only the path `erichdonahue.com/labs/charted-currents/` as though it were a hostname.

Therefore the initial deployment should remain independent.

Later options include:

1. keep the Pages hostname;
2. attach a project subdomain such as `charted-currents.erichdonahue.com`;
3. link/redirect from a `/labs/charted-currents/` page on the main site;
4. deliberately integrate the built project into the main site's build/output;
5. add an edge routing/proxy solution only if the path-shaped canonical URL is worth the extra infrastructure.

Do not add a Worker/proxy during Packet 1 merely to preserve the original path idea.

## Base-path rule

Packet 1 deploys at the Pages project root. Keep the app capable of later base-path adaptation, but do not configure Astro with `/labs/charted-currents/` as its base before that deployment model actually exists.

Avoid scattering hard-coded `/data/...` or `/assets/...` assumptions where a centralized/base-aware URL helper is appropriate.

## Production vs previews

For the initial launch, a verified Packet 1 push to `main` may be deployed directly for speed.

After the site exists publicly:

- use short-lived branches for substantial later packets;
- use Cloudflare preview deployments to inspect the real hosted result;
- merge to `main` when the packet is ready for production.

This gives the agent one large local work interval and the maintainer one hosted review point instead of many production deploys during implementation.

## Build-trigger posture

Do not optimize build-watch paths initially. The free Pages allowance is ample for the early project, and source/research files may later become build inputs. Bigger work packets and branch previews are the primary way to reduce noisy deployments.

Only add path-based build exclusions after the repository's real build dependency graph makes them safe.

## First-deploy acceptance

The first public deployment is successful when:

- Cloudflare reports a successful build from `main`;
- the deployment corresponds to the intended Git commit;
- the assigned public URL loads without a fatal console/runtime error;
- the real MapLibre surface renders with attribution;
- map → selection → inspector behavior works;
- desktop and narrow-phone layouts are usable;
- no secret/private/restricted artifact is present;
- the shell does not imply that unimplemented historical data exists.

A local `npm run build` is necessary but is not evidence that the Cloudflare deployment itself succeeded.

## Later hardening

Do not block the first deploy on these. Add them as the public slice matures:

- GitHub Actions/local verification parity;
- required checks/branch protection if useful;
- security headers appropriate to the final asset/runtime needs;
- canonical metadata and production indexing decision;
- custom domain/subdomain;
- deployment smoke checks;
- build-watch optimization.
