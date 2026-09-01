#!/usr/bin/env python3
"""
data/pipeline/build_corpus.py

Deterministic compiler for Charted Currents Packet 2 published data.
Reads the committed data/reviewed_corpus.yml and compiles the right-safe,
relational evidence graph under public/data/.

Invariants:
- Deterministic: identical input produces byte-identical output.
- No dynamic runtime timestamps.
- Explicit schema structures for sources, source_records, assertions,
  occurrences, canonical entities, and resolution edges.

Usage: python3 data/pipeline/build_corpus.py
"""

import json
import os
import sys
import yaml

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
    source_records = data.get("source_records", [])
    assertions = data.get("assertions", [])
    places = data.get("places", [])
    ship_occurrences = data.get("ship_occurrences", [])
    crew_occurrences = data.get("crew_occurrences", [])
    ships = data.get("ships", [])
    entity_resolution_edges = data.get("entity_resolution_edges", [])
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
                    "source_assertion_ids": p.get("source_assertion_ids", []),
                    "notes": p.get("notes", "")
                }
            }
            for p in places
        ]
    }

    # Map ships to capture dates for machine-readable route temporal metadata
    ship_to_capture_date = {}
    for ship in ships:
        occ_ids = ship.get("occurrence_ids", [])
        if occ_ids:
            for occ in ship_occurrences:
                if occ["id"] == occ_ids[0]:
                    ship_to_capture_date[ship["id"]] = occ.get("recorded_capture_date", "")
                    break

    # Group routes by directional endpoint pair for aggregation
    pair_groups = {}
    for r in routes:
        pair_key = f"{r['origin_place_id']}->{r['destination_place_id']}"
        if pair_key not in pair_groups:
            pair_groups[pair_key] = []
        pair_groups[pair_key].append(r)

    # 2. routes.geojson
    route_features = []
    for r in routes:
        cap_date = ship_to_capture_date.get(r["vessel_id"], "")
        year = None
        month = None
        if cap_date:
            parts = cap_date.split("-")
            if parts[0].isdigit():
                year = int(parts[0])
            if len(parts) > 1 and parts[1].isdigit():
                month = int(parts[1])

        pair_key = f"{r['origin_place_id']}->{r['destination_place_id']}"
        group = pair_groups[pair_key]
        constituent_vessels = [it["vessel_id"] for it in group]
        constituent_routes = [it["id"] for it in group]
        rec_count = len(group)
        route_group_id = f"route_group_{r['origin_place_id']}_{r['destination_place_id']}"

        route_features.append({
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
                "associated_record_year": year,
                "associated_record_month": month,
                "temporal_basis": "capture_record",
                "date_precision": "year_month" if month else "year",
                "route_group_id": route_group_id,
                "constituent_vessel_ids": constituent_vessels,
                "constituent_route_ids": constituent_routes,
                "record_count": rec_count,
                "geometry_kind": r.get("geometry_kind", "endpoints_only"),
                "evidence_state": r.get("evidence_state", "documented"),
                "is_track_observed": False,
                "geometry_provenance": r.get("geometry_provenance", "project visualization between resolved endpoint references"),
                "source_assertion_ids": r.get("source_assertion_ids", []),
                "notes": r.get("notes", "")
            }
        })

    routes_geojson = {
        "type": "FeatureCollection",
        "features": route_features
    }

    # 3. entities.json
    entities_json = {
        "ship_occurrences": ship_occurrences,
        "crew_occurrences": crew_occurrences,
        "ships": ships,
        "entity_resolution_edges": entity_resolution_edges,
        "places": places,
        "visuals": visuals
    }

    # 4. events.json
    events_json = {
        "events": events
    }

    # 5. sources.json
    sources_json = {
        "sources": sources,
        "source_records": source_records,
        "assertions": assertions
    }

    # 6. manifest.json (Deterministic: uses reviewed_at as publishedAt)
    manifest_json = {
        "version": meta.get("version", "0.2.0"),
        "corpusId": meta.get("corpus_id", "greater_caribbean_port_royal_sample"),
        "corpusTitle": meta.get("corpus_title", ""),
        "publishedAt": meta.get("reviewed_at", "2026-09-01"),
        "reviewStatus": meta.get("review_status", "reviewed_for_publication"),
        "counts": {
            "sources": len(sources),
            "source_records": len(source_records),
            "assertions": len(assertions),
            "ship_occurrences": len(ship_occurrences),
            "crew_occurrences": len(crew_occurrences),
            "ships": len(ships),
            "entity_resolution_edges": len(entity_resolution_edges),
            "places": len(places),
            "routes": len(routes),
            "events": len(events),
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
