'use client';

import { useEffect, useRef, useCallback } from 'react';
import { trailToGpx } from '@/lib/trail-to-gpx';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useRouteAnalysis } from '@/hooks/use-route-analysis';
import { useSharedRouteLoader } from '@/hooks/use-shared-route-loader';
import { useRouteStore } from '@/store/route-store';
import { cn, formatISOToConfig } from '@/lib/utils';
import { Session } from 'next-auth';

import { Header } from '@/app/_components/header';
import { ShareButton } from '@/app/_components/share-button';
import { ActivityConfigSection } from '@/app/_components/activity-config-section';
import { RouteLoadingOverlay } from '@/app/_components/route-loading-overlay';
import { AnalysisResults } from '@/app/_components/analysis-results';
import { AnalysisSkeleton } from '@/app/_components/analysis-skeleton';

import { RouteSummary } from './route-summary';
import { ElevationTerrainTabs } from './elevation-terrain-tabs';
import { MobileElevationChart } from '@/components/mobile-elevation-chart';

import { SpecialLoading } from '@/app/_components/special-loading';

const RouteMap = dynamic(() => import('@/components/route-map'), {
  ssr: false,
  loading: function Loading() {
    const th = useTranslations('HomePage');
    return (
      <div className="bg-card flex h-full items-center justify-center rounded-lg border border-slate-200 dark:border-white/5">
        <SpecialLoading message={th('loadingMap')} />
      </div>
    );
  },
});

interface HomePageClientProps {
  session: Session | null;
}

export default function HomePageClient({ session: serverSession }: HomePageClientProps) {
  const { data: clientSession } = useSession();
  const session = clientSession || serverSession;
  const searchParams = useSearchParams();
  const routeId = searchParams.get('routeId');
  const trailId = searchParams.get('trailId');
  const initialActivityType = (searchParams.get('activity') as 'cycling' | 'walking') || 'cycling';

  const tHomePage = useTranslations('HomePage');

  // Read reactive state from store
  const gpxData = useRouteStore((s) => s.gpxData);
  const isLoading = useRouteStore((s) => s.isLoading);
  const isRouteInfoLoading = useRouteStore((s) => s.isRouteInfoLoading);
  const isWeatherAnalyzed = useRouteStore((s) => s.isWeatherAnalyzed);
  const config = useRouteStore((s) => s.config);
  const fetchedActivityType = useRouteStore((s) => s.fetchedActivityType);
  const isMobileFullscreen = useRouteStore((s) => s.isMobileFullscreen);
  const { setConfig, setIsMobileFullscreen, setMobileHazardRange, reset, setFetchedRoute } = useRouteStore();

  const { handleAnalyze, handleReverseRoute, handleFindBestWindow } = useRouteAnalysis();
  const { activityFromHash } = useSharedRouteLoader(session, routeId, !!trailId);

  const mapResetViewRef = useRef<(() => void) | null>(null);

  const activityType = fetchedActivityType || activityFromHash || initialActivityType;

  // Reset store on unmount to avoid stale state on re-navigation
  useEffect(() => {
    return () => reset();
  }, [reset]);

  // Load trail from URL param (used after login redirect from trail detail page)
  useEffect(() => {
    if (!trailId) return;
    fetch(`/api/trails/${trailId}`)
      .then((r) => r.json())
      .then((trail) => {
        if (!trail?.track_profile) return;
        const gpxContent = trailToGpx(trail.name, trail.track_profile);
        setFetchedRoute({
          rawGpxContent: gpxContent,
          gpxFileName: `${trail.slug}.gpx`,
          activityType: 'walking',
          distance: trail.distance_km,
          elevationGain: trail.elevation_gain_m,
          elevationLoss: trail.elevation_loss_m,
        });
      })
      .catch(() => {}); // silently ignore network errors
  }, [trailId]); // eslint-disable-line react-hooks/exhaustive-deps

  const onReverseWithRange = useCallback(() => {
    handleReverseRoute();
  }, [handleReverseRoute]);

  const handleSelectBestWindow = useCallback(
    (isoTime: string) => {
      const { date, time } = formatISOToConfig(isoTime);
      setConfig({ ...config, date, time });
    },
    [config, setConfig],
  );

  const handleSelectAndAnalyze = useCallback(
    (isoTime: string) => {
      const { date, time } = formatISOToConfig(isoTime);
      const newConfig = { ...config, date, time, activityType };
      setConfig(newConfig);
      handleAnalyze(newConfig);
    },
    [config, setConfig, handleAnalyze, activityType],
  );

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <Header session={session} extraActions={<ShareButton />} />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="relative flex min-w-0 flex-1 flex-col lg:flex-row lg:overflow-hidden">
          <div className="custom-scrollbar flex w-full flex-col gap-10 p-4 md:p-8 lg:h-[calc(100vh-57px)] lg:w-[55%] lg:overflow-y-auto">
            {isLoading && !gpxData ? (
              <AnalysisSkeleton />
            ) : !gpxData ? (
              <AnalysisSkeleton />
            ) : isRouteInfoLoading ? (
              <AnalysisSkeleton />
            ) : (
              <div className="flex flex-col gap-10">
                <ActivityConfigSection
                  onAnalyze={handleAnalyze}
                  onReverseRoute={onReverseWithRange}
                />

                <ElevationTerrainTabs />

                <RouteSummary />

                {isWeatherAnalyzed ? (
                  <AnalysisResults
                    onFindBestWindow={handleFindBestWindow}
                    onSelectBestWindow={handleSelectBestWindow}
                    onAnalyzeBestWindow={handleSelectAndAnalyze}
                  />
                ) : (
                  <div className="border-border bg-card/50 text-muted-foreground flex h-60 flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
                    <h2 className="mb-2 text-xl font-semibold">{tHomePage('analyzeFirst')}</h2>
                    <p className="max-w-md text-sm">{tHomePage('clickAnalyze')}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            className={cn(
              'border-border relative w-full',
              !isMobileFullscreen &&
                'h-[70vh] border-t lg:h-[calc(100vh-57px)] lg:w-[45%] lg:border-t-0 lg:border-l',
              isMobileFullscreen && 'bg-background fixed inset-0 z-50 flex flex-col border-0',
              !gpxData && !isMobileFullscreen && 'hidden lg:block',
            )}
          >
            {/* Map fills all space normally, or flex-1 when chart is below */}
            <div
              className={cn('relative', isMobileFullscreen ? 'min-h-0 flex-1' : 'h-full w-full')}
            >
              {gpxData ? (
                <>
                  <RouteLoadingOverlay isVisible={isRouteInfoLoading} />
                  <RouteMap
                    onResetToFullRouteView={(func) => (mapResetViewRef.current = func)}
                    isMobileFullscreen={isMobileFullscreen}
                    onToggleMobileFullscreen={() => {
                      const next = !isMobileFullscreen;
                      setIsMobileFullscreen(next);
                      if (!next) setMobileHazardRange(null);
                    }}
                  />
                </>
              ) : (
                <div className="bg-muted/30 flex h-full items-center justify-center">
                  <p className="text-muted-foreground text-sm">{tHomePage('loadRoute')}</p>
                </div>
              )}
            </div>

            {/* Elevation chart below the map in fullscreen */}
            {isMobileFullscreen && <MobileElevationChart />}
          </div>
        </main>
      </div>

      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--border));
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground));
        }
      `}</style>
    </div>
  );
}
