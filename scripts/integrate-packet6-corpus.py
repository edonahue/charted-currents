#!/usr/bin/env python3
"""scripts/integrate-packet6-corpus.py

Integrates reviewed Packet 6 data into data/reviewed_corpus.yml:
  - 3 candidate vessels (5890, 4493, 4501)
  - Flota 189 ("Barco Holandés")
  - 17 referenced TIPOMERCANCIA category source records and Class A assertions
  - 11 referenced TIPOMEDIDA measure source records and Class A assertions
  - 160 MERCANCIAS consignment source records and assertions (Class A, C, B)
  - 160 GoodsOccurrence records
  - 5 new places (Curazao, Amsterdam, Sevilla, Venezuela, Puerto Rico)
  - Updated Havana description (evidence-bounded copy)
  - Canonical ships and entity resolution edges
  - Archival routes
"""

from __future__ import annotations

import json
import os
import sys
import yaml
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
REVIEWED_CORPUS_PATH = REPO_ROOT / "data" / "reviewed_corpus.yml"
CANDIDATES_DIR = REPO_ROOT / "data" / "candidates" / "crespo"

COMMODITY_FACETS = {
    "Cacao": "cacao",
    "Añil": "indigo",
    "Tabaco": "tobacco",
    "Tabaco de Barinas": "tobacco",
    "Azúcar": "sugar",
    "Algodón": "cotton",
    "Cobre": "copper",
    "Conchas de carey": "tortoiseshell",
    "Monedas de plata españolas": "specie",
}

NEW_PLACES = [
    {
        "id": "place_curacao",
        "canonical_name": "Curaçao",
        "raw_source_name": "Curazao",
        "endonym": "Kòrsou",
        "region": "Southern Caribbean",
        "geographic_precision": "colony_or_island",
        "coordinates": [-68.9333, 12.1167],
        "geometry_provenance": "modern_navigation_reference_coordinate",
        "notes": "Dutch Caribbean commercial hub recorded as departure port for West Indische Gally (1706) and La Provincia de Zeelanda (1700).",
        "source_assertion_ids": ["ast_crespo_4493_dep", "ast_crespo_4501_dep"],
        "attestations": [
            {
                "raw_name": "Curazao",
                "evidence_layer": "scholarly_dataset_value",
                "language": "es",
                "attestation_relationship": "source_transcription",
                "source_record_id": "sr_crespo_navio_4493",
                "normalized_search_key": "curazao"
            },
            {
                "raw_name": "Curaçao",
                "evidence_layer": "project_editorial_label",
                "language": "nl",
                "attestation_relationship": "modern_preferred_label",
                "source_record_id": "sr_crespo_navio_4493",
                "normalized_search_key": "curacao"
            }
        ]
    },
    {
        "id": "place_amsterdam",
        "canonical_name": "Amsterdam",
        "raw_source_name": "Amsterdam",
        "endonym": "Amsterdam",
        "region": "Netherlands",
        "geographic_precision": "port_city",
        "coordinates": [4.9041, 52.3676],
        "geometry_provenance": "modern_navigation_reference_coordinate",
        "notes": "Primary European destination port for Dutch Caribbean trade recorded in Crespo 4493 and 4501.",
        "source_assertion_ids": ["ast_crespo_4493_arr", "ast_crespo_4501_arr"],
        "attestations": [
            {
                "raw_name": "Amsterdam",
                "evidence_layer": "scholarly_dataset_value",
                "language": "nl",
                "attestation_relationship": "source_transcription",
                "source_record_id": "sr_crespo_navio_4493",
                "normalized_search_key": "amsterdam"
            }
        ]
    },
    {
        "id": "place_seville",
        "canonical_name": "Sevilla",
        "raw_source_name": "Sevilla",
        "endonym": "Sevilla",
        "region": "Spain",
        "geographic_precision": "port_city",
        "coordinates": [-5.9845, 37.3891],
        "geometry_provenance": "modern_navigation_reference_coordinate",
        "notes": "Guadalquivir river port and Casa de la Contratación headquarters recorded as destination for Nuestra Señora de la Estrella (1694).",
        "source_assertion_ids": ["ast_crespo_5890_arr"],
        "attestations": [
            {
                "raw_name": "Sevilla",
                "evidence_layer": "scholarly_dataset_value",
                "language": "es",
                "attestation_relationship": "source_transcription",
                "source_record_id": "sr_crespo_navio_5890",
                "normalized_search_key": "sevilla"
            }
        ]
    },
    {
        "id": "place_venezuela",
        "canonical_name": "Venezuela (Province / La Guaira)",
        "raw_source_name": "Venezuela",
        "endonym": "Venezuela",
        "region": "Tierra Firme / Southern Caribbean",
        "geographic_precision": "colony_or_island",
        "coordinates": [-66.9333, 10.6000],
        "geometry_provenance": "modern_navigation_reference_coordinate",
        "notes": "Province of Venezuela recorded as departure point for cacao voyage of Nuestra Señora de la Estrella (1694).",
        "source_assertion_ids": ["ast_crespo_5890_dep"],
        "attestations": [
            {
                "raw_name": "Venezuela",
                "evidence_layer": "scholarly_dataset_value",
                "language": "es",
                "attestation_relationship": "source_transcription",
                "source_record_id": "sr_crespo_navio_5890",
                "normalized_search_key": "venezuela"
            }
        ]
    },
    {
        "id": "place_puerto_rico",
        "canonical_name": "Puerto Rico",
        "raw_source_name": "Puerto Rico",
        "endonym": "Puerto Rico",
        "region": "Greater Antilles",
        "geographic_precision": "colony_or_island",
        "coordinates": [-66.1057, 18.4655],
        "geometry_provenance": "modern_navigation_reference_coordinate",
        "notes": "Recorded vicinity of prize capture for La Provincia de Zeelanda (1700) by Spanish corsair Manuel Duarte.",
        "source_assertion_ids": ["ast_crespo_4501_capture"],
        "attestations": [
            {
                "raw_name": "Puerto Rico",
                "evidence_layer": "scholarly_dataset_value",
                "language": "es",
                "attestation_relationship": "source_transcription",
                "source_record_id": "sr_crespo_navio_4501",
                "normalized_search_key": "puerto rico"
            }
        ]
    }
]


