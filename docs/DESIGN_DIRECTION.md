# Design direction

## Identity

**Editorial historical atlas + restrained engraved-chart influence + modern interactive data product.** Weighted toward editorial clarity, not theatrical pirate theming.

## Theme

Light/warm-paper first. Dark mode may exist secondarily.

## Visual vocabulary

Explore warm ivory/chart paper, deep desaturated Atlantic navy, near-black engraving ink, muted sea/verdigris, aged brass, and restrained oxblood/rum red for conflict/predation. Do not copy Pirate Arcade's exact tokens.

The modern basemap should be deliberately quiet: coastline, islands, land/water structure, and restrained orientation labels matter more than contemporary roads, POIs, or administrative clutter. Packet 1 should lean toward a period-inflected editorial atlas while keeping the modern basemap visibly distinct from historical evidence.

## Typography

Packet 1 typography is settled:

- **Libre Caslon Text** — primary editorial/historical serif;
- **Inter** — highly legible interface sans;
- **IBM Plex Mono** — archival IDs, coordinates, evidence metadata, and research-oriented microcopy.

Bundle them locally through Fontsource rather than relying on a font CDN. Use the serif selectively: historical/editorial character should come from hierarchy and proportion, not by making every control look antique.

## Layout

- Map-first: enough screen area to feel located in the Caribbean.
- Inspector-first: preserve geographic continuity.
- Desktop: elegant right-side inspector dock integrated with the map composition.
- Mobile: inspector becomes a simple elegant bottom sheet/drawer; the map remains visible rather than being replaced by a stacked page section.
- Clear distinction among primary records, reconstructions, and context.
- Persistent compact timeline with current period, events, and coverage gaps.

The mobile sheet may use a small number of predictable states (closed / useful partial height / expanded) but should not become a gesture-framework project.

## Camera

Selection movement should preserve context rather than perform for the user:

- gentle `easeTo`-style repositioning only when needed to keep a selected feature visible beside/above the inspector;
- minimal zoom change;
- north-up, essentially 2D;
- no cinematic fly-throughs or gratuitous pitch/bearing;
- reduced-motion users get immediate/minimal repositioning rather than animated travel.

## Timeline

Packet 1 should make the 1650–1730 rail look intentional and finished as part of the composition, but it must not pretend to filter historical evidence before Packet 2 supplies temporal data. Establish hierarchy/ticks/visual language without a fake functioning scrubber.

## Historical imagery

Use period maps/documents as toggleable reference layers, entity illustrations, primary-source callouts, section openings, and inspectable research objects. Do not use scans as anonymous distressed-paper backgrounds.

For Packet 1 visual design research, use the local board under `design/reference-board/` and its source/rights manifest. These local images are references, not automatically approved public-product assets.

## Animation

Start with restrained camera moves, route drawing, inspector transitions, timeline transitions. Architect toward richer temporal animation and reconstructed routes later. Respect `prefers-reduced-motion`.

## Maker identity

Charted Currents owns the primary experience. A restrained secondary **“Erich Donahue · Lab”** treatment and project/GitHub linkage may appear in low-priority chrome, an About surface, or footer utility area. Do not turn the masthead into portfolio navigation.

## Tone

Good: “Follow this ship,” “Explore Port Royal,” “See connected voyages,” “Open source record,” “Why this route matters.”

Avoid faux pirate language and treasure-chest evidence UI.

See `docs/PACKET1_DIRECTION.md` for the locked first-build interaction choices.
