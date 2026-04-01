import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Header } from '@/app/_components/header';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchTrails, getTrailRanges } from '@/lib/trails';
import type { TrailSearchParams } from '@/lib/trails';
import { TrailCard } from './trail-card';
import { TrailFilters } from './trail-filters';
import { ViewToggle } from './view-toggle';
import { TrailsMapWrapper } from './trails-map-wrapper';

export async function TrailSearchView({ locale, sp }: { locale: string; sp: TrailSearchParams }) {
  const t = await getTranslations({ locale, namespace: 'TrailSearchPage' });
  const tTrail = await getTranslations({ locale, namespace: 'TrailPage' });

  const isMapView = sp.view === 'map';
  const [{ trails, count, page, totalPages }, ranges] = await Promise.all([
    fetchTrails(sp),
    getTrailRanges(),
  ]);

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
    filterSeason: t('filterSeason'),
    filterDistance: t('filterDistance'),
    filterElevation: t('filterElevation'),
    clearFilters: t('clearFilters'),
    easy: tTrail('easy'),
    moderate: tTrail('moderate'),
    hard: tTrail('hard'),
    veryHard: tTrail('veryHard'),
    km: tTrail('km'),
    meters: tTrail('meters'),
    yearRound: tTrail('yearRound'),
    avoidSummer: tTrail('avoidSummer'),
    avoidWinter: tTrail('avoidWinter'),
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

  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams();
    if (sp.q) params.set('q', sp.q);
    if (sp.effort) params.set('effort', sp.effort);
    if (sp.type) params.set('type', sp.type);
    if (sp.shape) params.set('shape', sp.shape);
    if (sp.child) params.set('child', sp.child);
    if (sp.pet) params.set('pet', sp.pet);
    if (sp.season) params.set('season', sp.season);
    if (sp.minDist) params.set('minDist', sp.minDist);
    if (sp.maxDist) params.set('maxDist', sp.maxDist);
    if (sp.minGain) params.set('minGain', sp.minGain);
    if (sp.maxGain) params.set('maxGain', sp.maxGain);
    if (sp.view) params.set('view', sp.view);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return `/${locale}/trail${qs ? `?${qs}` : ''}`;
  };

  return (
    <div
      className={
        isMapView
          ? 'flex h-screen flex-col overflow-hidden bg-slate-50 dark:bg-[#08090f]'
          : 'min-h-screen bg-slate-50 dark:bg-[#08090f]'
      }
    >
      <Header session={null} />
      <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <h1 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">{t('title')}</h1>
          <TrailFilters
            initial={{
              q: sp.q ?? '',
              effort: sp.effort ?? '',
              type: sp.type ?? '',
              shape: sp.shape ?? '',
              child: sp.child ?? '',
              pet: sp.pet ?? '',
              minDist: sp.minDist ?? '',
              maxDist: sp.maxDist ?? '',
              minGain: sp.minGain ?? '',
              maxGain: sp.maxGain ?? '',
              season: sp.season ?? '',
            }}
            labels={filterLabels}
            ranges={ranges}
          />
        </div>
      </div>

      <main
        className={isMapView ? 'flex-1 overflow-hidden' : 'mx-auto max-w-6xl space-y-6 px-4 py-6'}
      >
        <div
          className={
            isMapView
              ? 'flex items-center justify-between px-4 pt-6 pb-4'
              : 'flex items-center justify-between'
          }
        >
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('results', { count })}</p>
          <ViewToggle labels={{ listView: t('listView'), mapView: t('mapView') }} />
        </div>

        {isMapView ? (
          <div className="h-[calc(100dvh-12rem)]">
            <TrailsMapWrapper
              searchParams={sp}
              locale={locale}
              labels={{
                viewTrail: t('viewTrail'),
                loading: t('mapLoading'),
                noTrails: t('mapNoTrails'),
                effort: {
                  easy: tTrail('easy'),
                  moderate: tTrail('moderate'),
                  hard: tTrail('hard'),
                  veryHard: tTrail('veryHard'),
                },
                km: tTrail('km'),
              }}
            />
          </div>
        ) : (
          <>
            {trails.length === 0 ? (
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
          </>
        )}
      </main>
    </div>
  );
}
