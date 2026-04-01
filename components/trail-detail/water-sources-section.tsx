'use client';

import { Droplets, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WaterSource {
  lat: number;
  lng: number;
  name: string;
  type: 'natural' | 'urban';
  distanceFromRoute: number;
  reliability: 'high' | 'medium' | 'low';
}

interface TrackPoint {
  lat: number;
  lng: number;
  d: number;
  e: number | null;
}

interface Labels {
  waterSources: string;
  natural: string;
  urban: string;
  reliable: string;
  seasonal: string;
  unreliable: string;
  kmAway: string;
  showOnMap: string;
  waterGapMax: string;
  waterCarryRecommendation: string;
  liters: string;
}

const RELIABILITY_STYLES = {
  high: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  low: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Project a water source onto the route and return its distance-along-route (km) */
function projectToRoute(source: WaterSource, profile: TrackPoint[]): number {
  let minDist = Infinity;
  let bestD = 0;
  for (const pt of profile) {
    const d = haversineKm(pt.lat, pt.lng, source.lat, source.lng);
    if (d < minDist) {
      minDist = d;
      bestD = pt.d;
    }
  }
  return bestD;
}

function computeMaxGap(sources: WaterSource[], totalKm: number, profile: TrackPoint[]): number {
  if (!sources.length) return totalKm;
  const positions = sources.map((s) => projectToRoute(s, profile)).sort((a, b) => a - b);
  // Gaps: start→first, between each pair, last→end
  const gaps = [
    positions[0],
    ...positions.slice(1).map((d, i) => d - positions[i]),
    totalKm - positions[positions.length - 1],
  ];
  return Math.round(Math.max(...gaps) * 10) / 10;
}

export function WaterSourcesSection({
  waterSources,
  trackProfile,
  distanceKm,
  estimatedDurationMin,
  labels,
  activePOI,
  onShowOnMap,
}: {
  waterSources: WaterSource[];
  trackProfile?: TrackPoint[];
  distanceKm?: number;
  estimatedDurationMin?: number;
  labels: Labels;
  activePOI?: { lat: number; lng: number } | null;
  onShowOnMap?: (lat: number, lng: number) => void;
}) {
  const reliabilityLabel = (r: WaterSource['reliability']) =>
    r === 'high' ? labels.reliable : r === 'medium' ? labels.seasonal : labels.unreliable;

  // Water gap analysis
  const maxGap =
    trackProfile && distanceKm
      ? computeMaxGap(waterSources, distanceKm, trackProfile)
      : null;

  const durationH = (estimatedDurationMin ?? 0) / 60;
  const recommendedLiters = Math.ceil(durationH * 0.5) + (maxGap !== null && maxGap > 4 ? 1 : 0);

  const gapColor =
    maxGap === null
      ? ''
      : maxGap > 6
        ? 'text-rose-600 dark:text-rose-400'
        : maxGap > 3
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-emerald-600 dark:text-emerald-400';

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{labels.waterSources}</h2>

      {/* Water gap summary */}
      {maxGap !== null && (
        <div className="flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div>
            <span className="text-slate-500 dark:text-slate-400">{labels.waterGapMax}: </span>
            <strong className={cn('font-semibold', gapColor)}>{maxGap} km</strong>
          </div>
          {recommendedLiters > 0 && (
            <div>
              <span className="text-slate-500 dark:text-slate-400">
                {labels.waterCarryRecommendation}{' '}
              </span>
              <strong className="font-semibold text-slate-900 dark:text-white">
                {recommendedLiters} {labels.liters}
              </strong>
            </div>
          )}
        </div>
      )}

      <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
        {waterSources.map((ws, i) => {
          const isActive =
            activePOI && Math.abs(activePOI.lat - ws.lat) < 0.00001 && Math.abs(activePOI.lng - ws.lng) < 0.00001;
          return (
            <li
              key={i}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                isActive ? 'bg-sky-50 dark:bg-sky-900/10' : ''
              }`}
            >
              <Droplets className="h-4 w-4 shrink-0 text-sky-400" />
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">
                  {ws.name}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {ws.type === 'natural' ? labels.natural : labels.urban}
                </span>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${RELIABILITY_STYLES[ws.reliability]}`}
              >
                {reliabilityLabel(ws.reliability)}
              </span>
              <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                {ws.distanceFromRoute} {labels.kmAway}
              </span>
              {onShowOnMap && (
                <button
                  onClick={() => onShowOnMap(ws.lat, ws.lng)}
                  className="ml-1 flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <Navigation className="h-3 w-3" />
                  {labels.showOnMap}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
