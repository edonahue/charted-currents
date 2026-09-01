# Packet 1 Hosted Production Review & Closeout Record

**Date**: 2026-09-01
**Production URL**: [`https://charted-currents.pages.dev/`](https://charted-currents.pages.dev/)
**Repository HEAD at time of hosted verification**: `82de458`
**Application Implementation Revision**: `ce44c66`
**Deployment Platform**: Cloudflare Pages (Git integration from branch `main`, static `dist/` output)

---

## 1. Production Deployment & Provenance Summary

The Packet 1 interactive atlas shell is successfully deployed to Cloudflare Pages from the `main` branch of `edonahue/charted-currents`.

- **Platform**: Cloudflare Pages static hosting (no Workers, SSR, or backend adapters);
- **Node Environment**: Node `22.23.1` (resolved via `.nvmrc`);
- **Dependencies**: Locked via committed `package-lock.json`;
- **Build Output**: Prerendered static site served directly from `dist/`;
- **Live Hostname**: `https://charted-currents.pages.dev/`.

---

## 2. Hosted Smoke-Test Verification

Verification was performed directly against the live production origin `https://charted-currents.pages.dev/` via HTTP requests and headless Chromium driven through the Chrome DevTools Protocol:

| Check | Production Target / Assertion | Result | Evidence Method |
| :--- | :--- | :--- | :--- |
| **HTTP Response** | Status 200, `content-type: text/html; charset=utf-8`, Cloudflare edge delivery | **PASS** | HTTP-observed |
| **Web Worker Resolution** | Dedicated worker thread active at `https://charted-currents.pages.dev/_astro/maplibre-gl-worker-Bml_7JYB.js` | **PASS** | CDP Target attached |
| **Vector Tile Decoding** | OpenFreeMap Positron style and vector tiles (`*.pbf`) load with HTTP 200 | **PASS** | CDP Network-observed |
| **Map Settlement** | `dataset.mapReady === "true"` and `dataset.mapIdle === "true"` reached within timeout | **PASS** | CDP DOM-observed |
| **Console Health** | 0 uncaught runtime exceptions (`Runtime.exceptionThrown` count = 0) | **PASS** | CDP Runtime-observed |
| **Folio Dock Interaction** | Browse Places disclosure opens; selecting "Port Royal" opens inspector with coordinates (`17.93738° N, 76.84062° W`) | **PASS** | CDP DOM-observed |
| **Attribution Controls** | MapLibre, OpenStreetMap, OpenMapTiles, and GeoNames (CC BY 4.0) links present and visible | **PASS** | CDP DOM-observed |
| **Mobile Responsiveness** | At 390x844 viewport, inspector transitions cleanly to bottom sheet with functional toggle handle (`data-sheet-state="partial"`) | **PASS** | CDP Emulation-observed |
| **Indexing Boundaries** | `/robots.txt` returns `Disallow: /`; `<meta name="robots" content="noindex,nofollow,noarchive" />` in HTML `<head>` | **PASS** | HTTP / DOM-observed |

---

## 3. Retained Hosted Screenshot

A clean representative screenshot captured directly from the live Cloudflare Pages URL at standard desktop viewport (1440x900) is preserved at:
- `design/reviews/packet1-hosted-1440x900.png` (219 KB)

---

## 4. Verification Boundaries & Notes

- **Basemap Glyph Fallback**: MapLibre requested a fallback font glyph from OpenFreeMap's public glyph endpoint (`404` for missing glyph range), which MapLibre handled silently without console errors or visual corruption.
- **Modern Locators**: The four visible markers (Port Royal, Havana, Curaçao / Willemstad, Cartagena de Indias) are modern developmental locators with explicit GeoNames CC BY 4.0 attribution, not historical geometries.
- **Corpus Posture**: Historical surfaces intentionally display honest prototype empty states. No synthetic voyages or invented records are published.

---

## 5. Milestone Conclusion

**Packet 1 is officially COMPLETE and closed as a deployed milestone.**

The interactive atlas shell, quiet modern basemap, folio dock, mobile bottom sheet, period rail, and rights/indexing boundaries are verified on the public production origin.

The repository is now ready for **Packet 2 (Historical corpus ingestion, source records, and provenance modeling)**.
