# Packet 1 visual reference board

This directory gives the coding/design agent a small **local historical visual vocabulary** so Packet 1 does not begin by browsing arbitrary pirate-site aesthetics.

## Populate the derivatives

From the repository root, after `npm install`:

```bash
npm run refs:sync
```

The script reads `manifest.json`, asks Wikimedia Commons for approximately 1280px derivatives of the specifically reviewed files, writes them to `assets/`, and records checksums in `checksums.json`.

Review the generated files before committing them. Packet 1 should keep the reviewed derivatives in Git so future visual work does not require repeated network access.

## What these files are for

Use them to study:

- hierarchy and negative space;
- coastline/land-water contrast;
- engraved line language;
- lettering scale and cadence;
- harbor plans and soundings;
- inset/reference treatment;
- restrained historical color;
- how maps visibly encode movement, wind, political space, and uncertainty.

They are **not** permission to:

- use a historical scan as a generic paper texture;
- copy ornamental cartouches into application chrome;
- imply that a 1755 source depicts 1692/1700 contemporaneously;
- publish a reference image in the product without its item-level rights/provenance review;
- make the modern basemap pretend to be a historical map.

`manifest.json` is the canonical metadata/source list. Do not add an image without adding its source and rights basis there.
