#!/usr/bin/env python3
"""
scripts/georeference-moll-1715.py

Neatline cropping, 14-point Ground Control Point (GCP) georeferencing,
and WebP export for Herman Moll's 1715 West Indies map (LOC gm71005442).

Rectifies the inner nautical chart to Web Mercator (EPSG:3857) via GDAL,
excluding lower margin harbor insets, and outputs a web-optimized WebP derivative
and a detailed georeference report with GCP residuals and epistemic caveats.

Supports:
  python3 scripts/georeference-moll-1715.py               # Run full GDAL rectification
  python3 scripts/georeference-moll-1715.py --verify-only  # Validate derivative and report (CI-safe)
"""

import argparse
import hashlib
import json
import math
import os
import subprocess
import sys
import numpy as np
from PIL import Image

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
RAW_MASTER = os.path.join(REPO_ROOT, "data/raw/loc_gm71005442/moll-1715-loc-master.jpg")
REPORT_PATH = os.path.join(REPO_ROOT, "data/source_acquisitions/loc_gm71005442/georeference_report.json")
PUBLIC_VISUALS_DIR = os.path.join(REPO_ROOT, "public/assets/visuals")
OUTPUT_WEBP_PATH = os.path.join(PUBLIC_VISUALS_DIR, "moll-west-indies-1715-rectified.webp")
TMP_DIR = os.path.join(REPO_ROOT, "data/raw/loc_gm71005442/tmp")

# 14 Documented Historical Ground Control Points (GCPs)
# Format: [master_x, master_y, lng, lat, feature_label, role]
GCPS = [
    [2310, 1490, -82.35, 23.14, "Havana, Cuba", "Harbor entrance / Castillo del Morro"],
    [2930, 1945, -76.84, 17.94, "Port Royal, Jamaica", "Palisadoes spit / harbor anchorage"],
    [1210, 1760, -96.13, 19.20, "Veracruz, Mexico", "San Juan de Ulua island fort"],
    [2630, 2390, -75.54, 10.40, "Cartagena, Colombia", "Boca Chica entrance / bay forts"],
    [2210, 2490, -79.66,  9.55, "Portobelo, Panama", "Bahia de Portobelo / Chagres approach"],
    [2420, 1030, -81.31, 29.89, "Saint Augustine, Florida", "Inlet / Castillo de San Marcos"],
    [3820, 1910, -66.12, 18.47, "San Juan, Puerto Rico", "Castillo San Felipe del Morro"],
    [3480, 1930, -69.88, 18.47, "Santo Domingo, Hispaniola", "Ozama River harbor entrance"],
    [4460, 2280, -59.62, 13.09, "Bridgetown, Barbados", "Carlisle Bay anchorage"],
    [3340, 2360, -68.93, 12.11, "Willemstad, Curacao", "Santa Anna Bay harbor entrance"],
    [2060, 1560, -84.95, 21.86, "Cabo San Antonio, Cuba", "Westernmost promontory of Cuba"],
    [3150, 1720, -74.14, 20.25, "Cabo Maisi, Cuba", "Easternmost promontory of Cuba"],
    [2980,  740, -75.50, 35.25, "Cape Hatteras, North Carolina", "Outer Banks barrier island cusp"],
    [3880,  890, -64.75, 32.30, "Bermuda", "Main Bermuda island cluster"]
]

# Neatline crop of the main nautical chart field (excluding lower harbor insets and outer margins)
NEATLINE_CROP = {
    "x": 20,
    "y": 91,
    "width": 5990,
    "height": 2804
}

EPISTEMIC_DISCLAIMER = (
    "Modern georeferenced alignment of Herman Moll's engraved chart ([1715?]) "
    "using a second-order polynomial transformation across 14 historical coastal and harbor ground control points. "
    "Regional discrepancies between 18th-century cartography and modern WGS84 coordinates "
    "are preserved as empirical historical evidence rather than modern survey ground truth."
)


