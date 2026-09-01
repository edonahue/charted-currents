#!/usr/bin/env python3
"""
data/pipeline/build_corpus.py

Deterministic compiler for Charted Currents Packet 2 published data.
Reads the committed, human-reviewed data/reviewed_corpus.yml and compiles
the right-safe, validated static JSON/GeoJSON artifacts under public/data/.

Usage: python3 data/pipeline/build_corpus.py
"""

import json
import os
import sys
import yaml
from datetime import datetime, timezone

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.abspath(os.path.join(script_dir, "..", ".."))
    reviewed_path = os.path.join(repo_root, "data", "reviewed_corpus.yml")
    public_data_dir = os.path.join(repo_root, "public", "data")

    if not os.path.exists(reviewed_path):
        print(f"Error: reviewed corpus not found at {reviewed_path}", file=sys.stderr)
        sys.exit(1)

    with open(reviewed_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    meta = data.get("metadata", {})
    sources = data.get("sources", [])
    places = data.get("places", [])
    ships = data.get("ships", [])
    routes = data.get("routes", [])
    events = data.get("events", [])
    visuals = data.get("visuals", [])

    os.makedirs(public_data_dir, exist_ok=True)

    # Build places lookup for coordinates
    place_coords = {p["id"]: p["coordinates"] for p in places}

    # 1. ports.geojson
    ports_geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "id": p["id"],
                "geometry": {
                    "type": "Point",
                    "coordinates": p["coordinates"]
                },
                "properties": {
                    "id": p["id"],
                    "canonical_name": p["canonical_name"],
                    "raw_source_name": p.get("raw_source_name", p["canonical_name"]),
                    "region": p.get("region", ""),
                    "geographic_precision": p.get("geographic_precision", "populated_place"),
                    "geometry_provenance": p.get("geometry_provenance", "modern_navigation_reference_coordinate"),
                    "notes": p.get("notes", "")
                }
            }
            for p in places
        ]
    }

    # 2. routes.geojson
    routes_geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "id": r["id"],
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        place_coords[r["origin_place_id"]],
                        place_coords[r["destination_place_id"]]
                    ]
                },
                "properties": {
                    "id": r["id"],
                    "vessel_id": r["vessel_id"],
                    "origin_place_id": r["origin_place_id"],
                    "destination_place_id": r["destination_place_id"],
                    "date_display": r.get("date_display", ""),
                    "geometry_kind": r.get("geometry_kind", "endpoints_only"),
                    "evidence_state": r.get("evidence_state", "documented"),
                    "is_track_observed": False,
                    "geometry_provenance": r.get("geometry_provenance", "project visualization between resolved endpoint references"),
                    "notes": r.get("notes", "")
                }
            }
            for r in routes
        ]
    }

    # 3. entities.json
    entities_json = {
        "ships": ships,
        "places": places,
        "visuals": visuals
    }

    # 4. events.json
    events_json = {
        "events": events
    }

    # 5. sources.json
    sources_json = {
        "sources": sources
    }

    # 6. manifest.json
    manifest_json = {
        "version": meta.get("version", "0.2.0"),
        "corpusId": meta.get("corpus_id", "greater_caribbean_port_royal_sample"),
        "corpusTitle": meta.get("corpus_title", ""),
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "reviewedAt": meta.get("reviewed_at", ""),
        "reviewStatus": meta.get("review_status", ""),
        "counts": {
            "ships": len(ships),
            "places": len(places),
            "routes": len(routes),
            "events": len(events),
            "sources": len(sources),
            "visuals": len(visuals)
        }
    }

    artifacts = {
        "manifest.json": manifest_json,
        "ports.geojson": ports_geojson,
        "routes.geojson": routes_geojson,
        "entities.json": entities_json,
        "events.json": events_json,
        "sources.json": sources_json,
    }

    for filename, content in artifacts.items():
        dest_path = os.path.join(public_data_dir, filename)
        with open(dest_path, "w", encoding="utf-8") as f:
            json.dump(content, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print(f"Generated: {dest_path}")

    print("\nPublished data compilation successful.")

if __name__ == "__main__":
    main()
