'use client';

import { X } from 'lucide-react';
import Link from 'next/link';
import { EFFORT_COLORS } from './trails-map-constants';

export interface SelectedTrailInfo {
  lng: number;
  lat: number;
  name: string;
  trail_code: string | null;
  distance_km: number;
  effort_level: string;
  slug: string;
  country: string;
  elevation_gain_m?: number;
  elevation_loss_m?: number;
  elevation_min_m?: number;
  elevation_max_m?: number;
}

interface TrailPopupProps {
  selectedTrail: SelectedTrailInfo;
  clearTrailSelection: () => void;
  getEffortLabel: (effort: string) => string;
  labels: {
    viewTrail: string;
    loading: string;
    km: string;
    lowPoint: string;
    highPoint: string;
  };
  locale: string;
  trackLoading: boolean;
}

export function TrailPopup({
  selectedTrail,
  clearTrailSelection,
  getEffortLabel,
  labels,
  locale,
  trackLoading,
}: TrailPopupProps) {
  return (
    <div className="absolute top-4 left-1/2 z-20 w-[90%] max-w-sm -translate-x-1/2 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative p-4">
        <button
          onClick={clearTrailSelection}
          className="absolute top-3 right-3 rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        <div className="mb-2 flex flex-wrap items-center gap-2 pr-6">
          {selectedTrail.trail_code && (
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm"
              style={{
                backgroundColor: EFFORT_COLORS[selectedTrail.effort_level] ?? '#94a3b8',
              }}
            >
              {selectedTrail.trail_code}
            </span>
          )}
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm"
            style={{
              backgroundColor: `${EFFORT_COLORS[selectedTrail.effort_level] ?? '#94a3b8'}20`,
              color: EFFORT_COLORS[selectedTrail.effort_level] ?? '#94a3b8',
            }}
          >
            {getEffortLabel(selectedTrail.effort_level)}
          </span>
        </div>

        <h3 className="mb-3 line-clamp-2 pr-6 text-sm leading-tight font-semibold text-zinc-900 dark:text-white">
          {selectedTrail.name}
        </h3>

        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold tracking-wider text-zinc-500 uppercase">
              {labels.km}
            </span>
            <span className="text-xs font-semibold text-zinc-900 tabular-nums dark:text-white">
              {selectedTrail.distance_km.toFixed(1)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold tracking-wider text-emerald-500 uppercase">D+</span>
            <span className="text-xs font-semibold text-zinc-900 tabular-nums dark:text-white">
              {selectedTrail.elevation_gain_m != null ? `${selectedTrail.elevation_gain_m}m` : '--'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold tracking-wider text-red-500 uppercase">D-</span>
            <span className="text-xs font-semibold text-zinc-900 tabular-nums dark:text-white">
              {selectedTrail.elevation_loss_m != null ? `${selectedTrail.elevation_loss_m}m` : '--'}
            </span>
          </div>
          <div className="flex flex-col">
            <span
              className="line-clamp-1 text-[9px] font-bold tracking-wider text-zinc-500 uppercase"
              title={labels.lowPoint}
            >
              {labels.lowPoint}
            </span>
            <span className="text-xs font-semibold text-zinc-900 tabular-nums dark:text-white">
              {selectedTrail.elevation_min_m != null ? `${selectedTrail.elevation_min_m}m` : '--'}
            </span>
          </div>
          <div className="flex flex-col">
            <span
              className="line-clamp-1 text-[9px] font-bold tracking-wider text-zinc-500 uppercase"
              title={labels.highPoint}
            >
              {labels.highPoint}
            </span>
            <span className="text-xs font-semibold text-zinc-900 tabular-nums dark:text-white">
              {selectedTrail.elevation_max_m != null ? `${selectedTrail.elevation_max_m}m` : '--'}
            </span>
          </div>
        </div>

        {trackLoading ? (
          <div className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <svg className="size-3.5 animate-spin text-zinc-400" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="text-xs font-medium text-zinc-500">{labels.loading}</span>
          </div>
        ) : (
          <Link
            href={`/${locale}/trail/${selectedTrail.country}/${selectedTrail.slug}`}
            className="flex h-9 w-full items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {labels.viewTrail}
          </Link>
        )}
      </div>
    </div>
  );
}
