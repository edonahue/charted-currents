# Durable context notes

Keep durable agent context focused on decisions that change future implementation. Do not use repository instruction files as session transcripts or personal memory.

## Worth recording

- product invariants and acceptance criteria;
- architectural decisions and why they were made;
- source-of-truth locations and generated-file rules;
- historical/provenance/rights constraints;
- public/private boundaries;
- verification commands and what they actually cover;
- recurring failure modes expressed as reusable tests, validators, or rules;
- current documented limitations when they materially constrain implementation.

## Do not record as durable agent context

- temporary branch/PR state;
- one-off debugging history;
- transient benchmark numbers without methodology/context;
- private workstation state;
- personal preferences that do not change implementation decisions;
- private account, household, employer, or infrastructure details;
- long narratives about how a previous agent failed.

When a recurring mistake matters, preserve the **invariant** that prevents it, not the story of the mistake.
