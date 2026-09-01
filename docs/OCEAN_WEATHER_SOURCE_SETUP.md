# Ocean, Weather, Winds & Tides Source Setup

**For:** Charted Currents  
**Last reviewed:** 2026-08-31  
**Purpose:** define access/setup and evidence rules for marine weather, winds, tides, water levels, and ocean-current data.

This lane has three fundamentally different evidence classes. Do not collapse them:

1. **Period observations** — observations made in or near the Charted Currents period, such as shipboard marine observations in ICOADS.
2. **Reconstructed/hydrographic conditions** — calculations based on later harmonic constants, astronomical forcing, historical cartography/bathymetry, or other models.
3. **Modern contextual/reanalysis data** — useful for orientation, climatology, comparison, and research hypotheses, but not evidence of what the sea or weather was doing on a specific date in 1650–1730.

Every adapter/public artifact must preserve which class it belongs to.

---

## Human setup summary

### Do now

- [ ] **Create a free Copernicus Marine account.** Use it for later modern/reanalysis ocean-current, sea-surface-temperature, salinity, wave, and related contextual products.
- [ ] After Packet 1, install the Copernicus Marine Toolbox in an isolated environment if/when a selected product requires it, then authenticate with `copernicusmarine login` so credentials live in the user's home directory rather than the project repository.

### Optional

- [ ] **Request a free NOAA Climate Data Online (CDO) token** if modern/long-running terrestrial weather-station context becomes useful. Store it locally as `NOAA_CDO_TOKEN`.

### No account/key needed

- **NOAA/NCEI ICOADS** direct observations/downloads.
- **NOAA CO-OPS Tides & Currents** Data API, Metadata API, Derived Product API, tide/current station metadata, harmonic constituents, observations, and predictions.
- Public NOAA/NCEI direct-download and open marine-data endpoints unless a particular service's documentation says otherwise.

There is no generic `NOAA_API_KEY` for this project. Use source-specific access contracts.

---

# 1. ICOADS — highest-value historical weather/wind lane

NOAA/NCEI's **International Comprehensive Ocean–Atmosphere Data Set (ICOADS)** spans **1662 to present**, overlapping almost the entire Charted Currents period.

Current landing page:
https://www.ncei.noaa.gov/products/international-comprehensive-ocean-atmosphere-data-set

Direct-download metadata:
https://www.ncei.noaa.gov/access/metadata/landing-page/bin/iso?id=gov.noaa.ncdc:C00606

Why it matters:

- observations originate from ships and other marine platforms;
- early records can include position/time plus wind direction/speed and, where present, sea-level pressure, air temperature, sea-surface temperature, humidity/cloud/weather fields;
- this can provide genuine period environmental observations rather than imposing a modern climatology on the seventeenth century.

### Access

- No Charted Currents account or API key is required for NOAA/NCEI direct distribution.
- Do **not** invent an environment variable for ICOADS.
- Prefer reproducible direct-download/source-snapshot workflows over scraping an interactive UI.

### Historical-evidence rules

Early ICOADS coverage is sparse and uneven. A record is an observation at a reported time/location, not a complete weather field.

For every usable observation preserve at least:

- ICOADS/source identifier and release/version;
- observation date/time and precision;
- reported latitude/longitude and position quality/precision where available;
- platform/source/deck information where available;
- original variable/value and units;
- quality-control flags;
- transformation/normalization history;
- missingness.

Do not interpolate a handful of ship observations into an apparently certain regional weather map without an explicit reconstruction method and uncertainty treatment.

Potential Packet 2+/research uses:

- observed wind arrows tied to individual dated observations;
- local wind/weather context around a voyage/event when spatial/temporal proximity is genuinely defensible;
- coverage-density layers showing where period observations actually exist;
- later, carefully derived seasonal wind summaries with visible sample size/coverage limits.

---

# 2. NOAA CO-OPS Tides & Currents — public, no key

NOAA Center for Operational Oceanographic Products and Services (CO-OPS) exposes public machine services for tides, water levels, currents, station metadata, datums, harmonic constituents, and predictions.

Web-services overview:
https://tidesandcurrents.noaa.gov/web_services_info.html

Metadata API:
https://api.tidesandcurrents.noaa.gov/mdapi/prod/

Data API:
https://api.tidesandcurrents.noaa.gov/api/prod/

### Access

- No API key/account is required for the public CO-OPS APIs.
- Do not create `NOAA_TIDES_API_KEY` or similar.
- When using the Data API, set a descriptive `application` parameter such as `ChartedCurrents` when practical so NOAA can identify automated callers in logs.

### What it is useful for

- station locations/history;
- modern/historical-observing-station metadata;
- tidal datums;
- water-level observations where station history supports them;
- tide/current predictions;
- harmonic constituents and prediction offsets;
- current-station metadata and harmonic constituents.

