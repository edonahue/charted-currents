#!/usr/bin/env python3
"""
scripts/generate-gcp-audit.py

Generates data/source_acquisitions/loc_gm71005442/gcp_audit.json, establishing the
canonical single machine-readable ground control point fixture for the Herman Moll
1715 period map overlay. Computes exact GDAL affine in-sample and LOOCV residuals.
"""

import json
import math
import os
import subprocess
import sys

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUTPUT_FILE = os.path.join(REPO_ROOT, "data/source_acquisitions/loc_gm71005442/gcp_audit.json")

CROP_OFFSET = {"x": 20, "y": 91}

# 13 Audited Ground Control Points (Candidate C)
# Format: id, name, feature_desc, master_x, master_y, lon, lat, in_f1, pinpoint_rationale
RAW_GCPS = [
    {
        "id": "gcp_moll_havana",
        "name": "Havana, Cuba",
        "feature": "Harbor entrance / Castillo del Morro",
        "master_x": 2550,
        "master_y": 1360,
        "target_lon": -82.35,
        "target_lat": 23.14,
        "in_candidate_f1": True,
        "pinpoint_rationale": "Castillo del Morro promontory guarding the narrow entrance channel to Havana harbor, south of Bahia Honda on the northwest Cuban coast."
    },
    {
        "id": "gcp_moll_port_royal",
        "name": "Port Royal, Jamaica",
        "feature": "Palisadoes spit / harbor anchorage",
        "master_x": 3420,
        "master_y": 1960,
        "target_lon": -76.84,
        "target_lat": 17.94,
        "in_candidate_f1": True,
        "pinpoint_rationale": "The tip of the Palisadoes sand spit enclosing Kingston Harbour and Port Royal on the south coast of Jamaica, distinctly engraved with anchorage anchor."
    },
    {
        "id": "gcp_moll_veracruz",
        "name": "Veracruz, Mexico",
        "feature": "San Juan de Ulua island fort",
        "master_x": 795,
        "master_y": 1665,
        "target_lon": -96.13,
        "target_lat": 19.20,
        "in_candidate_f1": True,
        "pinpoint_rationale": "Island fortress of San Juan de Ulua directly offshore from the port of Veracruz on the southwestern Gulf coast of New Spain."
    },
    {
        "id": "gcp_moll_cartagena",
        "name": "Cartagena, Colombia",
        "feature": "Boca Chica entrance / bay forts",
        "master_x": 3410,
        "master_y": 2835,
        "target_lon": -75.54,
        "target_lat": 10.40,
        "in_candidate_f1": True,
        "pinpoint_rationale": "Harbor entrance at Boca Chica and fortress symbol defending Cartagena bay on the Tierra Firme coast. Pinpointed from coastal engraving, correcting previous draft offset."
    },
    {
        "id": "gcp_moll_portobelo",
        "name": "Portobelo, Panama",
        "feature": "Bahia de Portobelo / Chagres approach",
        "master_x": 2840,
        "master_y": 2830,
        "target_lon": -79.66,
        "target_lat": 9.55,
        "in_candidate_f1": True,
        "pinpoint_rationale": "Embayment of Portobelo on the Caribbean coast of the Isthmus of Panama, just east of the mouth of Rio Chagres."
    },
    {
        "id": "gcp_moll_st_augustine",
        "name": "Saint Augustine, Florida",
        "feature": "Inlet / Castillo de San Marcos",
        "master_x": 2860,
        "master_y": 570,
        "target_lon": -81.31,
        "target_lat": 29.89,
        "in_candidate_f1": False,
        "pinpoint_rationale": "The coastal barrier island inlet and Castillo de San Marcos on the northeast coast of Florida. Preserved in Candidate C for Atlantic coastal continuity; excluded from F1 regional basin."
    },
    {
        "id": "gcp_moll_san_juan",
        "name": "San Juan, Puerto Rico",
        "feature": "Castillo San Felipe del Morro",
        "master_x": 4680,
        "master_y": 1825,
        "target_lon": -66.12,
        "target_lat": 18.47,
        "in_candidate_f1": True,
        "pinpoint_rationale": "The fortified islet and harbor entrance of San Juan on the north coast of Puerto Rico (San Juan Bautista)."
    },
    {
        "id": "gcp_moll_santo_domingo",
        "name": "Santo Domingo, Hispaniola",
        "feature": "Ozama River harbor entrance",
        "master_x": 4130,
        "master_y": 1880,
        "target_lon": -69.88,
        "target_lat": 18.47,
        "in_candidate_f1": True,
        "pinpoint_rationale": "Mouth of the Ozama River on the south-central coast of Hispaniola (Santo Domingo)."
    },
    {
        "id": "gcp_moll_bridgetown",
        "name": "Bridgetown, Barbados",
        "feature": "Carlisle Bay anchorage",
        "master_x": 5325,
        "master_y": 2430,
        "target_lon": -59.62,
        "target_lat": 13.09,
        "in_candidate_f1": False,
        "pinpoint_rationale": "Carlisle Bay anchorage on the southwest coast of Barbados, easternmost Windward island. Preserved in Candidate C to anchor Lesser Antilles; excluded from F1 regional basin."
    },
    {
        "id": "gcp_moll_willemstad",
        "name": "Willemstad, Curacao",
        "feature": "Santa Anna Bay harbor entrance",
        "master_x": 4365,
        "master_y": 2588,
        "target_lon": -68.93,
        "target_lat": 12.11,
        "in_candidate_f1": True,
        "pinpoint_rationale": "Deep natural inlet of Santa Anna Bay on the south coast of Curacao ('Bay St. Anna'), precisely pinpointed on the engraved harbor channel, correcting the 85px open-water error of earlier drafts."
    },
    {
        "id": "gcp_moll_cabo_san_antonio",
        "name": "Cabo San Antonio, Cuba",
        "feature": "Westernmost promontory of Cuba",
        "master_x": 2280,
        "master_y": 1495,
        "target_lon": -84.95,
        "target_lat": 21.86,
        "in_candidate_f1": True,
        "pinpoint_rationale": "Prominent western cape of Cuba, serving as critical cartographic anchor between the Gulf of Mexico and Yucatan Channel."
    },
    {
        "id": "gcp_moll_cabo_maisi",
        "name": "Cabo Maisi, Cuba",
        "feature": "Easternmost promontory of Cuba",
        "master_x": 3520,
        "master_y": 1690,
        "target_lon": -74.14,
        "target_lat": 20.25,
        "in_candidate_f1": True,
        "pinpoint_rationale": "Easternmost cape of Cuba framing the Windward Passage opposite Hispaniola."
    },
    {
        "id": "gcp_moll_charles_town",
        "name": "Charles Town, South Carolina",
        "feature": "Charleston Harbor / Ashley River entrance",
        "master_x": 3080,
        "master_y": 150,
        "target_lon": -79.93,
        "target_lat": 32.78,
        "in_candidate_f1": False,
        "pinpoint_rationale": "Entrance to Charleston Harbor on the Atlantic seaboard, anchoring the northern neatline of the chart field. Excluded from F1 regional basin."
    }
]

