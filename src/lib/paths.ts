function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

/**
 * Resolve a public asset/data path against Astro's configured base path.
 * Packet 1 deploys at `/`, but callers should not scatter root-relative URLs.
 */
export function withBase(path: string): string {
  const base = ensureTrailingSlash(import.meta.env.BASE_URL || "/");
  return `${base}${path.replace(/^\/+/, "")}`;
}
