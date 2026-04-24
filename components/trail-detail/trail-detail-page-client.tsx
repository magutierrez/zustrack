'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/app/_components/header';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  MapPin,
  RotateCcw,
  ArrowRight,
  Sun,
  Snowflake,
  Thermometer,
  ExternalLink,
  Maximize2,
  X,
} from 'lucide-react';
import type { Trail, TrailSummary } from '@/lib/trails';
import { StatsGrid } from './stats-grid';
import { EffortBadge } from './effort-badge';
import { SuitabilityChips } from './suitability-chips';
import { SlopeBreakdownBar } from './slope-breakdown-bar';
import { SurfaceSection } from './surface-section';
import { TrailHazards } from './trail-hazards';
import { TrailElevationChart } from './trail-elevation-chart';
import { TrailMapWrapper } from './trail-map-wrapper';
import { TrailGpxDownload } from './trail-gpx-download';
import { TrailWeatherForecast } from './trail-weather-forecast';
import { TrailCard } from './trail-card';
import { TrailInfoTabs } from './trail-info-tabs';
import { Button } from '@/components/ui/button';

type Range = { start: number; end: number; color?: string };
type POIPoint = { lat: number; lng: number };

function SeasonIcon({ season }: { season: string }) {
  if (season === 'avoid_summer') return <Sun className="h-4 w-4 text-amber-500" />;
  if (season === 'avoid_winter') return <Snowflake className="h-4 w-4 text-sky-400" />;
  return <Thermometer className="h-4 w-4 text-emerald-500" />;
}

function InfoRow({
  label,
  value,
  action,
}: {
  label: string;
  value: string;
  action?: React.ReactNode;
}) {
  return (
    <tr className="border-b border-slate-100 last:border-0 dark:border-slate-800">
      <td className="w-1/3 px-4 py-3 font-medium text-slate-500 dark:text-slate-400">{label}</td>
      <td className="px-4 py-3 text-slate-900 dark:text-white">
        <span>{value}</span>
        {action && <span className="ml-3">{action}</span>}
      </td>
    </tr>
  );
}

