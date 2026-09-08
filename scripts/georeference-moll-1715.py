#!/usr/bin/env python3
"""
scripts/georeference-moll-1715.py

Neatline cropping, 13-point Ground Control Point (GCP) georeferencing,
and WebP export for Herman Moll's 1715 West Indies map (LOC gm71005442).

Rectifies the inner nautical chart to Web Mercator (EPSG:3857) via GDAL,
excluding the 5 catalogued harbor draught insets via alpha transparency while
preserving Bermuda as continuous main-chart geography (R15), and outputs a
web-optimized WebP derivative and a detailed georeference report.

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

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
RAW_MASTER = os.path.join(REPO_ROOT, "data/raw/loc_gm71005442/moll-1715-loc-master.jpg")
GCP_AUDIT_PATH = os.path.join(REPO_ROOT, "data/source_acquisitions/loc_gm71005442/gcp_audit.json")
REPORT_PATH = os.path.join(REPO_ROOT, "data/source_acquisitions/loc_gm71005442/georeference_report.json")
PUBLIC_VISUALS_DIR = os.path.join(REPO_ROOT, "public/assets/visuals")
OUTPUT_WEBP_PATH = os.path.join(PUBLIC_VISUALS_DIR, "moll-west-indies-1715-rectified.webp")
TMP_DIR = os.path.join(REPO_ROOT, "data/raw/loc_gm71005442/tmp")

# Neatline crop of the main nautical chart field on 6025x3636 master
# Excludes lower margin containing LOC Inset #6 (Mexico City)
NEATLINE_CROP = {
    "x": 20,
    "y": 91,
    "width": 5990,
    "height": 2804
}

# The 5 catalogued LOC harbor insets inside the neatline crop are masked with alpha transparency:
# Box A: Havana (Inset 2), Porto Bella (Inset 3), Cartagena (Inset 5)
# Box B: La Vera Cruz (Inset 1)
# Box C: St. Augustin (Inset 4)
# Per R15, Bermuda (x: 4400..4830, y: 95..230) is NOT an inset and remains fully preserved in the main chart.
MASKED_INSET_BOXES = [
    {
        "name": "Box A (Havana, Porto Bella, Cartagena)",
        "insets": ["LOC Inset 2: Havana", "LOC Inset 3: Porto Bella", "LOC Inset 5: Cartagena"],
        "master_x": 4831,
        "master_y": 91,
        "master_width": 1132,
        "master_height": 1143
    },
    {
        "name": "Box B (La Vera Cruz)",
        "insets": ["LOC Inset 1: La Vera Cruz"],
        "master_x": 4481,
        "master_y": 233,
        "master_width": 350,
        "master_height": 206
    },
    {
        "name": "Box C (St. Augustin)",
        "insets": ["LOC Inset 4: St. Augustin"],
        "master_x": 4188,
        "master_y": 439,
        "master_width": 643,
        "master_height": 411
    }
]

EPISTEMIC_DISCLAIMER = (
    "Modern georeferenced alignment of Herman Moll's engraved chart ([1715?]) using an affine (order 1) "
    "transformation across 13 historical coastal and harbor ground control points on the main chart field. "
    "The gross visual misalignment of earlier derivatives was dominated by erroneous GCP placement and nonlinear over-warping; "
    "residual disagreement after correction reflects legitimate historical cartographic distortion, feature ambiguity, "
    "generalization, and the chart's engraved linear cylindrical graticule. The five catalogued harbor and city inset panels "
    "inside the neatline are excluded from the geographic coordinate frame via alpha transparency, while Bermuda is preserved "
    "as continuous main-chart geography."
)


def load_canonical_gcps():
    """Load canonical GCPs from gcp_audit.json single source of truth."""
    if os.path.exists(GCP_AUDIT_PATH):
        with open(GCP_AUDIT_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return [
                [
                    g["master_pixel"][0],
                    g["master_pixel"][1],
                    g["target_coords_wgs84"][0],
                    g["target_coords_wgs84"][1],
                    g["name"],
                    g["feature"]
                ]
                for g in data["canonical_gcps"]
            ]
    # Fallback static table if gcp_audit.json not yet generated
    return [
        [2550, 1360, -82.35, 23.14, "Havana, Cuba", "Harbor entrance / Castillo del Morro"],
        [3420, 1960, -76.84, 17.94, "Port Royal, Jamaica", "Palisadoes spit / harbor anchorage"],
        [795,  1665, -96.13, 19.20, "Veracruz, Mexico", "San Juan de Ulua island fort"],
        [3410, 2835, -75.54, 10.40, "Cartagena, Colombia", "Boca Chica entrance / bay forts"],
        [2840, 2830, -79.66,  9.55, "Portobelo, Panama", "Bahia de Portobelo / Chagres approach"],
        [2860,  570, -81.31, 29.89, "Saint Augustine, Florida", "Inlet / Castillo de San Marcos"],
        [4680, 1825, -66.12, 18.47, "San Juan, Puerto Rico", "Castillo San Felipe del Morro"],
        [4130, 1880, -69.88, 18.47, "Santo Domingo, Hispaniola", "Ozama River harbor entrance"],
        [5325, 2430, -59.62, 13.09, "Bridgetown, Barbados", "Carlisle Bay anchorage"],
        [4365, 2588, -68.93, 12.11, "Willemstad, Curacao", "Santa Anna Bay harbor entrance"],
        [2280, 1495, -84.95, 21.86, "Cabo San Antonio, Cuba", "Westernmost promontory of Cuba"],
        [3520, 1690, -74.14, 20.25, "Cabo Maisi, Cuba", "Easternmost promontory of Cuba"],
        [3080,  150, -79.93, 32.78, "Charles Town, South Carolina", "Charleston Harbor / Ashley River entrance"]
    ]


def compute_sha256(filepath: str) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def haversine(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    R = 6371.0088
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def get_gdal_version() -> str:
    try:
        res = subprocess.run(["gdaltransform", "--version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        return res.stdout.strip()
    except Exception as e:
        return f"Unknown ({e})"


def compute_gcp_residuals():
    gcps = load_canonical_gcps()
    crop_x = NEATLINE_CROP["x"]
    crop_y = NEATLINE_CROP["y"]

    # 1. In-sample residuals via GDAL official GCP transformer
    cmd_all = ["gdaltransform", "-order", "1"]
    for g in gcps:
        cmd_all.extend(["-gcp", str(g[0] - crop_x), str(g[1] - crop_y), str(g[2]), str(g[3])])

    p_all = subprocess.Popen(cmd_all, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    input_all = "\n".join(f"{g[0] - crop_x} {g[1] - crop_y}" for g in gcps)
    out_all, err_all = p_all.communicate(input=input_all)
    if p_all.returncode != 0:
        raise RuntimeError(f"gdaltransform failed ({p_all.returncode}): {err_all}")

    in_sample_dists = []
    for idx, line in enumerate(out_all.strip().split("\n")):
        parts = line.split()
        pred_lon = float(parts[0])
        pred_lat = float(parts[1])
        d = haversine(gcps[idx][2], gcps[idx][3], pred_lon, pred_lat)
        in_sample_dists.append(d)

    rmse_in_sample_km = round(math.sqrt(sum(d ** 2 for d in in_sample_dists) / len(in_sample_dists)), 2)

    # 2. Leave-One-Out Cross-Validation (LOOCV) via GDAL transformer
    n = len(gcps)
    loocv_dists = []
    for i in range(n):
        train_gcps = [g for j, g in enumerate(gcps) if j != i]
        test_gcp = gcps[i]
        cmd_loo = ["gdaltransform", "-order", "1"]
        for g in train_gcps:
            cmd_loo.extend(["-gcp", str(g[0] - crop_x), str(g[1] - crop_y), str(g[2]), str(g[3])])

        p_loo = subprocess.Popen(cmd_loo, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        out_loo, err_loo = p_loo.communicate(input=f"{test_gcp[0] - crop_x} {test_gcp[1] - crop_y}\n")
        if p_loo.returncode != 0:
            raise RuntimeError(f"gdaltransform LOOCV failed for GCP {i} ({p_loo.returncode}): {err_loo}")
        parts = out_loo.strip().split()
        pred_lon = float(parts[0])
        pred_lat = float(parts[1])
        d = haversine(test_gcp[2], test_gcp[3], pred_lon, pred_lat)
        loocv_dists.append(d)

    rmse_loocv_km = round(math.sqrt(sum(d ** 2 for d in loocv_dists) / n), 2)
    sorted_loo = sorted(loocv_dists)
    loocv_median_km = round(sorted_loo[n // 2], 2)
    p90_idx = int(math.ceil(0.90 * n)) - 1
    loocv_p90_km = round(sorted_loo[p90_idx], 2)
    loocv_max_km = round(max(loocv_dists), 2)
    max_idx = loocv_dists.index(max(loocv_dists))
    loocv_max_feature = gcps[max_idx][4]

    gcp_details = []
    for idx, g in enumerate(gcps):
        gcp_details.append({
            "name": g[4],
            "role": g[5],
            "master_pixel": [g[0], g[1]],
            "crop_pixel": [g[0] - crop_x, g[1] - crop_y],
            "geographic_coords": [g[2], g[3]],
            "residual_in_sample_km": round(in_sample_dists[idx], 2),
            "residual_loocv_km": round(loocv_dists[idx], 2),
        })

    return {
        "rmse_in_sample_km": rmse_in_sample_km,
        "rmse_loocv_km": rmse_loocv_km,
        "loocv_median_km": loocv_median_km,
        "loocv_p90_km": loocv_p90_km,
        "loocv_max_km": loocv_max_km,
        "loocv_max_feature": loocv_max_feature,
        "gcp_details": gcp_details,
        "gdal_version": get_gdal_version(),
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

    gcps = load_canonical_gcps()
    assert rep.get("gcp_count") == len(gcps), f"Expected {len(gcps)} GCPs in report"
    assert rep.get("projection") == "EPSG:3857", "Expected EPSG:3857 projection"
    assert rep.get("method") == "gdalwarp_affine_order_1", f"Expected gdalwarp_affine_order_1, got {rep.get('method')}"
    coords = rep.get("coordinates", [])
    assert len(coords) == 4, "Coordinates must contain exactly 4 corner points"
    for pt in coords:
        assert len(pt) == 2, "Each corner coordinate must be [lng, lat]"
        assert -130 < pt[0] < -20, f"Longitude out of range: {pt[0]}"
        assert 0 <= pt[1] < 60, f"Latitude out of range: {pt[1]}"

    assert len(rep.get("epistemic_disclaimer", "")) > 20, "Epistemic disclaimer must be present"

    # Mechanically verify affine least-squares residuals
    residuals = compute_gcp_residuals()
    expected_in_sample = residuals["rmse_in_sample_km"]
    expected_loocv = residuals["rmse_loocv_km"]

    actual_in_sample = rep.get("rmse_in_sample_km")
    assert actual_in_sample is not None, "Report missing rmse_in_sample_km"
    assert abs(actual_in_sample - expected_in_sample) <= 0.05, f"In-sample RMSE mismatch: expected {expected_in_sample}, got {actual_in_sample}"

    actual_loocv = rep.get("rmse_loocv_km")
    assert actual_loocv is not None, "Report missing rmse_loocv_km"
    assert abs(actual_loocv - expected_loocv) <= 0.05, f"LOOCV RMSE mismatch: expected {expected_loocv}, got {actual_loocv}"

    # Verify quality gates
    assert actual_in_sample <= 100.0, f"In-sample RMSE {actual_in_sample} exceeds 100 km gate"
    assert actual_loocv <= 130.0, f"LOOCV RMSE {actual_loocv} exceeds 130 km gate"

    # Verify individual Willemstad gate (R11)
    willemstad = next((g for g in rep.get("gcps", []) if "Willemstad" in g.get("name", "")), None)
    assert willemstad is not None, "Willemstad missing from GCP details"
    assert willemstad["residual_loocv_km"] <= 190.0, f"Willemstad LOOCV {willemstad['residual_loocv_km']} exceeds 190 km gate"

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

    # 1. Prepare neatline crop with multi-box LOC Inset Exclusion (preserving Bermuda per R15)
    from PIL import Image
    im_master = Image.open(RAW_MASTER).convert("RGBA")
    crop_im = im_master.crop((crop_x, crop_y, crop_x + crop_w, crop_y + crop_h))

    for box in MASKED_INSET_BOXES:
        bx1 = max(0, box["master_x"] - crop_x)
        by1 = max(0, box["master_y"] - crop_y)
        bx2 = min(crop_w, bx1 + box["master_width"])
        by2 = min(crop_h, by1 + box["master_height"])
        transparent_rect = Image.new("RGBA", (bx2 - bx1, by2 - by1), (0, 0, 0, 0))
        crop_im.paste(transparent_rect, (bx1, by1))
        print(f"[GEOREF] Alpha-masked {box['name']} at crop ({bx1}, {by1}) to ({bx2}, {by2})")

    masked_tif = os.path.join(TMP_DIR, "moll_masked_crop.tif")
    crop_im.save(masked_tif, format="TIFF")

    # 2. gdal_translate: assign GCPs to masked neatline crop
    gcps = load_canonical_gcps()
    gcp_tif = os.path.join(TMP_DIR, "moll_gcp.tif")
    cmd_translate = [
        "gdal_translate",
        "-a_srs", "EPSG:4326",
    ]
    for gcp in gcps:
        cx = gcp[0] - crop_x
        cy = gcp[1] - crop_y
        cmd_translate.extend(["-gcp", str(cx), str(cy), str(gcp[2]), str(gcp[3])])
    cmd_translate.extend([masked_tif, gcp_tif])

    print(f"[GEOREF] Running gdal_translate with {len(gcps)} main-chart GCPs (harbor insets alpha-masked)...")
    subprocess.run(cmd_translate, check=True)

    # 3. gdalwarp: warp to EPSG:3857 using 1st-order affine transformation with alpha transparency
    warped_tif = os.path.join(TMP_DIR, "moll_warped.tif")
    cmd_warp = [
        "gdalwarp",
        "-r", "bilinear",
        "-order", "1",
        "-t_srs", "EPSG:3857",
        "-dstalpha",
        "-overwrite",
        gcp_tif,
        warped_tif
    ]
    print("[GEOREF] Warping to EPSG:3857 via gdalwarp (affine order 1)...")
    subprocess.run(cmd_warp, check=True)

    # 4. Query gdalinfo to extract exact 4-corner coordinates in EPSG:4326
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

    # 5. Compress to web-optimized WebP (2560px width)
    print("[GEOREF] Exporting web-optimized WebP derivative (2560px)...")
    im = Image.open(warped_tif)
    inter_w, inter_h = im.size
    target_w = 2560
    aspect = im.size[1] / im.size[0]
    target_h = int(target_w * aspect)
    resized = im.resize((target_w, target_h), Image.Resampling.LANCZOS)
    resized.save(OUTPUT_WEBP_PATH, "WEBP", quality=80, method=6)

    derivative_size = os.path.getsize(OUTPUT_WEBP_PATH)
    derivative_sha = compute_sha256(OUTPUT_WEBP_PATH)
    print(f"[GEOREF] WebP derivative saved: {derivative_size} bytes ({derivative_size / 1024:.1f} KB), SHA256: {derivative_sha}")

    # 6. Build georeference report
    residuals = compute_gcp_residuals()

    report = {
        "target_visual_id": "visual_moll_west_indies_1715",
        "source_item": "gm71005442",
        "source_master": os.path.basename(RAW_MASTER),
        "neatline_crop": NEATLINE_CROP,
        "masked_inset_boxes": MASKED_INSET_BOXES,
        "catalogued_insets_count": 6,
        "insets_inside_crop": 5,
        "insets_outside_crop": 1,
        "bermuda_status": "preserved_in_main_chart_unmasked",
        "gcp_count": len(gcps),
        "gcps": residuals["gcp_details"],
        "projection": "EPSG:3857",
        "method": "gdalwarp_affine_order_1",
        "resampling": "bilinear",
        "rmse_in_sample_km": residuals["rmse_in_sample_km"],
        "rmse_loocv_km": residuals["rmse_loocv_km"],
        "loocv_median_km": residuals["loocv_median_km"],
        "loocv_p90_km": residuals["loocv_p90_km"],
        "loocv_max_km": residuals["loocv_max_km"],
        "loocv_max_feature": residuals["loocv_max_feature"],
        "residual_distance_metric": "great_circle_haversine_km",
        "gdal_version": residuals.get("gdal_version"),
        "coordinates": maplibre_corners,
        "derivative_path": "assets/visuals/moll-west-indies-1715-rectified.webp",
        "derivative_dimensions": [target_w, target_h],
        "intermediate_warped_dimensions": [inter_w, inter_h],
        "derivative_size_bytes": derivative_size,
        "derivative_sha256": derivative_sha,
        "epistemic_disclaimer": EPISTEMIC_DISCLAIMER
    }

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"[GEOREF] Georeference report written to {REPORT_PATH}")

    # Clean temporary files
    for tmp_file in [masked_tif, gcp_tif, warped_tif]:
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