EXCLUDED_CANDIDATES = [
    {
        "feature_name": "Cape Hatteras, North Carolina",
        "investigated_coords": [-75.50, 35.24],
        "packet8_pick_master_px": [2980, 740],
        "rejection_status": "strictly_rejected_off_sheet",
        "rejection_rationale": (
            "The physical engraving of Moll's 1715 map terminates at approximately 33°N latitude. "
            "Cape Hatteras (35°15'N) is physically off the top edge of the copperplate. In Packet 8, an arbitrary pixel "
            "at [2980, 740] (in the North Carolina coastal sounds near Beaufort) was assigned to Hatteras, injecting a >250 km "
            "systematic error that distorted the entire northern neatline under polynomial warping."
        )
    },
    {
        "feature_name": "Bermuda ('Barmudas Isl. English')",
        "investigated_coords": [-64.75, 32.30],
        "master_px": [4650, 160],
        "measured_displacement_km": 261.64,
        "measured_longitude_offset_deg": -2.53,
        "rejection_status": "preserved_in_chart_excluded_from_gcp_fit",
        "rejection_rationale": (
            "Bermuda is preserved unmasked in the main chart field. On this chart Bermuda is plotted "
            "materially west of its modern WGS84 position relative to the North American coastline (measured displacement "
            "~261.6 km, 2.53° west). Including it as an active affine control worsens the principal chart-field fit across "
            "the mainland and Greater Antilles, so it is preserved visually in the main chart but excluded from the control set."
        )
    },
    {
        "feature_name": "Mexico City ('The city of Mexico in New Spain')",
        "investigated_coords": [-99.13, 19.43],
        "master_px": [1050, 3200],
        "rejection_status": "loc_catalogue_inset_outside_crop",
        "rejection_rationale": (
            "The panoramic bird's-eye view of Mexico City is LOC Inset #6, engraved in the lower margin (y >= 2905). "
            "It is completely outside the main chart neatline crop (y <= 2895), requiring zero internal masking."
        )
    }
]

PACKET8_BASELINE_ACCOUNTING = {
    "gcp_count": 14,
    "warp_method": "gdalwarp_polynomial_order_2",
    "root_cause_defect": (
        "Packet 8 used 14 GCPs with several severe coordinate errors (including off-sheet Cape Hatteras and an uncalibrated "
        "coordinate frame). Second-order polynomial fitting ('gdalwarp -order 2') curled coordinate space between those flawed "
        "points, producing visible buckling along the Florida coast, Cuba, and neatlines."
    )
}


def haversine(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    R = 6371.0088
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi, dlam = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2.0) ** 2
    return R * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))


