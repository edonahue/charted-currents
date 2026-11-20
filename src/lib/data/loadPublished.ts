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
const publishedRequests = new Map<PublishedArtifact, Promise<unknown>>();

export function loadPublishedJson<T>(artifact: PublishedArtifact): Promise<T> {
  // Published artifacts are immutable for this page session. Share both pending
  // and completed requests across consumers; failures remain retryable.
  let request = publishedRequests.get(artifact);
  if (!request) {
    request = fetch(publishedDataUrl(artifact)).then((response) => {
      if (!response.ok) throw new Error(`Unable to load published artifact: ${artifact}`);
      return response.json();
    }).catch((error) => {
      publishedRequests.delete(artifact);
      throw error;
    });
    publishedRequests.set(artifact, request);
  }
  return request as Promise<T>;
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
