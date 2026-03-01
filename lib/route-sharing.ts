import polyline from '@mapbox/polyline';
import LZString from 'lz-string';
import { haversineDistance } from './gpx-parser';
import type { GPXData, RoutePoint } from './types';

export interface SharedRoutePayload {
  p: string;
  e: string;
  n: string;
  td: number;
  tg: number;
  tl: number;
  a?: string;
}

export function parseHashPayload(): SharedRoutePayload | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash;
  if (!hash.startsWith('#route=')) return null;
  try {
    const compressed = hash.slice('#route='.length);
    const json = LZString.decompressFromEncodedURIComponent(compressed);
    if (!json) return null;
    return JSON.parse(json) as SharedRoutePayload;
  } catch {
    return null;
  }
}

export function decodeSharedRoute(payload: SharedRoutePayload): GPXData {
  const coords = polyline.decode(payload.p, 5);

  // Reconstruct elevations from delta-encoded comma-separated string
  const deltas = payload.e.split(',').map(Number);
  const eles: number[] = [];
  for (let i = 0; i < deltas.length; i++) {
    eles.push(i === 0 ? deltas[0] : eles[i - 1] + deltas[i]);
  }

  const ELE_THRESHOLD = 5;
  let lastCommittedEle: number | undefined;
  let totalDistance = 0;
  let totalElevationGain = 0;
  let totalElevationLoss = 0;
  const points: RoutePoint[] = [];

  for (let i = 0; i < coords.length; i++) {
    const [lat, lon] = coords[i];
    const ele = eles[i] !== undefined ? eles[i] : undefined;

    if (i > 0) {
      const prev = points[i - 1];
      totalDistance += haversineDistance(prev.lat, prev.lon, lat, lon);

      if (ele !== undefined) {
        if (lastCommittedEle === undefined) {
          lastCommittedEle = ele;
        } else {
          const diff = ele - lastCommittedEle;
          if (diff >= ELE_THRESHOLD) {
            totalElevationGain += diff;
            lastCommittedEle = ele;
          } else if (diff <= -ELE_THRESHOLD) {
            totalElevationLoss += Math.abs(diff);
            lastCommittedEle = ele;
          }
        }
      }
    } else if (ele !== undefined) {
      lastCommittedEle = ele;
    }

    points.push({ lat, lon, ele, distanceFromStart: totalDistance });
  }

  return { points, name: payload.n, totalDistance, totalElevationGain, totalElevationLoss };
}
