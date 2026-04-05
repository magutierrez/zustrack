'use client';

import dynamic from 'next/dynamic';
import type { TrailSearchParams } from '@/lib/trails';

const TrailsMap = dynamic(() => import('./trails-map').then((m) => ({ default: m.TrailsMap })), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-900">
      <span className="text-sm text-slate-400">Loading map…</span>
    </div>
  ),
});

interface TrailsMapWrapperProps {
  searchParams: TrailSearchParams;
  locale: string;
  country: string;
  labels: {
    viewTrail: string;
    loading: string;
    noTrails: string;
    effort: { easy: string; moderate: string; hard: string; veryHard: string };
    km: string;
    meters: string;
    elevationGain: string;
    elevationLoss: string;
    lowPoint: string;
    highPoint: string;
  };
}

export function TrailsMapWrapper({ searchParams, locale, country, labels }: TrailsMapWrapperProps) {
  return <TrailsMap searchParams={searchParams} locale={locale} country={country} labels={labels} />;
}
