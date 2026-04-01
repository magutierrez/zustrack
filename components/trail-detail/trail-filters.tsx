'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import type { TrailRanges } from '@/lib/trails';

interface FilterLabels {
  searchPlaceholder: string;
  filterEffort: string;
  filterType: string;
  filterShape: string;
  allShapes: string;
  circular: string;
  linear: string;
  filterChild: string;
  filterPet: string;
  filterSeason: string;
  filterDistance: string;
  filterElevation: string;
  clearFilters: string;
  easy: string;
  moderate: string;
  hard: string;
  veryHard: string;
  km: string;
  meters: string;
  yearRound: string;
  avoidSummer: string;
  avoidWinter: string;
}

interface Filters {
  q: string;
  effort: string;
  type: string;
  shape: string;
  child: string;
  pet: string;
  minDist: string;
  maxDist: string;
  minGain: string;
  maxGain: string;
  season: string;
}

const EFFORT_OPTIONS = [
  { value: 'easy', labelKey: 'easy' as keyof FilterLabels },
  { value: 'moderate', labelKey: 'moderate' as keyof FilterLabels },
  { value: 'hard', labelKey: 'hard' as keyof FilterLabels },
  { value: 'very_hard', labelKey: 'veryHard' as keyof FilterLabels },
];

const EFFORT_COLORS: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700',
  moderate: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-700',
  hard: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700',
  very_hard: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-700',
};

const SEASON_OPTIONS: { value: string; labelKey: keyof FilterLabels }[] = [
  { value: 'year_round', labelKey: 'yearRound' },
  { value: 'avoid_summer', labelKey: 'avoidSummer' },
  { value: 'avoid_winter', labelKey: 'avoidWinter' },
];

