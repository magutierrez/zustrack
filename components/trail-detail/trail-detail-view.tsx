import { getTranslations } from 'next-intl/server';
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
import Link from 'next/link';
import type { Trail } from '@/lib/trails';
import { StatsGrid } from './stats-grid';
import { EffortBadge } from './effort-badge';
import { SuitabilityChips } from './suitability-chips';
import { SlopeBreakdownBar } from './slope-breakdown-bar';
import { SurfaceSection } from './surface-section';
import { TrailDetailClient } from './trail-detail-client';

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

export async function TrailDetailView({ trail, locale }: { trail: Trail; locale: string }) {
  const t = await getTranslations({ locale, namespace: 'TrailPage' });

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#08090f] dark:text-white">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <Link
            href={`/${locale}/trail`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToTrails')}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
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

          <div className="flex flex-wrap items-center gap-3">
            <EffortBadge level={trail.effort_level} label={effortLabel} score={trail.difficulty_score} />
            <span className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
              <SeasonIcon season={trail.season_best} />
              {seasonLabel}
            </span>
          </div>
        </div>

        {/* Interactive map + hazard segments (shared selectedRange state via TrailDetailClient) */}
        {trail.track_profile && trail.track_profile.length > 0 && (
          <TrailDetailClient
            trackProfile={trail.track_profile}
            name={trail.name}
            isCircular={trail.is_circular}
            elevationLabels={{
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
            escapePoints={trail.escape_points ?? undefined}
            waterSources={trail.water_sources ?? undefined}
            poiLabels={{
              showOnMap: t('showOnMap'),
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
            }}
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
          maxSlopePct={trail.max_slope_pct}
          labels={{
            distance: t('distance'),
            elevationGain: t('elevationGain'),
            elevationLoss: t('elevationLoss'),
            highPoint: t('highPoint'),
            lowPoint: t('lowPoint'),
            avgElevation: t('avgElevation'),
            duration: t('duration'),
            maxSlope: t('maxSlope'),
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

        {/* Description */}
        {trail.description && (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">{t('description')}</h2>
            <p className="text-slate-600 dark:text-slate-300">{trail.description}</p>
          </section>
        )}

        {/* Info table */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-sm">
            <tbody>
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
      </main>
    </div>
  );
}
