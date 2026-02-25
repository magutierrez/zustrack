'use client';

import { useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useRouteAnalysis } from '@/hooks/use-route-analysis';
import { useRouteStore } from '@/store/route-store';
import { getRouteFromDb } from '@/lib/db';
import { cn } from '@/lib/utils';
import { Session } from 'next-auth';

import { Header } from '@/app/_components/header';
import { EmptyState } from '@/app/_components/empty-state';
import { ActivityConfigSection } from '@/app/_components/activity-config-section';
import { RouteLoadingOverlay } from '@/app/_components/route-loading-overlay';
import { AnalysisResults } from '@/app/_components/analysis-results';
import { AnalysisSkeleton } from '@/app/_components/analysis-skeleton';

import { RouteSummary } from './route-summary';
import { ElevationTerrainTabs } from './elevation-terrain-tabs';

const RouteMap = dynamic(() => import('@/components/route-map'), {
  ssr: false,
  loading: function Loading() {
    const th = useTranslations('HomePage');
    return (
      <div className="bg-card flex h-full items-center justify-center rounded-lg">
        <span className="text-muted-foreground text-sm">{th('loadingMap')}</span>
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeId = searchParams.get('routeId');
  const initialActivityType = (searchParams.get('activity') as 'cycling' | 'walking') || 'cycling';

  const tHomePage = useTranslations('HomePage');

  // Read reactive state from store
  const gpxData = useRouteStore((s) => s.gpxData);
  const isLoading = useRouteStore((s) => s.isLoading);
  const isRouteInfoLoading = useRouteStore((s) => s.isRouteInfoLoading);
  const isWeatherAnalyzed = useRouteStore((s) => s.isWeatherAnalyzed);
  const config = useRouteStore((s) => s.config);
  const fetchedActivityType = useRouteStore((s) => s.fetchedActivityType);
  const { setFetchedRoute, setConfig, reset } = useRouteStore();

  const { handleAnalyze, handleReverseRoute, handleFindBestWindow } = useRouteAnalysis();

  const mapResetViewRef = useRef<(() => void) | null>(null);

  const activityType = fetchedActivityType || initialActivityType;

  // Reset store on unmount to avoid stale state on re-navigation
  useEffect(() => {
    return () => reset();
  }, [reset]);

  // Fetch route data from DB
  useEffect(() => {
    const userIdentifier = session?.user?.email || session?.user?.id;
    if (routeId && userIdentifier) {
      const fetchRoute = async () => {
        const route = await getRouteFromDb(routeId, userIdentifier);
        if (route) {
          setFetchedRoute({
            rawGpxContent: route.gpx_content,
            gpxFileName: route.name,
            activityType: route.activity_type,
            distance: route.distance,
            elevationGain: route.elevation_gain,
            elevationLoss: route.elevation_loss,
          });
        } else {
          router.replace('/app/setup');
        }
      };
      fetchRoute();
    } else if (!routeId) {
      router.replace('/app/setup');
    }
  }, [routeId, session?.user?.email, session?.user?.id, setFetchedRoute, router]);

  const onReverseWithRange = useCallback(() => {
    handleReverseRoute();
  }, [handleReverseRoute]);

  const handleSelectBestWindow = useCallback(
    (isoTime: string) => {
      const date = new Date(isoTime);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      setConfig({ ...config, date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` });
    },
    [config, setConfig],
  );

  const handleSelectAndAnalyze = useCallback(
    (isoTime: string) => {
      const date = new Date(isoTime);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const newConfig = {
        ...config,
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`,
        activityType,
      };
      setConfig(newConfig);
      handleAnalyze(newConfig);
    },
    [config, setConfig, handleAnalyze, activityType],
  );

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <Header session={session} />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="relative flex min-w-0 flex-1 flex-col lg:flex-row lg:overflow-hidden">
          <div className="custom-scrollbar flex w-full flex-col gap-10 p-4 md:p-8 lg:h-[calc(100vh-57px)] lg:w-[55%] lg:overflow-y-auto">
            {isLoading && !gpxData ? (
              <AnalysisSkeleton />
            ) : !gpxData ? (
              <EmptyState />
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
              'border-border relative h-[400px] w-full border-t lg:h-[calc(100vh-57px)] lg:w-[45%] lg:border-t-0 lg:border-l',
              !gpxData && 'hidden lg:block',
            )}
          >
            <RouteLoadingOverlay isVisible={isRouteInfoLoading} />
            <RouteMap onResetToFullRouteView={(func) => (mapResetViewRef.current = func)} />
          </div>
        </main>
      </div>

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
