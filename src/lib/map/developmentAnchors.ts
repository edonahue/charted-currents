import type { EntitySelection } from "../domain/types";

export interface DevelopmentAnchor {
  id: string;
  selection: EntitySelection;
  label: string;
  region: string;
  coordinates: [longitude: number, latitude: number];
  locatorSource: {
    name: "GeoNames";
    url: string;
    retrieved: "2026-08-31";
  };
  note: string;
}

export const DEVELOPMENT_ANCHOR_ATTRIBUTION = {
  label: "Development locator data: GeoNames",
  sourceUrl: "https://www.geonames.org/",
  license: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
} as const;

/**
 * Real modern locator points used only to exercise Packet 1 map interaction.
 *
 * These are NOT historical port geometries and do not assert a historical
 * voyage, boundary, jurisdiction, event, or exact period-specific location.
 * Keep them out of public/data; Packet 2 replaces developmental interaction
 * content with provenance-aware published historical artifacts.
 *
 * If these anchors are visible in a public Packet 1 build, expose
 * DEVELOPMENT_ANCHOR_ATTRIBUTION in a credits/About/utility surface.
 */
export const DEVELOPMENT_ANCHORS: readonly DevelopmentAnchor[] = [
  {
    id: "dev-port-royal-jamaica",
    selection: { kind: "port", id: "port_royal_jamaica" },
    label: "Port Royal",
    region: "Jamaica",
    coordinates: [-76.84062, 17.93738],
    locatorSource: {
      name: "GeoNames",
      url: "https://www.geonames.org/advanced-search.html?country=JM&q=Port+Royal",
      retrieved: "2026-08-31",
    },
    note: "Modern populated-place locator only; not a historical harbor extent or period coordinate.",
  },
  {
    id: "dev-havana-cuba",
    selection: { kind: "port", id: "havana" },
    label: "Havana",
    region: "Cuba",
    coordinates: [-82.38304, 23.13302],
    locatorSource: {
      name: "GeoNames",
      url: "https://www.geonames.org/3553478/havana.html",
      retrieved: "2026-08-31",
    },
    note: "Modern city locator only; historical harbor/place assertions require project provenance.",
  },
  {
    id: "dev-willemstad-curacao",
    selection: { kind: "port", id: "curacao" },
    label: "Curaçao / Willemstad",
    region: "Curaçao",
    coordinates: [-68.93333, 12.11667],
    locatorSource: {
      name: "GeoNames",
      url: "https://www.geonames.org/11525726/willemstad.html",
      retrieved: "2026-08-31",
    },
    note: "Modern Willemstad port locator used for the Curaçao development anchor; historical place normalization remains evidence-driven.",
  },
  {
    id: "dev-cartagena-colombia",
    selection: { kind: "port", id: "cartagena_indias" },
    label: "Cartagena de Indias",
    region: "Colombia",
    coordinates: [-75.49328, 10.39817],
    locatorSource: {
      name: "GeoNames",
      url: "https://www.geonames.org/3687238/cartagena.html",
      retrieved: "2026-08-31",
    },
    note: "Modern city locator only; not a historical fortification, harbor boundary, or period coordinate.",
  },
] as const;
