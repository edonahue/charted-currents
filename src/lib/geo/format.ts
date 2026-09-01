/**
 * src/lib/geo/format.ts
 *
 * Sourced geographic coordinate formatter for Charted Currents.
 * Formats longitude and latitude with correct cardinal hemisphere indicators (N/S, E/W).
 */

export function formatCoordinates(lng: number, lat: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";
  const latAbs = Math.abs(lat).toFixed(4);
  const lngAbs = Math.abs(lng).toFixed(4);
  return `${latAbs}° ${latDir}, ${lngAbs}° ${lngDir}`;
}
