'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { Search, X, SlidersHorizontal, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RegionOption } from '@/lib/trails';
import { Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import type { TrailRanges } from '@/lib/trails';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FilterLabels {
  searchPlaceholder: string;
  filterEffort: string;
  filterType: string;
  filterShape: string;
  filterChild: string;
  filterPet: string;
  filterSeason: string;
  filterDistance: string;
  filterElevation: string;
  filterProfile: string;
  filterMore: string;
  clearFilters: string;
  viewResults: string;
  easy: string;
  moderate: string;
  hard: string;
  veryHard: string;
  circular: string;
  linear: string;
  km: string;
  meters: string;
  yearRound: string;
  avoidSummer: string;
  avoidWinter: string;
  filterRegion: string;
  regionPlaceholder: string;
  noRegions: string;
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
  region: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EFFORT_OPTIONS = [
  { value: 'easy', labelKey: 'easy' as keyof FilterLabels },
  { value: 'moderate', labelKey: 'moderate' as keyof FilterLabels },
  { value: 'hard', labelKey: 'hard' as keyof FilterLabels },
  { value: 'very_hard', labelKey: 'veryHard' as keyof FilterLabels },
];

const EFFORT_COLORS: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700',
  moderate:
    'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-700',
  hard: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700',
  very_hard:
    'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-700',
};

const SEASON_OPTIONS: { value: string; labelKey: keyof FilterLabels }[] = [
  { value: 'year_round', labelKey: 'yearRound' },
  { value: 'avoid_summer', labelKey: 'avoidSummer' },
  { value: 'avoid_winter', labelKey: 'avoidWinter' },
];

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function VSep() {
  return <div className="hidden w-px self-stretch bg-slate-200 md:block dark:bg-slate-700" />;
}

function Chip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-all',
        active
          ? (color ??
              'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900')
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400',
      )}
    >
      {children}
    </button>
  );
}

function SliderCard({
  label,
  value,
  unit,
  min,
  max,
  step,
  histogram,
  onChange,
  onCommit,
}: {
  label: string;
  value: [number, number];
  unit: string;
  min: number;
  max: number;
  step: number;
  histogram?: number[];
  onChange: (v: [number, number]) => void;
  onCommit: (v: number[]) => void;
}) {
  const isFiltered = value[0] !== min || value[1] !== max;

  // Histogram logic
  const hasHistogram = histogram && histogram.length > 0;
  const rawMax = hasHistogram ? Math.max(...histogram) : 0;
  const maxHistCount = rawMax > 0 ? rawMax : 1;
  const rangeSpan = max - min;
  const histStep = rangeSpan / (hasHistogram ? histogram.length : 1);

  return (
    <div
      className={cn(
        'rounded-xl border p-3 transition-colors',
        isFiltered
          ? 'border-slate-900 bg-slate-50 dark:border-slate-400 dark:bg-slate-800/60'
          : 'border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40',
      )}
    >
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</span>
        <span
          className={cn(
            'text-xs font-bold tabular-nums',
            isFiltered ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500',
          )}
        >
          {value[0]}–{value[1]} {unit}
        </span>
      </div>

      {hasHistogram && (
        <div className="flex h-10 w-full items-end gap-[1px] px-1">
          {histogram.map((count, i) => {
            // Determine if this bin falls within the currently selected range
            const binStart = min + i * histStep;
            const binEnd = min + (i + 1) * histStep;
            // A bin is considered "in range" if it overlaps the selected value
            const inRange = binEnd > value[0] && binStart < value[1];

            const heightPct = count > 0 ? Math.max(10, (count / maxHistCount) * 100) : 0;

            return (
              <div
                key={i}
                className={cn(
                  'flex-1 rounded-t-sm transition-colors',
                  inRange ? 'bg-blue-500/80 dark:bg-blue-500/60' : 'bg-slate-200 dark:bg-slate-700',
                )}
                style={{ height: `${heightPct}%` }}
              />
            );
          })}
        </div>
      )}

      <Slider
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={(v) => onChange(v as [number, number])}
        onValueCommit={onCommit}
      />
      <div className="mt-1.5 flex justify-between text-[10px] text-slate-400 dark:text-slate-600">
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </div>
    </div>
  );
}

