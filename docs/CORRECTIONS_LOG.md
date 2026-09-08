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
  * Canonical GCP Fixture: `data/source_acquisitions/loc_gm71005442/gcp_audit.json`
  * Graticule Audit Fixture: `data/source_acquisitions/loc_gm71005442/graticule_audit.json`
  * Derivative Image: `public/assets/visuals/moll-west-indies-1715-rectified.webp`
  * User Interface Component: `src/components/map/MapViewport.astro`
  * Test Suite: `tests/test_period_map_layer.py`

### 1. Previous Claimed State (Packet 8 Baseline)
* **Transformation Method**: Second-order polynomial warp (`gdalwarp_polynomial_order_2`).
* **Reported Metrics**: In-sample RMSE `85.78 km`; LOOCV RMSE `209.65 km` (severe cross-validation discrepancy indicating overfitting and local control error).
* **Control Points**: Exactly 14 ground control points including off-sheet Cape Hatteras (`[2980, 740]`) and Bermuda (`[3880, 890]`) derived from an uncalibrated pixel scale, introducing 300–1,000 km control coordinate errors.
* **Inset Masking**: Inset panels were unmasked, warping five distinct local-scale harbor draughts into open-ocean Atlantic coordinates.
* **Graticule Representation**: Described informally as possibly Mercator-derived without empirical measurement.

### 2. Nature of Challenge & Error Analysis
* **Maintainer Challenge**: In manual visual inspection of Packet 8 preview, the Herman Moll overlay showed marked distortion against modern coastline geography: Florida warped west into the Gulf of Mexico, Cuba exhibited severe bending, and coastal features drifted hundreds of kilometers from their true coordinates.
* **Empirical Audit Findings**:
  1. *Pixel Mis-Picks & Baseline Defect*:
     - Port Royal: Picked on the north Jamaican coast rather than Port Royal / Kingston Harbour on the south.
     - Havana: Picked near Matanzas / Cárdenas Bay rather than Havana harbor entrance.
     - Cape Hatteras: Picked at an arbitrary pixel on the North Carolina sound; Moll's copperplate physically terminates at ~33°N, placing Hatteras (>35°N) off-sheet.
     - Uncalibrated Scale: The 14 Packet 8 GCP coordinates were scaled inconsistently with the canonical scan.
  2. *Polynomial Amplification*: Fitting a second-order polynomial through those flawed controls curled coordinate space, creating severe non-rigid buckling.
  3. *Graticule Audit*: Physical measurement of engraved latitude parallels along neatlines ($10^\circ, 15^\circ, 20^\circ, 25^\circ, 30^\circ\text{N}$) revealed strictly linear spacing ($122.0\text{ px/deg}$, $R^2 = 0.999951$, max residual $10.3\text{ px}$), conclusively demonstrating a regular linear/equidistant cylindrical-style graticule rather than Mercator ($R^2 = 0.999585$, max residual $21.8\text{ px}$).
  4. *LOC Inset Audit & Bermuda Classification*: The authoritative Library of Congress record (`gm71005442`, `G4390 1715 .M6`) lists exactly six insets:
     1. La Vera Cruz (harbor draught, upper right)
     2. A draught of ye bay & citty of Havana (harbor draught, upper right)
     3. The bay of Porto Bella (harbor draught, upper right)
     4. A draught of St. Augustin and its harbour (harbor draught, upper right)
     5. A draught of ye citty of Cartagena its harbour & forts (harbor draught, upper right)
     6. The city of Mexico in New Spain (panoramic view, lower-left margin, strictly outside the neatline crop $y \le 2895$)
     Per review directive R15, Bermuda is **not** one of the six catalogued insets; it has no inset compartment border and is engraved as continuous main-chart geography in the North Atlantic. It is fully preserved and unmasked.

### 3. Corrected State & Rationale
* **Audit & Selection**: Verified 13 high-confidence main-chart coastal control points on the canonical master scan (`data/raw/loc_gm71005442/moll-1715-loc-master.jpg`, $6025 \times 3636$, SHA-256 `5810c09c6c4185633be6f8b9cb1a19795d04cc0ac9a7f33ee90243395cf04f82`). Excluded off-sheet Hatteras and margin views.
* **Pinpointed Key Features**:
  - Willemstad, Curaçao: Pinpointed to the engraved harbor inlet at Bay St. Anna ($x=4365, y=2588$), dropping its LOOCV error from $238.49\text{ km}$ to $131.69\text{ km}$.
  - Cartagena, Colombia: Pinpointed to the Boca Chica entrance symbol on the coast ($x=3410, y=2835$), reducing LOOCV error to $79.22\text{ km}$.
