import { use } from 'react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TrailCard } from '@/components/trail-detail/trail-card';
import { TrailFilters } from '@/components/trail-detail/trail-filters';
import { Suspense } from 'react';

const PAGE_SIZE = 24;

interface SearchParams {
  q?: string;
  effort?: string;
  type?: string;
  shape?: string;
  child?: string;
  pet?: string;
  page?: string;
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

async function fetchTrails(sp: SearchParams) {
  const supabase = getSupabase();
  const page = Math.max(1, parseInt(sp.page ?? '1', 10));
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from('trails')
    .select(
      'id,slug,country,name,trail_code,route_type,distance_km,elevation_gain_m,estimated_duration_min,effort_level,difficulty_score,child_friendly,pet_friendly,is_circular,season_best,elevation_max_m',
      { count: 'exact' },
    );

  if (sp.q) query = query.ilike('name', `%${sp.q}%`);
  if (sp.effort) query = query.eq('effort_level', sp.effort);
  if (sp.type) query = query.eq('route_type', sp.type);
  if (sp.shape === 'circular') query = query.eq('is_circular', true);
  if (sp.shape === 'linear') query = query.eq('is_circular', false);
  if (sp.child === 'true') query = query.eq('child_friendly', true);
  if (sp.pet === 'true') query = query.eq('pet_friendly', true);

  query = query.order('difficulty_score').range(offset, offset + PAGE_SIZE - 1);

  const { data, count, error } = await query;
  return { trails: data ?? [], count: count ?? 0, page, error };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'TrailSearchPage' });
  return { title: t('title') };
}

export default function TrailSearchPage({ params, searchParams }: PageProps) {
  const { locale } = use(params);
  const sp = use(searchParams);
  setRequestLocale(locale);

  return (
    <Suspense>
      <TrailSearchContent locale={locale} sp={sp} />
    </Suspense>
  );
}

async function TrailSearchContent({ locale, sp }: { locale: string; sp: SearchParams }) {
  const t = await getTranslations({ locale, namespace: 'TrailSearchPage' });
  const tTrail = await getTranslations({ locale, namespace: 'TrailPage' });

  const { trails, count, page, error } = await fetchTrails(sp);
  const totalPages = Math.ceil(count / PAGE_SIZE);

  const filterLabels = {
    searchPlaceholder: t('searchPlaceholder'),
    filterEffort: t('filterEffort'),
    filterType: t('filterType'),
    filterShape: t('filterShape'),
    allShapes: t('allShapes'),
    circular: tTrail('circular'),
    linear: tTrail('linear'),
    filterChild: t('filterChild'),
    filterPet: t('filterPet'),
    clearFilters: t('clearFilters'),
    easy: tTrail('easy'),
    moderate: tTrail('moderate'),
    hard: tTrail('hard'),
    veryHard: tTrail('veryHard'),
  };

  const cardLabels = {
    easy: tTrail('easy'),
    moderate: tTrail('moderate'),
    hard: tTrail('hard'),
    veryHard: tTrail('veryHard'),
    circular: tTrail('circular'),
    linear: tTrail('linear'),
    km: tTrail('km'),
    meters: tTrail('meters'),
  };

  // Build pagination URL helper
  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams();
    if (sp.q) params.set('q', sp.q);
    if (sp.effort) params.set('effort', sp.effort);
    if (sp.type) params.set('type', sp.type);
    if (sp.shape) params.set('shape', sp.shape);
    if (sp.child) params.set('child', sp.child);
    if (sp.pet) params.set('pet', sp.pet);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return `/${locale}/trail${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#08090f]">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">{t('title')}</h1>
          <TrailFilters
            initial={{
              q: sp.q ?? '',
              effort: sp.effort ?? '',
              type: sp.type ?? '',
              shape: sp.shape ?? '',
              child: sp.child ?? '',
              pet: sp.pet ?? '',
            }}
            labels={filterLabels}
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Results count */}
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('results', { count })}
        </p>

        {/* Trail cards grid */}
        {error || trails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <p className="text-lg font-medium">{t('noResults')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trails.map((trail) => (
              <TrailCard
                key={trail.id}
                trail={trail as Parameters<typeof TrailCard>[0]['trail']}
                locale={locale}
                labels={cardLabels}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 border-t border-slate-200 pt-6 dark:border-slate-800">
            {page > 1 ? (
              <Link
                href={buildPageUrl(page - 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                <ChevronLeft className="h-4 w-4" />
                {t('previous')}
              </Link>
            ) : (
              <span className="flex items-center gap-1 rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-300 dark:border-slate-800 dark:text-slate-600">
                <ChevronLeft className="h-4 w-4" />
                {t('previous')}
              </span>
            )}

            <span className="text-sm text-slate-500 dark:text-slate-400">
              {t('page', { page, total: totalPages })}
            </span>

            {page < totalPages ? (
              <Link
                href={buildPageUrl(page + 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                {t('next')}
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="flex items-center gap-1 rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-300 dark:border-slate-800 dark:text-slate-600">
                {t('next')}
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
