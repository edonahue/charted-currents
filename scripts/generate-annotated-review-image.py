#!/usr/bin/env python3
"""
scripts/generate-annotated-review-image.py

Generates data/source_acquisitions/loc_gm71005442/gcp_audit_review_annotated.jpg
displaying the 13 canonical GCPs, neatline crop boundary, the 5 masked LOC insets,
the lower Mexico City inset (outside crop), and the preserved Bermuda main-chart region.
"""

import json
import os
import sys
from PIL import Image, ImageDraw, ImageFont

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MASTER_SCAN = os.path.join(REPO_ROOT, "data/raw/loc_gm71005442/moll-1715-loc-master.jpg")
GCP_AUDIT_PATH = os.path.join(REPO_ROOT, "data/source_acquisitions/loc_gm71005442/gcp_audit.json")
OUTPUT_IMAGE = os.path.join(REPO_ROOT, "data/source_acquisitions/loc_gm71005442/gcp_audit_review_annotated.jpg")


def main():
    if not os.path.exists(MASTER_SCAN):
        print(f"[FAIL] Master scan not found: {MASTER_SCAN}", file=sys.stderr)
        sys.exit(1)

    with open(GCP_AUDIT_PATH, "r", encoding="utf-8") as f:
        audit = json.load(f)

    gcps = audit["canonical_gcps"]

    # Load master image
    im = Image.open(MASTER_SCAN).convert("RGB")
    width, height = im.size
    draw = ImageDraw.Draw(im)

    # Try to load a nice font, otherwise default
    try:
        font_large = ImageFont.truetype("DejaVuSans-Bold.ttf", 36)
        font_med = ImageFont.truetype("DejaVuSans-Bold.ttf", 26)
        font_small = ImageFont.truetype("DejaVuSans.ttf", 20)
    except Exception:
        font_large = ImageFont.load_default()
        font_med = font_large
        font_small = font_large

    # 1. Neatline Crop (Cyan rectangle)
    crop_x1, crop_y1 = 20, 91
    crop_x2, crop_y2 = 6010, 2895
    for offset in range(4):
        draw.rectangle([crop_x1 + offset, crop_y1 + offset, crop_x2 - offset, crop_y2 - offset], outline="cyan")
    draw.text((crop_x1 + 30, crop_y1 + 15), "NEATLINE CROP BOUNDARY (y <= 2895)", fill="cyan", font=font_med)

    # 2. LOC Inset 6: Mexico City (Orange box, outside crop)
    mex_x1, mex_y1 = 20, 2905
    mex_x2, mex_y2 = 2120, 3555
    for offset in range(4):
        draw.rectangle([mex_x1 + offset, mex_y1 + offset, mex_x2 - offset, mex_y2 - offset], outline="orange")
    draw.text((mex_x1 + 30, mex_y1 + 20), "LOC INSET 6: Mexico City in New Spain (OUTSIDE CROP - NO INTERNAL MASK NEEDED)", fill="orange", font=font_med)

    # 3. LOC Insets 1-5 Masked Areas (Red boxes)
    mask_boxes = [
        ("LOC INSETS 2, 3, 5: Havana, Porto Bella, Cartagena (Box A)", 4831, 91, 5963, 1234),
        ("LOC INSET 1: La Vera Cruz (Box B)", 4481, 233, 4831, 439),
        ("LOC INSET 4: St. Augustin (Box C)", 4188, 439, 4831, 850)
    ]
    for label, bx1, by1, bx2, by2 in mask_boxes:
        for offset in range(4):
            draw.rectangle([bx1 + offset, by1 + offset, bx2 - offset, by2 - offset], outline="red")
        draw.text((bx1 + 15, by1 + 15), f"MASKED: {label}", fill="red", font=font_small)

    # 4. Bermuda (Green box, PRESERVED main chart per R15)
    ber_x1, ber_y1, ber_x2, ber_y2 = 4400, 95, 4830, 230
    for offset in range(4):
        draw.rectangle([ber_x1 + offset, ber_y1 + offset, ber_x2 - offset, ber_y2 - offset], outline="lime")
    draw.text((ber_x1 + 15, ber_y1 + 15), "BERMUDA: Main Chart (PRESERVED - NOT AN INSET)", fill="lime", font=font_med)

    # 5. Draw the 13 GCPs
    for idx, g in enumerate(gcps, 1):
        x, y = g["master_pixel"]
        r = 24
        # Draw outer circle (yellow), inner circle (red)
        for dr in range(4):
            draw.ellipse([x - r - dr, y - r - dr, x + r + dr, y + r + dr], outline="yellow")
        draw.ellipse([x - r, y - r, x + r, y + r], fill="red", outline="white")
        # Draw crosshair
        draw.line([x - r * 1.5, y, x + r * 1.5, y], fill="yellow", width=2)
        draw.line([x, y - r * 1.5, x, y + r * 1.5], fill="yellow", width=2)

        # Label number inside circle
        num_str = str(idx)
        draw.text((x - 8, y - 12), num_str, fill="white", font=font_med)

        # Text banner next to point
        label_text = f"#{idx} {g['name']} (LOOCV: {g['residual_loocv_km']} km)"
        tx = x + 35
        ty = y - 18
        if x > 4800:
            tx = x - 420
        if y < 300:
            ty = y + 25

        # Background tag
        draw.rectangle([tx - 4, ty - 2, tx + len(label_text) * 14 + 10, ty + 28], fill="black")
        draw.text((tx, ty), label_text, fill="yellow", font=font_small)

    # Downscale for review artifact (2000px wide, high quality JPEG)
    target_w = 2000
    target_h = int(target_w * (height / width))
    preview = im.resize((target_w, target_h), Image.Resampling.LANCZOS)
    preview.save(OUTPUT_IMAGE, "JPEG", quality=85)

    size = os.path.getsize(OUTPUT_IMAGE)
    print(f"[PASS] Annotated review image created: {OUTPUT_IMAGE} ({size / 1024:.1f} KB, {target_w}x{target_h})")


if __name__ == "__main__":
    main()
