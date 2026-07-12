'use client';

import { ArrowLeft, RotateCcw, ArrowRight, MapPin, Sun, Snowflake, Thermometer } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Trail } from '@/lib/trails';
import { EffortBadge } from './effort-badge';
import { TrailGpxDownload } from './trail-gpx-download';

interface TrailHeaderProps {
  trail: Trail;
  locale: string;
  searchParams: string;
  effortLabel: string;
  routeTypeLabel: string;
  seasonLabel: string;
}

function SeasonIcon({ season }: { season: string }) {
  if (season === 'avoid_summer') return <Sun className="size-4 text-amber-500" />;
  if (season === 'avoid_winter') return <Snowflake className="size-4 text-sky-400" />;
  return <Thermometer className="size-4 text-emerald-500" />;
}

export function TrailHeader({
  trail,
  locale,
  searchParams,
  effortLabel,
  routeTypeLabel,
  seasonLabel,
}: TrailHeaderProps) {
  const t = useTranslations('TrailPage');
  const regionName = trail.region_i18n?.[locale] ?? trail.region;

  return (
    <div className="space-y-3">
      {/* Back link — desktop only */}
      <Link
        href={`/${locale}/trail/${trail.country}${searchParams ? `?${searchParams}` : ''}`}
        className="hidden items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 lg:inline-flex dark:text-zinc-400 dark:hover:text-white"
      >
        <ArrowLeft className="size-4" />
        {t('backToTrails')}
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        {trail.trail_code && (
          <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-bold text-white dark:bg-white dark:text-zinc-900">
            {trail.trail_code}
          </span>
        )}
        <span className="hidden text-sm text-zinc-500 lg:block dark:text-zinc-400">
          {routeTypeLabel}
        </span>
        <span className="text-zinc-300 dark:text-zinc-600">·</span>
        <span className="inline-flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
          {trail.is_circular ? (
            <>
              <RotateCcw className="size-3.5" />
              {t('circular')}
            </>
          ) : (
            <>
              <ArrowRight className="size-3.5" />
              {t('linear')}
            </>
          )}
        </span>
      </div>

      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-4xl">
        {trail.name}
      </h1>

      {(trail.place || regionName) && (
        <p className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          <MapPin className="size-3.5 shrink-0" />
          {[trail.place, regionName].filter(Boolean).join(', ')}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <EffortBadge
          level={trail.effort_level}
          label={effortLabel}
          score={trail.difficulty_score}
        />
        <span className="inline-flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
          <SeasonIcon season={trail.season_best} />
          {seasonLabel}
        </span>
      </div>

      {trail.track_profile && trail.track_profile.length > 0 && (
        <div className="hidden pt-1 lg:block">
          <TrailGpxDownload
            name={trail.name}
            trackProfile={trail.track_profile}
            label={t('downloadGpx')}
          />
        </div>
      )}
    </div>
  );
}