def compute_residuals(gcps, crop_x, crop_y):
    # In-sample via gdaltransform -order 1
    cmd_all = ["gdaltransform", "-order", "1"]
    for g in gcps:
        cx = g["master_x"] - crop_x
        cy = g["master_y"] - crop_y
        cmd_all.extend(["-gcp", str(cx), str(cy), str(g["target_lon"]), str(g["target_lat"])])

    p = subprocess.Popen(cmd_all, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    inp = "\n".join(f"{g['master_x'] - crop_x} {g['master_y'] - crop_y}" for g in gcps)
    out, err = p.communicate(input=inp)
    if p.returncode != 0:
        raise RuntimeError(f"gdaltransform failed: {err}")

    in_sample_dists = []
    for idx, line in enumerate(out.strip().split("\n")):
        parts = line.split()
        plon, plat = float(parts[0]), float(parts[1])
        d = haversine(gcps[idx]["target_lon"], gcps[idx]["target_lat"], plon, plat)
        in_sample_dists.append(d)

    # LOOCV
    loocv_dists = []
    n = len(gcps)
    for i in range(n):
        train = [g for j, g in enumerate(gcps) if j != i]
        test = gcps[i]
        cmd_loo = ["gdaltransform", "-order", "1"]
        for g in train:
            cx = g["master_x"] - crop_x
            cy = g["master_y"] - crop_y
            cmd_loo.extend(["-gcp", str(cx), str(cy), str(g["target_lon"]), str(g["target_lat"])])
        p_loo = subprocess.Popen(cmd_loo, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        tcx = test["master_x"] - crop_x
        tcy = test["master_y"] - crop_y
        out_loo, err_loo = p_loo.communicate(input=f"{tcx} {tcy}\n")
        if p_loo.returncode != 0:
            raise RuntimeError(f"gdaltransform LOOCV failed for {test['id']}: {err_loo}")
        plon, plat = float(out_loo.split()[0]), float(out_loo.split()[1])
        d = haversine(test["target_lon"], test["target_lat"], plon, plat)
        loocv_dists.append(d)

    return in_sample_dists, loocv_dists


def main():
    crop_x = CROP_OFFSET["x"]
    crop_y = CROP_OFFSET["y"]

    in_sample, loocv = compute_residuals(RAW_GCPS, crop_x, crop_y)

    gcps_output = []
    for idx, g in enumerate(RAW_GCPS):
        gcps_output.append({
            "id": g["id"],
            "name": g["name"],
            "feature": g["feature"],
            "master_pixel": [g["master_x"], g["master_y"]],
            "crop_pixel": [g["master_x"] - crop_x, g["master_y"] - crop_y],
            "target_coords_wgs84": [g["target_lon"], g["target_lat"]],
            "in_candidate_c": True,
            "in_candidate_f1": g["in_candidate_f1"],
            "residual_in_sample_km": round(in_sample[idx], 2),
            "residual_loocv_km": round(loocv[idx], 2),
            "pinpoint_rationale": g["pinpoint_rationale"]
        })

    n = len(gcps_output)
    rmse_in = round(math.sqrt(sum(d ** 2 for d in in_sample) / n), 2)
    rmse_loo = round(math.sqrt(sum(d ** 2 for d in loocv) / n), 2)
    sorted_loo = sorted(loocv)
    med_loo = round(sorted_loo[n // 2], 2)
    p90_loo = round(sorted_loo[int(math.ceil(0.9 * n)) - 1], 2)
    max_loo = round(max(loocv), 2)
    max_idx = loocv.index(max(loocv))
    max_feature = gcps_output[max_idx]["name"]

    audit_data = {
        "schema_version": "1.0.0",
        "description": "Authoritative Ground Control Point (GCP) audit fixture for Herman Moll 1715 map (LOC gm71005442).",
        "master_image": {
            "path": "data/raw/loc_gm71005442/moll-1715-loc-master.jpg",
            "dimensions": [6025, 3636],
            "neatline_crop_offset": [crop_x, crop_y]
        },
        "candidate_c_summary": {
            "gcp_count": n,
            "warp_method": "gdalwarp_affine_order_1",
            "rmse_in_sample_km": rmse_in,
            "rmse_loocv_km": rmse_loo,
            "loocv_median_km": med_loo,
            "loocv_p90_km": p90_loo,
            "loocv_max_km": max_loo,
            "loocv_max_feature": max_feature,
            "willemstad_loocv_km": round(loocv[9], 2)
        },
        "canonical_gcps": gcps_output,
        "excluded_investigated_points": EXCLUDED_CANDIDATES,
        "packet8_baseline_accounting": PACKET8_BASELINE_ACCOUNTING
    }

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(audit_data, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"[PASS] GCP audit written to {OUTPUT_FILE}")
    print(f"       Candidate C: N={n}, in-sample RMSE={rmse_in} km, LOOCV RMSE={rmse_loo} km")
    print(f"       Willemstad LOOCV: {loocv[9]:.2f} km, Max LOOCV: {max_loo:.2f} km ({max_feature})")


if __name__ == "__main__":
    main()
