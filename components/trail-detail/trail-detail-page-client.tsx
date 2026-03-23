'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  RotateCcw,
  ArrowRight,
  Sun,
  Snowflake,
  Thermometer,
  ExternalLink,
} from 'lucide-react';
import type { Trail } from '@/lib/trails';
import { StatsGrid } from './stats-grid';
import { EffortBadge } from './effort-badge';
import { SuitabilityChips } from './suitability-chips';
import { SlopeBreakdownBar } from './slope-breakdown-bar';
import { SurfaceSection } from './surface-section';
import { TrailHazards } from './trail-hazards';
import { TrailElevationChart } from './trail-elevation-chart';
import { TrailMapWrapper } from './trail-map-wrapper';
import { EscapePointsSection } from './escape-points-section';
import { WaterSourcesSection } from './water-sources-section';

type Range = { start: number; end: number };
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

export function TrailDetailPageClient({ trail, locale }: { trail: Trail; locale: string }) {
  const t = useTranslations('TrailPage');

  const [selectedRange, setSelectedRange] = useState<Range | null>(null);
  const [hoverDist, setHoverDist] = useState<number | null>(null);
  const [focusPoint, setFocusPoint] = useState<POIPoint | null>(null);
  const [activePOI, setActivePOI] = useState<POIPoint | null>(null);

  const handleShowOnMap = (lat: number, lng: number) => {
    setFocusPoint({ lat, lng });
    setActivePOI({ lat, lng });
  };

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
      Math.abs(curr.e - trail.elevation_max_m!) < Math.abs((prev.e ?? Infinity) - trail.elevation_max_m!)
        ? curr
        : prev,
    );
    return best.e !== null ? { lat: best.lat, lng: best.lng } : null;
  }, [trackProfile, trail.elevation_max_m]);

  const lowPointCoords = useMemo(() => {
    if (!trail.elevation_min_m || !trackProfile.length) return null;
    const best = trackProfile.reduce((prev, curr) =>
      curr.e !== null &&
      Math.abs(curr.e - trail.elevation_min_m!) < Math.abs((prev.e ?? Infinity) - trail.elevation_min_m!)
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
      `}</style>

      <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-[#08090f] dark:text-white">
        {/* Header */}
        <header className="shrink-0 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="px-4 py-3 md:px-8">
            <Link
              href={`/${locale}/trail`}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('backToTrails')}
            </Link>
          </div>
        </header>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          {/* LEFT: scrollable content */}
          <div className="trail-scrollbar flex flex-col gap-8 overflow-y-auto p-4 md:p-8 lg:w-[55%]">
            {/* Hero */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {trail.trail_code && (
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white dark:bg-white dark:text-slate-900">
                    {trail.trail_code}
                  </span>
                )}
                <span className="text-sm text-slate-500 dark:text-slate-400">{routeTypeLabel}</span>
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
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{trail.name}</h1>
              {(trail.place || trail.region) && (
                <p className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {[trail.place, trail.region].filter(Boolean).join(', ')}
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
            </div>

            {/* Elevation chart */}
            {trackProfile.length > 1 && (
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
            )}

            {/* Hazards */}
            {trackProfile.length > 0 && (
              <TrailHazards
                trackProfile={trackProfile}
                selectedRange={selectedRange}
                onSegmentSelect={(start, end) => setSelectedRange({ start, end })}
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

            {/* Escape points */}
            {trail.escape_points && trail.escape_points.length > 0 && (
              <EscapePointsSection
                escapePoints={trail.escape_points}
                labels={{
                  escapePoints: t('escapePoints'),
                  town: t('town'),
                  road: t('road'),
                  shelter: t('shelter'),
                  kmAway: t('kmAway'),
                  showOnMap: t('showOnMap'),
                }}
                activePOI={activePOI}
                onShowOnMap={handleShowOnMap}
              />
            )}

            {/* Water sources */}
            {trail.water_sources && trail.water_sources.length > 0 && (
              <WaterSourcesSection
                waterSources={trail.water_sources}
                labels={{
                  waterSources: t('waterSources'),
                  natural: t('natural'),
                  urban: t('urban'),
                  reliable: t('reliable'),
                  seasonal: t('seasonal'),
                  unreliable: t('unreliable'),
                  kmAway: t('kmAway'),
                  showOnMap: t('showOnMap'),
                }}
                activePOI={activePOI}
                onShowOnMap={handleShowOnMap}
              />
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
                  {trail.region && <InfoRow label={t('region')} value={trail.region} />}
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
              <Link
                href={`/${locale}/app/route`}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                <MapPin className="h-4 w-4" />
                {t('analyzeWithZustrack')}
              </Link>
            </div>
          </div>

          {/* RIGHT: map — fills full height */}
          <div className="h-[70vh] shrink-0 border-t border-slate-200 lg:h-auto lg:flex-1 lg:border-t-0 lg:border-l dark:border-slate-800">
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
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-slate-100 dark:bg-slate-900">
                <span className="text-sm text-slate-400">No map data available</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
