# Extending the Living Atlas chart comparison

The proposed direction is one Atlantic atlas with a shared cartographic style and
separately credited historical sheets. The modern map supplies continuous
orientation from the Caribbean to Europe. Each sheet contributes only the
geography actually visible on that sheet. Keep the original in the folio for
reading its legends, insets and annotations in their printed context.

## What the current comparison shows

- Modern, Blend and Registered retain the camera. Blend changes global
  raster opacity, initially 65%. Registered uses full opacity. Both use the
  same Moll raster and project port and relationship layers. The image fetch
  begins when the reader requests the comparison.
- The accepted Moll derivative is a 13-control affine registration, projected
  to Web Mercator. Its envelope is 103.50°W–54.90°W and 9.15°N–34.00°N. This
  bounding box includes transparent areas. Five separate harbor insets are
  masked within the crop. The Mexico City inset is outside it. Bermuda
  remains in the raster. [Registration report](../data/source_acquisitions/loc_gm71005442/georeference_report.json)
- Leave-one-out RMSE is 107.68 km, with an 86.99 km median and 171.41 km
  90th percentile. Bermuda was excluded from the fit and has a separately
  measured offset of 261.64 km. The selected-control results cannot establish
  the error for all visible geography. Candidate C and the narrower F1 are
  within 1 km RMSE on their ten common controls. Keep C as the comparator.
  [Control audit](../data/source_acquisitions/loc_gm71005442/gcp_audit.json)
  [Candidate benchmark](../data/source_acquisitions/loc_gm71005442/candidate_benchmark.json)
- Matched MapLibre screenshots show the large stepped void in the northeast,
  hard cuts at inset masks, and a thin surviving section of the printed
  margin across part of the void. These discontinuities become more evident
  when zoomed. An opacity slider leaves the spatial cut in the same place.
  The folio remains the proper surface for reading source text and printed
  scale.

### Inset mask defect

