# ADR 0007 — Navigation state and adaptive rendering

**Status:** Accepted for Packet 12 implementation
**Date:** 2026-11-15

## Context

The Living Atlas direction broadens exploration beyond Packet 1’s fixed opening focus and requires a clean distinction between durable record selection, transient pointer state, and camera motion. Globe support, if implemented, also needs to degrade to a dependable 2D experience without adding a new runtime architecture.

## Decision

Keep selection, URL-addressable state, and camera lifecycle as separate concerns within the existing Astro, TypeScript, and MapLibre implementation:

- Typed selection identifies the reviewed entity, place, event, or reading-room record being inspected.
- URL/deep-link state should represent supported durable selection, settled geographic view (center/zoom), display mode (2D/globe), and guide state when applicable. In-flight camera motion and hover are transient and do not silently become selection state.
- Browser back/forward restores only durable state explicitly represented in the URL, including a settled view/mode when encoded. A selection-only deep link must not acquire a stale camera position from unrelated transient state, and history must not prevent users from navigating freely.
- Camera adjustment is interruptible and only corrects actual feature occlusion by the inspector or reading surface. User input can take control immediately. North-up 2D remains the dependable fallback; reduced-motion behavior avoids required animated travel.
- Adaptive rendering may select an available presentation based on explicit user choice and device/runtime capability. Optional globe work is deferred until requested/available, and gracefully unavailable without breaking 2D, selection, or evidence access.
- No continuous idle animation loop. Nonessential rendering pauses or reduces when the page is hidden or reduced motion is requested.

## Consequences

- The implementation must define which state is durable and which is transient, then verify direct links, browser history, camera interruption, inspector occlusion, keyboard interaction, and fallback behavior. Settled center/zoom/mode URL persistence is approved target behavior; it is not evidence of current implementation.
- This evolves Packet 1’s “do not build a client-side router just for inspector state” rule without authorizing a separate router or SPA. Use existing URL/hash/search mechanisms where appropriate.
- Adaptive rendering and the optional globe remain within the current static-first stack. A new framework, service, or dependency requires a separate decision.
- Performance and real-device behavior must be measured and reported under [the Living Atlas campaign budgets](../LIVING_ATLAS_CAMPAIGN.md#proposed-performance-and-stability-budgets); these targets are currently proposed and unmeasured.

## Scope

This ADR authorizes implementation only within [Packet 12: Living Atlas](../LIVING_ATLAS_CAMPAIGN.md). It does not authorize deployment, publication, or historical corpus changes.
