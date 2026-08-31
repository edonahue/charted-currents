# Visual Benchmark Assets

**Last reviewed:** 2026-08-31

This is a working shortlist for the first Charted Currents visual-reference board. These assets are historical evidence and design research, not generic pirate decoration.

A source outside the strict 1650–1730 corpus may be useful if it is explicitly labeled as a later representation of an earlier event or place.

## A. Herman Moll — West Indies, ca. 1715

Library of Congress:
https://www.loc.gov/item/gm71005442/

**Role:** core-period visual manifesto.

Why it matters: this map already combines geography, imperial/political space, trade winds and tracks of Spanish galleons/flota, with major port insets. It demonstrates the Charted Currents thesis — environment, movement, commerce and empire on one surface — before we draw a custom UI.

Use it for:
- visual hierarchy;
- route/wind notation study;
- historical labeling study;
- map-layer/reference toggle experiment;
- color/ink/paper sampling, without simply copying its style.

## B. Guillaume Delisle — *Carte des Antilles françoises et des isles voisines*, 1717 / ca. 1718

Greater Caribbean Mapping / LOC discovery record:
https://greatercaribbeanmaps.org/maps/carte-des-antilles-franc%CC%A7oises-et-des-isles-voisines-2/

BnF catalog example:
https://catalogue.bnf.fr/ark:/12148/cb449322487

**Role:** contemporary French comparison anchor.

The key value is not merely another attractive old map. It gives Charted Currents a second imperial/cartographic viewpoint from almost the same moment as Moll. Compare labels, island prominence, boundaries, text blocks, scale language and the geographic world each map chooses to make important.

## C. Georges-Louis Le Rouge — *Port-Royal de Jamaique*, 1755

Library of Congress:
https://www.loc.gov/item/73691840/

**Role:** later source explicitly recording the legacy of the 1692 earthquake.

The map notes that hatched areas mark what remained after the earthquake of 1692. This is exactly the sort of primary-source/context relationship Charted Currents should support: a 1755 map can illuminate a 1692 event, provided the interface says clearly that the map itself is later.

Potential metadata:

```yaml
as_of_source_date: 1755
historical_relation: later_map_depicting_1692_earthquake_impact
related_event: port_royal_earthquake_1692
```

## D. Patrick Browne / Sheffield / Bayly — Jamaica and Port Royal inset, 1755

Library of Congress:
https://www.loc.gov/item/73691842/

**Role:** maritime-chart detail benchmark.

Useful visual vocabulary includes harbor soundings, settlements, forts, pictorial terrain and an inset plan of Port Royal. It is later than the MVP core and must not be used as if it were a 1700 snapshot.

## E. Later Jamaica map with Port Royal state inset, ca. 1770

Library of Congress:
https://www.loc.gov/item/73691850/

**Role:** longitudinal cartographic comparison only.

This map includes a Port Royal inset showing different states of the town and detailed harbor/anchorage information. It can be useful later for a 'how maps remembered/reconstructed Port Royal' visual story, but it is not an MVP basemap.

## Asset-record requirements

Every approved visual benchmark/public asset should record:

```yaml
asset_id:
title:
creator:
source_date:
institution:
collection_or_division:
archive_or_call_number:
permalink:
rights_statement:
credit_line:
retrieved_at:
transformations: []
historical_relation:
related_entities: []
related_events: []
```

## Initial visual-board target

Before the UI's visual language is considered established, collect and review:

- 3–5 period maps spanning more than one imperial/cartographic tradition;
- at least Moll ca. 1715 and Delisle 1717/1718;
- 2 detailed port/harbor plans from different traditions;
- 2 ship/harbor artworks or material-culture items;
- 2 real manuscript/register pages;
- 1 navigational object;
- 1 disaster/weather primary source;
- rights/provenance metadata for every item.

The board should answer: **what does the historical record itself look like?** It should not answer: **what does a modern pirate website look like?**