* **Transformation Method**: First-order Affine transformation (`gdalwarp_affine_order_1`). An affine warp scales, translates, and rotates the linear cylindrical plate without introducing synthetic polynomial curvature.
* **Comparative Benchmark (Full Scope vs Common Core)**: Benchmarked Candidate C (Full Main Chart Affine, 13 GCPs) against Candidate F1 (Regional Caribbean Basin Affine, 10 GCPs). Because headline RMSE evaluates different populations (13 vs 10 GCPs), Candidate C was also evaluated across the exact same 10 common-core Caribbean basin control points used by F1:
  - On the 10 common points, LOOCV RMSE is effectively tied (`102.07 km` for C vs `101.16 km` for F1, delta `0.91 km`).
  - Candidate C achieves lower mean error (`93.14 km` vs `96.50 km`) and lower median error (`86.99 km` vs `99.41 km`) across the common core.
  - Candidate C stabilizes full-plate geometry without the unconstrained 9% vertical over-stretching (3533 vs 3241 lines) produced by Candidate F1, and preserves Moll's eastward/transatlantic Flota track markings within the retained chart field (*"and ye several tracts made by ye galeons and flota from place to place"*) alongside Florida and the Lesser Antilles to Barbados without artificial geographic truncation.
* **Harbor Inset Masking**: Applied transparent alpha mask across three exact bounding boxes covering the five catalogued harbor draught insets inside the neatline crop:
  - Box A: Havana, Porto Bella, Cartagena ($x \in [4831, 5963], y \in [91, 1234]$)
  - Box B: La Vera Cruz ($x \in [4481, 4831], y \in [233, 439]$)
  - Box C: St. Augustin ($x \in [4188, 4831], y \in [439, 850]$)
  Bermuda ($x \in [4400, 4830], y \in [95, 230]$) sits north of Box B and west of Box A, remaining completely unmasked.
* **Final Verified Metrics**:
  - In-sample RMSE: `79.57 km`
  - LOOCV RMSE: `107.68 km` (49% reduction in cross-validation error from Packet 8's `209.65 km`)
  - LOOCV Median Error: `86.99 km`
  - LOOCV 90th Percentile: `171.41 km`
  - LOOCV Maximum Error: `171.68 km` (Bridgetown, Barbados, reflecting 18th-century Lesser Antilles longitude displacement)
  - Willemstad LOOCV Error: `131.69 km` (passing the $\le 190\text{ km}$ quality gate)
  - Derivative Dimensions: `2560 x 1422 px` (intermediate uncropped warped TIFF: `5832 x 3241 px`)
  - Output File Size: `830,286 bytes` (WebP format, SHA-256: `1250d8864beb684357f3e3ec7dc066be1e49d39160ad6297cf4004115befb0d5`)
  - Geographic Bounding Box: `[[-103.504252, 34.004028], [-54.900389, 34.004028], [-54.900389, 9.146624], [-103.504252, 9.146624]]`

### 4. Machine-Checkable Regression Invariants
* Unit test suite `tests/test_period_map_layer.py` enforces:
  - `test_loc_source_provenance_and_rights`: Verifies LOC source rights, holding, and call number.
  - `test_source_record_and_inspection_state`: Verifies `digital_content_inspected` state.
  - `test_visual_entity_attributes`: Verifies WebP asset existence and $\le 1.5\text{ MB}$ asset budget.
  - `test_georeferencing_deterministic_reproduction`: Verifies exactly 13 GCPs, Order 1 affine warp, dimensions (`2560 x 1422`), and geographic bounds.
  - `test_georeferencing_quality_acceptance_thresholds`: Enforces in-sample RMSE $\le 100\text{ km}$ and LOOCV RMSE $\le 130\text{ km}$.
  - `test_individual_port_tolerances`: Verifies individual port LOOCV errors (Havana $\le 160\text{ km}$, Port Royal $\le 160\text{ km}$, San Juan $\le 120\text{ km}$, Santo Domingo $\le 80\text{ km}$, Portobelo $\le 100\text{ km}$, Cartagena $\le 200\text{ km}$, Willemstad $\le 190\text{ km}$).
  - `test_loc_inset_exclusion_and_bermuda_invariants`: Verifies 6 catalogued LOC insets, 5 masked inside neatline crop, Mexico City outside crop, and Bermuda preserved unmasked.
  - `test_georeferencing_epistemic_honesty`: Enforces honest epistemic disclaimer in report.
  - `test_cartographic_assertions`: Verifies published assertion records match derivation parameters.
  - `test_acquisition_metadata_invariants`: Verifies Bowles imprint and `[1715?]` date uncertainty.
  - `test_candidate_benchmark_and_common_core_invariants`: Verifies Candidate C vs F1 full scope and common-core metrics, delta LOOCV RMSE $\le 1.0\text{ km}$, F1 review asset presence, and lack of contradictory or unverified claims.
