import type { PublishedDatasetContext, PublishedEntities, PublishedEvent, PublishedRouteFeatureCollection, PublishedSources, Selection } from "../domain/types";
import { loadPublishedEntities, loadPublishedEvents, loadPublishedJson, loadPublishedRoutes, loadPublishedSources } from "../data/loadPublished";
import { formatCoordinates } from "../geo/format";
import { CURRENT_SELECTION_FOCUS_EVENT, consumeSelectionTrigger, recordSelectionTrigger } from "../map/interactionState";
import { selectionStore } from "../state/selection";
import { timeFilterStore, type TimeFilterState } from "../state/timeFilter";

/** Loaded only after a supported selection. All record rendering stays here. */
export function initializeInspector(): void {
  const lifecycle = new AbortController();
  const { signal } = lifecycle;
  const inspector = document.getElementById("entity-inspector");
  const kickerEl = document.querySelector<HTMLElement>("[data-inspector-kicker]");
  const badgeWrap = document.querySelector<HTMLElement>("[data-inspector-badge-wrap]");
  const badgeEl = document.querySelector<HTMLElement>("[data-inspector-badge]");
  const titleEl = document.querySelector<HTMLElement>("[data-inspector-title]");
  const subtitleEl = document.querySelector<HTMLElement>("[data-inspector-subtitle]");
  const periodNotice = document.querySelector<HTMLElement>("[data-period-notice]");
  const periodNoticeText = document.querySelector<HTMLElement>("[data-period-notice-text]");

  const viewPlace = document.querySelector<HTMLElement>("[data-view-place]");
  const placeRawName = document.querySelector<HTMLElement>("[data-place-raw-name]");
  const placePrecision = document.querySelector<HTMLElement>("[data-place-precision]");
  const placeCoords = document.querySelector<HTMLElement>("[data-place-coords]");
  const placeGeomProv = document.querySelector<HTMLElement>("[data-place-geom-provenance]");
  const placeNote = document.querySelector<HTMLElement>("[data-place-note]");
  const placeVisualWrap = document.querySelector<HTMLElement>("[data-place-visual-wrap]");
  const placeVisualDesc = document.querySelector<HTMLElement>("[data-place-visual-desc]");
  const placeConnectionsWrap = document.querySelector<HTMLElement>("[data-place-connections-wrap]");
  const placeConnectionsList = document.querySelector<HTMLElement>("[data-place-connections-list]");
  const placeEvidenceBtn = document.querySelector<HTMLButtonElement>("[data-place-evidence-btn]");

  // Dataset Context Selectors (Packet 7)
  const placeDatasetContextWrap = document.querySelector<HTMLElement>("[data-place-dataset-context-wrap]");
  const placeContextSummary = document.querySelector<HTMLElement>("[data-place-context-summary]");
  const placeContextRoles = document.querySelector<HTMLElement>("[data-place-context-roles]");
  const placeContextOverlapNote = document.querySelector<HTMLElement>("[data-place-context-overlap-note]");
  const placeContextBaselineNote = document.querySelector<HTMLElement>("[data-place-context-baseline-note]");
  const placeContextCounterpartsWrap = document.querySelector<HTMLElement>("[data-place-context-counterparts-wrap]");
  const placeContextPeriodLabel = document.querySelector<HTMLElement>("[data-place-context-period-label]");
  const placeContextCounterpartsList = document.querySelector<HTMLElement>("[data-place-context-counterparts-list]");
  const placeContextCaveat = document.querySelector<HTMLElement>("[data-place-context-caveat]");

  const viewShip = document.querySelector<HTMLElement>("[data-view-ship]");
  const shipRawName = document.querySelector<HTMLElement>("[data-ship-raw-name]");
  const shipTonnage = document.querySelector<HTMLElement>("[data-ship-tonnage]");
  const shipConstruction = document.querySelector<HTMLElement>("[data-ship-construction]");
  const shipOwnerRow = document.querySelector<HTMLElement>("[data-ship-owner-row]");
  const shipOwner = document.querySelector<HTMLElement>("[data-ship-owner]");
  const shipMasterRow = document.querySelector<HTMLElement>("[data-ship-master-row]");
  const shipMaster = document.querySelector<HTMLElement>("[data-ship-master]");
  const shipFleetRow = document.querySelector<HTMLElement>("[data-ship-fleet-row]");
  const shipFleet = document.querySelector<HTMLElement>("[data-ship-fleet]");
  const shipVoyage = document.querySelector<HTMLElement>("[data-ship-voyage]");
  const shipCaptureRow = document.querySelector<HTMLElement>("[data-ship-capture-row]");
  const shipCapture = document.querySelector<HTMLElement>("[data-ship-capture]");
  const shipRegisterRow = document.querySelector<HTMLElement>("[data-ship-register-row]");
  const shipRegister = document.querySelector<HTMLElement>("[data-ship-register]");
  const shipCrewSection = document.querySelector<HTMLElement>("[data-ship-crew-section]");
  const shipCrewTbody = document.querySelector<HTMLElement>("[data-ship-crew-tbody]");
  const shipUpstreamRef = document.querySelector<HTMLElement>("[data-ship-upstream-ref]");
  const shipFleetContext = document.querySelector<HTMLElement>("[data-ship-fleet-context]");
  const fleetTitle = document.querySelector<HTMLElement>("[data-fleet-title]");
  const fleetCommander = document.querySelector<HTMLElement>("[data-fleet-commander]");
  const fleetRoute = document.querySelector<HTMLElement>("[data-fleet-route]");
  const fleetEvidenceBtn = document.querySelector<HTMLButtonElement>("[data-fleet-evidence-btn]");
  const shipConnectionsWrap = document.querySelector<HTMLElement>("[data-ship-connections-wrap]");
  const shipConnectionsList = document.querySelector<HTMLElement>("[data-ship-connections-list]");
  const shipEvidenceBtn = document.querySelector<HTMLButtonElement>("[data-ship-evidence-btn]");

  // Recorded Goods Selectors (Packet 6)
  const shipGoodsSection = document.querySelector<HTMLElement>("[data-ship-goods-section]");
  const shipGoodsValueBanner = document.querySelector<HTMLElement>("[data-ship-goods-value-banner]");
  const shipGoodsTotalValue = document.querySelector<HTMLElement>("[data-ship-goods-total-value]");
  const shipGoodsSummaryBox = document.querySelector<HTMLElement>("[data-ship-goods-summary-box]");
  const shipGoodsSummaryText = document.querySelector<HTMLElement>("[data-ship-goods-summary-text]");
  const shipGoodsDiscrepancyNote = document.querySelector<HTMLElement>("[data-ship-goods-discrepancy-note]");
  const shipGoodsBadges = document.querySelector<HTMLElement>("[data-ship-goods-badges]");
  const shipGoodsConsigneesNote = document.querySelector<HTMLElement>("[data-ship-goods-consignees-note]");
  const shipGoodsConsigneesText = document.querySelector<HTMLElement>("[data-ship-goods-consignees-text]");
  const shipGoodsMeasureNote = document.querySelector<HTMLElement>("[data-ship-goods-measure-note]");
  const shipGoodsMeasureText = document.querySelector<HTMLElement>("[data-ship-goods-measure-text]");
  const shipGoodsEvidenceBtn = document.querySelector<HTMLButtonElement>("[data-ship-goods-evidence-btn]");

  // Privateering Encounter Selectors (Packet 11)
  const shipPrivateeringSection = document.querySelector<HTMLElement>("[data-ship-privateering-section]");
  const privateeringEngagement = document.querySelector<HTMLElement>("[data-privateering-engagement]");
  const privateeringResistance = document.querySelector<HTMLElement>("[data-privateering-resistance]");
  const privateeringPlunder = document.querySelector<HTMLElement>("[data-privateering-plunder]");
  const privateeringLinkageWrap = document.querySelector<HTMLElement>("[data-privateering-linkage-wrap]");
  const privateeringLinkageState = document.querySelector<HTMLElement>("[data-privateering-linkage-state]");
  const privateeringLinkageNote = document.querySelector<HTMLElement>("[data-privateering-linkage-note]");
  const privateeringPetition = document.querySelector<HTMLElement>("[data-privateering-petition]");
  const privateeringUpstreamNote = document.querySelector<HTMLElement>("[data-privateering-upstream-note]");
  const privateeringEvidenceBtn = document.querySelector<HTMLButtonElement>("[data-privateering-evidence-btn]");

  const viewEvent = document.querySelector<HTMLElement>("[data-view-event]");
  const eventDate = document.querySelector<HTMLElement>("[data-event-date]");
  const eventKind = document.querySelector<HTMLElement>("[data-event-kind]");
  const eventPlace = document.querySelector<HTMLElement>("[data-event-place]");
  const eventSummary = document.querySelector<HTMLElement>("[data-event-summary]");
  const eventConnectionsWrap = document.querySelector<HTMLElement>("[data-event-connections-wrap]");
  const eventConnectionsList = document.querySelector<HTMLElement>("[data-event-connections-list]");
  const eventEvidenceBtn = document.querySelector<HTMLButtonElement>("[data-event-evidence-btn]");

  const viewVoyage = document.querySelector<HTMLElement>("[data-view-voyage]");
  const voyageOrigin = document.querySelector<HTMLElement>("[data-voyage-origin]");
  const voyageDest = document.querySelector<HTMLElement>("[data-voyage-destination]");
  const voyageCount = document.querySelector<HTMLElement>("[data-voyage-count]");
  const voyageVesselsList = document.querySelector<HTMLElement>("[data-voyage-vessels-list]");

  const viewPerson = document.querySelector<HTMLElement>("[data-view-person]");
  const personRole = document.querySelector<HTMLElement>("[data-person-role]");
  const personActiveYears = document.querySelector<HTMLElement>("[data-person-active-years]");
  const personResolutionStatus = document.querySelector<HTMLElement>("[data-person-resolution-status]");
  const personNotes = document.querySelector<HTMLElement>("[data-person-notes]");
  const personVoyagesList = document.querySelector<HTMLElement>("[data-person-voyages-list]");
  const personEvidenceBtn = document.querySelector<HTMLButtonElement>("[data-person-evidence-btn]");

  let entitiesCache: PublishedEntities | null = null;
  let routesCache: PublishedRouteFeatureCollection | null = null;
  let eventsCache: PublishedEvent[] | null = null;
  let sourcesCache: PublishedSources | null = null;
  let datasetContextCache: PublishedDatasetContext | null = null;
  let currentReturnTarget: HTMLElement | null = null;
  let activeTimeFilter = timeFilterStore.get();
  let lastInspectorModality: "pointer" | "keyboard" = "pointer";
  window.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        lastInspectorModality = "keyboard";
      }
    },
    { capture: true, signal }
  );

  window.addEventListener(
    "mousedown",
    () => {
      lastInspectorModality = "pointer";
    },
    { capture: true, signal }
  );

  let coreRequest: Promise<void> | null = null;
  let sourceRequest: Promise<void> | null = null;
  function loadData(): Promise<void> {
    if (!coreRequest) coreRequest = (async () => {
      const [entities, routes, events, context] = await Promise.all([
        loadPublishedEntities(), loadPublishedRoutes(), loadPublishedEvents(),
        loadPublishedJson<PublishedDatasetContext>("dataset_context").catch(() => null),
      ]);
      entitiesCache = entities;
      routesCache = routes;
      eventsCache = Array.isArray(events) ? events : events.events;
      datasetContextCache = context;
    })().catch((error) => { coreRequest = null; throw error; });
    return coreRequest;
  }
  function loadSources(): Promise<void> {
    if (!sourceRequest) sourceRequest = loadPublishedSources().then((sources) => {
      sourcesCache = sources;
    }).catch((error) => { sourceRequest = null; throw error; });
    return sourceRequest;
  }

  function humanizePrecision(prec: string): string {
    switch (prec) {
      case "colony_or_island":
        return "Colony / Island reference";
      case "populated_place":
        return "Settlement / Populated place";
      case "port_city":
        return "Port city";
      case "port_town":
        return "Port town";
      case "province_or_region":
        return "Province / Region reference";
      case "modern_navigation_reference_coordinate":
        return "Modern coordinate reference";
      case "modern_generalized_navigation_reference":
        return "Modern regional centroid";
      default:
        return prec.replace(/_/g, " ");
    }
  }

  function humanizeDate(raw: string, cal?: string): string {
    if (!raw) return "Unrecorded date";
    const [y, m, d] = raw.split("-");
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let out = raw;
    if (y && m && d) {
      const mIdx = parseInt(m, 10) - 1;
      const mName = months[mIdx] || m;
      out = `${raw} (${parseInt(d, 10)} ${mName} ${y})`;
    } else if (y && m) {
      const mIdx = parseInt(m, 10) - 1;
      const mName = months[mIdx] || m;
      out = `${raw} (${mName} ${y})`;
    }
    if (cal) out += ` · ${cal}`;
    return out;
  }

  function createRelationshipRow(
    type: "LOCATION" | "VESSEL" | "EVENT" | "ROUTE" | "PERSON",
    role: string,
    label: string,
    kind: "port" | "ship" | "event" | "voyage" | "person",
    id: string
  ): HTMLElement {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "inspector-rel-row";
    btn.setAttribute("data-selection-kind", kind);
    btn.setAttribute("data-selection-id", id);

    const typeSpan = document.createElement("span");
    typeSpan.className = "inspector-rel-type";
    typeSpan.textContent = type;

    const contentSpan = document.createElement("span");
    contentSpan.className = "inspector-rel-content";

    const roleSpan = document.createElement("span");
    roleSpan.className = "inspector-rel-role";
    roleSpan.textContent = role;

    const sepSpan = document.createElement("span");
    sepSpan.className = "inspector-rel-sep";
    sepSpan.textContent = " · ";

    const labelSpan = document.createElement("span");
    labelSpan.className = "inspector-rel-label";
    labelSpan.textContent = label;

    contentSpan.append(roleSpan, sepSpan, labelSpan);
    btn.append(typeSpan, contentSpan);
    btn.addEventListener("click", () => {
      const modality = lastInspectorModality;
      recordSelectionTrigger({
        origin: "inspector_connection",
        modality,
        returnTarget: btn,
      });
      lastInspectorModality = "pointer";
      selectionStore.set({ kind, id });
    });
    return btn;
  }

  function checkPeriodFocus(years?: number | number[] | null) {
    if (!periodNotice || !periodNoticeText) return;
    if (activeTimeFilter.id !== "all") {
      if (Array.isArray(years)) {
        if (years.length > 0) {
          const hasMemberInFocus = years.some(
            (y) => y >= activeTimeFilter.startYear && y <= activeTimeFilter.endYear
          );
          if (!hasMemberInFocus) {
            periodNotice.hidden = false;
            periodNoticeText.textContent = `Outside current period focus (${activeTimeFilter.label})`;
            return;
          }
        }
      } else if (typeof years === "number") {
        if (years < activeTimeFilter.startYear || years > activeTimeFilter.endYear) {
          periodNotice.hidden = false;
          periodNoticeText.textContent = `Outside current period focus (${activeTimeFilter.label})`;
          return;
        }
      }
    }
    periodNotice.hidden = true;
  }

  function renderPlace(placeId: string) {
    if (!entitiesCache) return;
    const place = entitiesCache.places.find((p) => p.id === placeId);
    if (!place) return;

    checkPeriodFocus(null);

    if (kickerEl) kickerEl.textContent = "Geographic Place";
    if (badgeWrap && badgeEl) {
      badgeWrap.hidden = false;
      badgeEl.textContent = "Documented";
      badgeEl.setAttribute("data-evidence-state", "documented");
    }
    if (titleEl) titleEl.textContent = place.canonical_name;
    if (subtitleEl) subtitleEl.textContent = `${place.region} · Modern coordinates for navigation`;

    if (placeRawName) {
      if (place.endonym && place.endonym !== place.canonical_name) {
        placeRawName.textContent = `${place.raw_source_name} (Endonym: ${place.endonym})`;
      } else {
        placeRawName.textContent = place.raw_source_name;
      }
    }
    if (placePrecision) placePrecision.textContent = humanizePrecision(place.geographic_precision);
    if (placeCoords) placeCoords.textContent = formatCoordinates(place.coordinates[0], place.coordinates[1]);
    if (placeGeomProv) placeGeomProv.textContent = humanizePrecision(place.geometry_provenance);
    if (placeNote) placeNote.textContent = place.notes || "";

    // Show visual card exclusively for Jamaica and Port Royal
    if (placeVisualWrap) {
      if (place.id === "place_jamaica" || place.id === "place_port_royal") {
        placeVisualWrap.hidden = false;
        if (placeVisualDesc) {
          placeVisualDesc.textContent =
            place.id === "place_port_royal"
              ? 'Contemporary engraved chart explicitly depicting and labeling "Port Royall" on the harbor spit.'
              : "Contemporary engraved chart depicting the 17th-century island parishes and settlements.";
        }
      } else {
        placeVisualWrap.hidden = true;
      }
    }

    // Render Place Connections
    if (placeConnectionsWrap && placeConnectionsList) {
      placeConnectionsList.replaceChildren();
      const connectedRoutes = routesCache?.features.filter(
        (r) => r.properties.origin_place_id === place.id || r.properties.destination_place_id === place.id
      ) || [];
      const connectedEvents = eventsCache?.filter((ev) => ev.place_id === place.id) || [];

      // Also check for documented vessels departing/recorded at this place without aggregated routes
      const directVesselOccs = entitiesCache.ship_occurrences.filter((occ) => {
        const isAtPlace =
          occ.recorded_origin_place_id === place.id ||
          occ.recorded_voyage_origin === place.canonical_name ||
          occ.recorded_voyage_origin === place.raw_source_name ||
          (place.id === "place_cadiz" && (occ.recorded_voyage_origin === "Cadiz" || occ.recorded_origin_descriptor_raw === "van Cadiz"));
        if (!isAtPlace) return false;
        const edge = entitiesCache?.entity_resolution_edges.find((e) => e.occurrence_id === occ.id);
        const targetShipId = edge?.target_entity_id;
        return !connectedRoutes.some((r) => r.properties.constituent_vessel_ids.includes(targetShipId || ""));
      });

      if (connectedRoutes.length > 0 || connectedEvents.length > 0 || directVesselOccs.length > 0) {
        placeConnectionsWrap.hidden = false;

        for (const r of connectedRoutes) {
          const isOrigin = r.properties.origin_place_id === place.id;
          const otherPlace = entitiesCache.places.find((p) => p.id === (isOrigin ? r.properties.destination_place_id : r.properties.origin_place_id));
          const role = isOrigin ? `Voyage to ${otherPlace?.canonical_name || "Destination"}` : `Voyage from ${otherPlace?.canonical_name || "Origin"}`;
          for (const vid of r.properties.constituent_vessel_ids) {
            const ship = entitiesCache.ships.find((s) => s.id === vid);
            const shipName = ship ? ship.canonical_name : vid;
            // Look up individual archival route to get exact member year
            const archivalRoute = routesCache?.archival_routes?.find(
              (ar) => ar.vessel_id === vid && (ar.origin_place_id === r.properties.origin_place_id && ar.destination_place_id === r.properties.destination_place_id)
            );
            const vesselYear = archivalRoute?.associated_record_year || r.properties.associated_record_year;
            placeConnectionsList.appendChild(
              createRelationshipRow("VESSEL", role, `${shipName} (${vesselYear})`, "ship", vid)
            );
          }
        }

        const seenShipIds = new Set();
        for (const occ of directVesselOccs) {
          const edge = entitiesCache.entity_resolution_edges.find((e) => e.occurrence_id === occ.id);
          if (edge && !seenShipIds.has(edge.target_entity_id)) {
            seenShipIds.add(edge.target_entity_id);
            const ship = entitiesCache.ships.find((s) => s.id === edge.target_entity_id);
            const shipName = ship ? ship.canonical_name : occ.raw_name;
            const yearStr = occ.recorded_year ? ` (${occ.recorded_year})` : "";
            placeConnectionsList.appendChild(
              createRelationshipRow("VESSEL", "Recorded Origin", `${shipName}${yearStr}`, "ship", edge.target_entity_id)
            );
          }
        }

        for (const ev of connectedEvents) {
          const role = ev.kind.replace(/_/g, " ");
          placeConnectionsList.appendChild(
            createRelationshipRow("EVENT", role, `${ev.title} (${ev.date})`, "event", ev.id)
          );
        }
      } else {
        placeConnectionsWrap.hidden = true;
      }
    }

    if (placeEvidenceBtn) {
      placeEvidenceBtn.onclick = () => {
        window.dispatchEvent(
          new CustomEvent("cc:open-source", {
            detail: {
              assertionIds: place.source_assertion_ids,
              triggerEl: placeEvidenceBtn,
            },
          })
        );
      };
    }

    renderDatasetContext(place.id, activeTimeFilter);

    viewPlace?.removeAttribute("hidden");
    viewShip?.setAttribute("hidden", "");
    viewEvent?.setAttribute("hidden", "");
    viewVoyage?.setAttribute("hidden", "");
    viewPerson?.setAttribute("hidden", "");
  }

  function renderDatasetContext(placeId: string, filterState: TimeFilterState) {
    if (!placeDatasetContextWrap) return;
    if (!datasetContextCache || !datasetContextCache.places) {
      placeDatasetContextWrap.hidden = true;
      return;
    }
    const ctx = datasetContextCache.places[placeId];
    if (!ctx) {
      placeDatasetContextWrap.hidden = true;
      return;
    }

    placeDatasetContextWrap.hidden = false;

    if (ctx.status === "unmapped" || !ctx.crespo_lugar_id || !ctx.periods) {
      if (placeContextSummary) {
        placeContextSummary.textContent = "No reviewed Crespo place mapping is currently established for this place. Dataset context is unavailable.";
      }
      if (placeContextRoles) placeContextRoles.hidden = true;
      if (placeContextOverlapNote) placeContextOverlapNote.hidden = true;
      if (placeContextBaselineNote) placeContextBaselineNote.hidden = true;
      if (placeContextCounterpartsWrap) placeContextCounterpartsWrap.hidden = true;
      if (placeContextCaveat) {
        const caveat = ctx.coverage_caveat?.trim() || "";
        placeContextCaveat.textContent = caveat;
        placeContextCaveat.hidden = !caveat || caveat === placeContextSummary?.textContent;
      }
      return;
    }

    // Mapped place
    const periodData = ctx.periods[filterState.id] || ctx.periods["all"];
    const periodLabel = periodData.period_label;

    if (placeContextSummary) {
      if (periodData.total_records === 0) {
        placeContextSummary.textContent = `No Crespo vessel records record ${ctx.canonical_name} as an endpoint in ${periodLabel}.`;
        if (placeContextRoles) placeContextRoles.hidden = true;
        if (placeContextOverlapNote) placeContextOverlapNote.hidden = true;
      } else {
        const recordWord = periodData.total_records === 1 ? "Crespo vessel record documents" : "Crespo vessel records document";
        placeContextSummary.textContent = `${periodData.total_records.toLocaleString()} ${recordWord} ${ctx.canonical_name} as an endpoint in ${periodLabel}.`;

        if (placeContextRoles) {
          placeContextRoles.hidden = false;
          placeContextRoles.textContent = `Recorded as departure: ${periodData.records_with_origin.toLocaleString()} · arrival: ${periodData.records_with_destination.toLocaleString()}.`;
        }

        if (placeContextOverlapNote) {
          if (periodData.both_endpoint_records > 0) {
            placeContextOverlapNote.hidden = false;
            const recWord = periodData.both_endpoint_records === 1 ? "record lists" : "records list";
            placeContextOverlapNote.textContent = `${periodData.both_endpoint_records.toLocaleString()} ${recWord} ${ctx.canonical_name} at both endpoints; role counts therefore overlap.`;
          } else {
            placeContextOverlapNote.hidden = true;
          }
        }
      }
    }

    // Baseline note if active filter is not "all"
    if (placeContextBaselineNote) {
      if (filterState.id !== "all") {
        const allData = ctx.periods["all"];
        const allTotal = allData ? allData.total_records : 0;
        const recWord = allTotal === 1 ? "record" : "records";
        placeContextBaselineNote.hidden = false;
        placeContextBaselineNote.textContent = `Overall dataset baseline (1650–1730): ${allTotal.toLocaleString()} Crespo vessel ${recWord}.`;
      } else {
        placeContextBaselineNote.hidden = true;
      }
    }

    // Counterparts list
    if (placeContextCounterpartsWrap && placeContextCounterpartsList) {
      if (periodData.top_counterparts && periodData.top_counterparts.length > 0) {
        placeContextCounterpartsWrap.hidden = false;
        if (placeContextPeriodLabel) placeContextPeriodLabel.textContent = periodLabel;
        placeContextCounterpartsList.replaceChildren();

        for (const cp of periodData.top_counterparts) {
          const li = document.createElement("li");
          li.className = "inspector-dataset-context-item";

          const labelSpan = document.createElement("span");
          labelSpan.className = "inspector-dataset-context-item__name";
          labelSpan.textContent = cp.source_label;

          const countSpan = document.createElement("span");
          countSpan.className = "inspector-dataset-context-item__count inspector-mono";

          let roleDetails = "";
          if (cp.recorded_as_destination > 0 && cp.recorded_as_origin > 0) {
            roleDetails = ` (${cp.recorded_as_destination} outbound, ${cp.recorded_as_origin} inbound)`;
          } else if (cp.recorded_as_destination > 0) {
            roleDetails = " (outbound destination)";
          } else if (cp.recorded_as_origin > 0) {
            roleDetails = " (inbound origin)";
          }

          const recWord = cp.total_records === 1 ? "record" : "records";
          countSpan.textContent = `${cp.total_records.toLocaleString()} ${recWord}${roleDetails}`;

          li.appendChild(labelSpan);
          li.appendChild(countSpan);
          placeContextCounterpartsList.appendChild(li);
        }
      } else {
        placeContextCounterpartsWrap.hidden = true;
      }
    }

    // Persistent caveat
    if (placeContextCaveat) {
      placeContextCaveat.textContent = ctx.coverage_caveat;
      placeContextCaveat.hidden = !ctx.coverage_caveat;
    }
  }

  function renderShip(shipId: string) {
    if (!entitiesCache) return;
    const ship = entitiesCache.ships.find((s) => s.id === shipId);
    if (!ship) return;
    const occId = ship.occurrence_ids[0];
    const shipOcc = entitiesCache.ship_occurrences.find((o) => o.id === occId);
    const crewOccs = entitiesCache.crew_occurrences.filter((c) => c.ship_occurrence_id === occId);
    const sr = sourcesCache?.source_records.find((r) => r.id === shipOcc?.source_record_id);
    const primarySourceId = sr?.source_id || "src_imlm_ukda_852135";

    const capYearMatch = shipOcc?.recorded_capture_date?.match(/^(\d{4})/);
    const capYear = capYearMatch ? parseInt(capYearMatch[1], 10) : shipOcc?.recorded_year || null;
    checkPeriodFocus(capYear);

    if (kickerEl) kickerEl.textContent = ship.evidence_state === "probable_match" ? "Vessel" : "Documented Vessel";
    if (badgeWrap && badgeEl) {
      badgeWrap.hidden = false;
      const shipEvState = ship.evidence_state || "documented";
      badgeEl.textContent = shipEvState === "probable_match" ? "Probable Match" : "Documented";
      badgeEl.setAttribute("data-evidence-state", shipEvState);
    }
    if (titleEl) titleEl.textContent = ship.canonical_name;
    if (subtitleEl) {
      if (ship.disambiguation_display) {
        subtitleEl.textContent = `${ship.disambiguation_display} · ${ship.reported_burden_display}`;
      } else if (ship.construction_display) {
        subtitleEl.textContent = `${ship.reported_burden_display} · ${ship.construction_display}`;
      } else {
        subtitleEl.textContent = ship.reported_burden_display;
      }
    }

    if (shipRawName) shipRawName.textContent = shipOcc ? shipOcc.raw_name : ship.canonical_name;
    if (shipTonnage) shipTonnage.textContent = ship.reported_burden_display;
    if (shipConstruction) {
      if (ship.construction_display && ship.construction_display !== "Unknown") {
        shipConstruction.parentElement?.removeAttribute("hidden");
        shipConstruction.textContent = ship.construction_display;
      } else {
        shipConstruction.parentElement?.setAttribute("hidden", "");
      }
    }

    if (shipOwnerRow) {
      if (ship.owner_display) {
        shipOwnerRow.hidden = false;
        if (shipOwner) shipOwner.textContent = `Owner resident at ${ship.owner_display}`;
      } else {
        shipOwnerRow.hidden = true;
      }
    }

    if (shipMasterRow && shipMaster) {
      if (ship.master_display) {
        shipMasterRow.hidden = false;
        shipMaster.replaceChildren();

        // Check if master resolves to a canonical person
        const masterOcc = entitiesCache.person_occurrences?.find(
          (po) =>
            (occId && po.ship_occurrence_id === occId) ||
            (po.raw_name && shipOcc?.recorded_master && po.raw_name === shipOcc.recorded_master)
        );
        const personEdge = masterOcc
          ? entitiesCache.entity_resolution_edges.find((e) => e.occurrence_id === masterOcc.id)
          : null;
        const linkedPerson = personEdge
          ? entitiesCache.persons?.find((p) => p.id === personEdge.target_entity_id)
          : (shipOcc?.recorded_master === "Bartolomé Antonio Garrote"
              ? entitiesCache.persons?.find((p) => p.id === "person_bartolome_antonio_garrote")
              : null);

        if (linkedPerson) {
          const personBtn = document.createElement("button");
          personBtn.type = "button";
          personBtn.className = "inspector-link-btn";
          const stateLabel = linkedPerson.evidence_state === "probable_match" ? " (Probable Match ↗)" : " (Documented ↗)";
          personBtn.textContent = `Master: ${linkedPerson.canonical_name}${stateLabel}`;
          personBtn.addEventListener("click", () => {
            const modality = lastInspectorModality;
            recordSelectionTrigger({
              origin: "inspector_connection",
              modality,
              returnTarget: personBtn,
            });
            lastInspectorModality = "pointer";
            selectionStore.set({ kind: "person", id: linkedPerson.id });
          });
          shipMaster.appendChild(personBtn);
        } else {
          shipMaster.textContent = ship.master_display;
        }
      } else {
        shipMasterRow.hidden = true;
      }
    }

    if (shipFleetRow) {
      if (ship.fleet_display) {
        shipFleetRow.hidden = false;
        if (shipFleet) shipFleet.textContent = ship.fleet_display;
      } else {
        shipFleetRow.hidden = true;
      }
    }

    const shipVoyageLabel = document.querySelector<HTMLElement>("[data-ship-voyage-label]");
    if (shipVoyageLabel) {
      shipVoyageLabel.textContent = (shipOcc?.recorded_origin_descriptor_raw || shipOcc?.recorded_origin_place_id) && !shipOcc?.recorded_voyage_destination
        ? "Recorded Origin"
        : "Recorded Voyage";
    }
    if (shipVoyage) shipVoyage.textContent = ship.voyage_display;

    if (shipCaptureRow) {
      if (ship.capture_display) {
        shipCaptureRow.hidden = false;
        if (shipCapture) shipCapture.textContent = ship.capture_display;
      } else {
        shipCaptureRow.hidden = true;
      }
    }

    if (shipRegisterRow) {
      if (ship.register_display) {
        shipRegisterRow.hidden = false;
        if (shipRegister) shipRegister.textContent = ship.register_display;
      } else {
        shipRegisterRow.hidden = true;
      }
    }

    if (shipCrewSection && shipCrewTbody) {
      shipCrewTbody.replaceChildren();
      if (crewOccs.length > 0) {
        shipCrewSection.hidden = false;
        for (const crew of crewOccs) {
          const tr = document.createElement("tr");
          const tdName = document.createElement("td");
          tdName.textContent = `${crew.first_name} ${crew.last_name}${crew.age_as_recorded ? ` (${crew.age_as_recorded})` : ""}`;

          const tdRank = document.createElement("td");
          tdRank.textContent = crew.rank_as_recorded;

          const tdOrigin = document.createElement("td");
          tdOrigin.textContent = crew.birthplace_as_recorded || crew.residence_as_recorded || "Unrecorded";

          const tdSub = document.createElement("td");
          tdSub.textContent = crew.subject_of_as_recorded || "Unrecorded";

          tr.append(tdName, tdRank, tdOrigin, tdSub);
          shipCrewTbody.appendChild(tr);
        }
      } else {
        shipCrewSection.hidden = true;
      }
    }

    // Structured Fleet Convoy Context
    if (shipFleetContext) {
      if (shipOcc?.fleet_convoy) {
        const fc = shipOcc.fleet_convoy;
        shipFleetContext.hidden = false;
        if (fleetTitle) fleetTitle.textContent = fc.fleet_title;
        if (fleetCommander) fleetCommander.textContent = fc.commander_display;
        if (fleetRoute) fleetRoute.textContent = `${fc.fleet_origin} → ${fc.fleet_destination} (${fc.year})`;
        if (fleetEvidenceBtn) {
          fleetEvidenceBtn.onclick = () => {
            window.dispatchEvent(
              new CustomEvent("cc:open-source", {
                detail: {
                  sourceId: "src_crespo_dyncoopnet",
                  assertionIds: fc.assertion_ids,
                  triggerEl: fleetEvidenceBtn,
                },
              })
            );
          };
        }
      } else {
        shipFleetContext.hidden = true;
      }
    }

    // Recorded Goods Section (Packet 6)
    if (shipGoodsSection) {
      const linkedGoods = (entitiesCache as any).goods_occurrences?.filter(
        (g: any) => g.ship_occurrence_id === occId
      ) || [];

      if (linkedGoods.length > 0 || shipOcc?.recorded_goods_summary) {
        shipGoodsSection.hidden = false;

        // Goods value banner (e.g. 4501 prize valuation)
        if (shipGoodsValueBanner && shipGoodsTotalValue) {
          if (shipOcc?.recorded_goods_value_text) {
            shipGoodsValueBanner.hidden = false;
            shipGoodsTotalValue.textContent = shipOcc.recorded_goods_value_text;
          } else {
            shipGoodsValueBanner.hidden = true;
          }
        }

        // Goods summary box
        if (shipGoodsSummaryBox && shipGoodsSummaryText) {
          if (shipOcc?.recorded_goods_summary) {
            shipGoodsSummaryBox.hidden = false;
            shipGoodsSummaryText.textContent = shipOcc.recorded_goods_summary;
            if (shipGoodsDiscrepancyNote) {
              shipGoodsDiscrepancyNote.hidden = (ship.id !== "ship_crespo_5890");
            }
          } else {
            shipGoodsSummaryBox.hidden = true;
          }
        }

        // Render Grouped Badges
        if (shipGoodsBadges) {
          shipGoodsBadges.replaceChildren();

          if (ship.id === "ship_crespo_5890") {
            const card = document.createElement("div");
            card.className = "inspector-goods-card";
            card.innerHTML = `
              <div class="inspector-goods-card__header">
                <span class="inspector-goods-facet-tag">cacao</span>
                <strong class="inspector-goods-title">Cacao</strong>
              </div>
              <div class="inspector-goods-card__stats">
                <span class="inspector-goods-line-count">135 recorded goods lines</span>
                <span class="inspector-goods-quantities">(3,930 Fanegas, 2,026 Libras itemized)</span>
              </div>
            `;
            shipGoodsBadges.appendChild(card);

            const distinctConsignees = Array.from(new Set(
              linkedGoods.map((g: any) => g.recorded_consignee?.trim()).filter(Boolean)
            ));
            if (shipGoodsConsigneesNote && shipGoodsConsigneesText) {
              shipGoodsConsigneesNote.hidden = false;
              const preview = distinctConsignees.slice(0, 5).join(", ");
              const remaining = distinctConsignees.length - 5;
              shipGoodsConsigneesText.textContent = `${distinctConsignees.length} distinct nonblank consignees recorded in Seville, including: ${preview}, and ${remaining} others.`;
            }
            if (shipGoodsMeasureNote) shipGoodsMeasureNote.hidden = true;

          } else if (ship.id === "ship_crespo_4493") {
            const byCommodity: Record<string, any[]> = {};
            for (const g of linkedGoods) {
              const label = g.recorded_commodity_label;
              if (!byCommodity[label]) byCommodity[label] = [];
              byCommodity[label].push(g);
            }

            for (const [label, items] of Object.entries(byCommodity)) {
              const card = document.createElement("div");
              card.className = "inspector-goods-card";
              const facetTag = items[0].commodity_facet ? `<span class="inspector-goods-facet-tag">${items[0].commodity_facet}</span>` : "";
              const measuresText = items.map((it: any) => `${it.raw_quantity.toLocaleString()} ${it.recorded_measure_label || "units"}`).join(", ");
              card.innerHTML = `
                <div class="inspector-goods-card__header">
                  ${facetTag}
                  <strong class="inspector-goods-title">${label}</strong>
                </div>
                <div class="inspector-goods-card__stats">
                  <span class="inspector-goods-quantities">${measuresText}</span>
                </div>
              `;
              shipGoodsBadges.appendChild(card);
            }

            if (shipGoodsConsigneesNote) shipGoodsConsigneesNote.hidden = true;
            if (shipGoodsMeasureNote && shipGoodsMeasureText) {
              shipGoodsMeasureNote.hidden = false;
              shipGoodsMeasureText.textContent = "Source measurement caveat: Dutch container measure 'vat' in the vessel summary is keyed as ID 95 'Vara' in the source database measure reference table.";
            }

          } else if (ship.id === "ship_crespo_4501") {
            for (const g of linkedGoods) {
              const card = document.createElement("div");
              card.className = "inspector-goods-card inspector-goods-card--unitemized";
              const facetTag = g.commodity_facet ? `<span class="inspector-goods-facet-tag">${g.commodity_facet}</span>` : "";
              card.innerHTML = `
                <div class="inspector-goods-card__header">
                  ${facetTag}
                  <strong class="inspector-goods-title">${g.recorded_commodity_label}</strong>
                </div>
                <div class="inspector-goods-card__stats">
                  <span class="inspector-goods-unitemized-note">Quantity unitemized</span>
                </div>
              `;
              shipGoodsBadges.appendChild(card);
            }
            if (shipGoodsConsigneesNote) shipGoodsConsigneesNote.hidden = true;
            if (shipGoodsMeasureNote && shipGoodsMeasureText) {
              shipGoodsMeasureNote.hidden = false;
              shipGoodsMeasureText.textContent = "Prize capture context: Goods seized off Puerto Rico by corsair Manuel Duarte. Valuation recorded as vessel lump sum.";
            }
          }
        }

        if (shipGoodsEvidenceBtn) {
          const allGoodsAstIds = Array.from(new Set(
            linkedGoods.flatMap((g: any) => g.assertion_ids || [])
          ));
          shipGoodsEvidenceBtn.onclick = () => {
            window.dispatchEvent(
              new CustomEvent("cc:open-source", {
                detail: {
                  sourceId: "src_crespo_dyncoopnet",
                  assertionIds: allGoodsAstIds,
                  triggerEl: shipGoodsEvidenceBtn,
                },
              })
            );
          };
        }
      } else {
        shipGoodsSection.hidden = true;
      }
    }

    // Privateering Encounter & Petition Section (Packet 11)
    if (shipPrivateeringSection) {
      if (ship.privateering_engagement) {
        const pe = ship.privateering_engagement;
        shipPrivateeringSection.hidden = false;
        if (pe.cross_archive_resolution_state) {
          if (privateeringLinkageWrap) privateeringLinkageWrap.hidden = false;
          if (privateeringLinkageState) {
            privateeringLinkageState.textContent =
              pe.cross_archive_resolution_state === "probable_match" ? "Probable match" : pe.cross_archive_resolution_state;
            privateeringLinkageState.setAttribute("data-evidence-state", pe.cross_archive_resolution_state);
          }
          if (privateeringLinkageNote) {
            privateeringLinkageNote.textContent = pe.cross_archive_note || "";
            privateeringLinkageNote.hidden = !pe.cross_archive_note;
          }
        } else if (privateeringLinkageWrap) {
          privateeringLinkageWrap.hidden = true;
        }
        if (privateeringEngagement) privateeringEngagement.textContent = pe.engagement_display;
        if (privateeringResistance) privateeringResistance.textContent = pe.resistance_display;
        if (privateeringPlunder) privateeringPlunder.textContent = pe.plunder_display;
        if (privateeringPetition) privateeringPetition.textContent = pe.petition_display;
        if (privateeringUpstreamNote) {
          privateeringUpstreamNote.textContent = `Calendared Sept–Oct 1705 (${pe.calendar_ref}), citing Board of Trade Jamaica records (${pe.upstream_ref}).`;
        }
        if (privateeringEvidenceBtn) {
          privateeringEvidenceBtn.onclick = () => {
            window.dispatchEvent(
              new CustomEvent("cc:open-source", {
                detail: {
                  sourceId: pe.source_id,
                  assertionIds: pe.assertion_ids,
                  triggerEl: privateeringEvidenceBtn,
                },
              })
            );
          };
        }
      } else {
        shipPrivateeringSection.hidden = true;
      }
    }

    if (shipUpstreamRef) {
      if (sr?.source_id === "src_crespo_dyncoopnet") {
        shipUpstreamRef.textContent = `Upstream Archive: Archivo General de Indias (${sr.upstream_archive_reference || "PARES"})`;
      } else if (sr?.source_id === "src_na_2_22_24_sailing_letters") {
        shipUpstreamRef.textContent = `Upstream Archive: TNA High Court of Admiralty Prize Papers (via Nationaal Archief)`;
      } else {
        shipUpstreamRef.textContent = `Upstream Archive: TNA High Court of Admiralty Prize Papers`;
      }
    }

    if (shipConnectionsWrap && shipConnectionsList) {
      shipConnectionsList.replaceChildren();
      const connectedEdges = routesCache?.features.filter((r) =>
        r.properties.constituent_vessel_ids.includes(ship.id)
      ) || [];
      const connectedEvents = eventsCache?.filter((ev) => ev.vessel_id === ship.id) || [];

      // Connected persons (e.g. master, crew)
      const shipPersonOccs = entitiesCache.person_occurrences?.filter((po) => occId && po.ship_occurrence_id === occId) || [];
      const connectedPersons: { person: any; role: string }[] = [];
      for (const po of shipPersonOccs) {
        const edge = entitiesCache.entity_resolution_edges.find((e) => e.occurrence_id === po.id);
        if (edge) {
          const person = entitiesCache.persons?.find((p) => p.id === edge.target_entity_id);
          if (person && !connectedPersons.some((cp) => cp.person.id === person.id)) {
            connectedPersons.push({ person, role: po.role || "Master" });
          }
        }
      }

      // Check if voyage origin place exists without an aggregated route edge
      const unroutedOrigin = !connectedEdges.length && (shipOcc?.recorded_origin_place_id || shipOcc?.recorded_voyage_origin)
        ? entitiesCache.places.find(
            (p) =>
              p.id === shipOcc?.recorded_origin_place_id ||
              p.canonical_name === shipOcc?.recorded_voyage_origin ||
              p.raw_source_name === shipOcc?.recorded_voyage_origin ||
              (p.id === "place_cadiz" && shipOcc?.recorded_voyage_origin === "Cadiz")
          )
        : null;

      if (connectedEdges.length > 0 || connectedEvents.length > 0 || connectedPersons.length > 0 || unroutedOrigin) {
        shipConnectionsWrap.hidden = false;

        for (const edge of connectedEdges) {
          const originPlace = entitiesCache.places.find((p) => p.id === edge.properties.origin_place_id);
          const destPlace = entitiesCache.places.find((p) => p.id === edge.properties.destination_place_id);
          if (originPlace) {
            shipConnectionsList.appendChild(
              createRelationshipRow("LOCATION", "Voyage Origin", originPlace.canonical_name, "port", originPlace.id)
            );
          }
          if (destPlace) {
            shipConnectionsList.appendChild(
              createRelationshipRow("LOCATION", "Voyage Destination", destPlace.canonical_name, "port", destPlace.id)
            );
          }
        }

        if (unroutedOrigin) {
          shipConnectionsList.appendChild(
            createRelationshipRow("LOCATION", "Recorded Origin", unroutedOrigin.canonical_name, "port", unroutedOrigin.id)
          );
        }

        for (const cp of connectedPersons) {
          const roleTitle = cp.role.charAt(0).toUpperCase() + cp.role.slice(1);
          shipConnectionsList.appendChild(
            createRelationshipRow("PERSON", roleTitle, cp.person.canonical_name, "person", cp.person.id)
          );
        }

        for (const ev of connectedEvents) {
          const role = ev.kind.replace(/_/g, " ");
          shipConnectionsList.appendChild(
            createRelationshipRow("EVENT", role, `${ev.title} (${ev.date})`, "event", ev.id)
          );
        }
      } else {
        shipConnectionsWrap.hidden = true;
      }
    }

    if (shipEvidenceBtn) {
      shipEvidenceBtn.onclick = () => {
        const allAsts = [
          ...(shipOcc?.assertion_ids || []),
          ...crewOccs.flatMap((c) => c.assertion_ids),
          ...(ship.privateering_engagement?.assertion_ids || []),
        ];
        window.dispatchEvent(
          new CustomEvent("cc:open-source", {
            detail: {
              sourceId: primarySourceId,
              assertionIds: allAsts,
              triggerEl: shipEvidenceBtn,
            },
          })
        );
      };
    }

    viewShip?.removeAttribute("hidden");
    viewPlace?.setAttribute("hidden", "");
    viewEvent?.setAttribute("hidden", "");
    viewVoyage?.setAttribute("hidden", "");
    viewPerson?.setAttribute("hidden", "");
  }

  function renderEvent(eventId: string) {
    if (!eventsCache || !entitiesCache) return;
    const ev = eventsCache.find((e) => e.id === eventId);
    if (!ev) return;

    const evYearMatch = ev.date?.match(/^(\d{4})/);
    const evYear = evYearMatch ? parseInt(evYearMatch[1], 10) : null;
    checkPeriodFocus(evYear);

    if (kickerEl) kickerEl.textContent = "Historical Event";
    if (badgeWrap && badgeEl) {
      badgeWrap.hidden = false;
      badgeEl.textContent = ev.evidence_state === "contextual" ? "Contextual" : "Documented";
      badgeEl.setAttribute("data-evidence-state", ev.evidence_state);
    }
    if (titleEl) titleEl.textContent = ev.title;
    if (subtitleEl) subtitleEl.textContent = humanizeDate(ev.date, ev.calendar_system);

    if (eventDate) eventDate.textContent = humanizeDate(ev.date, ev.calendar_system);
    if (eventKind) eventKind.textContent = ev.kind.replace(/_/g, " ");

    const place = entitiesCache.places.find((p) => p.id === ev.place_id);
    if (eventPlace) eventPlace.textContent = place ? place.canonical_name : ev.place_id;
    if (eventSummary) eventSummary.textContent = ev.summary;

    if (eventConnectionsWrap && eventConnectionsList) {
      eventConnectionsList.replaceChildren();
      let hasConnections = false;

      if (place) {
        eventConnectionsList.appendChild(
          createRelationshipRow("LOCATION", "Event Location", place.canonical_name, "port", place.id)
        );
        hasConnections = true;
      }

      if (ev.vessel_id) {
        const ship = entitiesCache.ships.find((s) => s.id === ev.vessel_id);
        const shipName = ship ? ship.canonical_name : ev.vessel_id;
        eventConnectionsList.appendChild(
          createRelationshipRow("VESSEL", "Documented Vessel", shipName, "ship", ev.vessel_id)
        );
        hasConnections = true;
      }

      eventConnectionsWrap.hidden = !hasConnections;
    }

    if (eventEvidenceBtn) {
      eventEvidenceBtn.onclick = () => {
        window.dispatchEvent(
          new CustomEvent("cc:open-source", {
            detail: {
              sourceId: ev.sources[0],
              assertionIds: ev.assertion_ids,
              triggerEl: eventEvidenceBtn,
            },
          })
        );
      };
    }

    viewEvent?.removeAttribute("hidden");
    viewPlace?.setAttribute("hidden", "");
    viewShip?.setAttribute("hidden", "");
    viewVoyage?.setAttribute("hidden", "");
    viewPerson?.setAttribute("hidden", "");
  }

  function renderVoyage(routeGroupId: string) {
    if (!routesCache || !entitiesCache) return;

    const matchingRoutes = routesCache.features.filter(
      (r) => r.properties.route_group_id === routeGroupId || r.properties.id === routeGroupId
    );
    if (matchingRoutes.length === 0) return;

    const firstRoute = matchingRoutes[0];
    const origin = entitiesCache.places.find((p) => p.id === firstRoute.properties.origin_place_id);
    const dest = entitiesCache.places.find((p) => p.id === firstRoute.properties.destination_place_id);

    const filterActive = activeTimeFilter.id !== "all";
    const startY = activeTimeFilter.startYear;
    const endY = activeTimeFilter.endYear;

    const archivalRoutes = entitiesCache.routes || [];
    const constituentRouteObjs = archivalRoutes.filter((ar: any) =>
      firstRoute.properties.constituent_route_ids.includes(ar.id)
    );

    const activeMembers = filterActive
      ? constituentRouteObjs.filter(
          (ar: any) =>
            ar.associated_record_year &&
            ar.associated_record_year >= startY &&
            ar.associated_record_year <= endY
        )
      : constituentRouteObjs;

    checkPeriodFocus(firstRoute.properties.associated_record_year);

    if (kickerEl) kickerEl.textContent = "Route Connection";
    if (badgeWrap && badgeEl) {
      badgeWrap.hidden = false;
      badgeEl.textContent = "Documented";
      badgeEl.setAttribute("data-evidence-state", "documented");
    }

    const originName = origin?.canonical_name || firstRoute.properties.origin_place_id;
    const destName = dest?.canonical_name || firstRoute.properties.destination_place_id;

    if (titleEl) titleEl.textContent = `${originName} → ${destName}`;
    if (subtitleEl) {
      if (filterActive && firstRoute.properties.record_count > 1) {
        subtitleEl.textContent = `${activeMembers.length} of ${firstRoute.properties.record_count} documented voyages in current period focus (${activeTimeFilter.label})`;
      } else {
        subtitleEl.textContent = `${firstRoute.properties.record_count} documented vessel voyage${firstRoute.properties.record_count > 1 ? "s" : ""} in current corpus`;
      }
    }

    if (voyageOrigin) voyageOrigin.textContent = originName;
    if (voyageDest) voyageDest.textContent = destName;
    if (voyageCount) voyageCount.textContent = `${firstRoute.properties.record_count} vessel records`;

    if (voyageVesselsList) {
      voyageVesselsList.replaceChildren();
      for (const ar of constituentRouteObjs) {
        const ship = entitiesCache.ships.find((s) => s.id === ar.vessel_id);
        const shipName = ship ? ship.canonical_name : ar.vessel_id;
        const yearDisplay = ar.associated_record_year || "Unknown Year";
        const isOutOfPeriod = filterActive && (!ar.associated_record_year || ar.associated_record_year < startY || ar.associated_record_year > endY);
        const label = `${shipName} (${yearDisplay})${isOutOfPeriod ? " · Outside Focus" : ""}`;
        voyageVesselsList.appendChild(
          createRelationshipRow("VESSEL", "Documented Voyage", label, "ship", ar.vessel_id)
        );
      }
    }

    viewVoyage?.removeAttribute("hidden");
    viewPlace?.setAttribute("hidden", "");
    viewShip?.setAttribute("hidden", "");
    viewEvent?.setAttribute("hidden", "");
    viewPerson?.setAttribute("hidden", "");
  }

  function renderPerson(personId: string) {
    if (!entitiesCache) return;
    const person = entitiesCache.persons?.find((p) => p.id === personId);
    if (!person) return;

    checkPeriodFocus(
      person.member_occurrence_years ||
        (person.recorded_year_range
          ? [person.recorded_year_range[0], person.recorded_year_range[1]]
          : person.active_year_range
            ? [person.active_year_range[0], person.active_year_range[1]]
            : null)
    );

    if (kickerEl) kickerEl.textContent = "Maritime Actor";
    const state = person.evidence_state || "documented";
    if (badgeWrap && badgeEl) {
      badgeWrap.hidden = false;
      const stateLabel = state === "probable_match" ? "Probable Match" : "Documented";
      badgeEl.textContent = stateLabel;
      badgeEl.setAttribute("data-evidence-state", state);
    }
    if (titleEl) titleEl.textContent = person.canonical_name;

    const yr = person.recorded_year_range || person.active_year_range;
    if (subtitleEl) {
      const yrStr = yr ? (yr[0] === yr[1] ? ` · ${yr[0]}` : ` · ${yr[0]}–${yr[1]}`) : "";
      if (person.id === "person_bartolome_antonio_garrote") {
        subtitleEl.textContent = `Probable recurring Carrera master${yrStr}`;
      } else {
        const rolesDisplay = person.roles?.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(", ") || "Documented Person";
        subtitleEl.textContent = `${rolesDisplay}${yrStr}`;
      }
    }

    if (personRole) {
      if (person.id === "person_bartolome_antonio_garrote") {
        personRole.textContent = "Master (Carrera de Indias)";
      } else {
        personRole.textContent = person.roles?.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(", ") || "Documented Role";
      }
    }
    const personVoyagesKicker = document.querySelector<HTMLElement>("[data-person-voyages-kicker]");
    if (personVoyagesKicker) {
      personVoyagesKicker.textContent = person.id === "person_bartolome_antonio_garrote"
        ? "Recorded Master Voyages"
        : "Archival Occurrences";
    }

    if (personActiveYears) {
      const occCount = person.occurrence_ids ? person.occurrence_ids.length : 1;
      const yrLabel = yr ? (yr[0] === yr[1] ? `${yr[0]}` : `${yr[0]}–${yr[1]}`) : "";
      if (person.id === "person_bartolome_antonio_garrote") {
        personActiveYears.textContent = yrLabel ? `${yrLabel} (${occCount} recorded voyages)` : "";
      } else {
        personActiveYears.textContent = yrLabel ? `${yrLabel} (${occCount} archival occurrence${occCount === 1 ? "" : "s"})` : "";
      }
    }
    if (personResolutionStatus) {
      if (person.id === "person_bartolome_antonio_garrote") {
        personResolutionStatus.textContent = "Probable match across four Crespo voyage records";
      } else if (person.id === "person_antonio_de_witte_1666") {
        personResolutionStatus.textContent = "Probable match across two Nationaal Archief inventory items (HCA 32-11.380 / 11.391)";
      } else {
        personResolutionStatus.textContent = person.evidence_state === "probable_match" ? "Probable match across archival occurrences" : "Documented archival occurrence";
      }
    }
    if (personNotes) {
      personNotes.textContent = person.notes || "";
    }

    if (personVoyagesList) {
      personVoyagesList.replaceChildren();
      const personOccs = entitiesCache.person_occurrences?.filter((po) =>
        person.occurrence_ids.includes(po.id)
      ) || [];

      // Sort reverse chronological
      personOccs.sort((a, b) => (b.year_as_recorded || 0) - (a.year_as_recorded || 0));

      for (const occ of personOccs) {
        const roleTitle = (occ.role || "master").charAt(0).toUpperCase() + (occ.role || "master").slice(1);
        const roleStr = `${occ.year_as_recorded} ${roleTitle}`;
        let originDisplay = "Origin not recorded in finding aid";
        if (occ.origin_descriptor_raw) {
          originDisplay = occ.origin_descriptor_raw === "van Cadiz"
            ? "Recorded origin: Cádiz"
            : `Recorded origin: ${occ.origin_descriptor_raw}`;
        }
        const routeLabel = occ.arrival_place_raw
          ? `${occ.departure_place_raw || "Unrecorded"} → ${occ.arrival_place_raw}`
          : (occ.departure_place_raw
              ? `${occ.departure_place_raw} departure`
              : originDisplay);
        const labelStr = `${occ.vessel_name_raw} (${routeLabel})`;

        if (occ.ship_occurrence_id) {
          const ship = entitiesCache.ships.find((s) => s.occurrence_ids.includes(occ.ship_occurrence_id!));
          if (ship) {
            personVoyagesList.appendChild(
              createRelationshipRow("VESSEL", roleStr, labelStr, "ship", ship.id)
            );
          } else {
            personVoyagesList.appendChild(
              createRelationshipRow("VESSEL", roleStr, labelStr, "voyage", "route_cadiz_havana_crespo")
            );
          }
        } else {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "inspector-rel-row";

          const typeSpan = document.createElement("span");
          typeSpan.className = "inspector-rel-type";
          typeSpan.textContent = "REGISTER";

          const contentSpan = document.createElement("span");
          contentSpan.className = "inspector-rel-content";

          const roleSpan = document.createElement("span");
          roleSpan.className = "inspector-rel-role";
          roleSpan.textContent = roleStr;

          const sepSpan = document.createElement("span");
          sepSpan.className = "inspector-rel-sep";
          sepSpan.textContent = " · ";

          const labelSpan = document.createElement("span");
          labelSpan.className = "inspector-rel-label";
          labelSpan.textContent = labelStr;

          contentSpan.append(roleSpan, sepSpan, labelSpan);
          btn.append(typeSpan, contentSpan);

          btn.addEventListener("click", () => {
            window.dispatchEvent(
              new CustomEvent("cc:open-source", {
                detail: {
                  sourceId: "src_crespo_dyncoopnet",
                  assertionIds: occ.assertion_ids,
                  triggerEl: btn,
                },
              })
            );
          });

          personVoyagesList.appendChild(btn);
        }
      }
    }

    if (personEvidenceBtn) {
      personEvidenceBtn.onclick = () => {
        const personOccs = entitiesCache?.person_occurrences?.filter((po) =>
          person.occurrence_ids.includes(po.id)
        ) || [];
        const allAsts = Array.from(new Set(personOccs.flatMap((po) => po.assertion_ids)));
        const primarySource = person.source_record_ids?.[0]
          ? sourcesCache?.source_records.find((sr) => sr.id === person.source_record_ids[0])?.source_id
          : "src_crespo_dyncoopnet";
        window.dispatchEvent(
          new CustomEvent("cc:open-source", {
            detail: {
              sourceId: primarySource,
              assertionIds: allAsts,
              triggerEl: personEvidenceBtn,
            },
          })
        );
      };
    }

    viewPerson?.removeAttribute("hidden");
    viewPlace?.setAttribute("hidden", "");
    viewShip?.setAttribute("hidden", "");
    viewEvent?.setAttribute("hidden", "");
    viewVoyage?.setAttribute("hidden", "");
  }

  const status = document.querySelector<HTMLElement>("[data-inspector-status]");
  const retry = document.querySelector<HTMLButtonElement>("[data-inspector-retry]");
  const content = document.getElementById("inspector-content");
  let renderGeneration = 0;
  let inspectedSelection: Selection = null;
  const resetInspectorScroll = () => {
    if (inspector) inspector.scrollTop = 0;
    if (content) content.scrollTop = 0;
  };

  function renderRecord(selection: NonNullable<Selection>) {
    if (selection.kind === "port") renderPlace(selection.id);
    else if (selection.kind === "ship") renderShip(selection.id);
    else if (selection.kind === "event") renderEvent(selection.id);
    else if (selection.kind === "voyage") renderVoyage(selection.id);
    else if (selection.kind === "person") renderPerson(selection.id);
  }

  async function renderSelected(selection: NonNullable<Selection>, resetScroll = false) {
    const request = ++renderGeneration;
    const needsCore = !entitiesCache || !routesCache || !eventsCache;
    const needsSource = (selection.kind === "ship" || selection.kind === "person") && !sourcesCache;
    if (!needsCore && !needsSource) {
      if (status) status.hidden = true;
      if (retry) retry.hidden = true;
      content?.removeAttribute("aria-busy");
      renderRecord(selection);
      if (resetScroll) resetInspectorScroll();
      return;
    }
    for (const view of [viewPlace, viewShip, viewEvent, viewVoyage, viewPerson]) if (view) view.hidden = true;
    if (titleEl) titleEl.textContent = "Loading record…";
    if (subtitleEl) subtitleEl.textContent = "";
    if (badgeWrap) badgeWrap.hidden = true;
    if (periodNotice) periodNotice.hidden = true;
    if (status) { status.hidden = false; status.textContent = "Loading the published record…"; }
    if (retry) retry.hidden = true;
    content?.setAttribute("aria-busy", "true");
    try {
      await loadData();
      if (needsSource) await loadSources();
      if (request !== renderGeneration) return;
      const current = selectionStore.get();
      if (current?.kind !== selection.kind || current.id !== selection.id) return;
      if (status) status.hidden = true;
      if (retry) retry.hidden = true;
      content?.removeAttribute("aria-busy");
      renderRecord(selection);
      if (resetScroll) resetInspectorScroll();
    } catch {
      if (request !== renderGeneration || !selectionStore.get()) return;
      content?.removeAttribute("aria-busy");
      if (titleEl) titleEl.textContent = "Record unavailable";
      if (status) { status.hidden = false; status.textContent = "The published record could not be loaded. You can try again."; }
      if (retry) retry.hidden = false;
    }
  }

  function syncInspector(selection: Selection) {
    if (!inspector) return;
    const appShell = document.querySelector(".app-shell");
    if (!selection) {
      inspectedSelection = null;
      renderGeneration++;
      inspector.hidden = true;
      inspector.setAttribute("data-state", "closed");
      inspector.setAttribute("data-sheet-state", "closed");
      appShell?.setAttribute("data-inspector-open", "false");
      content?.removeAttribute("aria-busy");
      if (currentReturnTarget?.isConnected) currentReturnTarget.focus();
      currentReturnTarget = null;
      return;
    }
    const trigger = consumeSelectionTrigger();
    const resetScroll = Boolean(inspector.hidden) || inspectedSelection?.kind !== selection.kind || inspectedSelection?.id !== selection.id;
    inspectedSelection = selection;
    if (resetScroll) resetInspectorScroll();
    currentReturnTarget = trigger.returnTarget || null;
    inspector.hidden = false;
    inspector.setAttribute("data-state", "open");
    inspector.setAttribute("data-sheet-state", "open");
    appShell?.setAttribute("data-inspector-open", "true");
    void renderSelected(selection, resetScroll);
    if (trigger.modality === "keyboard") titleEl?.focus();
  }

  const stopSelection = selectionStore.subscribe(syncInspector);
  window.addEventListener(CURRENT_SELECTION_FOCUS_EVENT, () => syncInspector(selectionStore.get()), { signal });
  let firstPeriodCallback = true;
  const stopTime = timeFilterStore.subscribe((filter) => {
    activeTimeFilter = filter;
    const selection = selectionStore.get();
    if (!firstPeriodCallback && selection) void renderSelected(selection);
    firstPeriodCallback = false;
  });
  retry?.addEventListener("click", () => {
    const selection = selectionStore.get();
    if (selection) void renderSelected(selection);
  }, { signal });
  const cleanup = () => { lifecycle.abort(); stopSelection(); stopTime(); renderGeneration++; };
  document.addEventListener("astro:before-swap", cleanup, { once: true });
  window.addEventListener("pagehide", (event) => { if (!event.persisted) cleanup(); }, { signal });
  syncInspector(selectionStore.get());
}