export function TrailFilters({
  initial,
  labels,
  ranges,
}: {
  initial: Filters;
  labels: FilterLabels;
  ranges: TrailRanges;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(initial.q);

  const [distRange, setDistRange] = useState<[number, number]>([
    initial.minDist ? parseFloat(initial.minDist) : ranges.minDistance,
    initial.maxDist ? parseFloat(initial.maxDist) : ranges.maxDistance,
  ]);
  const [gainRange, setGainRange] = useState<[number, number]>([
    initial.minGain ? parseFloat(initial.minGain) : ranges.minElevation,
    initial.maxGain ? parseFloat(initial.maxGain) : ranges.maxElevation,
  ]);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete('page');
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams],
  );

  const updateTwoParams = useCallback(
    (k1: string, v1: string, k2: string, v2: string, isDefault: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      if (isDefault) {
        params.delete(k1);
        params.delete(k2);
      } else {
        params.set(k1, v1);
        params.set(k2, v2);
      }
      params.delete('page');
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams],
  );

  const clearAll = useCallback(() => {
    setQ('');
    setDistRange([ranges.minDistance, ranges.maxDistance]);
    setGainRange([ranges.minElevation, ranges.maxElevation]);
    startTransition(() => {
      router.push(pathname);
    });
  }, [router, pathname, ranges]);

  const hasFilters =
    initial.q ||
    initial.effort ||
    initial.type ||
    initial.shape ||
    initial.child ||
    initial.pet ||
    initial.season ||
    initial.minDist ||
    initial.maxDist ||
    initial.minGain ||
    initial.maxGain;

  const effort = searchParams.get('effort') ?? '';
  const type = searchParams.get('type') ?? '';
  const shape = searchParams.get('shape') ?? '';
  const child = searchParams.get('child') ?? '';
  const pet = searchParams.get('pet') ?? '';
  const season = searchParams.get('season') ?? '';

  return (
    <div className={cn('space-y-3 transition-opacity', isPending && 'opacity-60')}>
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') updateParam('q', q);
          }}
          onBlur={() => updateParam('q', q)}
          placeholder={labels.searchPlaceholder}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
        />
        {q && (
          <button
            onClick={() => { setQ(''); updateParam('q', ''); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter chips row — horizontal scroll on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* Effort level */}
        <div className="flex shrink-0 gap-1.5">
          {EFFORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateParam('effort', effort === opt.value ? '' : opt.value)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition',
                effort === opt.value
                  ? EFFORT_COLORS[opt.value]
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400',
              )}
            >
              {labels[opt.labelKey]}
            </button>
          ))}
        </div>

        <div className="mx-1 h-6 w-px shrink-0 self-center bg-slate-200 dark:bg-slate-700" />

        {/* Route type */}
        {(['GR', 'PR', 'SL'] as const).map((t) => (
          <button
            key={t}
            onClick={() => updateParam('type', type === t ? '' : t)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1 text-xs font-bold transition',
              type === t
                ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400',
            )}
          >
            {t}
          </button>
        ))}

        <div className="mx-1 h-6 w-px shrink-0 self-center bg-slate-200 dark:bg-slate-700" />

        {/* Shape toggle */}
        {[
          { value: '', label: labels.allShapes },
          { value: 'circular', label: labels.circular },
          { value: 'linear', label: labels.linear },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => updateParam('shape', opt.value)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition',
              shape === opt.value
                ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400',
            )}
          >
            {opt.label}
          </button>
        ))}

        <div className="mx-1 h-6 w-px shrink-0 self-center bg-slate-200 dark:bg-slate-700" />

        {/* Child-friendly */}
        <button
          onClick={() => updateParam('child', child === 'true' ? '' : 'true')}
          className={cn(
            'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition',
            child === 'true'
              ? 'border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400',
          )}
        >
          👶 {labels.filterChild}
        </button>

        {/* Pet-friendly */}
        <button
          onClick={() => updateParam('pet', pet === 'true' ? '' : 'true')}
          className={cn(
            'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition',
            pet === 'true'
              ? 'border-sky-400 bg-sky-50 text-sky-800 dark:border-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400',
          )}
        >
          🐾 {labels.filterPet}
        </button>

        <div className="mx-1 h-6 w-px shrink-0 self-center bg-slate-200 dark:bg-slate-700" />

        {/* Season */}
        {SEASON_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => updateParam('season', season === opt.value ? '' : opt.value)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition',
              season === opt.value
                ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400',
            )}
          >
            {labels[opt.labelKey]}
          </button>
        ))}

        {/* Clear all */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex shrink-0 items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-400"
          >
            <X className="h-3 w-3" />
            {labels.clearFilters}
          </button>
        )}
      </div>

      {/* Slider row — distance and elevation gain */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 pt-1 sm:grid-cols-2">
        {/* Distance */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-400">{labels.filterDistance}</span>
            <span className="text-slate-500 dark:text-slate-500">
              {distRange[0]}–{distRange[1]} {labels.km}
            </span>
          </div>
          <Slider
            min={ranges.minDistance}
            max={ranges.maxDistance}
            step={1}
            value={distRange}
            onValueChange={(v) => setDistRange(v as [number, number])}
            onValueCommit={(v) => {
              const [a, b] = v;
              const isDefault = a === ranges.minDistance && b === ranges.maxDistance;
              updateTwoParams('minDist', String(a), 'maxDist', String(b), isDefault);
            }}
          />
        </div>

        {/* Elevation gain */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-400">{labels.filterElevation}</span>
            <span className="text-slate-500 dark:text-slate-500">
              {gainRange[0]}–{gainRange[1]} {labels.meters}
            </span>
          </div>
          <Slider
            min={ranges.minElevation}
            max={ranges.maxElevation}
            step={50}
            value={gainRange}
            onValueChange={(v) => setGainRange(v as [number, number])}
            onValueCommit={(v) => {
              const [a, b] = v;
              const isDefault = a === ranges.minElevation && b === ranges.maxElevation;
              updateTwoParams('minGain', String(a), 'maxGain', String(b), isDefault);
            }}
          />
        </div>
      </div>
    </div>
  );
}