def compute_sha256(filepath: str) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def lnglat_to_merc(lng: float, lat: float):
    R = 6378137.0
    x = R * math.radians(lng)
    y = R * math.log(math.tan(math.pi / 4.0 + math.radians(lat) / 2.0))
    return x, y


def build_poly2_matrix(pts):
    rows = []
    for px, py in pts:
        rows.append([1.0, px, py, px**2, px * py, py**2])
    return np.array(rows, dtype=np.float64)


def compute_gcp_residuals():
    crop_x = NEATLINE_CROP["x"]
    crop_y = NEATLINE_CROP["y"]
    pts_px = np.array([[g[0] - crop_x, g[1] - crop_y] for g in GCPS], dtype=np.float64)
    target_merc = np.array([lnglat_to_merc(g[2], g[3]) for g in GCPS], dtype=np.float64)

    A = build_poly2_matrix(pts_px)
    cx, _, _, _ = np.linalg.lstsq(A, target_merc[:, 0], rcond=None)
    cy, _, _, _ = np.linalg.lstsq(A, target_merc[:, 1], rcond=None)

    pred_x = A @ cx
    pred_y = A @ cy
    dx = pred_x - target_merc[:, 0]
    dy = pred_y - target_merc[:, 1]
    in_sample_res_m = np.sqrt(dx**2 + dy**2)
    rmse_in_sample_km = round(float(np.sqrt(np.mean(in_sample_res_m**2)) / 1000.0), 2)

    n = len(GCPS)
    loocv_res_m = []
    for i in range(n):
        mask = np.ones(n, dtype=bool)
        mask[i] = False
        A_train = A[mask]
        target_train = target_merc[mask]
        cxi, _, _, _ = np.linalg.lstsq(A_train, target_train[:, 0], rcond=None)
        cyi, _, _, _ = np.linalg.lstsq(A_train, target_train[:, 1], rcond=None)

        test_A = A[i : i + 1]
        test_px = test_A @ cxi
        test_py = test_A @ cyi
        res_i = math.sqrt((test_px[0] - target_merc[i, 0]) ** 2 + (test_py[0] - target_merc[i, 1]) ** 2)
        loocv_res_m.append(res_i)

    rmse_loocv_km = round(float(math.sqrt(sum(r**2 for r in loocv_res_m) / n) / 1000.0), 2)

    gcp_details = []
    for idx, g in enumerate(GCPS):
        gcp_details.append({
            "name": g[4],
            "role": g[5],
            "master_pixel": [g[0], g[1]],
            "crop_pixel": [g[0] - crop_x, g[1] - crop_y],
            "geographic_coords": [g[2], g[3]],
            "residual_in_sample_km": round(float(in_sample_res_m[idx] / 1000.0), 2),
            "residual_loocv_km": round(float(loocv_res_m[idx] / 1000.0), 2),
        })

    return {
        "rmse_in_sample_km": rmse_in_sample_km,
        "rmse_loocv_km": rmse_loocv_km,
        "gcp_details": gcp_details,
    }


