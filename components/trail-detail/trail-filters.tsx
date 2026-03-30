'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  clearFilters: string;
  easy: string;
  moderate: string;
  hard: string;
  veryHard: string;
}

interface Filters {
  q: string;
  effort: string;
  type: string;
  shape: string;
  child: string;
  pet: string;
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

export function TrailFilters({
  initial,
  labels,
}: {
  initial: Filters;
  labels: FilterLabels;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(initial.q);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete('page'); // reset pagination on filter change
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams],
  );

  const clearAll = useCallback(() => {
    setQ('');
    startTransition(() => {
      router.push(pathname);
    });
  }, [router, pathname]);

  const hasFilters =
    initial.q || initial.effort || initial.type || initial.shape || initial.child || initial.pet;

  const effort = searchParams.get('effort') ?? '';
  const type = searchParams.get('type') ?? '';
  const shape = searchParams.get('shape') ?? '';
  const child = searchParams.get('child') ?? '';
  const pet = searchParams.get('pet') ?? '';

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

      {/* Filter chips row */}
      <div className="flex flex-wrap gap-2">
        {/* Effort level */}
        <div className="flex flex-wrap gap-1.5">
          {EFFORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateParam('effort', effort === opt.value ? '' : opt.value)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-semibold transition',
                effort === opt.value
                  ? EFFORT_COLORS[opt.value]
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400',
              )}
            >
              {labels[opt.labelKey]}
            </button>
          ))}
        </div>

        <div className="mx-1 h-6 w-px self-center bg-slate-200 dark:bg-slate-700" />

        {/* Route type */}
        {(['GR', 'PR', 'SL'] as const).map((t) => (
          <button
            key={t}
            onClick={() => updateParam('type', type === t ? '' : t)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-bold transition',
              type === t
                ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400',
            )}
          >
            {t}
          </button>
        ))}

        <div className="mx-1 h-6 w-px self-center bg-slate-200 dark:bg-slate-700" />

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
              'rounded-full border px-3 py-1 text-xs font-medium transition',
              shape === opt.value
                ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400',
            )}
          >
            {opt.label}
          </button>
        ))}

        <div className="mx-1 h-6 w-px self-center bg-slate-200 dark:bg-slate-700" />

        {/* Child-friendly */}
        <button
          onClick={() => updateParam('child', child === 'true' ? '' : 'true')}
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-medium transition',
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
            'rounded-full border px-3 py-1 text-xs font-medium transition',
            pet === 'true'
              ? 'border-sky-400 bg-sky-50 text-sky-800 dark:border-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400',
          )}
        >
          🐾 {labels.filterPet}
        </button>

        {/* Clear all */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-400"
          >
            <X className="h-3 w-3" />
            {labels.clearFilters}
          </button>
        )}
      </div>
    </div>
  );
}
