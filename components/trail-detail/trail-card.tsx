'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowUp, Clock, Ruler, RotateCcw, ArrowRight, Baby, PawPrint } from 'lucide-react';
import { EffortBadge } from './effort-badge';
import { TrailSearchParams } from '@/lib/trails';

interface TrailCardData {
  id: number;
  slug: string;
  country: string;
  name: string;
  trail_code: string | null;
  route_type: string | null;
  distance_km: number;
  elevation_gain_m: number;
  estimated_duration_min: number;
  effort_level: string;
  difficulty_score: number;
  is_circular: boolean;
  child_friendly: boolean;
  pet_friendly: boolean;
}

interface TrailCardLabels {
  easy: string;
  moderate: string;
  hard: string;
  veryHard: string;
  circular: string;
  linear: string;
  km: string;
  meters: string;
}

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function TrailCard({
  trail,
  locale,
  labels,
  sp,
}: {
  trail: TrailCardData;
  locale: string;
  labels: TrailCardLabels;
  sp?: TrailSearchParams;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);

  const effortLabel =
    trail.effort_level === 'very_hard'
      ? labels.veryHard
      : labels[trail.effort_level as 'easy' | 'moderate' | 'hard'];

  const searchParamsStr = sp ? new URLSearchParams(sp as any).toString() : '';
  const href = `/${locale}/trail/${trail.country}/${trail.slug}${searchParamsStr ? `?${searchParamsStr}` : ''}`;

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
    >
      {/* Map image hero */}
      <div className="relative aspect-2/1 overflow-hidden bg-slate-200 dark:bg-slate-800">
        {/* Skeleton */}
        {!imgLoaded && (
          <div className="absolute inset-0 animate-pulse">
            <div className="h-full w-full bg-linear-to-br from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-400 dark:border-slate-600 dark:border-t-slate-500" />
            </div>
          </div>
        )}
        <img
          src={`/api/trails/${trail.id}/map-image?size=wide`}
          alt={trail.name}
          loading="lazy"
          className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImgLoaded(true)}
          onError={(e) => {
            (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
          }}
        />
        {/* Bottom gradient so badges are always readable */}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
        {/* Badges overlaid on image */}
        <div className="absolute right-2.5 bottom-2.5 left-2.5 flex items-end justify-between gap-2">
          {trail.trail_code ? (
            <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold text-slate-900 shadow backdrop-blur-sm">
              {trail.trail_code}
            </span>
          ) : (
            <span />
          )}
          <EffortBadge level={trail.effort_level} label={effortLabel} className="shrink-0 shadow" />
        </div>
      </div>

      {/* Text content */}
      <div className="flex flex-col gap-3 p-4">
        {/* Name */}
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-slate-700 dark:text-white dark:group-hover:text-slate-200">
          {trail.name}
        </h3>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Ruler className="h-3.5 w-3.5" />
            {trail.distance_km.toFixed(1)} {labels.km}
          </span>
          <span className="flex items-center gap-1">
            <ArrowUp className="h-3.5 w-3.5 text-emerald-500" />+
            {trail.elevation_gain_m.toLocaleString()} {labels.meters}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(trail.estimated_duration_min)}
          </span>
          <span className="flex items-center gap-1">
            {trail.is_circular ? (
              <RotateCcw className="h-3.5 w-3.5" />
            ) : (
              <ArrowRight className="h-3.5 w-3.5" />
            )}
            {trail.is_circular ? labels.circular : labels.linear}
          </span>
        </div>

        {/* Suitability icons */}
        {(trail.child_friendly || trail.pet_friendly) && (
          <div className="flex gap-2">
            {trail.child_friendly && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                <Baby className="h-3 w-3" />
              </span>
            )}
            {trail.pet_friendly && (
              <span className="flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                <PawPrint className="h-3 w-3" />
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
