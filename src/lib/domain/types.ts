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

export interface EntitySelection {
  kind: EntityKind;
  id: string;
}

export type Selection = EntitySelection | null;
