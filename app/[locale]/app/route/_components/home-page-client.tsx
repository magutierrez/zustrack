'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import polyline from '@mapbox/polyline';
import LZString from 'lz-string';
import { useRouteAnalysis } from '@/hooks/use-route-analysis';
import { useRouteStore } from '@/store/route-store';
import { getRouteFromDb } from '@/lib/db';
import { haversineDistance } from '@/lib/gpx-parser';
import { cn } from '@/lib/utils';
import { Session } from 'next-auth';
import type { GPXData, RoutePoint } from '@/lib/types';

import { Header } from '@/app/_components/header';
import { ShareButton } from '@/app/_components/share-button';
import { EmptyState } from '@/app/_components/empty-state';
import { ActivityConfigSection } from '@/app/_components/activity-config-section';
import { RouteLoadingOverlay } from '@/app/_components/route-loading-overlay';
import { AnalysisResults } from '@/app/_components/analysis-results';
import { AnalysisSkeleton } from '@/app/_components/analysis-skeleton';

import { RouteSummary } from './route-summary';
import { ElevationTerrainTabs } from './elevation-terrain-tabs';
import { MobileElevationChart } from '@/components/mobile-elevation-chart';

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

interface SharedRoutePayload {
  p: string;
  e: string;
  n: string;
  td: number;
  tg: number;
  tl: number;
  a?: string;
}

function parseHashPayload(): SharedRoutePayload | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash;
  if (!hash.startsWith('#route=')) return null;
  try {
    const compressed = hash.slice('#route='.length);
    const json = LZString.decompressFromEncodedURIComponent(compressed);
    if (!json) return null;
    return JSON.parse(json) as SharedRoutePayload;
  } catch {
    return null;
  }
}

function decodeSharedRoute(payload: SharedRoutePayload): GPXData {
  const coords = polyline.decode(payload.p, 5);

  // Reconstruct elevations from delta-encoded comma-separated string
  const deltas = payload.e.split(',').map(Number);
  const eles: number[] = [];
  for (let i = 0; i < deltas.length; i++) {
    eles.push(i === 0 ? deltas[0] : eles[i - 1] + deltas[i]);
  }

  const ELE_THRESHOLD = 5;
  let lastCommittedEle: number | undefined;
  let totalDistance = 0;
  let totalElevationGain = 0;
  let totalElevationLoss = 0;
  const points: RoutePoint[] = [];

  for (let i = 0; i < coords.length; i++) {
    const [lat, lon] = coords[i];
    const ele = eles[i] !== undefined ? eles[i] : undefined;

    if (i > 0) {
      const prev = points[i - 1];
      totalDistance += haversineDistance(prev.lat, prev.lon, lat, lon);

      if (ele !== undefined) {
        if (lastCommittedEle === undefined) {
          lastCommittedEle = ele;
        } else {
          const diff = ele - lastCommittedEle;
          if (diff >= ELE_THRESHOLD) {
            totalElevationGain += diff;
            lastCommittedEle = ele;
          } else if (diff <= -ELE_THRESHOLD) {
            totalElevationLoss += Math.abs(diff);
            lastCommittedEle = ele;
          }
        }
      }
    } else if (ele !== undefined) {
      lastCommittedEle = ele;
    }

    points.push({ lat, lon, ele, distanceFromStart: totalDistance });
  }

  return { points, name: payload.n, totalDistance, totalElevationGain, totalElevationLoss };
}

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

  // Parse the hash fragment on the client (fragments never reach the server)
  const [hashPayload, setHashPayload] = useState<SharedRoutePayload | null>(null);
  useEffect(() => {
    setHashPayload(parseHashPayload());
  }, []);

  const isSharedRoute = hashPayload !== null;
  const activityFromHash = (hashPayload?.a as 'cycling' | 'walking') ?? null;

  const tHomePage = useTranslations('HomePage');

  // Read reactive state from store
  const gpxData = useRouteStore((s) => s.gpxData);
  const isLoading = useRouteStore((s) => s.isLoading);
  const isRouteInfoLoading = useRouteStore((s) => s.isRouteInfoLoading);
  const isWeatherAnalyzed = useRouteStore((s) => s.isWeatherAnalyzed);
  const config = useRouteStore((s) => s.config);
  const fetchedActivityType = useRouteStore((s) => s.fetchedActivityType);
  const {
    setFetchedRoute,
    setConfig,
    setGpxData,
    setGpxFileName,
    setLockedMetrics,
    setRecalculatedTotalDistance,
    setRecalculatedElevationGain,
    setRecalculatedElevationLoss,
    reset,
  } = useRouteStore();

  const { handleAnalyze, handleReverseRoute, handleFindBestWindow } = useRouteAnalysis();

  const mapResetViewRef = useRef<(() => void) | null>(null);
  const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);

  const activityType = fetchedActivityType || activityFromHash || initialActivityType;

  // Reset store on unmount to avoid stale state on re-navigation
  useEffect(() => {
    return () => reset();
  }, [reset]);

  // Load shared route from the decompressed hash payload
  useEffect(() => {
    if (!hashPayload || gpxData) return;
    try {
      const decoded = decodeSharedRoute(hashPayload);
      if (decoded.points.length < 2) return;

      // Lock the original metrics so the recalculation pipeline cannot overwrite them
      setLockedMetrics({ distance: hashPayload.td, gain: hashPayload.tg, loss: hashPayload.tl });
      setRecalculatedTotalDistance(hashPayload.td);
      setRecalculatedElevationGain(hashPayload.tg);
      setRecalculatedElevationLoss(hashPayload.tl);

      // Set gpxData after locking so useRouteAnalysis effects see the lock immediately
      setGpxData(decoded);
      setGpxFileName(decoded.name);
    } catch (err) {
      console.error('Error decoding shared route:', err);
    }
  }, [
    hashPayload,
    gpxData,
    setGpxData,
    setGpxFileName,
    setLockedMetrics,
    setRecalculatedTotalDistance,
    setRecalculatedElevationGain,
    setRecalculatedElevationLoss,
  ]);

  // Fetch route data from DB (skip when loading from shared hash).
  // We check window.location.hash directly (synchronous) instead of relying on the
  // hashPayload state, which is set in a separate useEffect and would be null on the
  // first render — causing a redirect race condition.
  useEffect(() => {
    if (window.location.hash.startsWith('#route=')) return;
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
      <Header session={session} extraActions={<ShareButton />} />

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
              'border-border relative w-full',
              !isMobileFullscreen && 'h-[70vh] border-t lg:h-[calc(100vh-57px)] lg:w-[45%] lg:border-t-0 lg:border-l',
              isMobileFullscreen && 'fixed inset-0 z-50 flex flex-col border-0 bg-background',
              !gpxData && !isMobileFullscreen && 'hidden lg:block',
            )}
          >
            {/* Map fills all space normally, or flex-1 when chart is below */}
            <div className={cn('relative', isMobileFullscreen ? 'min-h-0 flex-1' : 'h-full w-full')}>
              <RouteLoadingOverlay isVisible={isRouteInfoLoading} />
              <RouteMap
                onResetToFullRouteView={(func) => (mapResetViewRef.current = func)}
                isMobileFullscreen={isMobileFullscreen}
                onToggleMobileFullscreen={() => setIsMobileFullscreen((v) => !v)}
              />
            </div>

            {/* Elevation chart below the map in fullscreen */}
            {isMobileFullscreen && <MobileElevationChart />}
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
