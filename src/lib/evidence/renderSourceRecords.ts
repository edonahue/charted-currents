import type { PublishedAssertion, PublishedSource, PublishedSourceRecord, PublishedSources } from "../domain/types";

/** Render published evidence only after the drawer has opened on user intent. */
export function renderSourceRecords(
  options: { sourceId?: string | null; assertionIds?: string[] | null; upstreamRef?: string | null },
  sources: PublishedSources,
  container: HTMLElement,
  titleEl: HTMLElement | null,
  subtitleEl: HTMLElement | null,
): void {
  function humanizeInspectionState(state: string): string {
    switch (state) {
      case "dataset_record_inspected":
        return "Dataset record inspected";
      case "digital_content_inspected":
        return "Digital source inspected";
      case "metadata_only":
        return "Catalogue metadata inspected";
      case "upstream_cited_only":
        return "Cited upstream; not independently inspected";
      default:
        return state.replace(/_/g, " ");
    }
  }

  function humanizeRightsPosture(posture: string): string {
    switch (posture) {
      case "open_access_no_registration_required":
        return "Open access · No registration required";
      case "open_public_domain":
        return "Open public domain";
      case "cc0_and_public_domain":
        return "CC0 1.0 Universal / Public Domain";
      case "cc_by_4_0":
        return "Creative Commons Attribution 4.0 (CC BY 4.0)";
      case "uk_open_government_licence":
        return "Open Government Licence (OGL)";
      default:
        return posture.replace(/_/g, " ");
    }
  }

  function formatAssertionValue(ast: PublishedAssertion): string {
    const field = ast.field;

    if (ast.derived_value !== undefined) {
      const method = ast.derivation_method ? ` · Method: ${ast.derivation_method.replace(/_/g, " ")}` : "";
      return `${ast.derived_value} [Project-derived${method}]`;
    }

    if (field === "ship_name") return String(ast.raw_value || "");
    if (field === "archival_finding_aid_title") return `"${ast.raw_value}" [Archival Finding Aid]`;
    if (field === "prize_cause") return String(ast.raw_value || "");
    if (field === "tonnage") return `${ast.raw_value} tons reported burden`;
    if (field === "construction_place") {
      const ageStr = ast.reported_age_years ? ` (reported age: ${ast.reported_age_years})` : "";
      return `${ast.raw_value}${ageStr}`;
    }
    if (field === "owner_residence") return `Owner resident at ${ast.raw_value}`;
    if (field === "voyage") {
      const musterStr = ast.muster_raw ? ` (muster: ${ast.muster_raw})` : "";
      return `${ast.origin_raw || "Unknown"} → ${ast.destination_raw || "Unknown"}${musterStr}`;
    }
    if (field === "capture") {
      const dateStr = ast.display ? ` (${ast.display})` : "";
      return `${ast.location_raw || "Unrecorded location"}${dateStr}`;
    }
    if (field === "recorded_origin_descriptor") {
      return `"${ast.raw_value}" [Recorded Origin Descriptor]`;
    }
    if (field === "upstream_archive_reference") {
      return `Cited in upstream archival series: ${ast.raw_value}`;
    }
    if (field === "battle_engagement") return String(ast.raw_value || "");
    if (field === "crew_resistance") return String(ast.raw_value || "");
    if (field === "plunder_cargo") return String(ast.raw_value || "");
    if (field === "jamaica_petition") return String(ast.raw_value || "");
    if (field === "report_date") return `Council of Trade Report Date: ${ast.raw_value}`;
    if (field === "crew_examination") {
      const parts: string[] = [];
      if (ast.first_name || ast.last_name) parts.push(`${ast.first_name || ""} ${ast.last_name || ""}`.trim());
      if (ast.age) parts.push(`age ${ast.age}`);
      if (ast.rank) parts.push(String(ast.rank));
      if (ast.birthplace) parts.push(`b. ${ast.birthplace}`);
      if (ast.residence) parts.push(`res. ${ast.residence}`);
      if (ast.subject_of) parts.push(`subject of ${ast.subject_of}`);
      if (ast.signature) parts.push(`[${ast.signature}]`);
      return parts.join(" · ");
    }
    if (field === "event_date") {
      const cal = ast.calendar_system ? ` (${ast.calendar_system})` : "";
      return `${ast.date_as_recorded || ast.display || ast.year || ""}${cal}`;
    }
    if (field === "event_location") return String(ast.place_name || ast.raw_value || "");
    if (field === "published_account") return String(ast.title || ast.raw_value || "");
    if (field === "manuscript_letter") {
      const by = ast.creator ? `Letter from ${ast.creator}` : "Letter";
      const date = ast.letter_date ? ` (${ast.letter_date})` : "";
      const desc = ast.description ? `: ${ast.description}` : "";
      return `${by}${date}${desc}`;
    }
    if (field === "map_title") return `"${ast.raw_title || ast.raw_value || ""}"`;
    if (field === "map_date") return `${ast.date_display || ast.year_recorded || ""}`;
    if (field === "cartographic_place_label") return `"${ast.raw_value}" depicted and labeled on contemporary chart`;
    if (field === "cartographic_feature_inscription") {
      const notes = ast.notes ? ` — ${ast.notes}` : "";
      return `"${ast.raw_value}" [engraved inscription]${notes}`;
    }
    if (field === "cartographic_feature") return String(ast.raw_value || "");
    if (field === "georeference_alignment") {
      const method = ast.derivation_method ? ` · Method: ${ast.derivation_method.replace(/_/g, " ")}` : "";
      return `${ast.derived_value || ast.raw_value || ""} [Project-derived${method}]`;
    }

    // Fallback
    const kv = Object.entries(ast)
      .filter(([k]) => !["id", "source_record_id", "field"].includes(k))
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    return kv || String(ast.raw_value || ast.raw_title || ast.title || ast.place_name || "");
  }

  function renderSourceCard(
    source: PublishedSource,
    record: PublishedSourceRecord | null,
    assertions: PublishedAssertion[],
    upstreamRef?: string | null
  ): HTMLElement {
    const card = document.createElement("article");
    card.className = "source-card";
    if (record) card.dataset.sourceRecordId = record.id;

    // Source Card Header
    const header = document.createElement("header");
    header.className = "source-card__header";

    const title = document.createElement("h3");
    title.className = "source-card__title";
    title.textContent = source.title;

    const subtitle = document.createElement("p");
    subtitle.className = "source-card__subtitle";
    subtitle.textContent = `${source.holding_institution} · ${record ? record.native_identifier : source.stable_identifier}`;

    header.append(title, subtitle);
    card.appendChild(header);
    const visual = Array.from(document.querySelectorAll<HTMLTemplateElement>("template[data-source-visual]"))
      .find((template) => template.dataset.sourceVisual === source.id);
    if (visual) card.appendChild(visual.content.cloneNode(true));

    // Metadata DL
    const dl = document.createElement("dl");
    dl.className = "inspector-meta";

    // Inspection State Row
    const rowState = document.createElement("div");
    rowState.className = "inspector-meta__row";
    const dtState = document.createElement("dt");
    dtState.textContent = "Inspection State";
    const ddState = document.createElement("dd");
    const stateVal = record?.inspection_state || "record_level_inspection_not_specified";
    ddState.textContent = record ? humanizeInspectionState(stateVal)
      : sources.source_records.some((item) => item.source_id === source.id)
        ? "Select an item-level record to see its inspection state"
        : "No item-level inspection record published for this source container";
    ddState.setAttribute("data-source-inspection-state", stateVal);
    rowState.append(dtState, ddState);
    dl.appendChild(rowState);

    // Repository Row
    const rowInst = document.createElement("div");
    rowInst.className = "inspector-meta__row";
    const dtInst = document.createElement("dt");
    dtInst.textContent = "Repository / Host";
    const ddInst = document.createElement("dd");
    ddInst.textContent = source.holding_institution;
    ddInst.setAttribute("data-source-institution", source.holding_institution);
    rowInst.append(dtInst, ddInst);
    dl.appendChild(rowInst);

    // Creator Row
    if (source.creator) {
      const rowCreator = document.createElement("div");
      rowCreator.className = "inspector-meta__row";
      const dtCreator = document.createElement("dt");
      dtCreator.textContent = "Creator / Authority";
      const ddCreator = document.createElement("dd");
      ddCreator.textContent = source.creator;
      rowCreator.append(dtCreator, ddCreator);
      dl.appendChild(rowCreator);
    }

    // Rights Posture
    const rowRights = document.createElement("div");
    rowRights.className = "inspector-meta__row";
    const dtRights = document.createElement("dt");
    dtRights.textContent = "Rights & reuse";
    const ddRights = document.createElement("dd");
    ddRights.textContent = humanizeRightsPosture(source.rights_posture);
    ddRights.setAttribute("data-source-rights", source.rights_posture);
    rowRights.append(dtRights, ddRights);
    dl.appendChild(rowRights);

    // Source / Record Permalink Row
    if (record?.record_url) {
      const rowLink = document.createElement("div");
      rowLink.className = "inspector-meta__row";
      const dtLink = document.createElement("dt");
      dtLink.textContent = "Record Link";
      const ddLink = document.createElement("dd");
      const a = document.createElement("a");
      a.href = record.record_url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "inspector-link";
      a.textContent = "View Published Record ↗";
      ddLink.appendChild(a);
      rowLink.append(dtLink, ddLink);
      dl.appendChild(rowLink);
    } else if (source.item_url) {
      const rowLink = document.createElement("div");
      rowLink.className = "inspector-meta__row";
      const dtLink = document.createElement("dt");
      dtLink.textContent = "Source Link";
      const ddLink = document.createElement("dd");
      const a = document.createElement("a");
      a.href = source.item_url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "inspector-link";
      a.textContent = "View Repository Record ↗";
      ddLink.appendChild(a);
      rowLink.append(dtLink, ddLink);
      dl.appendChild(rowLink);
    }

    // Persistent Handle Row
    if (record?.persistent_handle) {
      const rowHandle = document.createElement("div");
      rowHandle.className = "inspector-meta__row";
      const dtHandle = document.createElement("dt");
      dtHandle.textContent = "Persistent Handle";
      const ddHandle = document.createElement("dd");
      const aHandle = document.createElement("a");
      aHandle.href = record.persistent_handle;
      aHandle.target = "_blank";
      aHandle.rel = "noopener noreferrer";
      aHandle.className = "inspector-link inspector-mono";
      aHandle.textContent = record.persistent_handle.replace(/^https?:\/\/hdl\.handle\.net\//, "hdl:") + " ↗";
      ddHandle.appendChild(aHandle);
      rowHandle.append(dtHandle, ddHandle);
      dl.appendChild(rowHandle);
    }

    // Digitized Scans Row
    if (record?.scan_count) {
      const rowScans = document.createElement("div");
      rowScans.className = "inspector-meta__row";
      const dtScans = document.createElement("dt");
      dtScans.textContent = "Digitized Scans";
      const ddScans = document.createElement("dd");
      ddScans.textContent = `${record.scan_count} scans (Non-commercial access via Nationaal Archief)`;
      rowScans.append(dtScans, ddScans);
      dl.appendChild(rowScans);
    }

    card.appendChild(dl);

    // Digital Surrogate Viewer Link (if available for this record)
    if (record?.persistent_handle && record?.scan_count) {
      const facSection = document.createElement("div");
      facSection.className = "source-card__facsimile";

      const facKicker = document.createElement("p");
      facKicker.className = "panel-kicker";
      facKicker.textContent = "Digital Surrogate";

      const facFig = document.createElement("div");
      facFig.className = "inspector-facsimile-figure";

      const facCap = document.createElement("p");
      facCap.className = "inspector-note";
      facCap.style.marginBottom = "0.5rem";
      facCap.textContent = `Digitized surrogate preserved at Nationaal Archief, Den Haag (${record.scan_count} scans). Non-commercial open access.`;

      const facLink = document.createElement("a");
      facLink.href = record.persistent_handle;
      facLink.target = "_blank";
      facLink.rel = "noopener noreferrer";
      facLink.className = "inspector-link";
      facLink.textContent = `Open Complete ${record.scan_count}-Scan Digital Viewer at Nationaal Archief ↗`;

      facFig.append(facCap, facLink);
      facSection.append(facKicker, facFig);
      card.appendChild(facSection);
    }

    // Upstream Archival Reference (if cited via dataset)
    const effectiveUpstream = upstreamRef || record?.upstream_archive_reference;
    if (effectiveUpstream) {
      const upSection = document.createElement("div");
      upSection.className = "source-card__upstream";

      const upKicker = document.createElement("p");
      upKicker.className = "panel-kicker";
      upKicker.textContent = "Upstream Archival Citation";

      const upDl = document.createElement("dl");
      upDl.className = "inspector-meta";

      const upRow = document.createElement("div");
      upRow.className = "inspector-meta__row";
      const upDt = document.createElement("dt");
      upDt.textContent = "Archival Reference";
      const upDd = document.createElement("dd");
      upDd.className = "inspector-mono";
      upDd.textContent = effectiveUpstream;
      upDd.setAttribute("data-source-upstream-ref", effectiveUpstream);
      upRow.append(upDt, upDd);
      upDl.appendChild(upRow);

      const upNote = document.createElement("p");
      upNote.className = "inspector-note";
      if (record?.upstream_archive_source_id === "src_pares_agi") {
        upNote.textContent =
          "Cited in dataset extract from Archivo General de Indias (Sevilla). Portal de Archivos Españoles (PARES) · Ministerio de Cultura.";
      } else if (record?.source_id === "src_na_2_22_24_sailing_letters") {
        upNote.textContent =
          "Physical manuscripts held at The National Archives, Kew (series HCA 32). Photographic duplicate collection and finding aid examined at Nationaal Archief, Den Haag.";
      } else if (
        record?.source_id === "src_csp_colonial_vol22" ||
        record?.upstream_archive_source_id === "src_tna_co_138" ||
        record?.upstream_archive_source_id === "src_tna_co_137"
      ) {
        upNote.textContent =
          "Colonial Office manuscript records held at The National Archives, Kew. The physical manuscript volume was not independently examined; entry inspected via published Calendar of State Papers.";
      } else {
        upNote.textContent =
          "Cited in dataset extract from High Court of Admiralty prize papers. The physical 17th/18th-century manuscript at Kew was not independently examined.";
      }

      upSection.append(upKicker, upDl, upNote);
      card.appendChild(upSection);
    }

    // Supporting Assertions Table
    if (assertions.length > 0) {
      const astSection = document.createElement("div");
      astSection.className = "source-card__assertions";

      const astKicker = document.createElement("p");
      astKicker.className = "panel-kicker";
      astKicker.textContent = "Supporting Sourced Assertions";

      const tableWrap = document.createElement("div");
      tableWrap.className = "inspector-table-wrap";

      const table = document.createElement("table");
      table.className = "inspector-crew-table";

      const thead = document.createElement("thead");
      const headTr = document.createElement("tr");
      const thField = document.createElement("th");
      thField.textContent = "Assertion Field";
      const thVal = document.createElement("th");
      thVal.textContent = "Assertion Value";
      headTr.append(thField, thVal);
      thead.appendChild(headTr);

      const tbody = document.createElement("tbody");
      tbody.setAttribute("data-source-assertions-tbody", "");

      for (const ast of assertions) {
        const tr = document.createElement("tr");
        tr.dataset.assertionId = ast.id;
        const tdField = document.createElement("td");
        tdField.textContent = ast.field.replace(/_/g, " ");

        const tdVal = document.createElement("td");
        tdVal.className = "inspector-mono";

        if (ast.derived_value !== undefined) {
          tdVal.setAttribute("data-assertion-type", "project-derived");
          const valSpan = document.createElement("span");
          valSpan.textContent = String(ast.derived_value);
          valSpan.className = "inspector-derived-val";

          const badgeSpan = document.createElement("span");
          badgeSpan.className = "inspector-field-badge";
          badgeSpan.textContent = "Project-derived";

          tdVal.append(valSpan, document.createTextNode(" "), badgeSpan);

          if (ast.derivation_method) {
            const ruleP = document.createElement("div");
            ruleP.className = "inspector-rule-note";
            ruleP.textContent = `Rule: ${ast.derivation_method.replace(/_/g, " ")}`;
            tdVal.appendChild(ruleP);
          }
        } else {
          tdVal.setAttribute("data-assertion-type", "direct-source");
          tdVal.textContent = formatAssertionValue(ast);
        }

        tr.append(tdField, tdVal);
        tbody.appendChild(tr);
      }

      table.append(thead, tbody);
      tableWrap.appendChild(table);
      astSection.append(astKicker, tableWrap);
      card.appendChild(astSection);
    }

    // Citation Note
    if (source.credit_line) {
      const citSection = document.createElement("div");
      citSection.className = "source-card__citation";
      const citKicker = document.createElement("p");
      citKicker.className = "panel-kicker";
      citKicker.textContent = "Citation & Attribution";
      const citNote = document.createElement("p");
      citNote.className = "inspector-note";
      citNote.textContent = source.credit_line;
      citSection.append(citKicker, citNote);
      card.appendChild(citSection);
    }

    return card;
  }

  container.replaceChildren();

  if (options.assertionIds && options.assertionIds.length > 0) {
    // Group assertions by source_record_id
    const astByRecordId = new Map<string, PublishedAssertion[]>();
    for (const astId of options.assertionIds) {
      const ast = sources.assertions.find((a) => a.id === astId);
      if (ast) {
        const list = astByRecordId.get(ast.source_record_id) || [];
        list.push(ast);
        astByRecordId.set(ast.source_record_id, list);
      }
    }

    if (titleEl) titleEl.textContent = "Evidence & provenance";
    if (subtitleEl) {
      const assertionCount = [...astByRecordId.values()].reduce((count, assertions) => count + assertions.length, 0);
      subtitleEl.textContent = `${assertionCount} published ${assertionCount === 1 ? "assertion" : "assertions"} · ${astByRecordId.size} source ${astByRecordId.size === 1 ? "record" : "records"}.`;
    }

    for (const [recordId, recordAsts] of astByRecordId.entries()) {
      const record = sources.source_records.find((r) => r.id === recordId) || null;
      const source = record ? sources.sources.find((s) => s.id === record.source_id) : null;
      if (source) {
        const card = renderSourceCard(source, record, recordAsts, options.upstreamRef);
        container.appendChild(card);
      }
    }
  } else if (options.sourceId) {
    const source = sources.sources.find((s) => s.id === options.sourceId);
    if (source) {
      if (titleEl) titleEl.textContent = source.title;
      if (subtitleEl) subtitleEl.textContent = `${source.holding_institution} · ${source.stable_identifier}`;

      const relatedRecords = sources.source_records.filter((r) => r.source_id === source.id);
      // A source container is not one record. Keep each assertion with its
      // actual record, identifier and inspection state.
      if (!relatedRecords.length) {
        container.appendChild(renderSourceCard(source, null, [], options.upstreamRef));
      }
      for (const record of relatedRecords) {
        const assertions = sources.assertions.filter((a) => a.source_record_id === record.id);
        const card = renderSourceCard(source, record, assertions, options.upstreamRef);
        if (relatedRecords.length === 1) {
          container.appendChild(card);
        } else {
          const entry = document.createElement("details");
          entry.className = "source-record-entry";
          const summary = document.createElement("summary");
          summary.textContent = `${record.native_identifier} · ${assertions.length} assertions`;
          entry.append(summary, card);
          container.appendChild(entry);
        }
      }
    }
  } else if (sources.sources.length > 0) {
    const source = sources.sources[0];
    const card = renderSourceCard(source, null, []);
    container.appendChild(card);
  }

  if (!container.childElementCount) {
    const empty = document.createElement("p");
    empty.className = "inspector-note";
    empty.textContent = "No published source record matches this request.";
    container.appendChild(empty);
  }
}
