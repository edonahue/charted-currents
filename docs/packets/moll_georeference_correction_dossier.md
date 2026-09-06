# Historical & Technical Dossier — Herman Moll Period Map Georeference Realignment

**Repository**: `edonahue/charted-currents`  
**Feature Branch**: `correction-moll-georeference`  
**Base**: `origin/main` (`ce86adeff4df4043924ad9987f49d5b5cc25dd7b`)  
**Corpus Version**: `0.7.0`  
**Lifecycle State**: `PACKET IMPLEMENTATION SELF-VERIFIED — EXTERNAL REVIEW REQUIRED`

---

## 1. Executive Summary & Review Invariant Alignment

This corrective interstitial pass resolves the visual and spatial misalignments identified in the Herman Moll [1715?] period map overlay (`loc_gm71005442`) introduced in Packet 8.

Following external maintainer review and audit instructions (R1–R15), this implementation reconciles all documentation, data fixtures, and transformation pipelines:

1. **R1 (Moderate Root-Cause Partitioning)**: The defect is partitioned into:
   - *Implementation Defect*: Packet 8 utilized 14 ground control points derived from an uncalibrated scale (injecting 300–1,000 km errors, including an off-sheet pick for Cape Hatteras >250 km north of the chart's neatline), compounded by a second-order polynomial warp (`gdalwarp_polynomial_order_2`) that curled coordinate space between those flawed controls.
   - *Legitimate Historical Cartographic Limitations*: Moll's original copperplate engraving exhibits genuine 18th-century longitude compression and regional distortion (~70–130 km across the Caribbean basin). Residual errors are preserved rather than forced into unnatural alignment.
2. **R2 & R9 (Graticule & Projection Audit)**: Direct pixel measurements across the canonical master scan (`moll-1715-loc-master.jpg`, $6025 \times 3636$) demonstrate a strictly linear/equidistant cylindrical-style graticule ($122.0\text{ px/deg}$ latitude, $R^2 = 0.999951$; $120.2\text{ px/deg}$ longitude; aspect ratio ~0.985). An order-1 affine transformation mathematically models translation, rotation, and independent axis scaling without synthetic polynomial warping.
3. **R6 (Single Coordinate Frame)**: All operations strictly reference the pinned canonical master `data/raw/loc_gm71005442/moll-1715-loc-master.jpg` ($6025 \times 3636$, SHA-256 `5810c09c6c4185633be6f8b9cb1a19795d04cc0ac9a7f33ee90243395cf04f82`). Uncalibrated exploratory TIFF references have been purged.
4. **R7 & R11 (Pinpointed GCPs & Machine-Readable Audit)**: Canonical fixture `data/source_acquisitions/loc_gm71005442/gcp_audit.json` defines all 13 points with physical pinpoint rationales. Key features have been accurately pinpointed: Willemstad, Curaçao to the engraved harbor inlet at Bay St. Anna ($x=4365, y=2588$, LOOCV $131.69\text{ km}$, meeting the $\le 190\text{ km}$ gate); Cartagena to the Boca Chica entrance ($x=3410, y=2835$, LOOCV $79.22\text{ km}$).
5. **R8 & R15 (LOC Inset Reconciliation & Bermuda Status)**: Authoritative Library of Congress record (`gm71005442`, `G4390 1715 .M6`) lists exactly six insets. The five harbor draught insets inside the neatline crop are alpha-masked across three discrete bounding boxes. Inset 6 (Mexico City) is outside the crop ($y \ge 2905$). Bermuda is **not** an LOC-listed inset, has no compartment border, belongs to the continuous main chart field, and is fully preserved and unmasked.

---

## 2. Empirical Graticule Audit (R2 & R9 Proof)

Measured on canonical master `data/raw/loc_gm71005442/moll-1715-loc-master.jpg` ($6025 \times 3636$):

### Latitude Parallels (North to South)

| Engraved Parallel | Observed Y-Pixel (Master) | Expected Y ($y = -122.00 \cdot \text{lat} + 4159.70$) | Residual |
| :--- | :--- | :--- | :--- |
| $30^\circ\text{N}$ | $496.0$ | $499.70$ | $-3.70\text{ px}$ |
| $25^\circ\text{N}$ | $1120.0$ | $1109.70$ | $+10.30\text{ px}$ |
| $20^\circ\text{N}$ | $1712.0$ | $1719.70$ | $-7.70\text{ px}$ |
| $15^\circ\text{N}$ | $2329.0$ | $2329.70$ | $-0.70\text{ px}$ |
| $10^\circ\text{N}$ | $2941.5$ | $2939.70$ | $+1.80\text{ px}$ |

* **Linear Graticule Fit**: $y = -122.00 \cdot \text{deg} + 4159.70$ ($R^2 = 0.999951$, $122.00\text{ px/deg}$)
* **Mercator Fit**: $R^2 = 0.999585$ (max residual $21.8\text{ px}$, inferior fit to simple cylindrical)
* **Longitude Spacing**: Inner neatline span $5963 - 72 = 5891\text{ px}$ across $49^\circ$ ($105^\circ\text{W}$ to $56^\circ\text{W}$) = $120.22\text{ px/deg}$.
* **Aspect Ratio**: $120.22 / 122.00 = 0.985$ (approximately $1.0$, confirming a square-degree linear cylindrical plate).
* **Scan Orthogonality**: Left neatline $x=72$, top neatline $y=96$; scan tilt $<0.05^\circ$.

---

## 3. Authoritative LOC Inset Audit & Masking Boundary (R8 & R15)

The Library of Congress catalogue entry for `gm71005442` (`G4390 1715 .M6`) records exactly six insets:

| # | Catalogued Inset Title | Master Bounds $[x_1, y_1, x_2, y_2]$ | Crop Relation | Masking Treatment |
| :--- | :--- | :--- | :--- | :--- |
| 1 | *La Vera Cruz* | $[4481, 233, 4831, 439]$ | Inside Crop | Alpha-masked (Box B: $350 \times 206\text{ px}$) |
| 2 | *A draught of ye bay & citty of Havana* | $[4831, 91, 5425, 625]$ | Inside Crop | Alpha-masked (Box A) |
| 3 | *The bay of Porto Bella* | $[5425, 91, 5963, 625]$ | Inside Crop | Alpha-masked (Box A) |
| 4 | *A draught of St. Augustin and its harbour* | $[4188, 439, 4831, 850]$ | Inside Crop | Alpha-masked (Box C: $643 \times 411\text{ px}$) |
| 5 | *A draught of ye citty of Cartagena its harbour & forts* | $[4831, 625, 5963, 1234]$ | Inside Crop | Alpha-masked (Box A: $1132 \times 1143\text{ px}$ total) |
| 6 | *The city of Mexico in New Spain* | $[20, 2905, 2120, 3555]$ | **Outside Crop** | Excluded by neatline crop ($y \le 2895$); zero internal mask |

### Bermuda Classification (R15 Mandate)
* **Status**: Continuous main-chart geography (**NOT an LOC-listed inset**).
* **Master Bounds**: $x \in [4400, 4830], y \in [95, 230]$ ("Barmudas Isl. English").
* **Preservation Proof**: Bermuda sits strictly north of Box B ($y < 233$) and west of Box A ($x < 4831$). It is **100% unmasked and preserved** in the rectified WebP asset.

---

## 4. Ground Control Points (13 Audited Points, Candidate C)

Master pixel frame: $6025 \times 3636$; Crop offset: $[20, 91]$. Machine-readable fixture: `gcp_audit.json`.

| ID | Feature Name | Modern Lon | Modern Lat | Master X | Master Y | In-Sample (km) | LOOCV (km) | Pinpoint Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Havana, Cuba | -82.35 | 23.14 | 2550 | 1360 | 76.25 | 86.99 | Castillo del Morro at narrow harbor entrance channel |
| 2 | Port Royal, Jamaica | -76.84 | 17.94 | 3420 | 1960 | 124.90 | 135.87 | Palisadoes sand spit enclosing Kingston Harbour |
| 3 | Veracruz, Mexico | -96.13 | 19.20 | 795 | 1665 | 85.28 | 171.41 | San Juan de Ulúa island fortress offshore |
| 4 | Cartagena, Colombia | -75.54 | 10.40 | 3410 | 2835 | 60.97 | 79.22 | Boca Chica entrance symbol on Tierra Firme coast |
| 5 | Portobelo, Panama | -79.66 | 9.55 | 2840 | 2830 | 42.71 | 59.70 | Embayment of Portobelo east of Rio Chagres |
| 6 | Saint Augustine, Florida | -81.31 | 29.89 | 2860 | 570 | 43.96 | 60.28 | Coastal inlet and Castillo de San Marcos |
| 7 | San Juan, Puerto Rico | -66.12 | 18.47 | 4680 | 1825 | 41.26 | 51.63 | Fortified islet and harbor entrance |
| 8 | Santo Domingo, Hispaniola | -69.88 | 18.47 | 4130 | 1880 | 42.67 | 48.38 | Mouth of Ozama River on south coast |
| 9 | Bridgetown, Barbados | -59.62 | 13.09 | 5325 | 2430 | 115.49 | 171.68 | Carlisle Bay anchorage on southwest coast |
| 10 | Willemstad, Curaçao | -68.93 | 12.11 | 4365 | 2588 | 106.85 | 131.69 | Deep inlet of Bay St. Anna on south coast |
| 11 | Cabo San Antonio, Cuba | -84.95 | 21.86 | 2280 | 1495 | 39.66 | 46.38 | Prominent western promontory of Cuba |
| 12 | Cabo Maisí, Cuba | -74.14 | 20.25 | 3520 | 1690 | 110.26 | 120.15 | Easternmost promontory framing Windward Passage |
| 13 | Charles Town, South Carolina | -79.93 | 32.78 | 3080 | 150 | 64.29 | 115.89 | Charleston Harbor entrance anchoring northern neatline |

---

## 5. Benchmark Decision: Candidate C vs. Candidate F1

Reproducible benchmark generated by `scripts/benchmark-moll-candidates.py`:

| Metric | Packet 8 Baseline | Candidate C (Canonical) | Candidate F1 (Regional) |
| :--- | :--- | :--- | :--- |
| **Warp Method** | Order 2 Polynomial | **Order 1 Affine** | Order 1 Affine |
| **GCP Count** | 14 (flawed/off-sheet) | **13 verified** | 10 (Caribbean basin core) |
| **In-Sample RMSE** | 85.78 km (overfit) | **79.57 km** | 69.80 km |
| **LOOCV RMSE** | 209.65 km | **107.68 km** | 101.16 km |
| **LOOCV Median** | — | **86.99 km** | 99.41 km |
| **LOOCV 90th %** | — | **171.41 km** | 133.27 km |
| **LOOCV Maximum** | — | **171.68 km** (Bridgetown) | 150.81 km (Veracruz) |
| **Neatline Integrity** | Curled & buckled | **Completely straight / rigid** | Straight / clipped |
| **Flota Route Preserved** | Distorted | **Fully preserved** | Atlantic return clipped |
| **Lesser Antilles Extent** | Distorted | **Fully preserved to Barbados** | Windward chain clipped |
| **LOC Insets Masked** | None (floating) | **5 masked (Bermuda kept)** | 5 masked |

**Selection Rationale**: Candidate C is adopted as the canonical georeference layer. It delivers a 49% reduction in cross-validation error relative to Packet 8 (`107.68 km` vs `209.65 km`) across the full map field, while retaining the northern Atlantic seaboard, Florida, Windward Islands, and transatlantic Flota return route without artificial geographic truncation.

---

## 6. Artifact Verification & Checksums

* **Rectified Visual Asset**: `public/assets/visuals/moll-west-indies-1715-rectified.webp`
  - Dimensions: $2560 \times 1422\text{ px}$ (intermediate warped TIFF: $5832 \times 3241\text{ px}$)
  - File Size: $830,286\text{ bytes}$ ($\le 1.5\text{ MB}$ asset budget)
  - SHA-256: `1250d8864beb684357f3e3ec7dc066be1e49d39160ad6297cf4004115befb0d5`
* **Canonical GCP Audit**: `data/source_acquisitions/loc_gm71005442/gcp_audit.json`
* **Graticule Audit**: `data/source_acquisitions/loc_gm71005442/graticule_audit.json`
* **Visual Review Artifact**: `data/source_acquisitions/loc_gm71005442/gcp_audit_review_annotated.jpg` ($2000 \times 1206\text{ px}$, $909.7\text{ KB}$)
* **Acquisition Georeference Report**: `data/source_acquisitions/loc_gm71005442/georeference_report.json`
  - Geographic Bounds: `[[-103.504252, 34.004028], [-54.900389, 34.004028], [-54.900389, 9.146624], [-103.504252, 9.146624]]`
* **Regression Test Verification**:
  - `python3 scripts/georeference-moll-1715.py --verify-only` $\to$ `[PASS]`
  - `python3 -m unittest tests/test_period_map_layer.py` $\to$ `10 passed, 0 failed`
  - `npm run data:validate` $\to$ `All 8 published artifacts validated successfully with 0 errors`
  - `npm run preflight` $\to$ `Static build clean, 0 errors, 0 warnings`