def verify_report() -> bool:
    if not os.path.exists(REPORT_PATH):
        print(f"[FAIL] Georeference report not found at {REPORT_PATH}", file=sys.stderr)
        return False
    if not os.path.exists(OUTPUT_WEBP_PATH):
        print(f"[FAIL] Rectified WebP derivative not found at {OUTPUT_WEBP_PATH}", file=sys.stderr)
        return False

    with open(REPORT_PATH, "r", encoding="utf-8") as f:
        rep = json.load(f)

    assert rep.get("gcp_count") == len(GCPS), f"Expected {len(GCPS)} GCPs in report"
    assert rep.get("projection") == "EPSG:3857", "Expected EPSG:3857 projection"
    coords = rep.get("coordinates", [])
    assert len(coords) == 4, "Coordinates must contain exactly 4 corner points"
    for pt in coords:
        assert len(pt) == 2, "Each corner coordinate must be [lng, lat]"
        assert -130 < pt[0] < -20, f"Longitude out of range: {pt[0]}"
        assert 0 <= pt[1] < 60, f"Latitude out of range: {pt[1]}"

    assert len(rep.get("epistemic_disclaimer", "")) > 20, "Epistemic disclaimer must be present"

    # Mechanically verify polynomial least-squares residuals
    residuals = compute_gcp_residuals()
    expected_in_sample = residuals["rmse_in_sample_km"]
    expected_loocv = residuals["rmse_loocv_km"]

    actual_in_sample = rep.get("rmse_in_sample_km")
    assert actual_in_sample is not None, "Report missing rmse_in_sample_km"
    assert abs(actual_in_sample - expected_in_sample) <= 0.05, f"In-sample RMSE mismatch: expected {expected_in_sample}, got {actual_in_sample}"

    actual_loocv = rep.get("rmse_loocv_km")
    assert actual_loocv is not None, "Report missing rmse_loocv_km"
    assert abs(actual_loocv - expected_loocv) <= 0.05, f"LOOCV RMSE mismatch: expected {expected_loocv}, got {actual_loocv}"

    for gcp in rep.get("gcps", []):
        assert "residual_in_sample_km" in gcp, f"GCP {gcp.get('name')} missing residual_in_sample_km"
        assert "residual_loocv_km" in gcp, f"GCP {gcp.get('name')} missing residual_loocv_km"

    actual_size = os.path.getsize(OUTPUT_WEBP_PATH)
    actual_sha = compute_sha256(OUTPUT_WEBP_PATH)
    expected_sha = rep.get("derivative_sha256")

    # Verify asset budget
    max_bytes = 1572864  # 1.5 MB
    if actual_size > max_bytes:
        print(f"[FAIL] Derivative exceeds 1.5 MB asset budget: {actual_size} bytes", file=sys.stderr)
        return False

    if expected_sha and actual_sha != expected_sha:
        print(f"[FAIL] Derivative SHA256 mismatch: expected {expected_sha}, got {actual_sha}", file=sys.stderr)
        return False

    print(f"[PASS] Georeference report and derivative verified ({actual_size} bytes, {len(coords)} corners, in-sample RMSE {actual_in_sample} km, LOOCV RMSE {actual_loocv} km, SHA256 {actual_sha})")
    return True


