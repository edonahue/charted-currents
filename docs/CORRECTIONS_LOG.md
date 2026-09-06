# Charted Currents — Historical Corrections Log

This log records substantive historical, provenance, and cartographic corrections in accordance with [`docs/CORRECTIONS_POLICY.md`](CORRECTIONS_POLICY.md). Every entry provides an auditable trail of what was previously claimed, the nature and root cause of the error, the empirical evidence prompting the change, the updated state, and machine-checkable invariants.

---

## Correction Entry: `CORR-20260906-01`

* **Date**: 2026-09-06
* **Status**: `corrected` (self-verified, pending maintainer review)
* **First Corrected Branch / Release**: `correction-moll-georeference` (targeting next corpus release after `0.7.0`)
* **Category**: Cartographic georeference / Class F (spatial alignment) and Class B (transformation parameter) assertion correction
* **Impacted Objects**:
  * Assertion: `ast_loc_moll_georeference` in `public/data/sources.json`
  * Entity: `visual_moll_west_indies_1715` in `public/data/entities.json`
  * Acquisition Report: `data/source_acquisitions/loc_gm71005442/georeference_report.json`
  * Derivative Image: `public/assets/visuals/moll-west-indies-1715-rectified.webp`
  * User Interface Component: `src/components/map/MapViewport.astro`
  * Test Suite: `tests/test_period_map_layer.py`

### 1. Previous Claimed State (Packet 8)
* **Transformation Method**: Second-order polynomial warp (`gdalwarp_tps_order_2`).
* **Reported Metrics**: In-sample RMSE `85.78 km`; LOOCV RMSE `209.65 km` (severe cross-validation discrepancy indicating overfitting and local control error).
* **Control Points**: 10 ground control points including off-sheet Hatteras and erroneous pixel picks for Port Royal and Havana.
* **Inset Masking**: Upper-right harbor draught insets were unmasked, warping five distinct local-scale harbor plans (Port Royal, Havana, Portobelo, Cartagena, Boston) into open-ocean Atlantic coordinates.
* **Graticule Representation**: Described informally as possibly Mercator-derived without empirical measurement.

### 2. Nature of Challenge & Error Analysis
* **Maintainer Challenge**: In manual visual inspection of Packet 8 preview, the Herman Moll overlay showed marked distortion against modern coastline geography: Florida warped west into the Gulf of Mexico, Cuba exhibited severe bending, and coastal features drifted hundreds of kilometers from their true coordinates.
* **Empirical Audit Findings**:
  1. *Pixel Mis-Picks*:
     - Port Royal: Picked at $y=2140$ instead of $y=2280$ (selecting Rio Bueno on the north Jamaican coast rather than Port Royal / Kingston Harbour on the south, an error of ~140 px / 150 km).
     - Havana: Picked at $x=2728, y=1477$ instead of $x=2620, y=1480$ (selecting Matanzas / Cárdenas Bay rather than Havana harbor entrance, an error of ~108 px / 120 km).
     - Cape Hatteras: Picked at $x=4150, y=472$ on the cropped Carolina coastline, whereas Cape Hatteras ($35^\circ 15'\text{N}$) is entirely off the top neatline ($34^\circ 05'\text{N}$), injecting an error of $>1,000\text{ km}$.
     - Bermuda: Picked within an independent inset box, not the continuous main-chart sheet.
  2. *Polynomial Amplification*: The second-order polynomial warp curved coordinate space between erroneous control points, creating severe nonlinear buckling.
  3. *Graticule Audit*: Physical measurement of engraved latitude parallels along both neatlines ($10^\circ, 15^\circ, 20^\circ, 25^\circ, 30^\circ\text{N}$) revealed strictly linear spacing ($121.2\text{ px/degree}$, $R^2 = 0.999998$, max residual $2.4\text{ px}$), conclusively proving an Equirectangular / Plate Carrée graticule rather than Mercator ($R^2 = 0.999585$, max residual $21.8\text{ px}$).

### 3. Corrected State & Rationale
* **Audit & Selection**: Verified 13 high-confidence main-chart coastal control points on the uncompressed master TIFF. Excluded all inset boxes and off-sheet features.
* **Transformation Method**: First-order Affine transformation (`gdalwarp_affine_order_1`). Because Moll's underlying graticule is linear equirectangular, an affine warp scales and rotates the sheet without introducing artificial non-rigid curvature.
* **Comparative Benchmark**: Benchmarked Candidate C (Full Main Chart Affine) against Candidate F1 (Regional Caribbean Affine). Candidate C achieved superior out-of-sample error (LOOCV RMSE `123.76 km` vs `125.44 km`), preserves the full main chart field (Spanish Flota return route to Spain, full Lesser Antilles and Barbados without artificial clipping), and maintains zero neatline warping.
* **Harbor Inset Masking**: Applied transparent alpha mask to the upper-right inset region ($x \ge 4190, y \le 1175$) containing the five detailed harbor draughts, allowing modern MapLibre bathymetry to render without ghost harbor plans.
* **Final Verified Metrics**:
  - In-sample RMSE: `94.91 km`
  - LOOCV RMSE: `123.76 km` (41% reduction in cross-validation error from Packet 8's `209.65 km`)
  - LOOCV Median Error: `118.85 km`
  - LOOCV 90th Percentile: `170.82 km`
  - LOOCV Maximum Error: `238.49 km` (Cartagena de Indias, reflecting genuine 18th-century South American coastal longitude compression)
  - Output Size: `820,024 bytes` (WebP format, SHA-256: `0670b44343e22067769b7a8e77e23515c8d87b3fea35cf421ae24f24323ce972`)
  - Geographic Bounding Box: `[[-103.446484, 34.081101], [-54.856667, 34.081101], [-54.856667, 9.002197], [-103.446484, 9.002197]]`

### 4. Machine-Checkable Regression Invariants
* Unit test suite `tests/test_period_map_layer.py` enforces:
  - `test_georeference_metrics_quality_gates`: Enforces in-sample RMSE $\le 115\text{ km}$ and LOOCV RMSE $\le 160\text{ km}$.
  - `test_reproducible_warp_parameters`: Enforces Order 1 affine warp, exactly 13 GCPs, and verified raster dimensions (`4352 x 2248`).
  - `test_reproduction_with_gdal_available`: Verifies identical corner coordinates to 4 decimal places when run against pipeline derivatives.
  - `test_port_tolerances_order1_affine`: Verifies individual port LOOCV errors remain within historical tolerance gates (e.g. San Juan $\le 120\text{ km}$, Port Royal $\le 160\text{ km}$, Havana $\le 170\text{ km}$).