def main() -> None:
    print("[*] Loading candidate fixtures from data/candidates/crespo/...")
    with open(CANDIDATES_DIR / "source_rows.json", encoding="utf-8") as f:
        source_rows = json.load(f)
    with open(CANDIDATES_DIR / "flotas_rows.json", encoding="utf-8") as f:
        flotas_rows = json.load(f)
    with open(CANDIDATES_DIR / "mercancias_rows.json", encoding="utf-8") as f:
        mercancias_rows = json.load(f)
    with open(CANDIDATES_DIR / "tipomercancia_rows.json", encoding="utf-8") as f:
        tipomercancia_rows = json.load(f)
    with open(CANDIDATES_DIR / "tipomedida_rows.json", encoding="utf-8") as f:
        tipomedida_rows = json.load(f)

    with open(REVIEWED_CORPUS_PATH, encoding="utf-8") as f:
        corpus = yaml.safe_load(f)

    # Commodity and Measure Lookups
    tm_lookup = {int(r["idTipoMercancia"]): r["tipoMercancia"].strip() for r in tipomercancia_rows}
    tmed_lookup = {int(r["IdTipoMedida"]): r["tipoMedida"].strip() for r in tipomedida_rows}

    # 1. Update place_havana notes (evidence-bounded copy)
    for p in corpus["places"]:
        if p["id"] == "place_havana":
            p["notes"] = "Havana appears in the reviewed Carrera voyage records, the 1684 Bochart & Knollis chart, and as prize departure port in IMLM 1582."

    # Add new places if not already present
    existing_place_ids = {p["id"] for p in corpus["places"]}
    for np in NEW_PLACES:
        if np["id"] not in existing_place_ids:
            corpus["places"].append(np)
            existing_place_ids.add(np["id"])

    # 2. Add Flota 189 SourceRecord & Assertions
    flota_189 = next((f for f in flotas_rows if int(f["ID"]) == 189), None)
    if flota_189 and not any(sr["id"] == "sr_crespo_flota_189" for sr in corpus["source_records"]):
        corpus["source_records"].append({
            "id": "sr_crespo_flota_189",
            "source_id": "src_crespo_dyncoopnet",
            "record_type": "dataset_fleet_record",
            "native_identifier": "189",
            "inspection_state": "dataset_record_inspected"
        })
        corpus["assertions"].extend([
            {
                "id": "ast_crespo_flota_189_title",
                "source_record_id": "sr_crespo_flota_189",
                "field": "FLOTA",
                "raw_value": "Barco Holandés",
                "risk_class": "A"
            }
        ])

    # 3. Add TIPOMERCANCIA and TIPOMEDIDA SourceRecords and Class A Assertions
    existing_sr_ids = {sr["id"] for sr in corpus["source_records"]}
    existing_ast_ids = {ast["id"] for ast in corpus["assertions"]}

    for tm_id, tm_label in sorted(tm_lookup.items()):
        sr_id = f"sr_crespo_tipomercancia_{tm_id}"
        if sr_id not in existing_sr_ids:
            corpus["source_records"].append({
                "id": sr_id,
                "source_id": "src_crespo_dyncoopnet",
                "record_type": "dataset_reference_record",
                "source_table": "TIPOMERCANCIA",
                "native_identifier": str(tm_id),
                "inspection_state": "dataset_record_inspected"
            })
            existing_sr_ids.add(sr_id)
        ast_id = f"ast_crespo_tm_{tm_id}_label"
        if ast_id not in existing_ast_ids:
            corpus["assertions"].append({
                "id": ast_id,
                "source_record_id": sr_id,
                "field": "tipoMercancia",
                "raw_value": tm_label,
                "risk_class": "A"
            })
            existing_ast_ids.add(ast_id)

    for tmed_id, tmed_label in sorted(tmed_lookup.items()):
        sr_id = f"sr_crespo_tipomedida_{tmed_id}"
        if sr_id not in existing_sr_ids:
            corpus["source_records"].append({
                "id": sr_id,
                "source_id": "src_crespo_dyncoopnet",
                "record_type": "dataset_reference_record",
                "source_table": "TIPOMEDIDA",
                "native_identifier": str(tmed_id),
                "inspection_state": "dataset_record_inspected"
            })
            existing_sr_ids.add(sr_id)
        ast_id = f"ast_crespo_tmed_{tmed_id}_label"
        if ast_id not in existing_ast_ids:
            corpus["assertions"].append({
                "id": ast_id,
                "source_record_id": sr_id,
                "field": "tipoMedida",
                "raw_value": tmed_label,
                "risk_class": "A"
            })
            existing_ast_ids.add(ast_id)

    # 4. Add the 3 Vessel SourceRecords and ShipOccurrences
    vessel_configs = {
        5890: {
            "canonical_name": "Nuestra Señora de la Estrella (1694)",
            "origin_place_id": "place_venezuela",
            "destination_place_id": "place_seville",
            "fuente_citation": "El comercio español con América…/García Fuentes, L. p. 555-558",
            "goods_summary": "3698 fanegas y 95 libras de cacao.l",
            "goods_value": None,
            "flota_id": None
        },
        4493: {
            "canonical_name": "West Indische Gally (1706)",
            "origin_place_id": "place_curacao",
            "destination_place_id": "place_amsterdam",
            "fuente_citation": "Curazao y la Costa de Caracas…/Aizpurua, R. p. 393",
            "goods_summary": "36000 libras de palo de Campeche ; 8768 libras de cacao y 7 vat y 1 zurron de cacao ; 26 canastas, 1 caja, 4 vat y 18 rollos de tabaco ; 1958  piezas y 12 paquetes de cuero ; 58055 libras de azúcar ; 47 balas de algodón ; 22 pipas y 15 vat.  de limón ; 2 vat. De rocú ; 6 vat. De gengibre",
            "goods_value": None,
            "flota_id": 189
        },
        4501: {
            "canonical_name": "La Provincia de Zeelanda (1700)",
            "origin_place_id": "place_curacao",
            "destination_place_id": "place_amsterdam",
            "capture_place_id": "place_puerto_rico",
            "fuente_citation": "El contrabando holandés en el Caribe…/Arauz Monfante, C.A. Tomo I p. 49",
            "goods_summary": "Corambre ; Palo de Brasil ; cacao ; tabaco de Barinas ; añil ; cobre ; conchas de carey ; cascaras  de naranja ; monedas de plata españoles",
            "goods_value": "10491 pesos y 2 reales de valor total",
            "flota_id": 189
        }
    }

    for nid, cfg in vessel_configs.items():
        vrow = next((r for r in source_rows if int(r["ID"]) == nid), None)
        if not vrow:
            continue

        sr_id = f"sr_crespo_navio_{nid}"
        if sr_id not in existing_sr_ids:
            corpus["source_records"].append({
                "id": sr_id,
                "source_id": "src_crespo_dyncoopnet",
                "record_type": "dataset_voyage_record",
                "native_identifier": str(nid),
                "inspection_state": "dataset_record_inspected",
                "source_citation": cfg["fuente_citation"]
            })
            existing_sr_ids.add(sr_id)

        # Vessel assertions
        v_asts = [
            ("name", "ESPECTRO DEL NAVIO", vrow.get("ESPECTRO DEL NAVIO"), "A"),
            ("year", "AÑO", str(vrow.get("AÑO")), "A"),
            ("master", "CAPITAN / MAESTRE", vrow.get("CAPITAN / MAESTRE"), "A"),
            ("dep", "PUERTO DE SALIDA", vrow.get("PUERTO DE SALIDA"), "A"),
            ("arr", "PUERTO DE LLEGADA", vrow.get("PUERTO DE LLEGADA"), "A"),
            ("fuente", "FUENTE", cfg["fuente_citation"], "A"),
        ]
        if vrow.get("TONELAJE"):
            v_asts.append(("tonnage", "TONELAJE", str(vrow.get("TONELAJE")), "A"))
        if cfg["goods_summary"]:
            v_asts.append(("goods_summary", "MERCANCIA (VER ANEXO EN TODOS)", cfg["goods_summary"], "A"))
        if cfg["goods_value"]:
            v_asts.append(("goods_value", "VALOR DE LA MERCANCIA", cfg["goods_value"], "A"))
        if cfg.get("capture_place_id"):
            v_asts.append(("capture", "INCIDENCIAS", vrow.get("INCIDENCIAS"), "A"))

        v_ast_ids = []
        for tag, fld, val, rclass in v_asts:
            if val is not None:
                aid = f"ast_crespo_{nid}_{tag}"
                v_ast_ids.append(aid)
                if aid not in existing_ast_ids:
                    corpus["assertions"].append({
                        "id": aid,
                        "source_record_id": sr_id,
                        "field": fld,
                        "raw_value": str(val).strip(),
                        "risk_class": rclass
                    })
                    existing_ast_ids.add(aid)

        occ_id = f"occ_ship_crespo_{nid}"
        year_val = int(vrow["AÑO"]) if str(vrow.get("AÑO", "")).isdigit() else None

        # Build ship occurrence
        ship_occ = {
            "id": occ_id,
            "source_record_id": sr_id,
            "raw_name": vrow.get("ESPECTRO DEL NAVIO"),
            "raw_tonnage": str(vrow.get("TONELAJE")) if vrow.get("TONELAJE") else None,
            "recorded_voyage_origin": vrow.get("PUERTO DE SALIDA"),
            "recorded_voyage_destination": vrow.get("PUERTO DE LLEGADA"),
            "recorded_year": year_val,
            "recorded_master": vrow.get("CAPITAN / MAESTRE"),
            "recorded_goods_summary": cfg["goods_summary"],
            "recorded_goods_value_text": cfg["goods_value"],
            "goods_occurrence_ids": [],
            "assertion_ids": v_ast_ids
        }
        if cfg.get("capture_place_id"):
            ship_occ["recorded_capture_location"] = "Puerto Rico"
            ship_occ["recorded_capture_date"] = "1700"

        if cfg.get("flota_id"):
            ship_occ["fleet_convoy"] = {
                "native_fleet_id": 189,
                "source_record_id": "sr_crespo_flota_189",
                "assertion_ids": ["ast_crespo_flota_189_title"],
                "fleet_title": "Barco Holandés",
                "commander_display": "Dutch Carrier Context",
                "fleet_origin": "Curazao",
                "fleet_destination": "Amsterdam",
                "year": year_val or 1700
            }
            ship_occ["fleet_convoy_display"] = "Barco Holandés (Dutch Transatlantic Trade)"

        if not any(so["id"] == occ_id for so in corpus["ship_occurrences"]):
            corpus["ship_occurrences"].append(ship_occ)

        # Canonical ship
        canonical_ship_id = f"ship_crespo_{nid}"
        if not any(s["id"] == canonical_ship_id for s in corpus["ships"]):
            corpus["ships"].append({
                "id": canonical_ship_id,
                "canonical_name": cfg["canonical_name"],
                "evidence_state": "documented",
                "occurrence_ids": [occ_id],
                "reported_burden_display": f"Recorded tonnage: {vrow.get('TONELAJE')}" if vrow.get("TONELAJE") else "Tonnage unrecorded",
                "voyage_display": f"{vrow.get('PUERTO DE SALIDA')} → {vrow.get('PUERTO DE LLEGADA')} ({year_val})",
                "master_display": vrow.get("CAPITAN / MAESTRE"),
                "fleet_display": "Barco Holandés" if cfg.get("flota_id") else None,
                "capture_display": "Captured in the vicinity of Puerto Rico by corsair Manuel Duarte (1700)" if cfg.get("capture_place_id") else None,
                "goods_summary_display": cfg["goods_summary"],
                "goods_value_display": cfg["goods_value"]
            })

        # Resolution edge
        if not any(edge["occurrence_id"] == occ_id for edge in corpus["entity_resolution_edges"]):
            corpus["entity_resolution_edges"].append({
                "occurrence_id": occ_id,
                "target_entity_id": canonical_ship_id,
                "resolution_state": "documented_identity",
                "resolver": "crespo_adapter",
                "evidence_assertions": [f"ast_crespo_{nid}_name"]
            })

        # Route
        route_id = f"route_crespo_{nid}"
        if not any(r["id"] == route_id for r in corpus["routes"]):
            corpus["routes"].append({
                "id": route_id,
                "origin_place_id": cfg["origin_place_id"],
                "destination_place_id": cfg["destination_place_id"],
                "vessel_id": canonical_ship_id,
                "associated_record_year": year_val or 1700,
                "source_ids": ["src_crespo_dyncoopnet"],
                "source_assertion_ids": [f"ast_crespo_{nid}_dep", f"ast_crespo_{nid}_arr"]
            })

    # 5. Add 160 MERCANCIAS SourceRecords, Assertions, and GoodsOccurrences
    if "goods_occurrences" not in corpus:
        corpus["goods_occurrences"] = []

    existing_goods_occ_ids = {g["id"] for g in corpus["goods_occurrences"]}

    # Mapping from navio ID to ShipOccurrence object in corpus
    ship_occ_map = {int(so["source_record_id"].replace("sr_crespo_navio_", "")): so for so in corpus["ship_occurrences"] if so["id"].startswith("occ_ship_crespo_")}

    for mrow in mercancias_rows:
        mid = int(mrow["identificador"])
        nid = int(mrow["NAVIO MERCANTE"])
        sr_id = f"sr_crespo_merc_{mid}"

        if sr_id not in existing_sr_ids:
            corpus["source_records"].append({
                "id": sr_id,
                "source_id": "src_crespo_dyncoopnet",
                "record_type": "dataset_merchandise_record",
                "source_table": "MERCANCIAS",
                "native_identifier": str(mid),
                "parent_ship_record_id": f"sr_crespo_navio_{nid}",
                "inspection_state": "dataset_record_inspected"
            })
            existing_sr_ids.add(sr_id)

        comm_fk = int(mrow["MERCANCIA"])
        comm_label = tm_lookup.get(comm_fk, f"Unknown ({comm_fk})")

        meas_fk = int(mrow.get("MEDIDAS", 0)) if mrow.get("MEDIDAS") is not None and str(mrow.get("MEDIDAS")).isdigit() else 0
        meas_label = tmed_lookup.get(meas_fk) if meas_fk > 0 else None

        raw_qty = int(mrow.get("CANTIDAD", 0)) if mrow.get("CANTIDAD") is not None and str(mrow.get("CANTIDAD")).isdigit() else 0
        parsed_qty = raw_qty if raw_qty > 0 else None

        consignee = mrow.get("CONSIGNATARIO")
        if consignee:
            consignee = str(consignee).strip() or None

        notas = mrow.get("NOTAS")
        if notas:
            notas = str(notas).strip() or None

        # Assertions
        m_ast_ids = []

        # Ast 1: Class A raw FK
        ast_fk_id = f"ast_crespo_merc_{mid}_fk"
        m_ast_ids.append(ast_fk_id)
        if ast_fk_id not in existing_ast_ids:
            corpus["assertions"].append({
                "id": ast_fk_id,
                "source_record_id": sr_id,
                "field": "MERCANCIA",
                "raw_value": str(comm_fk),
                "risk_class": "A"
            })
            existing_ast_ids.add(ast_fk_id)

        # Ast 2: Class A raw quantity
        ast_qty_id = f"ast_crespo_merc_{mid}_qty"
        m_ast_ids.append(ast_qty_id)
        if ast_qty_id not in existing_ast_ids:
            corpus["assertions"].append({
                "id": ast_qty_id,
                "source_record_id": sr_id,
                "field": "CANTIDAD",
                "raw_value": str(raw_qty),
                "risk_class": "A"
            })
            existing_ast_ids.add(ast_qty_id)

        # Ast 3: Class A raw measure
        ast_meas_id = f"ast_crespo_merc_{mid}_meas"
        m_ast_ids.append(ast_meas_id)
        if ast_meas_id not in existing_ast_ids:
            corpus["assertions"].append({
                "id": ast_meas_id,
                "source_record_id": sr_id,
                "field": "MEDIDAS",
                "raw_value": str(meas_fk),
                "risk_class": "A"
            })
            existing_ast_ids.add(ast_meas_id)

        # Ast 4: Class A consignee if present
        if consignee:
            ast_cons_id = f"ast_crespo_merc_{mid}_consignee"
            m_ast_ids.append(ast_cons_id)
            if ast_cons_id not in existing_ast_ids:
                corpus["assertions"].append({
                    "id": ast_cons_id,
                    "source_record_id": sr_id,
                    "field": "CONSIGNATARIO",
                    "raw_value": consignee,
                    "risk_class": "A"
                })
                existing_ast_ids.add(ast_cons_id)

        # Ast 5: Class C relational join via TIPOMERCANCIA
        ast_label_id = f"ast_crespo_merc_{mid}_commodity"
        m_ast_ids.append(ast_label_id)
        if ast_label_id not in existing_ast_ids:
            corpus["assertions"].append({
                "id": ast_label_id,
                "source_record_id": sr_id,
                "field": "recorded_commodity_label",
                "derived_value": comm_label,
                "derivation_method": "relational_join_via_TIPOMERCANCIA",
                "source_assertion_id": ast_fk_id,
                "risk_class": "C"
            })
            existing_ast_ids.add(ast_label_id)

        # Ast 6: Class C relational join via TIPOMEDIDA if measure > 0
        if meas_label:
            ast_m_label_id = f"ast_crespo_merc_{mid}_measure"
            m_ast_ids.append(ast_m_label_id)
            if ast_m_label_id not in existing_ast_ids:
                corpus["assertions"].append({
                    "id": ast_m_label_id,
                    "source_record_id": sr_id,
                    "field": "recorded_measure_label",
                    "derived_value": meas_label,
                    "derivation_method": "relational_join_via_TIPOMEDIDA",
                    "source_assertion_id": ast_meas_id,
                    "risk_class": "C"
                })
                existing_ast_ids.add(ast_m_label_id)

        # Ast 7: Class B facet mapping if in approved list
        facet = COMMODITY_FACETS.get(comm_label)
        if facet:
            ast_facet_id = f"ast_crespo_merc_{mid}_facet"
            m_ast_ids.append(ast_facet_id)
            if ast_facet_id not in existing_ast_ids:
                corpus["assertions"].append({
                    "id": ast_facet_id,
                    "source_record_id": sr_id,
                    "field": "commodity_facet",
                    "derived_value": facet,
                    "derivation_method": "deterministic_facet_mapping",
                    "source_assertion_id": ast_label_id,
                    "risk_class": "B"
                })
                existing_ast_ids.add(ast_facet_id)

        # GoodsOccurrence object
        g_occ_id = f"occ_goods_crespo_{mid}"
        if g_occ_id not in existing_goods_occ_ids:
            g_occ = {
                "id": g_occ_id,
                "source_record_id": sr_id,
                "ship_occurrence_id": f"occ_ship_crespo_{nid}",
                "commodity_ref_key": comm_fk,
                "recorded_commodity_label": comm_label,
                "commodity_facet": facet,
                "raw_quantity": raw_qty,
                "parsed_quantity": parsed_qty,
                "measure_ref_key": meas_fk,
                "recorded_measure_label": meas_label,
                "recorded_consignee": consignee,
                "raw_notes": notas,
                "assertion_ids": m_ast_ids
            }
            if nid == 4501:
                g_occ["goods_value_text"] = "10491 pesos y 2 reales de valor total"
            corpus["goods_occurrences"].append(g_occ)
            existing_goods_occ_ids.add(g_occ_id)

        # Append to ship_occurrence.goods_occurrence_ids
        if nid in ship_occ_map:
            so = ship_occ_map[nid]
            if "goods_occurrence_ids" not in so:
                so["goods_occurrence_ids"] = []
            if g_occ_id not in so["goods_occurrence_ids"]:
                so["goods_occurrence_ids"].append(g_occ_id)

    # Save reviewed corpus
    print(f"[*] Writing updated corpus to {REVIEWED_CORPUS_PATH.name}...")
    with open(REVIEWED_CORPUS_PATH, "w", encoding="utf-8") as f:
        yaml.dump(corpus, f, sort_keys=False, allow_unicode=True, width=120)

    print("[SUCCESS] Packet 6 corpus integration complete:")
    print(f"  - Source Records: {len(corpus['source_records'])}")
    print(f"  - Assertions:     {len(corpus['assertions'])}")
    print(f"  - Ship Occurrences: {len(corpus['ship_occurrences'])}")
    print(f"  - Goods Occurrences: {len(corpus['goods_occurrences'])}")
    print(f"  - Places:         {len(corpus['places'])}")
    print(f"  - Ships:          {len(corpus['ships'])}")
    print(f"  - Routes:         {len(corpus['routes'])}")


if __name__ == "__main__":
    main()
