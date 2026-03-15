import type { RoutePoint } from './types';

/**
 * Interpolates a point along a route at the given distance from start.
 * Returns null if the points array has fewer than 2 entries.
 */
export function interpolatePointOnRoute(
  points: RoutePoint[],
  activeDistance: number,
): RoutePoint | null {
  if (points.length < 2) return null;

  let p1 = points[0];
  let p2 = points[1];

  for (let i = 0; i < points.length - 1; i++) {
    if (
      activeDistance >= points[i].distanceFromStart &&
      activeDistance <= points[i + 1].distanceFromStart
    ) {
      p1 = points[i];
      p2 = points[i + 1];
      break;
    }
  }

  const segmentDist = p2.distanceFromStart - p1.distanceFromStart;
  const ratio = segmentDist > 0 ? (activeDistance - p1.distanceFromStart) / segmentDist : 0;

  return {
    lat: p1.lat + (p2.lat - p1.lat) * ratio,
    lon: p1.lon + (p2.lon - p1.lon) * ratio,
    ele: (p1.ele || 0) + ((p2.ele || 0) - (p1.ele || 0)) * ratio,
    distanceFromStart: activeDistance,
  };
}

/**
 * Projects a geographic coordinate (lat/lon) onto the segment between
 * points[i] and points[i+1]. Returns null if the segment index is out of range.
 */
export function projectOntoSegment(
  points: RoutePoint[],
  i: number,
  lat: number,
  lon: number,
): { t: number; distSq: number; point: RoutePoint } | null {
  if (i < 0 || i >= points.length - 1) return null;
  const p1 = points[i];
  const p2 = points[i + 1];
  const dx = p2.lon - p1.lon;
  const dy = p2.lat - p1.lat;
  const lenSq = dx * dx + dy * dy;
  const t =
    lenSq > 0
      ? Math.max(0, Math.min(1, ((lon - p1.lon) * dx + (lat - p1.lat) * dy) / lenSq))
      : 0;
  const projLon = p1.lon + t * dx;
  const projLat = p1.lat + t * dy;

  return {
    t,
    distSq: (lon - projLon) ** 2 + (lat - projLat) ** 2,
    point: {
      lat: projLat,
      lon: projLon,
      ele: (p1.ele || 0) + t * ((p2.ele || 0) - (p1.ele || 0)),
      distanceFromStart: p1.distanceFromStart + t * (p2.distanceFromStart - p1.distanceFromStart),
    },
  };
}

/**
 * Calculates the initial bearing (azimuth) from p1 to p2 in degrees [0, 360).
 */
export function calculateBearing(
  p1: { lat: number; lon: number },
  p2: { lat: number; lon: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const lat1 = toRad(p1.lat);
  const lat2 = toRad(p2.lat);
  const dLon = toRad(p2.lon - p1.lon);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Finds the index of the route point closest to the given lat/lon.
 */
export function findClosestPointIndex(
  points: RoutePoint[],
  lat: number,
  lon: number,
): number {
  let minDist = Infinity;
  let closestIdx = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const d = (p.lon - lon) ** 2 + (p.lat - lat) ** 2;
    if (d < minDist) {
      minDist = d;
      closestIdx = i;
    }
  }
  return closestIdx;
}
