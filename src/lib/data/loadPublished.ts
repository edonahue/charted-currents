import type {
  PublishedEntities,
  PublishedEvents,
  PublishedManifest,
  PublishedPortFeatureCollection,
  PublishedRouteFeatureCollection,
  PublishedSources,
} from "../domain/types";
import { withBase } from "../paths";

export const PUBLISHED_ARTIFACTS = {
  manifest: "manifest.json",
  ports: "ports.geojson",
  routes: "routes.geojson",
  entities: "entities.json",
  events: "events.json",
  sources: "sources.json",
  dataset_context: "dataset_context.json",
} as const;

export type PublishedArtifact = keyof typeof PUBLISHED_ARTIFACTS;

export function publishedDataUrl(artifact: PublishedArtifact): string {
  return withBase(`data/${PUBLISHED_ARTIFACTS[artifact]}`);
}

/**
 * Generic loader for deliberately published/right-safe artifacts.
 */
export async function loadPublishedJson<T>(artifact: PublishedArtifact): Promise<T> {
  const response = await fetch(publishedDataUrl(artifact));
  if (!response.ok) {
    throw new Error(`Unable to load published artifact: ${artifact}`);
  }
  return (await response.json()) as T;
}

export function loadPublishedManifest(): Promise<PublishedManifest> {
  return loadPublishedJson<PublishedManifest>("manifest");
}

export function loadPublishedPorts(): Promise<PublishedPortFeatureCollection> {
  return loadPublishedJson<PublishedPortFeatureCollection>("ports");
}

export function loadPublishedRoutes(): Promise<PublishedRouteFeatureCollection> {
  return loadPublishedJson<PublishedRouteFeatureCollection>("routes");
}

export function loadPublishedEntities(): Promise<PublishedEntities> {
  return loadPublishedJson<PublishedEntities>("entities");
}

export function loadPublishedEvents(): Promise<PublishedEvents> {
  return loadPublishedJson<PublishedEvents>("events");
}

export function loadPublishedSources(): Promise<PublishedSources> {
  return loadPublishedJson<PublishedSources>("sources");
}
