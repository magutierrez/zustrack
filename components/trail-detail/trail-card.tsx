'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowUp, Clock, Ruler, RotateCcw, ArrowRight, Baby, PawPrint } from 'lucide-react';
import { EffortBadge } from './effort-badge';
import { TrailSearchParams } from '@/lib/trails';
import { cn } from '@/lib/utils';

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
  durationH: string;
  durationMin: string;
}

function formatDuration(mins: number, labels: Pick<TrailCardLabels, 'durationH' | 'durationMin'>): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}${labels.durationMin}`;
  if (m === 0) return `${h}${labels.durationH}`;
  return `${h}${labels.durationH} ${m}${labels.durationMin}`;
}

const EFFORT_DOT_COLORS: Record<string, string> = {
  easy: 'bg-emerald-400',
  moderate: 'bg-sky-400',
  hard: 'bg-amber-400',
  very_hard: 'bg-rose-400',
};

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

  const trailCodePrefix = trail.trail_code?.split('-')[0] ?? null;
  const effortDotClass = EFFORT_DOT_COLORS[trail.effort_level] ?? 'bg-sky-400';

  const searchParamsStr = sp ? new URLSearchParams(sp as any).toString() : '';
  const href = `/${locale}/trail/${trail.country}/${trail.slug}${searchParamsStr ? `?${searchParamsStr}` : ''}`;

  return (
    <Link
      href={href}
      className="group flex flex-row sm:flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      {/* Text content — left on mobile (order-1), below image on desktop (order-2) */}
      <div className="order-1 sm:order-2 flex flex-1 min-w-0 flex-col gap-2 sm:gap-3 p-3 sm:p-4">

        {/* Mobile-only badge row: trail code prefix + effort dot + effort label */}
        <div className="flex items-center gap-1.5 sm:hidden">
          {trailCodePrefix && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {trailCodePrefix}
            </span>
          )}
          <span className={cn('size-2 shrink-0 rounded-full', effortDotClass)} />
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            {effortLabel}
          </span>
        </div>

        {/* Name */}
        <h3 className="line-clamp-2 text-sm font-semibold text-zinc-900 group-hover:text-zinc-700 dark:text-white dark:group-hover:text-zinc-200">
          {trail.name}
        </h3>

        {/* Stats row — dot-separated on mobile, spaced on desktop */}
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 sm:gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <Ruler className="size-3 sm:size-3.5" />
            {trail.distance_km.toFixed(1)} {labels.km}
          </span>
          <span className="text-zinc-300 dark:text-zinc-600 sm:hidden" aria-hidden="true">·</span>
          <span className="flex items-center gap-1">
            <ArrowUp className="size-3 sm:size-3.5 text-emerald-500" />+
            {trail.elevation_gain_m.toLocaleString()} {labels.meters}
          </span>
          <span className="text-zinc-300 dark:text-zinc-600 sm:hidden" aria-hidden="true">·</span>
          <span className="flex items-center gap-1">
            <Clock className="size-3 sm:size-3.5" />
            {formatDuration(trail.estimated_duration_min, labels)}
          </span>
          {/* Shape — hidden on mobile (too cramped), desktop only */}
          <span className="hidden sm:flex items-center gap-1">
            {trail.is_circular ? (
              <RotateCcw className="size-3.5" />
            ) : (
              <ArrowRight className="size-3.5" />
            )}
            {trail.is_circular ? labels.circular : labels.linear}
          </span>
        </div>

        {/* Suitability icons — desktop only */}
        {(trail.child_friendly || trail.pet_friendly) && (
          <div className="hidden sm:flex gap-2">
            {trail.child_friendly && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                <Baby className="size-3" />
              </span>
            )}
            {trail.pet_friendly && (
              <span className="flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                <PawPrint className="size-3" />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Thumbnail (mobile: right, 96px wide) / Hero (desktop: top, aspect-2/1) */}
      <div
        className="relative order-2 w-24 shrink-0 sm:order-1 sm:w-auto sm:aspect-2/1 overflow-hidden bg-zinc-200 dark:bg-zinc-800"
        data-trail-img={trail.id}
      >
        {/* Skeleton */}
        {!imgLoaded && (
          <div className="absolute inset-0 animate-pulse">
            <div className="h-full w-full bg-linear-to-br from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="size-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-400 dark:border-zinc-600 dark:border-t-zinc-500" />
            </div>
          </div>
        )}
        <Image
          src={`/api/trails/${trail.id}/map-image?size=card`}
          alt={trail.name}
          fill
          sizes="(max-width: 640px) 96px, (max-width: 1024px) 50vw, 33vw"
          className={cn(
            'object-cover transition-all duration-500 group-hover:scale-105',
            imgLoaded ? 'opacity-100' : 'opacity-0',
          )}
          onLoad={() => setImgLoaded(true)}
          onError={() => {
            const wrapper = document.querySelector(`[data-trail-img="${trail.id}"]`) as HTMLElement | null;
            if (wrapper) wrapper.style.display = 'none';
          }}
          unoptimized
        />
        {/* Gradient overlay — desktop only */}
        <div className="hidden sm:block absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
        {/* Overlay badges — desktop only */}
        <div className="hidden sm:flex absolute right-2.5 bottom-2.5 left-2.5 items-end justify-between gap-2">
          {trail.trail_code ? (
            <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold text-zinc-900 shadow backdrop-blur-sm">
              {trail.trail_code}
            </span>
          ) : (
            <span />
          )}
          <EffortBadge level={trail.effort_level} label={effortLabel} className="shrink-0 shadow" />
        </div>
      </div>
    </Link>
  );
}
