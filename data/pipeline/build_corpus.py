#!/usr/bin/env python3
"""
data/pipeline/build_corpus.py

Deterministic compiler for Charted Currents Packet 4 published data.
Reads the committed data/reviewed_corpus.yml and compiles the rights-safe,
relational evidence graph under public/data/.

Invariants:
- Deterministic: identical input produces byte-identical output.
- No dynamic runtime timestamps.
- Explicit schema structures for sources, source_records, assertions,
  occurrences, canonical entities, resolution edges, and coverage.

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
    source_coverages = data.get("source_coverages", [])
    source_records = data.get("source_records", [])
    assertions = data.get("assertions", [])
    places = data.get("places", [])
    ship_occurrences = data.get("ship_occurrences", [])
    crew_occurrences = data.get("crew_occurrences", [])
    person_occurrences = data.get("person_occurrences", [])
    ships = data.get("ships", [])
    persons = data.get("persons", [])
    entity_resolution_edges = data.get("entity_resolution_edges", [])
    routes = data.get("routes", [])
    events = data.get("events", [])
    visuals = data.get("visuals", [])

    os.makedirs(public_data_dir, exist_ok=True)

    # Build places lookup for coordinates
    place_coords = {p["id"]: p["coordinates"] for p in places}
    place_names = {p["id"]: p.get("canonical_name", p["id"]) for p in places}

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
                    "endonym": p.get("endonym"),
                    "attestations": p.get("attestations", []),
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

    # Source record to source ID mapping
    sr_to_source = {sr["id"]: sr["source_id"] for sr in source_records}
    # Assertion to source ID mapping
    ast_to_source = {}
    for ast in assertions:
        sr_id = ast.get("source_record_id")
        if sr_id in sr_to_source:
            ast_to_source[ast["id"]] = sr_to_source[sr_id]

    # Map ships to capture dates and primary source IDs
    ship_to_capture_date = {}
    ship_to_source_id = {}
    for ship in ships:
        occ_ids = ship.get("occurrence_ids", [])
        if occ_ids:
            for occ in ship_occurrences:
                if occ["id"] == occ_ids[0]:
                    ship_to_capture_date[ship["id"]] = occ.get("recorded_capture_date", "")
                    sr_id = occ.get("source_record_id")
                    if sr_id in sr_to_source:
                        ship_to_source_id[ship["id"]] = sr_to_source[sr_id]
                    break

    # Build individual archival route records
    archival_routes = []
    for r in routes:
        explicit_year = r.get("year")
        cap_date = ship_to_capture_date.get(r["vessel_id"], "")
        year = explicit_year
        month = r.get("month")

        if year is None and cap_date:
            parts = cap_date.split("-")
            if parts[0].isdigit():
                year = int(parts[0])
            if len(parts) > 1 and parts[1].isdigit():
                month = int(parts[1])

        route_src_ids = []
        for aid in r.get("source_assertion_ids", []):
            if aid in ast_to_source and ast_to_source[aid] not in route_src_ids:
                route_src_ids.append(ast_to_source[aid])
        if not route_src_ids and r["vessel_id"] in ship_to_source_id:
            route_src_ids.append(ship_to_source_id[r["vessel_id"]])

        archival_routes.append({
            "id": r["id"],
            "vessel_id": r["vessel_id"],
            "origin_place_id": r["origin_place_id"],
            "destination_place_id": r["destination_place_id"],
            "date_display": r.get("date_display", ""),
            "associated_record_year": year,
            "associated_record_month": month,
            "temporal_basis": r.get("temporal_basis", "capture_record" if cap_date else "register_record"),
            "date_precision": "year_month" if month else "year",
            "geometry_kind": r.get("geometry_kind", "endpoints_only"),
            "evidence_state": r.get("evidence_state", "documented"),
            "is_track_observed": False,
            "geometry_provenance": r.get("geometry_provenance", "project visualization between resolved endpoint references"),
            "source_assertion_ids": r.get("source_assertion_ids", []),
            "source_ids": route_src_ids,
            "notes": r.get("notes", "")
        })

    # Group routes by directional endpoint pair for distinct display edges
    pair_groups = {}
    for r in archival_routes:
        pair_key = (r["origin_place_id"], r["destination_place_id"])
        if pair_key not in pair_groups:
            pair_groups[pair_key] = []
        pair_groups[pair_key].append(r)

    # Compile deterministic display edge features (one per directional pair)
    display_edge_features = []
    for (orig_id, dest_id), group in sorted(pair_groups.items(), key=lambda x: (x[0][0], x[0][1])):
        constituent_vessels = [r["vessel_id"] for r in group]
        constituent_routes = [r["id"] for r in group]
        all_ast_ids = []
        all_src_ids = []
        for r in group:
            for aid in r.get("source_assertion_ids", []):
                if aid not in all_ast_ids:
                    all_ast_ids.append(aid)
            for sid in r.get("source_ids", []):
                if sid not in all_src_ids:
                    all_src_ids.append(sid)

        years = sorted([r["associated_record_year"] for r in group if r.get("associated_record_year") is not None])
        primary_year = years[0] if years else 1700
        min_year = min(years) if years else None
        max_year = max(years) if years else None

        orig_name = place_names.get(orig_id, orig_id)
        dest_name = place_names.get(dest_id, dest_id)
        edge_id = f"display_edge_{orig_id}_{dest_id}"
        route_group_id = f"route_group_{orig_id}_{dest_id}"
        rec_count = len(group)

        display_edge_features.append({
            "type": "Feature",
            "id": edge_id,
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    place_coords[orig_id],
                    place_coords[dest_id]
                ]
            },
            "properties": {
                "id": edge_id,
                "origin_place_id": orig_id,
                "destination_place_id": dest_id,
                "origin_name": orig_name,
                "destination_name": dest_name,
                "route_group_id": route_group_id,
                "constituent_vessel_ids": constituent_vessels,
                "constituent_route_ids": constituent_routes,
                "constituent_assertion_ids": all_ast_ids,
                "constituent_source_ids": all_src_ids,
                "record_count": rec_count,
                "member_years": years,
                "associated_record_year": primary_year,
                "temporal_extent": {
                    "start_year": min_year,
                    "end_year": max_year,
                    "temporal_basis": "historical_record"
                },
                "geometry_kind": "endpoints_only",
                "evidence_state": "documented",
                "is_track_observed": False,
                "geometry_provenance": "project visualization between resolved endpoint references",
                "notes": f"Aggregated display edge for {rec_count} documented transatlantic vessel voyage{'s' if rec_count > 1 else ''} between {orig_name} and {dest_name}."
            }
        })

    routes_geojson = {
        "type": "FeatureCollection",
        "features": display_edge_features,
        "archival_routes": archival_routes
    }

    # 3. entities.json
    entities_json = {
        "ship_occurrences": ship_occurrences,
        "crew_occurrences": crew_occurrences,
        "person_occurrences": person_occurrences,
        "ships": ships,
        "persons": persons,
        "entity_resolution_edges": entity_resolution_edges,
        "places": places,
        "routes": archival_routes,
        "visuals": visuals,
        "source_coverages": source_coverages
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

    # 6. coverage.json
    coverage_json = source_coverages

    # 7. manifest.json (Deterministic: uses reviewed_at as publishedAt)
    manifest_json = {
        "version": meta.get("version", "0.4.0"),
        "corpusId": meta.get("corpus_id", "greater_caribbean_public_beta"),
        "corpusTitle": meta.get("corpus_title", ""),
        "publishedAt": meta.get("reviewed_at", "2026-09-01"),
        "reviewStatus": meta.get("review_status", "reviewed_for_publication"),
        "counts": {
            "sources": len(sources),
            "source_records": len(source_records),
            "assertions": len(assertions),
            "ship_occurrences": len(ship_occurrences),
            "crew_occurrences": len(crew_occurrences),
            "person_occurrences": len(person_occurrences),
            "ships": len(ships),
            "persons": len(persons),
            "entity_resolution_edges": len(entity_resolution_edges),
            "places": len(places),
            "routes": len(archival_routes),
            "display_edges": len(display_edge_features),
            "events": len(events),
            "visuals": len(visuals),
            "source_coverages": len(source_coverages)
        }
    }

    artifacts = {
        "manifest.json": manifest_json,
        "ports.geojson": ports_geojson,
        "routes.geojson": routes_geojson,
        "entities.json": entities_json,
        "events.json": events_json,
        "sources.json": sources_json,
        "coverage.json": coverage_json
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
