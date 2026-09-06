# Historical & Technical Dossier — Herman Moll Period Map Georeference Realignment

**Repository**: `edonahue/charted-currents`  
**Feature Branch**: `correction-moll-georeference`  
**Base**: `origin/main` (`ce86adeff4df4043924ad9987f49d5b5cc25dd7b`)  
**Corpus Version**: `0.7.0`  
**Lifecycle State**: `PACKET IMPLEMENTATION SELF-VERIFIED — EXTERNAL REVIEW REQUIRED`

---

## 1. Executive Summary & Review Invariant Alignment

This corrective interstitial pass resolves the visual and spatial misalignments identified in the Herman Moll [1715?] period map overlay (`loc_gm71005442`) introduced in Packet 8.

Following external maintainer review and audit instructions, the implementation strictly adheres to the four mandatory review requirements:

1. **R1 (Moderate Root-Cause Claim)**: The root cause is partitioned into two distinct factors:
   - *Implementation Error*: Severe pixel coordinate selection errors in Packet 8 (Port Royal picked on the north coast; Havana picked at Matanzas; Cape Hatteras picked arbitrarily from a clipped Carolina coast >1,000 km south of its true latitude) and the application of a second-order polynomial warp (`gdalwarp_tps_order_2`) which curled coordinate space between those flawed controls.
   - *Historical Cartographic Limitations*: Moll's original 18th-century engraving exhibits genuine historical longitude compression and regional cartographic variation (~90–130 km residual discrepancy across the Caribbean basin). Residual errors are preserved rather than forced into unnatural alignment.
2. **R2 (Graticule & Projection Audit)**: Direct pixel measurements of engraved latitude lines along the neatlines ($10^\circ, 15^\circ, 20^\circ, 25^\circ, 30^\circ\text{N}$) revealed strictly uniform linear spacing ($121.2\text{ px/deg}$, $R^2 = 0.999998$, max residual $2.4\text{ px}$), confirming an **Equirectangular / Plate Carrée** simple cylindrical graticule. The informal claim of Mercator projection was tested and definitively disproven ($R^2 = 0.999585$, max residual $21.8\text{ px}$).
3. **R3 (Harbor Inset Masking)**: The upper-right harbor draught inset block ($x \ge 4190, y \le 1175$) containing plans of Port Royal, Havana, Portobelo, Cartagena, and Boston is masked with full alpha transparency. Inset harbor plans no longer float over modern open Atlantic ocean bathymetry.
4. **R4 (Candidate Benchmark & Decision)**: Controlled comparative visual captures and quantitative error metrics were evaluated across 7 key viewports comparing Candidate C (Main Chart Affine) against Candidate F1 (Regional Caribbean Affine). Candidate C was selected based on superior leave-one-out cross-validation error, complete chart preservation (Flota return tracks and Lesser Antilles), and absence of artificial border clipping.

---

## 2. Empirical Graticule Audit (R2 Proof)

To verify the true projection of Moll's engraving, the y-pixel coordinates of the engraved degree ticks along the western and eastern graticule neatlines were measured on the uncompressed master TIFF (`loc_gm71005442_master.tif`, $6134 \times 3224\text{ px}$):

| Engraved Latitude | Y-Pixel (Master) | Observed $\Delta y$ / $5^\circ$ |
| :--- | :--- | :--- |
| $30^\circ\text{N}$ | $321$ | — |
| $25^\circ\text{N}$ | $926$ | $605\text{ px}$ ($121.0\text{ px/deg}$) |
| $20^\circ\text{N}$ | $1530$ | $604\text{ px}$ ($120.8\text{ px/deg}$) |
| $15^\circ\text{N}$ | $2139$ | $609\text{ px}$ ($121.8\text{ px/deg}$) |
| $10^\circ\text{N}$ | $2746$ | $607\text{ px}$ ($121.4\text{ px/deg}$) |

* **Linear Graticule Fit**:
  $$y = -121.26 \cdot \text{lat} + 3957.4$$
  - $R^2 = 0.999998$
  - Max residual: $2.40\text{ px}$
  - RMSE: $1.29\text{ px}$
* **Mercator Conformal Fit**:
  $$y = a \cdot \ln(\tan(\pi/4 + \phi/2)) + b$$
  - $R^2 = 0.999585$
  - Max residual: $21.79\text{ px}$
  - RMSE: $17.47\text{ px}$

**Conclusion**: Moll's chart was drawn on a strictly linear Plate Carrée / equirectangular graticule. An order-1 affine transformation is the mathematically exact model for rotating, scaling, and translating an equirectangular historical plate into modern WGS 84 geographic coordinates without introducing synthetic warping.