The pinned Library of Congress scan passed its acquisition checksum check.
Comparing the current source rectangles against the scan shows that the
St. Augustine rectangle ends above the printed inset's bottom border.
Inset lettering and rhumb lines are still displayed as main-chart ocean.
Independent visual review identified the same fragment in the browser.
The current boxes also cut some genuine chart field above the Veracruz
and St. Augustine insets and west of the Cartagena frame.
[Library of Congress source record](https://www.loc.gov/item/gm71005442/)

A local cutline proof regenerated the WebP with the same master, crop,
13 controls, affine transform and four geographic corners. It made this
inset strip transparent and recovered main-chart samples in all three
adjacent areas. At alpha ≥128, the proof gains 0.368% of the old
area-adjusted footprint and excludes 0.518%, for a net reduction of
0.150%. The regained area is authentic main-chart content, and the
exclusions include the wrongly placed inset. The proof's rectangular
approximations still need review against all panel edges. Published
source and derivative checksums passed after the experiment.

Review the proposed cutlines in master-image pixels before promoting
an asset. Inspect the combined mask where panels meet. Lock regression
samples for the excluded inset, recovered main-chart material and
Bermuda. Record a correction for the derivative's coverage and credit
the same source. Once the cutlines are agreed, run the edge treatment
study on that derivative. [Correction policy](CORRECTIONS_POLICY.md)

### Coverage within the existing sheet

The approved crop ends at master y=2895 to avoid the Mexico City
panorama. The main map continues south of this line east of the panorama.
A second local proof brought the crop to the lower border at y=3555
and masked the panorama locally. With the same affine controls, the
envelope extends to about 3.41°N from 9.15°N. At alpha ≥128, the
estimated area of raster support rises from 11.95 to 14.08 million km²
(17.8%) after correcting the inset masks. This area estimate integrates
pixel support with a latitude correction for Web Mercator. Geographic
agreement in the added band has yet to be independently checked. The
proof transfers 919,594 bytes at 2560 pixels wide, about 89 KB more than the
current raster. It exceeds the provisional 0.85 MB regional Blend budget.
Two encodes from the same uncompressed warp meet that transfer budget.
At 2560×1711 and WebP quality 75 the file is 773,442 bytes, with a nominal
17.5 MB RGBA surface. At 2368×1583 and quality 80 the file is 805,566 bytes,
with a nominal 15.0 MB surface, near the current 14.6 MB. Detail crops
retain readable larger labels in both. Compare the smaller texture on
real phones and check fine engraving in the browser before choosing an
encode. These sizes omit GPU/browser overhead and precede any feathering.

Review this extension before acquiring another chart. Include southern
holdouts and compare against an original-color folio if the geography
proves unreliable at the intended scale. The upper inset gap still exists:
the printed plate uses that part of the paper for separate harbor plans.

## Extend the engraving to the atlas

| Borrow from the charts | Apply to the atlas |
| --- | --- |
| Moll and Delisle use different scales of lettering and leave water open around larger geographic names. | Keep the new widely tracked basin lettering and quiet light-blue sea. At Atlantic scale prioritize basin names and a few ports. Reveal smaller labels with zoom and use warm ink for the selected record. Keep the label hierarchy consistent across flat map and globe. |
| Delisle gives long coastlines and islands different amounts of visual weight. | Let the modern land-water boundary do most of the work. At regional scale use fine shoreline emphasis only if a real coastal geometry layer is available. Outlining tiled water polygons will introduce lines along tile boundaries. Maintain contrast when the source is visible. |
| Moll's graticule and neatline establish orientation. The harbor charts open into a different scale of detail. | Retain a faint coordinate grid at wide zoom. Use thin folio rules, coordinates and a reliable modern scale as orientation marks. Use a sheet picker and source heading with author, date and area. Offer the island or harbor source alongside the same location, at its own scale. |

Let the imagery provide the period texture. Contemporary geography,
documented endpoints and printed chart markings should remain distinguishable
by shape and wording as well as color. Preserve the route qualifier as users
cross a seam. Avoid screen-space grain, decorative rhumb lines and fabricated
soundings. A modern map with engraved visual hierarchy can continue all the
way to the horizon without implying that an old chart extends there.
[Local visual references](../design/reference-board/manifest.json)

## Soften the transition

Use the current MapLibre image source for the first comparison experiment.
A local prototype altered only the rectified image's WebP alpha chunk. It
used an inward smoothstep from each existing transparent boundary, including
inset masks. The scheme leaves RGB bytes and registration coordinates intact,
never increases alpha, and keeps pixels beyond the existing valid area
transparent. There is no per-frame shader or rendering loop.

| Inward distance in source pixels | File size | Baseline area at alpha ≥ 128 retained | Impact in matched views |
| --- | ---: | ---: | --- |
| Current hard edge | 830,286 bytes | 100% | Hard chromatic boundary and visible inset steps. |
| 16 pixels | 826,864 bytes | 98.05% | Softens the seam with a fairly compact transition. Fine engraving near the cut still reads at the closer camera. |
| 32 pixels | 829,708 bytes | 95.83% | Broader fade obscures the thin border and some of the nearby engraving. The stepped hole remains recognizable. |

The area percentages use Web Mercator row weights approximating equal surface
area. They describe raster support at an alpha threshold, separate from
geographic accuracy. A fade of a fixed width in source pixels has different
screen widths at different zooms. Independent visual review preferred 16
pixels on desktop and flagged that the open controls obscure much of the
phone map. A second matched capture closed the controls and compared two
phone zooms and a wider Atlantic view. The 16-pixel fade reduced the
hardness of the edge. The mineral water test (`#c5d1c4`) further reduced
the color jump. Independent review preferred the existing blue-green
water, which separated open ocean from the printed sheet more clearly
and tied the view to the globe. The 35% setting left source lettering
faint. At 85% the sheet remained prominent, and Registered retained the
fine lines along the edge. The stepped inset gap remained visible
throughout. Both capture sets are local review artifacts.

A combined proof applied that fade to the 2368-pixel expanded encode.
It transfers 801,002 bytes and has 15.5% more raster support than the
current chart at the same alpha threshold. Matched browser captures used
the same camera and 65% opacity for both versions, at the southern edge
on desktop and the northeast inset gap on a phone with controls closed.
The southern scan filled the previously abrupt cut through the mainland.
The phone view retained a visible gap at the insets, with the stray harbor
detail removed and the border softened. The proof inherits the original
control fit and requires independent geographic checks in the added area.

For Blend, start with the narrower inward fade on the existing blue-green
water. Keep Registered on the current unfeathered derivative, with the
original image and dated credit in the folio. Add concise coverage language
near source attribution. A compact label such as “Chart coverage · Herman
Moll, [1715?]” can also open a footprint preview. Show coverage using the
valid pixel extent, including holes, rather than the rectangular image
envelope. If adjacent printed material survives the inset masks, use reviewed
cutlines following the actual panel borders to recover authentic pixels. A
reviewer should compare the master, mask and derivative at native resolution.
[GDAL cutlines and blend distances](https://gdal.org/en/stable/programs/gdalwarp.html)

The cartography candidate hides the modern basin labels when Moll is active,
including open water beyond the sheet. For wider comparison, test keeping
those labels outside the dense printed footprint. A simplified footprint
filter could replace the global visibility change on the existing point
label layer. Check anchor, text box and edge collisions separately and
apply the footprint only on a mode or sheet change.
[MapLibre point containment](https://maplibre.org/maplibre-style-spec/expressions/#within)

An optional synchronized inspection lens is worth testing only after the
ordinary blend reads cleanly. Keeping a single chart under a movable
comparison edge would help readers see double coastlines and label
displacement where opacity alone muddles them. It would need the same
keyboard and touch access as the opacity control and an ordinary full-view
comparison alternative. It can wait if the extra composite complicates
readability or rendering.

## Improve alignment and expand coverage

The source gives a lead for testing a different registration model.
Its printed 20° parallel bows by roughly 165–180 master pixels between
the edges and middle of the plate. Other labelled parallels show similar
curvature. The existing audit's near-linear series of latitude samples
could describe one central transect. The series alone cannot establish
that the whole grid is cylindrical. The lower neatline specifies degrees
west from London. Redigitize the grid in both axes and establish the
printed longitude origin before comparing projection models and converting
the grid to modern coordinates. Keep this test separate from conventional
geographic holdouts. [Graticule audit](../data/source_acquisitions/loc_gm71005442/graticule_audit.json)

An exploratory block test refit the same affine model using the published
control pixels and WGS84 coordinates. It reproduced the 107.68 km
leave-one-out RMSE. Removing nearby controls together shows how much
the fit can depend on support from the same region.

| Controls omitted together | Individual leave-one-out median | Block median / maximum |
| --- | ---: | ---: |
| Northern approaches (lat ≥ 29°N, 2 controls) | 88.1 km | 127.2 / 155.8 km |
| Western approaches (lat < 29°N, lon ≤ 82°W, 3 controls) | 87.0 km | 102.6 / 189.9 km |
| Southern coast (lat ≤ 11°N, 2 controls) | 69.5 km | 55.6 / 70.0 km |
| Eastern islands (lat > 11°N, lon ≥ 70°W, 4 controls) | 91.7 km | 112.6 / 219.4 km |

These groups reuse the selected controls and give a sensitivity diagnostic
with small samples. They point to the eastern and northern edges as useful
places for independent checkpoints. At latitude 20°N, a horizontal distance
equal to the original 107.68 km RMSE spans roughly 23 CSS pixels at Mercator
zoom 4 and 265 at zoom 7.5. This scale example explains why the same
derivative can support a basin overview while leaving a visibly displaced
harbor at closer zoom.

1. Freeze the accepted model, raster and checksums. Have an independent
   reader pick geographically distributed holdout checkpoints before model
   tuning. Record identifiable physical features, master coordinates,
   modern reference and version, uncertainty, and whether each point is for
   fitting or evaluation. Prefer stable headlands and offshore islands;
   assess known shoreline or harbor alterations separately. Keep Bermuda
   visible in the error report. Give the northern, western, southern and
   eastern edges independent coverage and report inside and outside the
   calibration hull.
2. Compare better-audited affine controls with a graticule-led registration.
   Collect full master coordinates for grid intersections across the
   sheet and test simple projection models against held-out grid points.
   Evaluate historic grid fidelity separately from agreement with modern
   features. Add a constrained local warp only where residual vectors
   suggest coherent correctable distortion.
   Review displacement grids and local scale. Higher-order fits can appear
   excellent at their control points while warping islands and edges.
   [QGIS transform guidance](https://docs.qgis.org/3.40/en/docs/user_manual/managing_data_source/georeferencer.html)
   [MapAnalyst distortion analysis](https://mapanalyst.org/)
3. Score every candidate on the same locked checkpoints with great-circle
   median, p90, maximum, directional residuals and leave-one-region-out
   scores. A provisional promotion target is at least a 20% reduction in
   independent p90 displacement with no material regional degradation,
   shape folding, or loss of approved coverage. Agree the regional tolerance
   and sample before tuning. If the chart remains useful only at basin scale,
   say so and favor synchronized comparison or a local source at higher zoom.
   Use errors translated to screen distance at each view scale to make
   the suggested scale understandable.
4. Review the recovered southern geography first, then extend actual
   area using a small scale-based chart collection. Test the
   valid-footprint union in an equal-area projection and report added
   area at a fixed alpha threshold, separately from the geographic area that
   passed checkpoint review. Disclose author, edition and date at sheet
   selection. Start with a named, reader-controlled sheet switch and retain
   the camera wherever the footprints overlap. Outside coverage, continue
   to show the modern map under the same atlas styling. Prefer a brief
   crossfade during a deliberate sheet switch, immediate with reduced motion.
   Avoid leaving two period coastlines in a blended composite. These are
   different maps and viewpoints even when dates are close.

### Source candidates

| Candidate | Why test it | Rights and geographic checks |
| --- | --- | --- |
| Bochart and Knollis, *Jamaica* [1684?] | The existing reviewed folio source offers a wider reading scale around Jamaica and Port Royal. Start with a linked folio and shared orientation. | Its public scan already has recorded provenance. A separate registration and independent checkpoints would be required before any island-scale raster overlay. [Library of Congress item](https://www.loc.gov/item/99463761/) |
| Delisle, *Carte du Mexique et de la Floride* (1703) | First candidate to investigate for a western/northern extension and an independent depiction of Caribbean geography. It depicts Mexico, Florida and the Caribbean and may add useful coverage of the continental approaches. | The Hargrett catalogue identifies a Ferro prime meridian. Account for it when testing graticule registration. Measure incremental support for the exact plate with its inset and ornament masks, and verify reuse terms for that digitization. [Hargrett item via Digital Library of Georgia](https://dlg.usg.edu/record/guan_hmap_hmap1703d4) |
| Halley, *A new and correct chart shewing the variations of the compass…* | First candidate to investigate for a genuinely transatlantic view. Catalogue scope includes the Atlantic, West Indies, Europe and Africa. The chart shows magnetic variation observations dated 1700. | Princeton dates its copy to [1701?]. Use the chosen edition's date and item-level reuse statement. Keep its printed lines identified as magnetic variation. Verify the fit and relevance to active Atlantic endpoints before considering registration. [Princeton Historic Maps Collection](https://static-prod.lib.princeton.edu/visual_materials/maps/websites/thematic-maps/quantitative/meteorology/meteorology.html) |
| Denis de Rotis, North Atlantic (1674) | Complementary northern Atlantic manuscript perspective, with mapped continental coasts on both sides. Stronger as a deliberate folio comparison at this time. | The American coastal scope described by BnF extends to Virginia. The manuscript includes a conjectured passage. Verify BnF reproduction terms and suitable control distribution before any overlay work. [BnF catalogue](https://catalogue.bnf.fr/ark:/12148/cb40665897c) |

The wider candidates are catalogue discoveries. Their registration
suitability, exact overlap and item-level derivative rights still need
review. Keep that review outside the first publish critical path.
[Visual-source publication policy](VISUAL_SOURCE_ACCESS.md)

## Delivery and acceptance

- Keep zero initial chart requests on the ordinary map. Load the chosen
  derivative on intent. Keep one active sheet texture. A 2560×1422 RGBA
  raster is about 14.6 MB before GPU and browser overhead. Compare one
  image source and cached variant on demand before considering raster
  tiles. For a multi-sheet collection, try static, bounded MapLibre raster
  tiles or a lightweight overview only if network and device traces show
  a benefit. Keep no second rendering engine. [MapLibre source types](https://maplibre.org/maplibre-style-spec/sources/)
- Preserve the mask, approved Registered asset, original scan, provenance
  and official geometry. Test no positive alpha outside support, identical
  RGB, and unchanged camera and endpoint coordinates. Show projection
  and alignment limits in the chart's provenance. In failed and no-coverage
  states, keep the map, locator and folio reachable with correct attribution.
- Compare matched screenshots at regional and Atlantic scale and each
  problematic edge, with special attention to the Lesser Antilles, Jamaica,
  Bermuda and the Carolinas. Test low, ordinary and high opacity, the
  interior and outside coverage, and close the phone controls before judging
  the map. Check labels, endpoint selection, period filtering, focus,
  keyboard operation, reduced motion and legibility of source credit.
- For each added source record cold chart transfer, response to the first
  switch, decode and pan cost, and texture cleanup. Initially budget ≤0.85 MB
  for the regional variant and one active raster of the current dimensions.
  Use the current image as the lab comparator. Confirm mobile GPU cost on
  hardware before promoting multiple sheets. Independent visual review and
  the source/rights review are separate gates.
