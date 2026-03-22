import Link from 'next/link';
import { ArrowUp, Clock, Ruler, RotateCcw, ArrowRight, Baby, PawPrint } from 'lucide-react';
import { EffortBadge } from './effort-badge';

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
}: {
  trail: TrailCardData;
  locale: string;
  labels: TrailCardLabels;
}) {
  const effortLabel =
    trail.effort_level === 'very_hard'
      ? labels.veryHard
      : labels[trail.effort_level as 'easy' | 'moderate' | 'hard'];

  return (
    <Link
      href={`/${locale}/trail/${trail.country}/${trail.slug}`}
      className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            {trail.trail_code && (
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white dark:bg-white dark:text-slate-900">
                {trail.trail_code}
              </span>
            )}
            {trail.route_type && trail.route_type !== 'unknown' && (
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                {trail.route_type}
              </span>
            )}
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-slate-700 dark:text-white dark:group-hover:text-slate-200">
            {trail.name}
          </h3>
        </div>
        <EffortBadge level={trail.effort_level} label={effortLabel} className="shrink-0" />
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <Ruler className="h-3.5 w-3.5" />
          {trail.distance_km.toFixed(1)} {labels.km}
        </span>
        <span className="flex items-center gap-1">
          <ArrowUp className="h-3.5 w-3.5 text-emerald-500" />
          +{trail.elevation_gain_m.toLocaleString()} {labels.meters}
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
    </Link>
  );
}