### Critical historical rule

A NOAA tide prediction for a modern station is **not an observed 1690 tide**.

NOAA explains that tide predictions are calculated from harmonic constituents derived from observations at a location. Those harmonic constants reflect the physical harbor/coastline/bathymetry represented by the observing record. Applying later harmonic constants to an early-modern date is therefore, at best, a **reconstruction** and can become especially questionable where shorelines, channels, engineering, earthquakes, subsidence, or bathymetry changed.

This matters acutely at places such as Port Royal, where the 1692 earthquake dramatically altered the harbor/coastline.

If Charted Currents later computes historical-date tides:

- classify them `reconstructed`, never `documented`;
- record the modern/later harmonic station and constituent source;
- record the astronomical calculation/model used;
- expose geographic/bathymetric limitations;
- avoid false precision in centimeters/minutes when the historical physical setting is uncertain;
- prefer qualitative state (`flooding`, `near high`, `ebb`, etc.) only when the methodology supports it.

Period documents or logs explicitly reporting tide/current conditions remain separate primary evidence.

---

# 3. Copernicus Marine — modern/reanalysis ocean context

Copernicus Marine Data Store:
https://marine.copernicus.eu/

Toolbox docs:
https://toolbox-docs.marine.copernicus.eu/

Copernicus Marine offers modern/reanalysis ocean products useful for current vectors, sea-surface temperature, salinity, waves and other physical-ocean context.

### Human setup

- [ ] Create a free Copernicus Marine account.
- [ ] When we select an actual product, install the `copernicusmarine` Toolbox in an isolated environment.
- [ ] Run:

```bash
copernicusmarine login
```

The Toolbox stores its credentials under the user's home directory (normally `~/.copernicusmarine/`). Prefer that mechanism rather than placing a Copernicus password in the Charted Currents project `.env`.

For machine-to-machine automation, the Toolbox officially recognizes:

```text
COPERNICUSMARINE_SERVICE_USERNAME
COPERNICUSMARINE_SERVICE_PASSWORD
```

These names are documented for completeness but are **not project `.env.example` entries by default** because they include an account password. If future automation needs them, configure them outside the repository/agent-visible workspace or through an appropriate secret mechanism.

### Evidence rule

Copernicus products do not make a current field from 2020, a climatology, or a modern reanalysis into evidence of the current on a specific voyage in 1695.

Use these products as:

- `contextual` modern oceanography;
- a comparison/reference layer;
- a hypothesis generator for route reconstruction;
- possible input to a clearly documented reconstruction method if historical validity can be justified independently.

Do not silently back-project modern currents into the early modern period.

---

# 4. NOAA Climate Data Online — optional modern weather token

Climate Data Online API docs:
https://www.ncei.noaa.gov/cdo-web/webservices/v2

CDO requires a free access token for its web-services API. Current documented limits are 5 requests/second and 10,000 requests/day per token.

This is **not** the primary period-weather source; ICOADS is much more important for Charted Currents' 1662–1730 marine lane. CDO can still be useful for later station-based modern/long-running climatic context.

If obtained, use the canonical local variable:

```bash
NOAA_CDO_TOKEN=...
```

Do not invent `NOAA_API_KEY` or expose the token to browser code.

---

# 5. Storms and hurricanes before 1851

Do not assume NOAA HURDAT-style modern tropical-cyclone datasets provide a complete 1650–1730 storm record. Early-modern Caribbean hurricanes require a separate historical-source/scholarly reconstruction lane drawing on ship logs, colonial records, newspapers/letters, archival compilations and specialist historical climatology.

A later environmental packet should research that literature explicitly and classify reconstructed storm tracks/intensities as reconstructed rather than importing modern hurricane-map conventions.

No additional account/API key is recommended for this lane yet.

---

# 6. Product-design implications

Environmental data should eventually deepen the map without turning Charted Currents into a live weather product.

Promising future layers/interactions include:

- period ICOADS wind observations with visible coverage/quality;
- trade-wind/context annotations derived from real cartographic/primary sources;
- reconstructed tidal state for a carefully chosen event, with methodology visible;
- modern current/climatology comparison that is explicitly labeled contextual;
- environmental conditions inside the entity inspector/evidence drawer rather than permanent visual clutter;
- optional seasonal/temporal overlays once enough real observations exist.

Avoid:

- decorative animated wind merely because it looks impressive;
- live weather widgets unrelated to the historical inquiry;
- presenting a modern Gulf Stream/current visualization as an exact 1700 current field;
- presenting modern tide predictions as observed historical tide levels;
- smoothed historical weather surfaces that conceal sparse underlying observations.

The same provenance/uncertainty system used for ships, routes and events must govern environmental assertions.