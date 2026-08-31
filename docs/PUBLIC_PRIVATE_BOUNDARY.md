# Public / private repository boundary

Charted Currents is a public repository. Reproducibility and transparency matter, but neither requires publishing secrets, private infrastructure, personal information, restricted source material, or sensitive heritage locations.

This document defines what belongs in Git and what remains local/private.

## Safe to publish by default

These are appropriate for the public repository when their own source/license terms permit it:

- project code, schemas, validators, tests, and documentation;
- synthetic fixtures designed for deterministic tests;
- historical facts and metadata that have clear source provenance and publication rights;
- machine-readable source registries containing public URLs, public identifiers, rights notes, and non-secret setup requirements;
- rights-cleared or public-domain maps, images, documents, and derived assets with attribution metadata;
- generalized architecture diagrams and local-development instructions that do not expose private infrastructure;
- reproducible benchmark methodology and non-sensitive measured results;
- example configuration files containing placeholders rather than live credentials;
- public artifact manifests and provenance/version metadata needed to reproduce the published experience.

A source being visible on the web does not by itself make its data, scans, or images safe to redistribute.

## Keep local/private

Never commit:

- API keys, tokens, passwords, cookies, OAuth credentials, SSH keys, or authenticated session material;
- `.env` files other than deliberately sanitized examples;
- private usernames, home-directory paths, personal email addresses used only for authentication, or account IDs that are not required public project metadata;
- machine hostnames, private IP addresses, VPN/Tailscale names, SSH aliases, storage mounts, backup paths, or detailed home/local network topology;
- private deployment credentials or non-public service endpoints;
- raw logs or screenshots that expose local paths, account UI, notifications, unrelated browser tabs, or private desktop content;
- employer/internal-project information, internal identifiers, private work artifacts, or non-public organizational data;
- personal/family/health/financial information or other unrelated personal context;
- private collection exports, research notes, or personal annotations that are not intentionally part of the public historical corpus;
- raw archive/dataset payloads whose redistribution rights are absent, uncertain, or restrictive;
- licensed/proprietary database exports obtained for research use only;
- exact archaeological/shipwreck coordinates when source policy, law, conservation practice, or site sensitivity calls for generalized/withheld public location;
- generated AI research output that has not been traced back to public source evidence and reviewed for publication.

If code needs one of these locally, document the interface/configuration shape and keep the real value ignored.

## Public fixtures must not be disguised private data

A fixture should be either:

1. **synthetic and reproducible**, with no dependency on private information; or
2. **real and publishable**, with explicit source/provenance/rights metadata.

Do not take a small slice of a private/restricted dataset and call it a fixture merely because the sample is small.

When realistic values are useful for a UI or parser test but the real source is not publishable, construct synthetic records that exercise the same schema and edge cases without reproducing protected/private content.

Historical demo data is a special case: do not fabricate historical facts for visual realism. Use an explicit development-only synthetic namespace or an honest empty state until a real publishable fixture is available.

## Repository evidence controls public claims

Do not document or present a capability as existing merely because it exists on a maintainer's workstation or in an uncommitted experiment.

Public claims such as these require repository/runtime evidence:

- an ingestion adapter is implemented;
- a source has been downloaded or profiled;
- a benchmark has been run;
- a dataset has been published;
- a browser interaction works;
- a deployment exists;
- a museum/wreck/source connection has been validated;
- an automated workflow or check exists.

Use future-tense or planned language when the public repository does not yet contain the evidence.

## Source rights and credentials are separate concerns

A source can be:

- public to read but not reusable in bulk;
- accessible only after free authentication;
- reusable as metadata but restrictive for images;
- locally storable for research but not redistributable;
- reusable only after permission.

Therefore do not infer publication rights from access method. Track source/component rights using `docs/SOURCE_RIGHTS.md` and the research registries.

Credential requirements may be documented publicly using environment-variable names and setup instructions, but never include the actual credential.

## Sensitive geographic data

Some heritage datasets may contain more precise location than the public product should expose.

Maintain separate concepts for:

- research/source geometry;
- validated canonical geometry;
- public display geometry;
- public precision/sensitivity state.

Generalization or withholding is an intentional publication transform, not data corruption. See `docs/SHIPWRECKS_AND_MUSEUMS.md` for underwater archaeological-site examples.

## Benchmarks and environment descriptions

Performance results should include enough environment description to be interpretable without exposing private infrastructure.

Prefer public-safe descriptors such as:

- CPU/GPU model or broad hardware class when relevant;
- RAM amount when relevant;
- OS/runtime versions;
- dataset/input version;
- command/method;
- elapsed time and measured resource use.

Do not include local hostnames, user names, home paths, IP addresses, storage topology, or access credentials.

## Agent behavior before adding questionable content

Before committing a new data file, config, log, screenshot, benchmark artifact, or environment-specific document, ask:

1. Is this necessary for the public project?
2. Is it reproducible or intentionally canonical?
3. Do we have the right to redistribute it?
4. Does it reveal private environment or unrelated personal information?
5. Could a less-sensitive synthetic/generalized representation serve the same engineering purpose?

When uncertain, keep the material local and document the missing public-safe contract rather than publishing first and cleaning up later.

## Future enforcement

As implementation grows, add deterministic validation for the public boundary where practical—for example checks for forbidden raw-data paths, secrets patterns, untracked generated artifacts, source/rights metadata, and sensitive-location publication state. Automation should supplement, not replace, human rights/privacy review.
