import { withBase } from "../paths";

export const PUBLISHED_ARTIFACTS = {
  manifest: "manifest.json",
  ports: "ports.geojson",
  routes: "routes.geojson",
  entities: "entities.json",
  events: "events.json",
  sources: "sources.json",
} as const;

export type PublishedArtifact = keyof typeof PUBLISHED_ARTIFACTS;

export function publishedDataUrl(artifact: PublishedArtifact): string {
  return withBase(`data/${PUBLISHED_ARTIFACTS[artifact]}`);
}

/**
 * Generic loader for deliberately published/right-safe artifacts.
 * Packet 2 will add schema validation and real historical fixtures.
 */
export async function loadPublishedJson<T>(artifact: PublishedArtifact): Promise<T> {
  const response = await fetch(publishedDataUrl(artifact));
  if (!response.ok) {
    throw new Error(`Unable to load published artifact: ${artifact}`);
  }
  return (await response.json()) as T;
}