export function TrailDetailPageClient({
  trail,
  locale,
  similarTrails = [],
}: {
  trail: Trail;
  locale: string;
  similarTrails?: TrailSummary[];
}) {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const t = useTranslations('TrailPage');
  const regionName = trail.region_i18n?.[locale] ?? trail.region;
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mapExpanded, setMapExpanded] = useState(false);
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
  mapHeightPxRef.current = mapHeightPx;

  useEffect(() => {
    const el = dragHandleRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      dragStateRef.current = {
        startY: t.clientY,
        startH: mapHeightPxRef.current ?? window.innerHeight * 0.38,
      };
    };

    const FULLSCREEN_THRESHOLD = 0.62; // fraction of screen height

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
      router.push(`/${locale}/app/login?callbackUrl=${callbackUrl}`);
      return;
    }
    router.push(`/${locale}/app/route?trailId=${trail.id}`);
  }, [isAuthenticated, trail, locale, router]);

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

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${trail.start_lat},${trail.start_lng}`;

  const trackProfile = trail.track_profile ?? [];

  // Find the lat/lng of the highest and lowest elevation points in the track profile
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
      <style>{`
        .trail-scrollbar::-webkit-scrollbar { width: 4px; }
        .trail-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .trail-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 10px; }
        .trail-scrollbar::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground)); }

        /* MapLibre navigation control — match secondary icon buttons */
        .maplibregl-ctrl-group {
          background: transparent !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          border: none !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 0 !important;
        }
        /* All buttons: base size, secondary bg, no individual shadow by default */
        .maplibregl-ctrl-group button {
          width: 40px !important;
          height: 40px !important;
          background-color: var(--secondary) !important;
          border: none !important;
          box-shadow: none !important;
        }
        /* Zoom-in: top of the unified card */
        .maplibregl-ctrl-group button.maplibregl-ctrl-zoom-in {
          border-radius: calc(var(--radius) - 2px) calc(var(--radius) - 2px) 0 0 !important;
          border-bottom: 1px solid color-mix(in oklch, var(--border) 60%, transparent) !important;
        }
        /* Zoom-out: bottom of the unified card — carries the shadow for the whole pair */
        .maplibregl-ctrl-group button.maplibregl-ctrl-zoom-out {
          border-radius: 0 0 calc(var(--radius) - 2px) calc(var(--radius) - 2px) !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
        }
        /* Compass: separate card with gap */
        .maplibregl-ctrl-group button.maplibregl-ctrl-compass {
          border-radius: calc(var(--radius) - 2px) !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
          margin-top: 6px !important;
        }
        .maplibregl-ctrl-group button:hover {
          background-color: color-mix(in oklch, var(--secondary) 80%, transparent) !important;
        }
        .dark .maplibregl-ctrl-group button .maplibregl-ctrl-icon {
          filter: invert(1) brightness(0.85) !important;
        }
      `}</style>

      <div className="flex flex-col bg-slate-50 text-slate-900 lg:h-screen lg:overflow-hidden dark:bg-[#08090f] dark:text-white">
        <Header session={null} />

        {/* Body */}
        <main className="flex flex-1 flex-col lg:min-h-0 lg:flex-row lg:overflow-hidden">
          {/* LEFT: scrollable content — bottom sheet on mobile */}
          <div className="trail-scrollbar z-3 order-2 -mt-8 flex flex-col overflow-y-auto rounded-t-3xl bg-white shadow-[0_-8px_24px_rgba(0,0,0,0.08)] lg:order-1 lg:mt-0 lg:w-[55%] lg:rounded-none lg:bg-transparent lg:shadow-none dark:bg-[#0e0f18] dark:shadow-[0_-8px_24px_rgba(0,0,0,0.35)] dark:lg:bg-transparent">
            {/* Drag handle — mobile only, touch-active */}
            <div
              ref={dragHandleRef}
              className="flex shrink-0 touch-none justify-center py-4 lg:hidden"
            >
              <div
                className={cn(
                  'h-1 w-10 rounded-full transition-all duration-150',
                  nearFullscreen
                    ? 'w-16 bg-slate-500 dark:bg-slate-300'
                    : 'bg-slate-200 dark:bg-slate-600',
                )}
              />
            </div>

            {/* Inner content wrapper */}
            <div className="flex flex-col gap-6 px-4 pb-24 lg:gap-8 lg:p-8 lg:pb-4">
              {/* Back link — desktop only (mobile uses map overlay button) */}
              <Link
                href={`/${locale}/trail/${trail.country}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
                className="hidden items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 lg:inline-flex dark:text-slate-400 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('backToTrails')}
              </Link>
              {/* Hero */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {trail.trail_code && (
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white dark:bg-white dark:text-slate-900">
                      {trail.trail_code}
                    </span>
                  )}
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {routeTypeLabel}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                    {trail.is_circular ? (
                      <>
                        <RotateCcw className="h-3.5 w-3.5" />
                        {t('circular')}
                      </>
                    ) : (
                      <>
                        <ArrowRight className="h-3.5 w-3.5" />
                        {t('linear')}
                      </>
                    )}
                  </span>
                </div>
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl lg:text-4xl">
                  {trail.name}
                </h1>
                {(trail.place || regionName) && (
                  <p className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {[trail.place, regionName].filter(Boolean).join(', ')}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  <EffortBadge
                    level={trail.effort_level}
                    label={effortLabel}
                    score={trail.difficulty_score}
                  />
                  <span className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                    <SeasonIcon season={trail.season_best} />
                    {seasonLabel}
                  </span>
                </div>
                {trackProfile.length > 0 && (
                  <div className="pt-1">
                    <TrailGpxDownload
                      name={trail.name}
                      trackProfile={trackProfile}
                      label={t('downloadGpx')}
                    />
                  </div>
                )}
              </div>

              {/* Elevation chart — desktop only (mobile uses compact strip above drag handle) */}
              {trackProfile.length > 1 && (
                <div className="hidden lg:block">
                  <TrailElevationChart
                    trackProfile={trackProfile}
                    labels={{
                      elevationProfile: t('elevationProfile'),
                      slope: t('slope'),
                      flat: t('flat'),
                      gentle: t('gentle'),
                      steep: t('steep'),
                      extreme: t('extreme'),
                      km: t('km'),
                      meters: t('meters'),
                      resetZoom: t('resetZoom'),
                    }}
                    externalHoverDist={hoverDist}
                    onHoverDist={setHoverDist}
                    onRangeSelect={(s, e) => setSelectedRange({ start: s, end: e })}
                    onRangeReset={() => setSelectedRange(null)}
                  />
                </div>
              )}

              {/* Hazards */}
              {trackProfile.length > 0 && (
                <TrailHazards
                  trackProfile={trackProfile}
                  selectedRange={selectedRange}
                  onSegmentSelect={(start, end, color) => setSelectedRange({ start, end, color })}
                  onReset={() => setSelectedRange(null)}
                />
              )}

              {/* Stats */}
              <StatsGrid
                distanceKm={trail.distance_km}
                elevationGainM={trail.elevation_gain_m}
                elevationLossM={trail.elevation_loss_m}
                elevationMaxM={trail.elevation_max_m}
                elevationMinM={trail.elevation_min_m}
                avgElevationM={trail.avg_elevation_m}
                estimatedDurationMin={trail.estimated_duration_min}
                highPointCoords={highPointCoords}
                lowPointCoords={lowPointCoords}
                onShowOnMap={handleShowOnMap}
                labels={{
                  distance: t('distance'),
                  elevationGain: t('elevationGain'),
                  elevationLoss: t('elevationLoss'),
                  highPoint: t('highPoint'),
                  lowPoint: t('lowPoint'),
                  avgElevation: t('avgElevation'),
                  duration: t('duration'),
                  km: t('km'),
                  meters: t('meters'),
                  showOnMap: t('showOnMap'),
                }}
              />

              {/* Weather forecast */}
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

              {/* Slope breakdown */}
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

              {/* Suitability */}
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

              {/* Surface types + path types */}
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

              {/* Escape points + Water sources + Equipment — tabbed */}
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

              {/* Similar trails */}
              {similarTrails.length > 0 && (
                <section className="space-y-3">
                  <h2 className="text-lg font-semibold">{t('similarTrails')}</h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {similarTrails.map((s) => (
                      <TrailCard
                        key={s.id}
                        trail={s as Parameters<typeof TrailCard>[0]['trail']}
                        locale={locale}
                        labels={{
                          easy: t('easy'),
                          moderate: t('moderate'),
                          hard: t('hard'),
                          veryHard: t('veryHard'),
                          circular: t('circular'),
                          linear: t('linear'),
                          km: t('km'),
                          meters: t('meters'),
                        }}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Description */}
              {trail.description && (
                <section className="space-y-2">
                  <h2 className="text-lg font-semibold">{t('description')}</h2>
                  <p className="text-slate-600 dark:text-slate-300">{trail.description}</p>
                </section>
              )}

              {/* Info table */}
              <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="w-full text-sm">
                  <tbody>
                    {trail.place && <InfoRow label={t('place')} value={trail.place} />}
                    {regionName && <InfoRow label={t('region')} value={regionName} />}
                    {trail.source && <InfoRow label={t('source')} value={trail.source} />}
                    <InfoRow
                      label={t('startPoint')}
                      value={`${trail.start_lat.toFixed(5)}, ${trail.start_lng.toFixed(5)}`}
                      action={
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sky-600 hover:underline dark:text-sky-400"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          {t('openInMaps')}
                        </a>
                      }
                    />
                    {!trail.is_circular && (
                      <InfoRow
                        label={t('endPoint')}
                        value={`${trail.end_lat.toFixed(5)}, ${trail.end_lng.toFixed(5)}`}
                      />
                    )}
                    {trail.waypoint_count != null && trail.waypoint_count > 0 && (
                      <InfoRow label={t('waypointCount')} value={String(trail.waypoint_count)} />
                    )}
                    {trail.point_count != null && (
                      <InfoRow label={t('pointCount')} value={trail.point_count.toLocaleString()} />
                    )}
                  </tbody>
                </table>
              </section>

              {/* CTA */}
              <div className="flex justify-center pb-4">
                <button
                  onClick={handleAnalyze}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  <MapPin className="h-4 w-4" />
                  {t('analyzeWithZustrack')}
                </button>
              </div>
            </div>
            {/* end inner content wrapper */}
          </div>

          {/* RIGHT: map — 38vh on mobile (bottom sheet overlaps ~32px), fills full height on desktop */}
          <div
            className={cn(
              'relative order-1 h-[38vh] shrink-0 border-slate-200 lg:order-2 lg:h-auto lg:flex-1 lg:border-l dark:border-slate-800',
              mapExpanded && 'fixed inset-0 z-50 h-screen',
            )}
            style={mapHeightPx !== null && !mapExpanded ? { height: mapHeightPx } : undefined}
          >
            {trackProfile.length > 0 ? (
              <TrailMapWrapper
                trackProfile={trackProfile}
                name={trail.name}
                isCircular={trail.is_circular}
                selectedRange={selectedRange}
                onReset={() => setSelectedRange(null)}
                hoverDist={hoverDist}
                onHoverDist={setHoverDist}
                escapePoints={trail.escape_points ?? undefined}
                waterSources={trail.water_sources ?? undefined}
                focusPoint={focusPoint}
                onFocusPointConsumed={() => setFocusPoint(null)}
                activePOI={activePOI}
                mapExpanded={mapExpanded}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-slate-100 dark:bg-slate-900">
                <span className="text-sm text-slate-400">No map data available</span>
              </div>
            )}

            {/* Compact elevation chart — overlaid at bottom of map, mobile only, not fullscreen */}
            {trackProfile.length > 1 && !mapExpanded && (
              <div className="absolute inset-x-0 bottom-3 z-2 text-slate-500 lg:hidden dark:text-slate-300">
                <TrailElevationChart
                  compact
                  singleColor="currentColor"
                  selectable={false}
                  trackProfile={trackProfile}
                  labels={{
                    elevationProfile: t('elevationProfile'),
                    slope: t('slope'),
                    flat: t('flat'),
                    gentle: t('gentle'),
                    steep: t('steep'),
                    extreme: t('extreme'),
                    km: t('km'),
                    meters: t('meters'),
                    resetZoom: t('resetZoom'),
                  }}
                  externalHoverDist={hoverDist}
                  onHoverDist={setHoverDist}
                />
              </div>
            )}

            {/* Elevation chart in fullscreen — slope colours, selectable, at bottom of map */}
            {trackProfile.length > 1 && mapExpanded && (
              <div className="absolute inset-x-0 bottom-16 z-10 lg:hidden">
                <TrailElevationChart
                  compact
                  trackProfile={trackProfile}
                  labels={{
                    elevationProfile: t('elevationProfile'),
                    slope: t('slope'),
                    flat: t('flat'),
                    gentle: t('gentle'),
                    steep: t('steep'),
                    extreme: t('extreme'),
                    km: t('km'),
                    meters: t('meters'),
                    resetZoom: t('resetZoom'),
                  }}
                  externalHoverDist={hoverDist}
                  onHoverDist={setHoverDist}
                  onRangeSelect={(s, e) => setSelectedRange({ start: s, end: e })}
                  onRangeReset={() => setSelectedRange(null)}
                />
              </div>
            )}

            {/* Back button overlay — mobile only */}
            {!mapExpanded && (
              <Link
                href={`/${locale}/trail/${trail.country}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
                className="absolute top-3 left-3 z-10 flex items-center justify-center rounded-full bg-white/90 p-2 shadow-md backdrop-blur-sm lg:hidden dark:bg-slate-900/90"
                aria-label={t('backToTrails')}
              >
                <ArrowLeft className="h-4 w-4 text-slate-700 dark:text-slate-300" />
              </Link>
            )}

            {/* Expand button — mobile only, top-right */}
            {!mapExpanded && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setMapExpanded(true)}
                className="absolute top-3 right-3 z-10 flex items-center justify-center bg-white/90 p-2 shadow-md backdrop-blur-sm lg:hidden dark:bg-slate-900/90"
                aria-label="Expand map"
              >
                <Maximize2 />
              </Button>
            )}

            {/* Close button — shown when map is expanded */}
            {mapExpanded && (
              <button
                onClick={() => setMapExpanded(false)}
                className="absolute top-4 right-4 z-10 flex items-center justify-center rounded-full bg-white/90 p-2 shadow-md backdrop-blur-sm dark:bg-slate-900/90"
                aria-label="Close map"
              >
                <X className="h-4 w-4 text-slate-700 dark:text-slate-300" />
              </button>
            )}
          </div>
        </main>

        {/* Sticky CTA — mobile only */}
        <div className="fixed right-0 bottom-0 left-0 z-20 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-sm lg:hidden dark:border-slate-800 dark:bg-[#08090f]/95">
          <Button
            onClick={handleAnalyze}
            className="font-headline h-auto w-full rounded-xl bg-slate-900 px-6 py-4 text-base font-bold text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <MapPin />
            {t('analyzeWithZustrack')}
          </Button>
        </div>
      </div>
    </>
  );
}
