export const ENTITY_KINDS = ["ship", "port", "voyage", "person", "event"] as const;
export type EntityKind = (typeof ENTITY_KINDS)[number];

export const EVIDENCE_STATES = [
  "documented",
  "probable_match",
  "reconstructed",
  "contextual",
] as const;
export type EvidenceState = (typeof EVIDENCE_STATES)[number];

export const GEOMETRY_KINDS = [
  "endpoints_only",
  "schematic",
  "observed_track",
  "reconstructed_route",
] as const;
export type GeometryKind = (typeof GEOMETRY_KINDS)[number];

export const GEOGRAPHIC_PRECISIONS = [
  "colony_or_island",
  "populated_place",
  "port_city",
  "port_town",
] as const;
export type GeographicPrecision = (typeof GEOGRAPHIC_PRECISIONS)[number];

export interface EntitySelection {
  kind: EntityKind;
  id: string;
}

export type Selection = EntitySelection | null;

export interface PublishedPlace {
  id: string;
  canonical_name: string;
  raw_source_name: string;
  region: string;
  geographic_precision: GeographicPrecision;
  coordinates: [number, number];
  geometry_provenance: string;
  notes?: string;
}

export interface PublishedPortFeature {
  type: "Feature";
  id: string;
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    id: string;
    canonical_name: string;
    raw_source_name: string;
    region: string;
    geographic_precision: GeographicPrecision;
    geometry_provenance: string;
    notes?: string;
  };
}

export interface PublishedPortFeatureCollection {
  type: "FeatureCollection";
  features: PublishedPortFeature[];
}

export interface PublishedRouteFeature {
  type: "Feature";
  id: string;
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
  properties: {
    id: string;
    vessel_id: string;
    origin_place_id: string;
    destination_place_id: string;
    date_display: string;
    geometry_kind: GeometryKind;
    evidence_state: EvidenceState;
    is_track_observed: boolean;
    geometry_provenance: string;
    notes?: string;
  };
}

export interface PublishedRouteFeatureCollection {
  type: "FeatureCollection";
  features: PublishedRouteFeature[];
}

export interface PublishedCrewMember {
  id: string;
  first_name: string;
  last_name: string;
  age?: number;
  rank: string;
  place_birth?: string;
  place_residence?: string;
  place_muster?: string;
  subject_of?: string;
  literacy?: string;
}

export interface PublishedShip {
  id: string;
  canonical_name: string;
  raw_name: string;
  source_record_id: string;
  primary_source_id: string;
  dataset_source_id: string;
  raw_tonnage: string;
  reported_burden_display: string;
  raw_construction_place: string;
  reported_age_years?: number;
  reported_owner_residence: string;
  recorded_voyage_origin: string;
  recorded_muster_place?: string;
  recorded_voyage_destination: string;
  capture_location_place_id: string;
  capture_date: string;
  evidence_state: EvidenceState;
  crew_occurrences?: PublishedCrewMember[];
}

export interface PublishedEvent {
  id: string;
  title: string;
  date: string;
  calendar_system?: string;
  place_id: string;
  kind: string;
  evidence_state: EvidenceState;
  summary: string;
  sources: string[];
}

export interface PublishedSource {
  id: string;
  title: string;
  creator: string;
  holding_institution: string;
  stable_identifier: string;
  item_url?: string;
  rights_posture: string;
  public_use_basis: string;
  attribution_required: boolean;
  credit_line: string;
  notes?: string;
}

export interface PublishedVisual {
  id: string;
  title: string;
  creators: string[];
  date_display: string;
  date_start: number;
  date_end: number;
  is_uncertain: boolean;
  source_id: string;
  holding_institution: string;
  call_number: string;
  digital_id: string;
  item_url: string;
  rights_state: string;
  credit_line: string;
  asset_path: string;
}

export interface PublishedEntities {
  ships: PublishedShip[];
  places: PublishedPlace[];
  visuals: PublishedVisual[];
}

export interface PublishedEvents {
  events: PublishedEvent[];
}

export interface PublishedSources {
  sources: PublishedSource[];
}

export interface PublishedManifest {
  version: string;
  corpusId: string;
  corpusTitle: string;
  generatedAt: string;
  reviewedAt: string;
  reviewStatus: string;
  counts: {
    ships: number;
    places: number;
    routes: number;
    events: number;
    sources: number;
    visuals: number;
  };
}
