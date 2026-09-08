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

Reproducible benchmark generated by `scripts/benchmark-moll-candidates.py` and serialized to canonical fixture `data/source_acquisitions/loc_gm71005442/candidate_benchmark.json`.

### 5.1 Full-Scope Benchmark Comparison

| Metric | Packet 8 Baseline | Candidate C (Canonical) | Candidate F1 (Inner-Basin Controls) |
| :--- | :--- | :--- | :--- |
| **Warp Method** | Order 2 Polynomial | **Order 1 Affine** | Order 1 Affine |
| **GCP Count** | 14 (flawed/off-sheet) | **13 verified** | 10 (Caribbean basin core) |
| **In-Sample RMSE** | 85.78 km (overfit) | **79.57 km** | 69.80 km |
| **LOOCV RMSE** | 209.65 km | **107.68 km** | 101.16 km |
| **LOOCV Mean** | — | **98.41 km** | 96.50 km |
| **LOOCV Median** | — | **86.99 km** | 97.94 km |
| **LOOCV 90th %** | — | **171.41 km** | 133.27 km |
| **LOOCV Maximum** | — | **171.68 km** (Bridgetown) | 150.81 km (Veracruz) |
| **Neatline Integrity** | Curled & buckled | **Completely straight / rigid** | Straight / unconstrained northern drift |
| **Flota Route Preserved** | Distorted | **Markings preserved within retained chart field** | Eastward markings unconstrained; plate scale drifts north |
| **Lesser Antilles Extent** | Distorted | **Fully preserved to Barbados** | Outer plate unconstrained without peripheral anchor |
| **LOC Insets Masked** | None (floating) | **5 masked (Bermuda kept)** | 5 masked |

*Note on population difference*: Candidate C covers 13 points spanning the entire map plate, including peripheral anchors (Charles Town, SC, St. Augustine, FL, and Bridgetown, Barbados). Candidate F1 is a full-chart affine fit using strictly the 10 inner-basin controls without peripheral constraints. Both models share the exact same 6-parameter affine transformation degrees of freedom; F1 has 3 fewer GCP observations. The headline LOOCV RMSEs (107.68 km vs 101.16 km) evaluate different geographic extents and control populations.

### 5.2 Common-Core Benchmark (Exact Same 10 Caribbean Basin Points)

Evaluating Candidate C's affine solution strictly across the identical 10 control points used by Candidate F1 isolates spatial accuracy from scope differences:

| Metric on Common Core (10 GCPs) | Candidate C | Candidate F1 | Delta (C − F1) |
| :--- | :--- | :--- | :--- |
| **In-Sample RMSE** | 79.31 km | 69.80 km | +9.51 km |
| **LOOCV RMSE** | **102.07 km** | **101.16 km** | **+0.91 km** (tied within 1 km) |
| **LOOCV Mean Error** | **93.14 km** | 96.50 km | **-3.36 km** (C is lower) |
| **LOOCV Median Error** | **83.105 km** | 97.94 km | **-14.835 km** (C is lower) |
| **LOOCV 90th Percentile** | 135.87 km | 133.27 km | +2.60 km |
| **LOOCV Maximum Error** | 171.41 km (Veracruz) | 150.81 km (Veracruz) | +20.60 km |

### 5.3 Per-Point LOOCV Error Breakdown on Common Core

| GCP ID | Feature Name | Candidate C LOOCV | Candidate F1 LOOCV | Delta (C − F1) | Substantive Assessment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `gcp_moll_san_juan` | San Juan, Puerto Rico | **51.63 km** | 109.84 km | **-58.21 km** | **Candidate C vastly superior**; F1 LOOCV error is 58.21 km larger without eastern constraint |
| `gcp_moll_portobelo` | Portobelo, Panama | **59.70 km** | 99.41 km | **-39.71 km** | **Candidate C markedly tighter** on Darien / Panama isthmus (39.71 km lower error) |
| `gcp_moll_cartagena` | Cartagena, Colombia | **79.22 km** | 96.47 km | **-17.25 km** | **Candidate C fits better** on Tierra Firme coast (17.25 km lower error) |
| `gcp_moll_cabo_san_antonio` | Cabo San Antonio, Cuba | **46.38 km** | 63.46 km | **-17.08 km** | **Candidate C tighter** on western Cuba promontory (17.08 km lower error) |
| `gcp_moll_santo_domingo` | Santo Domingo, Hispaniola | **48.38 km** | 55.32 km | **-6.94 km** | Candidate C slightly tighter on south Hispaniola |
| `gcp_moll_port_royal` | Port Royal, Jamaica | 135.87 km | 133.27 km | +2.60 km | Effectively identical (~135 km) |
| `gcp_moll_cabo_maisi` | Cabo Maisí, Cuba | 120.15 km | 113.33 km | +6.82 km | Effectively identical (~115 km) |
| `gcp_moll_veracruz` | Veracruz, Mexico | 171.41 km | 150.81 km | +20.60 km | Candidate F1 slightly tighter in Bay of Campeche |
| `gcp_moll_havana` | Havana, Cuba | 86.99 km | 57.24 km | +29.76 km | Candidate F1 local fit tighter at Havana |
| `gcp_moll_willemstad` | Willemstad, Curaçao | 131.69 km | 85.84 km | +45.85 km | Candidate F1 tighter locally; both pass $\le 190\text{ km}$ gate |

