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

export const INSPECTION_STATES = [
  "dataset_record_inspected",
  "digital_content_inspected",
  "metadata_only",
  "upstream_cited_only",
] as const;
export type InspectionState = (typeof INSPECTION_STATES)[number];

export type EvidenceLayer =
  | "historical_document_text"
  | "archival_catalogue_metadata"
  | "scholarly_dataset_value"
  | "historical_map_label"
  | "modern_authority_label"
  | "project_editorial_label";

export type AttestationLanguage = "es" | "en" | "fr" | "nl" | "und";

export type AttestationRelationship =
  | "source_transcription"
  | "historical_spelling_variant"
  | "editorial_normalization"
  | "modern_preferred_label";

export interface NameAttestation {
  raw_name: string;
  evidence_layer: EvidenceLayer;
  language: AttestationLanguage;
  attestation_relationship: AttestationRelationship;
  source_record_id: string;
  normalized_search_key?: string;
}

export interface PublishedSourceCoverage {
  source_id: string;
  short_label: string;
  source_declared_scope: {
    start_year: number;
    end_year: number;
    description: string;
  };
  local_database_scope?: {
    start_year: number;
    end_year: number;
    record_count: number;
    description: string;
  };
  project_reviewed_sample: {
    start_year: number;
    end_year: number;
    sample_type: string;
    record_count: number;
    caveat: string;
  };
}

export interface EntitySelection {
  kind: EntityKind;
  id: string;
}

export type Selection = EntitySelection | null;

export interface PublishedPlace {
  id: string;
  canonical_name: string;
  raw_source_name: string;
  endonym?: string;
  attestations?: NameAttestation[];
  region: string;
  geographic_precision: GeographicPrecision;
  coordinates: [number, number];
  geometry_provenance: string;
  source_assertion_ids?: string[];
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
    source_assertion_ids?: string[];
    notes?: string;
  };
}

export interface PublishedPortFeatureCollection {
  type: "FeatureCollection";
  features: PublishedPortFeature[];
}

export interface PublishedDisplayEdgeFeature {
  type: "Feature";
  id: string;
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
  properties: {
    id: string;
    origin_place_id: string;
    destination_place_id: string;
    origin_name: string;
    destination_name: string;
    route_group_id: string;
    constituent_vessel_ids: string[];
    constituent_route_ids: string[];
    constituent_assertion_ids: string[];
    constituent_source_ids?: string[];
    record_count: number;
    member_years: number[];
    associated_record_year: number;
    temporal_extent: {
      start_year: number | null;
      end_year: number | null;
      temporal_basis: string;
    };
    geometry_kind: GeometryKind;
    evidence_state: EvidenceState;
    is_track_observed: boolean;
    geometry_provenance: string;
    notes?: string;
  };
}

export interface PublishedArchivalRoute {
  id: string;
  vessel_id: string;
  origin_place_id: string;
  destination_place_id: string;
  date_display: string;
  associated_record_year?: number | null;
  associated_record_month?: number | null;
  temporal_basis?: string;
  date_precision?: string;
  geometry_kind: GeometryKind;
  evidence_state: EvidenceState;
  is_track_observed: boolean;
  geometry_provenance: string;
  source_assertion_ids: string[];
  notes?: string;
}

export type PublishedRouteFeature = PublishedDisplayEdgeFeature;

export interface PublishedRouteFeatureCollection {
  type: "FeatureCollection";
  features: PublishedDisplayEdgeFeature[];
  archival_routes?: PublishedArchivalRoute[];
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

export interface PublishedSourceRecord {
  id: string;
  source_id: string;
  record_type: string;
  native_identifier: string;
  inspection_state: InspectionState;
  upstream_archive_source_id?: string;
  upstream_archive_reference?: string;
  parent_ship_record_id?: string;
}

export interface PublishedAssertion {
  id: string;
  source_record_id: string;
  field: string;
  raw_value?: string;
  [key: string]: unknown;
}

export interface PublishedShipOccurrence {
  id: string;
  source_record_id: string;
  raw_name: string;
  attestations?: NameAttestation[];
  raw_tonnage: string;
  raw_construction_place: string;
  reported_age_years?: number;
  reported_owner_residence: string;
  recorded_voyage_origin: string;
  recorded_muster_place?: string;
  recorded_voyage_destination: string;
  recorded_capture_location: string;
  recorded_capture_date: string;
  assertion_ids: string[];
}

export interface PublishedCrewOccurrence {
  id: string;
  source_record_id: string;
  ship_occurrence_id: string;
  first_name: string;
  last_name: string;
  age_as_recorded?: number;
  rank_as_recorded: string;
  birthplace_as_recorded?: string;
  residence_as_recorded?: string;
  muster_place_as_recorded?: string;
  subject_of_as_recorded?: string;
  signature_recorded?: string;
  assertion_ids: string[];
}

export interface PublishedShip {
  id: string;
  canonical_name: string;
  attestations?: NameAttestation[];
  evidence_state: EvidenceState;
  occurrence_ids: string[];
  reported_burden_display: string;
  construction_display: string;
  owner_display: string;
  voyage_display: string;
  capture_display: string;
}

export interface PublishedEntityResolutionEdge {
  occurrence_id: string;
  target_entity_id: string;
  resolution_state: string;
  resolver: string;
  evidence_assertions: string[];
}

export interface PublishedEvent {
  id: string;
  title: string;
  date: string;
  calendar_system?: string;
  place_id: string;
  vessel_id?: string;
  kind: string;
  evidence_state: EvidenceState;
  summary: string;
  sources: string[];
  assertion_ids: string[];
}

export interface PublishedVisual {
  id: string;
  title: string;
  creators: string[];
  date_display: string;
  year_recorded?: number;
  is_uncertain: boolean;
  source_id: string;
  holding_institution: string;
  call_number: string;
  digital_id: string;
  item_url: string;
  rights_state: string;
  credit_line: string;
  asset_path: string;
  assertion_ids: string[];
}

export interface PublishedEntities {
  ship_occurrences: PublishedShipOccurrence[];
  crew_occurrences: PublishedCrewOccurrence[];
  ships: PublishedShip[];
  entity_resolution_edges: PublishedEntityResolutionEdge[];
  places: PublishedPlace[];
  routes?: PublishedArchivalRoute[];
  visuals: PublishedVisual[];
  source_coverages?: PublishedSourceCoverage[];
}

export interface PublishedEvents {
  events: PublishedEvent[];
}

export interface PublishedSources {
  sources: PublishedSource[];
  source_records: PublishedSourceRecord[];
  assertions: PublishedAssertion[];
}

export interface PublishedManifest {
  version: string;
  corpusId: string;
  corpusTitle: string;
  publishedAt: string;
  reviewStatus: string;
  counts: Record<string, number>;
}
