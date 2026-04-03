'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';

interface TrackPoint {
  lat: number;
  lng: number;
  d: number;
  e: number | null;
}

interface Labels {
  paceEstimator: string;
  calorieEstimator: string;
  bodyWeight: string;
  kg: string;
  perKm: string;
  estimatedCalories: string;
  duration: string;
  meters: string;
  km: string;
}

/** Tobler's hiking function: speed in km/h given slope (rise/run decimal) */
function toblerSpeed(slope: number): number {
  return 6 * Math.exp(-3.5 * Math.abs(slope + 0.05));
}

interface KmSplit {
  km: number;
  minutes: number;
  avgSpeedKmh: number;
}

function computeSplits(profile: TrackPoint[]): KmSplit[] {
  if (profile.length < 2) return [];

  const splits: KmSplit[] = [];
  let currentKm = 1;
  let timeInSplit = 0;
  let distInSplit = 0;

  for (let i = 1; i < profile.length; i++) {
    const prev = profile[i - 1];
    const curr = profile[i];
    const segDist = curr.d - prev.d; // km
    if (segDist <= 0) continue;

    const elevDiff = (curr.e ?? prev.e ?? 0) - (prev.e ?? curr.e ?? 0);
    const slope = elevDiff / (segDist * 1000);
    const speed = toblerSpeed(slope);
    const segTime = (segDist / speed) * 60; // minutes

    timeInSplit += segTime;
    distInSplit += segDist;

    if (curr.d >= currentKm || i === profile.length - 1) {
      splits.push({
        km: currentKm,
        minutes: Math.round(timeInSplit),
        avgSpeedKmh: Math.round((distInSplit / (timeInSplit / 60)) * 10) / 10,
      });
      currentKm++;
      timeInSplit = 0;
      distInSplit = 0;
    }
  }

  return splits;
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

export function TrailPaceCard({
  trackProfile,
  distanceKm,
  elevationGainM,
  labels,
}: {
  trackProfile: TrackPoint[];
  distanceKm: number;
  elevationGainM: number;
  labels: Labels;
}) {
  const [weight, setWeight] = useState(70);

  const splits = useMemo(() => computeSplits(trackProfile), [trackProfile]);

  const totalMinutes = useMemo(() => splits.reduce((s, sp) => s + sp.minutes, 0), [splits]);

  // Calorie estimate: MET-based approximation
  const calories = useMemo(() => {
    const durationH = totalMinutes / 60;
    const met = 4 + (elevationGainM / Math.max(distanceKm, 1)) * 0.01;
    return Math.round(met * weight * durationH);
  }, [weight, totalMinutes, elevationGainM, distanceKm]);

  if (!splits.length) return null;

  const minPace = Math.min(...splits.map((s) => s.minutes));
  const maxPace = Math.max(...splits.map((s) => s.minutes));

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{labels.paceEstimator}</h2>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {labels.duration}: <strong className="text-slate-900 dark:text-white">{formatTime(totalMinutes)}</strong>
        </span>
      </div>

      {/* Splits bar chart */}
      <div className="space-y-1.5">
        {splits.map((split) => {
          const pct = maxPace > minPace ? ((split.minutes - minPace) / (maxPace - minPace)) * 100 : 50;
          const color =
            split.minutes <= minPace + (maxPace - minPace) * 0.33
              ? 'bg-emerald-500'
              : split.minutes <= minPace + (maxPace - minPace) * 0.66
                ? 'bg-amber-500'
                : 'bg-rose-500';
          return (
            <div key={split.km} className="flex items-center gap-2">
              <span className="w-10 shrink-0 text-right text-[11px] text-slate-400">
                km {split.km}
              </span>
              <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={cn('h-full rounded-full transition-all', color)}
                  style={{ width: `${Math.max(10, pct)}%` }}
                />
              </div>
              <span className="w-14 shrink-0 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                {split.minutes}min
              </span>
              <span className="hidden w-16 shrink-0 text-[11px] text-slate-400 sm:block">
                {split.avgSpeedKmh} km/h
              </span>
            </div>
          );
        })}
      </div>

      {/* Calorie estimator */}
      <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {labels.calorieEstimator}
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            ~{calories.toLocaleString()} kcal
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
            {labels.bodyWeight}: <strong>{weight} {labels.kg}</strong>
          </span>
          <Slider
            min={40}
            max={130}
            step={5}
            value={[weight]}
            onValueChange={([v]) => setWeight(v)}
            className="flex-1"
          />
        </div>
      </div>
    </section>
  );
}