### 5.4 Review Candidate F1 Specification (Non-Production Working Derivative)

To support complete empirical audit and visual review without shipping non-canonical rasters in production, the Candidate F1 derivative is generated into a non-production working location:
* **Working Asset Path**: `data/working/review/moll-west-indies-1715-f1-inner-basin.webp`
* **Production Status**: Non-production review artifact (excluded from `public/` and git; served locally during comparison captures)
* **Derivative Dimensions**: $2560 \times 1562\text{ px}$ (intermediate warped TIFF: $5787 \times 3533\text{ px}$)
* **Asset Size**: $892,668\text{ bytes}$
* **SHA-256**: `10cfb9cad6b9f51e4cd5cb0c458740be4084ee7c274697975ec822aed45d9142`
* **Geographic Bounds**: `[[-102.229315, 34.773944], [-55.659716, 34.773944], [-55.659716, 8.664943], [-102.229315, 8.664943]]`

### 5.5 Paired Visual Comparison Analysis (9 Viewports)

All 18 screenshots captured under identical MapLibre camera parameters, layer opacity (0.65), and viewport dimensions via `npm run review:moll-comparison` (`scripts/capture-moll-comparison.mjs`):

1. **Greater Caribbean Wide** (`[-75.0, 20.0]`, z4.2):
   - *Candidate C*: Rigid rectangular plate bounds preserving the northern neatline at $34.00^\circ\text{N}$, framing the Atlantic coastline from the Carolinas through Florida, the entire Caribbean sea, and the Windward Islands down to Trinidad.
   - *Candidate F1*: Top neatline shifts northward to $34.77^\circ\text{N}$, vertically stretching the chart by 9% (3533 vs 3241 lines) due to the absence of northern controls.
2. **Cuba / Jamaica / Hispaniola** (`[-75.5, 20.0]`, z5.5):
   - *Candidate C*: Cuba and Hispaniola sit with natural orientation; the Windward Passage between Cabo Maisí and western Hispaniola aligns cleanly with modern bathymetry.
   - *Candidate F1*: Similar regional orientation, but Hispaniola and Puerto Rico are noticeably stretched vertically.
3. **Havana** (`[-82.35, 23.14]`, z7.5):
   - Both candidates place the Castillo del Morro harbor entrance directly over Havana Bay. Candidate F1 is ~30 km closer to true center, but both provide high cartographic legibility.
4. **Jamaica / Port Royal** (`[-76.84, 17.94]`, z7.5):
   - Alignment is virtually identical across both candidates (135.87 km vs 133.27 km LOOCV, delta 2.6 km); Palisadoes sand spit and Kingston Harbour overlay with identical fidelity.
5. **Hispaniola / Puerto Rico** (`[-68.0, 18.5]`, z6.0):
   - *Candidate C*: Displays excellent alignment on Puerto Rico (LOOCV 51.63 km), with San Juan harbor positioned accurately.
   - *Candidate F1*: San Juan LOOCV error is 58.21 km larger (109.84 km) under the unconstrained fit, showing visible eastward shift relative to the modern grid.
6. **Willemstad / Southern Caribbean** (`[-68.93, 12.11]`, z7.0):
   - Both candidates place Curaçao and the entrance to St. Anna Bay within historical tolerance ($\le 190\text{ km}$ gate). F1 achieves a tighter local fit at Curaçao (85.84 km vs 131.69 km), while C provides better balance along the adjacent Venezuelan / Tierra Firme coast.
7. **Cartagena / Portobelo** (`[-77.5, 10.0]`, z6.2):
   - Candidate C is visibly superior across both Tierra Firme anchorages (Portobelo: 59.70 km vs 99.41 km for F1; Cartagena: 79.22 km vs 96.47 km for F1), avoiding the northeastern coastal drift visible under F1's unconstrained fit.
