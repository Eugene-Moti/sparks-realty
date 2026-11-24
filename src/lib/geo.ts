/**
 * Privacy offset for public maps: exact coordinates never leave the server.
 * Deterministic per listing (same pin every visit) and ~±165 m in each axis,
 * so a pin points to the neighbourhood, not the gate.
 */
export function approximateLocation(id: string, lat: number, lng: number): [number, number] {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619) >>> 0;
  const a = ((h & 0xffff) / 0xffff - 0.5) * 0.003;
  const b = (((h >>> 16) & 0xffff) / 0xffff - 0.5) * 0.003;
  return [lat + a, lng + b];
}

/** Radius (metres) of the "somewhere in here" circle drawn on detail maps. */
export const APPROXIMATE_RADIUS_M = 350;
