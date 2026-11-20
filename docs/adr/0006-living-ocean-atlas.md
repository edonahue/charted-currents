# ADR 0006 — Living Ocean Atlas exploration direction

**Status:** Accepted for Packet 12 implementation
**Date:** 2026-11-15

## Context

Packet 1 established a light editorial historical atlas, a Port Royal-centered Greater Caribbean opening, and restrained north-up 2D camera behavior. The approved Living Atlas campaign calls for a broader ocean-first experience that supports geographic rediscovery while keeping reviewed evidence immediately inspectable.

## Decision

Adopt **Living Ocean Atlas** as the product direction for Packet 12: luminous mineral sea, warm land, Atlantic ink, and existing project fonts; free geographic exploration as the default; optional guided paths derived only from reviewed data; and an integrated chart-to-record reading room with period-map comparison as the signature research experience.

An optional native MapLibre Atlantic globe may be implemented when the existing stack supports it within the packet’s performance and usability constraints. The globe must have a complete 2D fallback and preserve selection, source access, attribution, and geographic legibility. It is an interface view, not historical evidence.

## Consequences

- This decision supersedes Packet 1’s fixed Port Royal-centered initial focus and strict 2D-only presentation for the campaign. It does not supersede the static Astro/MapLibre architecture, evidence/provenance rules, item-level rights, editorial quality, or reduced-motion requirements.
- A globe is optional; no additional framework, service, runtime research API, dependency, or historical asset is approved by this ADR.
- A period-map comparison must disclose what is source imagery, georeferenced/projected material, modern basemap, and project overlay.
- Design acceptance is based on the campaign’s required viewport review and observed behavior, not on this decision text alone.

## Scope

This ADR authorizes implementation only within [Packet 12: Living Atlas](../LIVING_ATLAS_CAMPAIGN.md). It does not authorize deployment, publication, or historical corpus changes.