function RegionCombobox({
  regions,
  value,
  onChange,
  placeholder,
  noRegions,
  allLabel,
}: {
  regions: RegionOption[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  noRegions: string;
  allLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = regions.find((r) => r.value === value)?.label ?? value;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all',
            value
              ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400',
          )}
        >
          <span className="max-w-[140px] truncate">{value ? selectedLabel : allLabel}</span>
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[220px] p-0"
        align="start"
        onWheel={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <Command>
          <CommandInput placeholder={placeholder} className="h-9" />
          <CommandList>
            <CommandEmpty>{noRegions}</CommandEmpty>
            <CommandGroup>
              {value && (
                <CommandItem
                  value="__all__"
                  onSelect={() => {
                    onChange('');
                    setOpen(false);
                  }}
                  className="text-slate-500"
                >
                  {allLabel}
                </CommandItem>
              )}
              {regions.map((r) => (
                <CommandItem
                  key={r.value}
                  value={r.label}
                  onSelect={() => {
                    onChange(r.value === value ? '' : r.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn('mr-2 h-3.5 w-3.5', value === r.value ? 'opacity-100' : 'opacity-0')}
                  />
                  {r.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TrailFilters({
  initial,
  labels,
  ranges,
  regions,
  routeTypes,
  sidebar = false,
}: {
  initial: Filters;
  labels: FilterLabels;
  ranges: TrailRanges;
  regions: RegionOption[];
  routeTypes: string[];
  sidebar?: boolean;
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

  // ── URL helpers ──────────────────────────────────────────────────────────

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete('page');
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
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
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    },
    [router, pathname, searchParams],
  );

  const clearAll = useCallback(() => {
    setQ('');
    setDistRange([ranges.minDistance, ranges.maxDistance]);
    setGainRange([ranges.minElevation, ranges.maxElevation]);
    startTransition(() => router.push(pathname));
  }, [router, pathname, ranges]); // region is cleared by router.push(pathname) which removes all params

  // ── Derived state ────────────────────────────────────────────────────────

  const effort = searchParams.get('effort') ?? '';
  const type = searchParams.get('type') ?? '';
  const shape = searchParams.get('shape') ?? '';
  const child = searchParams.get('child') ?? '';
  const pet = searchParams.get('pet') ?? '';
  const season = searchParams.get('season') ?? '';
  const region = searchParams.get('region') ?? '';

  const activeCount = [
    initial.effort,
    initial.type,
    initial.shape,
    initial.child === 'true' ? 'x' : '',
    initial.pet === 'true' ? 'x' : '',
    initial.season,
    initial.region,
    initial.minDist,
    initial.maxDist,
    initial.minGain,
    initial.maxGain,
  ].filter(Boolean).length;

  const hasFilters = activeCount > 0 || !!initial.q;

  // ── Slider commit helpers ────────────────────────────────────────────────

  const commitDist = (v: number[]) => {
    const [a, b] = v;
    updateTwoParams(
      'minDist',
      String(a),
      'maxDist',
      String(b),
      a === ranges.minDistance && b === ranges.maxDistance,
    );
  };
  const commitGain = (v: number[]) => {
    const [a, b] = v;
    updateTwoParams(
      'minGain',
      String(a),
      'maxGain',
      String(b),
      a === ranges.minElevation && b === ranges.maxElevation,
    );
  };

  // ── Chip renderers (shared between desktop + Sheet) ──────────────────────

  const effortChips = EFFORT_OPTIONS.map((opt) => (
    <Chip
      key={opt.value}
      active={effort === opt.value}
      color={EFFORT_COLORS[opt.value]}
      onClick={() => updateParam('effort', effort === opt.value ? '' : opt.value)}
    >
      <span className="font-semibold">{labels[opt.labelKey]}</span>
    </Chip>
  ));

  const typeChips = routeTypes.map((t) => (
    <Chip key={t} active={type === t} onClick={() => updateParam('type', type === t ? '' : t)}>
      <span className="font-bold">{t}</span>
    </Chip>
  ));

  const shapeChips = (
    [
      { value: 'circular', label: labels.circular },
      { value: 'linear', label: labels.linear },
    ] as const
  ).map((opt) => (
    <Chip
      key={opt.value}
      active={shape === opt.value}
      onClick={() => updateParam('shape', shape === opt.value ? '' : opt.value)}
    >
      {opt.label}
    </Chip>
  ));

  const seasonChips = SEASON_OPTIONS.map((opt) => (
    <Chip
      key={opt.value}
      active={season === opt.value}
      onClick={() => updateParam('season', season === opt.value ? '' : opt.value)}
    >
      {labels[opt.labelKey]}
    </Chip>
  ));

  const profileChips = (
    <>
      <Chip
        active={child === 'true'}
        color="border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
        onClick={() => updateParam('child', child === 'true' ? '' : 'true')}
      >
        👶 {labels.filterChild}
      </Chip>
      <Chip
        active={pet === 'true'}
        color="border-sky-400 bg-sky-50 text-sky-800 dark:border-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
        onClick={() => updateParam('pet', pet === 'true' ? '' : 'true')}
      >
        🐾 {labels.filterPet}
      </Chip>
    </>
  );

  const regionCombobox = (
    <RegionCombobox
      regions={regions}
      value={region}
      onChange={(v) => updateParam('region', v)}
      placeholder={labels.regionPlaceholder}
      noRegions={labels.noRegions}
      allLabel={labels.filterRegion}
    />
  );

  const sliders = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <SliderCard
        label={labels.filterDistance}
        value={distRange}
        unit={labels.km}
        min={ranges.minDistance}
        max={ranges.maxDistance}
        step={1}
        histogram={ranges.distanceHistogram}
        onChange={setDistRange}
        onCommit={commitDist}
      />
      <SliderCard
        label={labels.filterElevation}
        value={gainRange}
        unit={labels.meters}
        min={ranges.minElevation}
        max={ranges.maxElevation}
        step={50}
        histogram={ranges.elevationHistogram}
        onChange={setGainRange}
        onCommit={commitGain}
      />
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────

  if (sidebar) {
    return (
      <div className={cn('space-y-4 transition-opacity', isPending && 'opacity-60')}>
        {/* Search */}
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') updateParam('q', q);
            }}
            onBlur={() => updateParam('q', q)}
            placeholder={labels.searchPlaceholder}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-9 pl-9 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
          />
          {q && (
            <button
              onClick={() => {
                setQ('');
                updateParam('q', '');
              }}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <FilterSection label={labels.filterEffort}>{effortChips}</FilterSection>
        <FilterSection label={labels.filterType}>{typeChips}</FilterSection>
        <FilterSection label={labels.filterShape}>{shapeChips}</FilterSection>
        <FilterSection label={labels.filterSeason}>{seasonChips}</FilterSection>
        <FilterSection label={labels.filterProfile}>{profileChips}</FilterSection>
        {regions.length > 0 && (
          <FilterSection label={labels.filterRegion}>{regionCombobox}</FilterSection>
        )}

        <div className="space-y-3">
          <SliderCard
            label={labels.filterDistance}
            value={distRange}
            unit={labels.km}
            min={ranges.minDistance}
            max={ranges.maxDistance}
            step={1}
            histogram={ranges.distanceHistogram}
            onChange={setDistRange}
            onCommit={commitDist}
          />
          <SliderCard
            label={labels.filterElevation}
            value={gainRange}
            unit={labels.meters}
            min={ranges.minElevation}
            max={ranges.maxElevation}
            step={50}
            histogram={ranges.elevationHistogram}
            onChange={setGainRange}
            onCommit={commitGain}
          />
        </div>

        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
            {labels.clearFilters}
            <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white dark:bg-white dark:text-slate-900">
              {activeCount}
            </span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3 transition-opacity', isPending && 'opacity-60')}>
      {/* ── Row 1: Search + Clear (desktop) ─────────────────────────────── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') updateParam('q', q);
            }}
            onBlur={() => updateParam('q', q)}
            placeholder={labels.searchPlaceholder}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-9 pl-9 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
          />
          {q && (
            <button
              onClick={() => {
                setQ('');
                updateParam('q', '');
              }}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Desktop: clear all */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="hidden shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900 md:flex dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
            {labels.clearFilters}
            <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white dark:bg-white dark:text-slate-900">
              {activeCount}
            </span>
          </button>
        )}
      </div>

      {/* ── Row 2 mobile: effort chips + "Filters" button ───────────────── */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {effortChips}
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <button className="ml-auto flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <SlidersHorizontal className="h-4 w-4" />
              {labels.filterMore}
              {activeCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white dark:bg-white dark:text-slate-900">
                  {activeCount}
                </span>
              )}
            </button>
          </SheetTrigger>

          <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl px-0">
            <SheetHeader className="flex flex-row items-center justify-between border-b border-slate-100 px-4 pb-3 dark:border-slate-800">
              <SheetTitle className="text-base">{labels.filterMore}</SheetTitle>
              {hasFilters && (
                <button
                  onClick={clearAll}
                  className="text-sm text-rose-600 hover:text-rose-700 dark:text-rose-400"
                >
                  {labels.clearFilters}
                </button>
              )}
            </SheetHeader>

            <div className="space-y-6 px-4 py-5">
              <FilterSection label={labels.filterEffort}>{effortChips}</FilterSection>
              <FilterSection label={labels.filterType}>{typeChips}</FilterSection>
              <FilterSection label={labels.filterShape}>{shapeChips}</FilterSection>
              <FilterSection label={labels.filterSeason}>{seasonChips}</FilterSection>
              <FilterSection label={labels.filterProfile}>{profileChips}</FilterSection>
              {regions.length > 0 && (
                <FilterSection label={labels.filterRegion}>{regionCombobox}</FilterSection>
              )}
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                  {labels.filterDistance} / {labels.filterElevation}
                </p>
                {sliders}
              </div>
            </div>

            <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
              <SheetClose asChild>
                <button className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">
                  {labels.viewResults}
                </button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* ── Row 2 desktop: sectioned filter groups ──────────────────────── */}
      <div className="hidden flex-wrap items-start gap-x-4 gap-y-3 md:flex">
        <FilterSection label={labels.filterEffort}>{effortChips}</FilterSection>
        <VSep />
        <FilterSection label={labels.filterType}>{typeChips}</FilterSection>
        <VSep />
        <FilterSection label={labels.filterShape}>{shapeChips}</FilterSection>
        <VSep />
        <FilterSection label={labels.filterProfile}>{profileChips}</FilterSection>
        <VSep />
        <FilterSection label={labels.filterSeason}>{seasonChips}</FilterSection>
        {regions.length > 0 && (
          <>
            <VSep />
            <FilterSection label={labels.filterRegion}>{regionCombobox}</FilterSection>
          </>
        )}
      </div>

      {/* ── Row 3 desktop: sliders ──────────────────────────────────────── */}
      <div className="hidden md:block">{sliders}</div>
    </div>
  );
}