def run_georeference() -> None:
    if not os.path.exists(RAW_MASTER):
        print(f"[FAIL] Master scan not found at {RAW_MASTER}. Run scripts/acquire-moll-1715.py first.", file=sys.stderr)
        sys.exit(1)

    os.makedirs(TMP_DIR, exist_ok=True)
    os.makedirs(PUBLIC_VISUALS_DIR, exist_ok=True)

    crop_x = NEATLINE_CROP["x"]
    crop_y = NEATLINE_CROP["y"]
    crop_w = NEATLINE_CROP["width"]
    crop_h = NEATLINE_CROP["height"]

    # 1. gdal_translate: crop neatline and assign GCPs
    gcp_tif = os.path.join(TMP_DIR, "moll_gcp.tif")
    cmd_translate = [
        "gdal_translate",
        "-a_srs", "EPSG:4326",
        "-srcwin", str(crop_x), str(crop_y), str(crop_w), str(crop_h)
    ]
    for gcp in GCPS:
        cx = gcp[0] - crop_x
        cy = gcp[1] - crop_y
        cmd_translate.extend(["-gcp", str(cx), str(cy), str(gcp[2]), str(gcp[3])])
    cmd_translate.extend([RAW_MASTER, gcp_tif])

    print("[GEOREF] Running gdal_translate with 14 GCPs on neatline crop...")
    subprocess.run(cmd_translate, check=True)

    # 2. gdalwarp: warp to EPSG:3857 using 2nd-order polynomial with alpha transparency
    warped_tif = os.path.join(TMP_DIR, "moll_warped.tif")
    cmd_warp = [
        "gdalwarp",
        "-r", "bilinear",
        "-order", "2",
        "-t_srs", "EPSG:3857",
        "-dstalpha",
        "-overwrite",
        gcp_tif,
        warped_tif
    ]
    print("[GEOREF] Warping to EPSG:3857 via gdalwarp (polynomial order 2)... ")
    subprocess.run(cmd_warp, check=True)

    # 3. Query gdalinfo to extract exact 4-corner coordinates in EPSG:4326
    cmd_info = ["gdalinfo", "-json", warped_tif]
    res_info = subprocess.run(cmd_info, capture_output=True, text=True, check=True)
    info = json.loads(res_info.stdout)

    # wgs84Extent coordinates in order: TL, BL, BR, TR, TL
    wgs84 = info.get("wgs84Extent", {}).get("coordinates", [[]])[0]
    # MapLibre image source expects: [ [TL_lng, TL_lat], [TR_lng, TR_lat], [BR_lng, BR_lat], [BL_lng, BL_lat] ]
    tl = [round(wgs84[0][0], 6), round(wgs84[0][1], 6)]
    bl = [round(wgs84[1][0], 6), round(wgs84[1][1], 6)]
    br = [round(wgs84[2][0], 6), round(wgs84[2][1], 6)]
    tr = [round(wgs84[3][0], 6), round(wgs84[3][1], 6)]
    maplibre_corners = [tl, tr, br, bl]

    # 4. Compress to web-optimized WebP (2560px width)
    print("[GEOREF] Exporting web-optimized WebP derivative (2560px)... ")
    im = Image.open(warped_tif)
    target_w = 2560
    aspect = im.size[1] / im.size[0]
    target_h = int(target_w * aspect)
    resized = im.resize((target_w, target_h), Image.Resampling.LANCZOS)
    resized.save(OUTPUT_WEBP_PATH, "WEBP", quality=80, method=6)

    derivative_size = os.path.getsize(OUTPUT_WEBP_PATH)
    derivative_sha = compute_sha256(OUTPUT_WEBP_PATH)
    print(f"[GEOREF] WebP derivative saved: {derivative_size} bytes ({derivative_size / 1024:.1f} KB), SHA256: {derivative_sha}")

    # 5. Build georeference report
    residuals = compute_gcp_residuals()

    report = {
        "target_visual_id": "visual_moll_west_indies_1715",
        "source_item": "gm71005442",
        "source_master": os.path.basename(RAW_MASTER),
        "neatline_crop": NEATLINE_CROP,
        "gcp_count": len(GCPS),
        "gcps": residuals["gcp_details"],
        "projection": "EPSG:3857",
        "method": "gdalwarp_polynomial_order_2",
        "resampling": "bilinear",
        "rmse_in_sample_km": residuals["rmse_in_sample_km"],
        "rmse_loocv_km": residuals["rmse_loocv_km"],
        "coordinates": maplibre_corners,
        "derivative_path": "assets/visuals/moll-west-indies-1715-rectified.webp",
        "derivative_dimensions": [target_w, target_h],
        "derivative_size_bytes": derivative_size,
        "derivative_sha256": derivative_sha,
        "epistemic_disclaimer": EPISTEMIC_DISCLAIMER
    }

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
        f.write(chr(10))

    print(f"[GEOREF] Georeference report written to {REPORT_PATH}")

    # Clean temporary files
    for tmp_file in [gcp_tif, warped_tif]:
        if os.path.exists(tmp_file):
            try:
                os.remove(tmp_file)
            except OSError:
                pass


def main():
    parser = argparse.ArgumentParser(description="Georeference Herman Moll 1715 map to EPSG:3857 WebP.")
    parser.add_argument("--verify-only", action="store_true", help="Verify derivative and report without re-warping")
    args = parser.parse_args()

    if args.verify_only:
        if not verify_report():
            sys.exit(1)
    else:
        run_georeference()
        if not verify_report():
            sys.exit(1)


if __name__ == "__main__":
    main()