8. **Barbados / Eastern Edge** (`[-59.62, 13.1]`, z7.0):
   - Candidate C firmly retains Bridgetown (171.68 km LOOCV) and the full Windward chain. In Candidate F1, lacking an eastern peripheral anchor, the Lesser Antilles drift eastward relative to modern coordinates.
9. **Florida / Northern Edge** (`[-81.0, 29.5]`, z6.0):
   - Candidate C accurately positions St. Augustine (60.28 km LOOCV) and Charles Town (115.89 km LOOCV), maintaining proper scale for the Florida peninsula. Candidate F1 stretches the peninsula vertically by ~9% due to missing northern anchor controls.

### 5.6 Final Selection Rationale

Candidate C is selected as the canonical production georeference layer:
1. **Common-Core Statistical Equivalence**: On the exact same 10 Caribbean basin points, out-of-sample LOOCV RMSE is effectively tied ($102.07\text{ km}$ for C vs $101.16\text{ km}$ for F1, delta $0.91\text{ km}$). Candidate C achieves **lower mean error** ($93.14\text{ km}$ vs $96.50\text{ km}$) and **lower median error** ($83.105\text{ km}$ vs $97.94\text{ km}$) across the common core.
2. **Geometric Regularity**: Both models use the identical 6-parameter affine transformation; Candidate C utilizes 13 GCP observations while Candidate F1 utilizes 10. Candidate C preserves true graticule proportions (3241 warped height lines), avoiding the unconstrained 9% vertical over-stretching (3533 lines) produced by Candidate F1's lack of northern constraints.
3. **Cartographic Integrity**: Candidate C preserves Moll's eastward/transatlantic Flota track markings within the retained chart field (*"and ye several tracts made by ye galeons and flota from place to place"*) and maintains continuous representation of Florida and the Lesser Antilles down to Barbados without artificial border truncation.

---

## 6. Artifact Verification & Checksums

* **Canonical Rectified Visual Asset**: `public/assets/visuals/moll-west-indies-1715-rectified.webp`
  - Dimensions: $2560 \times 1422\text{ px}$ (intermediate warped TIFF: $5832 \times 3241\text{ px}$)
  - File Size: $830,286\text{ bytes}$ ($\le 1.5\text{ MB}$ asset budget)
  - SHA-256: `1250d8864beb684357f3e3ec7dc066be1e49d39160ad6297cf4004115befb0d5`
* **Review Visual Asset (Candidate F1)**: Non-production working derivative `data/working/review/moll-west-indies-1715-f1-inner-basin.webp` ($2560 \times 1562\text{ px}$, $892,668\text{ bytes}$, SHA-256 `10cfb9cad6b9f51e4cd5cb0c458740be4084ee7c274697975ec822aed45d9142`, generated on demand, excluded from production `public/`)
* **Candidate Benchmark Fixture**: `data/source_acquisitions/loc_gm71005442/candidate_benchmark.json`
* **Canonical GCP Audit**: `data/source_acquisitions/loc_gm71005442/gcp_audit.json`
* **Graticule Audit**: `data/source_acquisitions/loc_gm71005442/graticule_audit.json`
* **Visual Review Artifact**: `data/source_acquisitions/loc_gm71005442/gcp_audit_review_annotated.jpg` ($2000 \times 1206\text{ px}$, $909.7\text{ KB}$)
* **Acquisition Georeference Report**: `data/source_acquisitions/loc_gm71005442/georeference_report.json`
  - Geographic Bounds: `[[-103.504252, 34.004028], [-54.900389, 34.004028], [-54.900389, 9.146624], [-103.504252, 9.146624]]`
* **Paired Review Screenshots**: 18 files in `design/reviews/moll-candidate-c-*.png` and `design/reviews/moll-candidate-f1-*.png`
* **Regression Test Verification**:
  - `python3 scripts/georeference-moll-1715.py --verify-only` $\to$ `[PASS]`
  - `python3 -m unittest tests/test_period_map_layer.py` $\to$ `11 passed, 0 failed`
  - `npm run data:validate` $\to$ `All 8 published artifacts validated successfully with 0 errors`
  - `npm run preflight` $\to$ `Static build clean, 0 errors, 0 warnings`
  - `npm run review:capture-packet8` $\to$ `267 passed, 0 failed`
  - `npm run review:moll-comparison` $\to$ `All 18 comparison screenshots successfully captured`

