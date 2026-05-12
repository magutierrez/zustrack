'use client';

import { useState, useMemo, useCallback, useRef, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/app/_components/header';
import { cn } from '@/lib/utils';
import type { Trail, TrailSummary } from '@/lib/trails';
import { SuitabilityChips } from './suitability-chips';
import { SlopeBreakdownBar } from './slope-breakdown-bar';
import { SurfaceSection } from './surface-section';
import { analyzeTrackSegments, TrailHazards } from './trail-hazards';
import { TrailWeatherForecast } from './trail-weather-forecast';
import { TrailInfoTabs } from './trail-info-tabs';

// Subcomponents
import { TrailHeader } from './trail-header';
import { TrailStatsSection } from './trail-stats-section';
import { TrailMapSection } from './trail-map-section';
import { TrailInfoTable } from './trail-info-table';
import { TrailSimilarTrails } from './trail-similar-trails';
import { TrailElevationHazardsTabs } from './trail-elevation-hazards-tabs';
import { TrailDetailsStyles } from './trail-details-styles';
import { TrailActionFooter } from './trail-action-footer';
import { TrailDetailsSkeleton } from './trail-details-skeleton';
import { useIsMobile } from '@/hooks/use-mobile';

type Range = { start: number; end: number; color?: string };
type POIPoint = { lat: number; lng: number };

interface TrailDetailPageClientProps {
  trail: Trail;
  locale: string;
  similarTrails?: TrailSummary[];
}

const EMPTY_SIMILAR_TRAILS: TrailSummary[] = [];

function TrailDetailPageInner({
  trail,
  locale,
  similarTrails = EMPTY_SIMILAR_TRAILS,
}: TrailDetailPageClientProps) {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const t = useTranslations('TrailPage');
  const regionName = trail.region_i18n?.[locale] ?? trail.region;
  const { push } = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  const [mapExpanded, setMapExpanded] = useState(false);

  // Back-button collapses fullscreen map instead of navigating away
  useEffect(() => {
    if (mapExpanded) {
      history.pushState({ mapExpanded: true }, '');
    }
  }, [mapExpanded]);

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      if (e.state?.mapExpanded) return;
      setMapExpanded(false);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const [selectedRange, setSelectedRange] = useState<Range | null>(null);
  const [hoverDist, setHoverDist] = useState<number | null>(null);
  const [focusPoint, setFocusPoint] = useState<POIPoint | null>(null);
  const [activePOI, setActivePOI] = useState<POIPoint | null>(null);

  // Drag handle — resize map height on mobile
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{ startY: number; startH: number } | null>(null);
  const [mapHeightPx, setMapHeightPx] = useState<number | null>(null);
  const [nearFullscreen, setNearFullscreen] = useState(false);
  const mapHeightPxRef = useRef<number | null>(null);

  useEffect(() => {
    mapHeightPxRef.current = mapHeightPx;
  }, [mapHeightPx]);

  useEffect(() => {
    const el = dragHandleRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      dragStateRef.current = {
        startY: touch.clientY,
        startH: mapHeightPxRef.current ?? window.innerHeight * 0.38,
      };
    };

    const FULLSCREEN_THRESHOLD = 0.62;

    const onTouchMove = (e: TouchEvent) => {
      if (!dragStateRef.current) return;
      e.preventDefault();
      const delta = e.touches[0].clientY - dragStateRef.current.startY;
      const newH = dragStateRef.current.startH + delta;
      const clamped = Math.max(
        window.innerHeight * 0.12,
        Math.min(window.innerHeight * 0.85, newH),
      );
      setMapHeightPx(clamped);
      setNearFullscreen(clamped > window.innerHeight * FULLSCREEN_THRESHOLD);
    };

    const onTouchEnd = () => {
      dragStateRef.current = null;
      setNearFullscreen(false);
      const current = mapHeightPxRef.current;
      if (current !== null && current > window.innerHeight * FULLSCREEN_THRESHOLD) {
        setMapExpanded(true);
        setMapHeightPx(null);
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  const handleShowOnMap = (lat: number, lng: number) => {
    setFocusPoint({ lat, lng });
    setActivePOI({ lat, lng });
  };

  const handleAnalyze = useCallback(() => {
    if (!isAuthenticated) {
      const callbackUrl = encodeURIComponent(`/${locale}/app/route?trailId=${trail.id}`);
      push(`/${locale}/app/login?callbackUrl=${callbackUrl}`);
      return;
    }
    push(`/${locale}/app/route?trailId=${trail.id}`);
  }, [isAuthenticated, trail.id, locale, push]);

  // Pre-compute display labels
  const effortLabel =
    trail.effort_level === 'very_hard'
      ? t('veryHard')
      : t(trail.effort_level as 'easy' | 'moderate' | 'hard');

  const routeTypeLabel =
    trail.route_type && trail.route_type !== 'unknown'
      ? t(`trailType.${trail.route_type}` as 'trailType.GR' | 'trailType.PR' | 'trailType.SL')
      : t('trailType.unknown');

  const seasonLabel =
    trail.season_best === 'avoid_summer'
      ? t('avoidSummer')
      : trail.season_best === 'avoid_winter'
        ? t('avoidWinter')
        : t('yearRound');

  const trackProfile = trail.track_profile ?? [];
  const hasHazards = useMemo(() => analyzeTrackSegments(trackProfile).length > 0, [trackProfile]);

  const highPointCoords = useMemo(() => {
    if (!trail.elevation_max_m || !trackProfile.length) return null;
    const best = trackProfile.reduce((prev, curr) =>
      curr.e !== null &&
      Math.abs(curr.e - trail.elevation_max_m!) <
        Math.abs((prev.e ?? Infinity) - trail.elevation_max_m!)
        ? curr
        : prev,
    );
    return best.e !== null ? { lat: best.lat, lng: best.lng } : null;
  }, [trackProfile, trail.elevation_max_m]);

  const lowPointCoords = useMemo(() => {
    if (!trail.elevation_min_m || !trackProfile.length) return null;
    const best = trackProfile.reduce((prev, curr) =>
      curr.e !== null &&
      Math.abs(curr.e - trail.elevation_min_m!) <
        Math.abs((prev.e ?? Infinity) - trail.elevation_min_m!)
        ? curr
        : prev,
    );
    return best.e !== null ? { lat: best.lat, lng: best.lng } : null;
  }, [trackProfile, trail.elevation_min_m]);

  return (
    <>
      <TrailDetailsStyles />

      <div
        className={cn(
          'flex flex-col bg-zinc-50 text-zinc-900 lg:h-screen lg:overflow-hidden dark:bg-[#08090f] dark:text-white',
          mapExpanded && 'h-dvh overflow-hidden',
        )}
      >
        <Header session={null} />

        {/* Body */}
        <main
          className={cn(
            'flex flex-1 flex-col lg:min-h-0 lg:flex-row lg:overflow-hidden',
            mapExpanded && 'overflow-hidden',
          )}
        >
          {/* LEFT: scrollable content */}
          <div
            className={cn(
              'trail-scrollbar z-3 order-2 -mt-8 flex flex-col overflow-y-auto rounded-t-3xl bg-white shadow-[0_-8px_24px_rgba(0,0,0,0.08)] lg:order-1 lg:mt-0 lg:w-[55%] lg:overflow-hidden lg:rounded-none lg:bg-transparent lg:shadow-none dark:bg-[#0e0f18] dark:shadow-[0_-8px_24px_rgba(0,0,0,0.35)] dark:lg:bg-transparent',
              mapExpanded && 'hidden lg:flex',
            )}
          >
            {/* Drag handle — mobile only */}
            <div
              ref={dragHandleRef}
              className="flex shrink-0 touch-none justify-center py-4 lg:hidden"
            >
              <div
                className={cn(
                  'h-1 w-10 rounded-full transition-all duration-150',
                  nearFullscreen
                    ? 'w-16 bg-zinc-500 dark:bg-zinc-300'
                    : 'bg-zinc-200 dark:bg-zinc-600',
                )}
              />
            </div>

            {/* Inner content wrapper */}
            <div className="trail-scrollbar flex flex-col gap-6 px-4 pb-24 lg:flex-1 lg:gap-8 lg:overflow-y-auto lg:p-8 lg:pb-4">
              <TrailHeader
                trail={trail}
                locale={locale}
                searchParams={searchParams.toString()}
                effortLabel={effortLabel}
                routeTypeLabel={routeTypeLabel}
                seasonLabel={seasonLabel}
              />

              <TrailStatsSection
                trail={trail}
                highPointCoords={highPointCoords}
                lowPointCoords={lowPointCoords}
                onShowOnMap={handleShowOnMap}
              />

              <TrailElevationHazardsTabs
                trackProfile={trackProfile}
                hasHazards={hasHazards}
                hoverDist={hoverDist}
                setHoverDist={setHoverDist}
                selectedRange={selectedRange}
                setSelectedRange={setSelectedRange}
              />

              {/* Hazards — mobile only */}
              {trackProfile.length > 0 && (
                <div className="lg:hidden">
                  <TrailHazards
                    trackProfile={trackProfile}
                    selectedRange={selectedRange}
                    onSegmentSelect={(start, end, color) => setSelectedRange({ start, end, color })}
                    onReset={() => setSelectedRange(null)}
                    hidden={mapExpanded || !isMobile}
                  />
                </div>
              )}

              <TrailWeatherForecast
                lat={trail.start_lat}
                lng={trail.start_lng}
                locale={locale}
                labels={{
                  weatherForecast: t('weatherForecast'),
                  bestDay: t('bestDay'),
                  weatherLoading: t('weatherLoading'),
                  precipitation: t('precipitation'),
                  wind: t('wind'),
                }}
              />

              {trail.slope_breakdown && (
                <SlopeBreakdownBar
                  breakdown={trail.slope_breakdown}
                  labels={{
                    slopeBreakdown: t('slopeBreakdown'),
                    flat: t('flat'),
                    gentle: t('gentle'),
                    steep: t('steep'),
                    extreme: t('extreme'),
                  }}
                />
              )}

              <SuitabilityChips
                childFriendly={trail.child_friendly}
                petFriendly={trail.pet_friendly}
                labels={{
                  childFriendly: t('childFriendly'),
                  petFriendly: t('petFriendly'),
                  yes: t('yes'),
                  no: t('no'),
                }}
              />

              {(trail.dominant_surface || trail.dominant_path_type) && (
                <SurfaceSection
                  dominantSurface={trail.dominant_surface}
                  surfaceBreakdown={trail.surface_breakdown}
                  dominantPathType={trail.dominant_path_type}
                  pathTypeBreakdown={trail.path_type_breakdown}
                  labels={{
                    surfaceTypes: t('surfaceTypes'),
                    pathTypes: t('pathTypes'),
                    surface: {
                      asphalt: t('surface.asphalt'),
                      concrete: t('surface.concrete'),
                      paved: t('surface.paved'),
                      gravel: t('surface.gravel'),
                      fine_gravel: t('surface.fine_gravel'),
                      pebblestone: t('surface.pebblestone'),
                      compacted: t('surface.compacted'),
                      dirt: t('surface.dirt'),
                      earth: t('surface.earth'),
                      ground: t('surface.ground'),
                      grass: t('surface.grass'),
                      unpaved: t('surface.unpaved'),
                      rock: t('surface.rock'),
                      sand: t('surface.sand'),
                      mud: t('surface.mud'),
                      unknown: t('surface.unknown'),
                    },
                    pathType: {
                      footway: t('pathType.footway'),
                      path: t('pathType.path'),
                      track: t('pathType.track'),
                      cycleway: t('pathType.cycleway'),
                      bridleway: t('pathType.bridleway'),
                      steps: t('pathType.steps'),
                      primary: t('pathType.primary'),
                      secondary: t('pathType.secondary'),
                      tertiary: t('pathType.tertiary'),
                      unclassified: t('pathType.unclassified'),
                      residential: t('pathType.residential'),
                      service: t('pathType.service'),
                      unknown: t('pathType.unknown'),
                    },
                  }}
                />
              )}

              <TrailInfoTabs
                trail={trail}
                trackProfile={trackProfile}
                activePOI={activePOI}
                onShowOnMap={handleShowOnMap}
                labels={{
                  escapePoints: t('escapePoints'),
                  town: t('town'),
                  road: t('road'),
                  shelter: t('shelter'),
                  waterSources: t('waterSources'),
                  natural: t('natural'),
                  urban: t('urban'),
                  reliable: t('reliable'),
                  seasonal: t('seasonal'),
                  unreliable: t('unreliable'),
                  kmAway: t('kmAway'),
                  showOnMap: t('showOnMap'),
                  waterGapMax: t('waterGapMax'),
                  waterCarryRecommendation: t('waterCarryRecommendation'),
                  liters: t('liters'),
                  equipmentTitle: t('equipmentTitle'),
                  equipmentFootwear: t('equipmentFootwear'),
                  equipmentPoles: t('equipmentPoles'),
                  equipmentWater: t('equipmentWater'),
                  equipmentLayers: t('equipmentLayers'),
                  equipmentSun: t('equipmentSun'),
                  equipmentCrampons: t('equipmentCrampons'),
                  equipmentFirstAid: t('equipmentFirstAid'),
                  equipmentNavigation: t('equipmentNavigation'),
                  essential: t('essential'),
                  recommended: t('recommended'),
                  equipmentFootwearVibram: t('equipmentFootwearVibram'),
                  equipmentFootwearTrail: t('equipmentFootwearTrail'),
                  equipmentFootwearLight: t('equipmentFootwearLight'),
                  equipmentPolesHighly: t('equipmentPolesHighly'),
                  equipmentPolesRecommended: t('equipmentPolesRecommended'),
                  equipmentWaterAmount: t.raw('equipmentWaterAmount'),
                  equipmentWaterWithSources: t('equipmentWaterWithSources'),
                  equipmentWaterNoSources: t('equipmentWaterNoSources'),
                  equipmentLayersWaterproof: t('equipmentLayersWaterproof'),
                  equipmentLayersFleece: t('equipmentLayersFleece'),
                  equipmentSunHigh: t('equipmentSunHigh'),
                  equipmentSunBasic: t('equipmentSunBasic'),
                  equipmentCramponsNote: t('equipmentCramponsNote'),
                  equipmentFirstAidFull: t('equipmentFirstAidFull'),
                  equipmentFirstAidBasic: t('equipmentFirstAidBasic'),
                  equipmentNavigationGps: t('equipmentNavigationGps'),
                  equipmentNavigationOffline: t('equipmentNavigationOffline'),
                }}
              />

              <TrailSimilarTrails similarTrails={similarTrails} locale={locale} />

              {trail.description && (
                <section className="space-y-2">
                  <h2 className="text-lg font-semibold">{t('description')}</h2>
                  <p className="text-zinc-600 dark:text-zinc-300">{trail.description}</p>
                </section>
              )}

              <TrailInfoTable trail={trail} locale={locale} regionName={regionName} />
            </div>

            <TrailActionFooter onAnalyze={handleAnalyze} mapExpanded={mapExpanded} />
          </div>

          <TrailMapSection
            trail={trail}
            trackProfile={trackProfile}
            locale={locale}
            searchParams={searchParams.toString()}
            mapExpanded={mapExpanded}
            setMapExpanded={setMapExpanded}
            mapHeightPx={mapHeightPx}
            selectedRange={selectedRange}
            setSelectedRange={setSelectedRange}
            hoverDist={hoverDist}
            setHoverDist={setHoverDist}
            focusPoint={focusPoint}
            setFocusPoint={setFocusPoint}
            activePOI={activePOI}
          />
        </main>
      </div>
    </>
  );
}

export function TrailDetailPageClient(props: TrailDetailPageClientProps) {
  return (
    <Suspense fallback={<TrailDetailsSkeleton />}>
      <TrailDetailPageInner {...props} />
    </Suspense>
  );
}