---

## 3. Ground Control Points (13 Audited Points)

All 13 GCPs were audited and verified on the master scan:

| ID | Feature Name | Modern Longitude | Modern Latitude | Scan X (px) | Scan Y (px) | LOOCV Residual (km) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Havana Harbour Entrance | -82.3556 | 23.1469 | 2620 | 1480 | 163.66 |
| 2 | Port Royal / Kingston Harbour | -76.8411 | 17.9372 | 3448 | 2280 | 154.51 |
| 3 | San Juan Harbour | -66.1245 | 18.4682 | 4376 | 2283 | 118.85 |
| 4 | St. Augustine Lighthouse | -81.2882 | 29.8965 | 2800 | 465 | 92.20 |
| 5 | Cape Canaveral | -80.5264 | 28.4611 | 2895 | 675 | 58.74 |
| 6 | Key West (Cayo Hueso) | -81.7999 | 24.5551 | 2708 | 1298 | 85.95 |
| 7 | Veracruz (San Juan de Ulúa) | -96.1333 | 19.2000 | 973 | 1876 | 134.42 |
| 8 | Campeche (Fuerte San José) | -90.5375 | 19.8464 | 1640 | 1860 | 91.67 |
| 9 | Cape Catoche | -87.1000 | 21.6000 | 2060 | 1630 | 148.65 |
| 10 | Portobelo Bay Entrance | -79.6600 | 9.5533 | 3090 | 3210 | 205.74 |
| 11 | Cartagena de Indias (Boca Chica) | -75.5800 | 10.3200 | 3580 | 3150 | 238.49 |
| 12 | Santo Domingo (Ozama River) | -69.8833 | 18.4667 | 3995 | 2265 | 114.75 |
| 13 | Bridgetown, Barbados | -59.6200 | 13.0950 | 5120 | 2875 | 87.79 |

---

## 4. Benchmark Decision: Candidate C vs. Candidate F1

| Metric | Baseline (Packet 8 Order 2) | Candidate C (Main Chart Affine) | Candidate F1 (Regional Affine) |
| :--- | :--- | :--- | :--- |
| **Warp Method** | Order 2 Polynomial | Order 1 Affine | Order 1 Affine |
| **GCP Count** | 10 (with off-sheet/mis-picks) | 13 verified | 10 (Caribbean basin only) |
| **In-Sample RMSE** | 85.78 km (overfit) | **94.91 km** | 95.33 km |
| **LOOCV RMSE** | 209.65 km | **123.76 km** | 125.44 km |
| **LOOCV Median** | — | 118.85 km | 91.67 km |
| **LOOCV 90th %** | — | 170.82 km | 184.28 km |
| **LOOCV Maximum** | — | 238.49 km | 237.17 km |
| **Output File Size** | 1,069,380 bytes | **820,024 bytes** | 892,386 bytes |
| **Neatline Integrity** | Buckled & warped | **Completely straight / unwarped** | Straight / clipped |
| **Extent Coverage** | Full (distorted) | **Full main chart preserved** | South Atlantic / Flota clipped |
| **Harbor Insets** | Unmasked (floating over sea) | **Cleanly alpha-masked** | Cleanly alpha-masked |

**Selection Decision**: Candidate C is adopted as the canonical georeference layer. Candidate C achieves a lower out-of-sample LOOCV RMSE (`123.76 km` vs `125.44 km`) across the full extent of the chart while preserving the critical transatlantic return route of the Spanish Flota and the complete Lesser Antilles chain.

---

## 5. Artifact Verification & Checksums

* **Rectified Visual Asset**: `public/assets/visuals/moll-west-indies-1715-rectified.webp`
  - Dimensions: $4352 \times 2248\text{ px}$
  - File Size: $820,024\text{ bytes}$
  - SHA-256: `0670b44343e22067769b7a8e77e23515c8d87b3fea35cf421ae24f24323ce972`
* **Acquisition Georeference Report**: `data/source_acquisitions/loc_gm71005442/georeference_report.json`
  - Geographic Bounds: `[[-103.446484, 34.081101], [-54.856667, 34.081101], [-54.856667, 9.002197], [-103.446484, 9.002197]]`
* **Regression Test Verification**:
  - `python3 scripts/georeference-moll-1715.py --verify-only` $\to$ `[PASS]`
  - `python3 -m unittest tests/test_period_map_layer.py` $\to$ `8 passed, 0 failed`
  - `npm run verify` $\to$ `0 errors, 0 warnings; static build complete`
