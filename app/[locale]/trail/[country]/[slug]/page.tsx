import { notFound } from 'next/navigation';
import { use } from 'react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { createClient } from '@supabase/supabase-js';
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
import { StatsGrid } from '@/components/trail-detail/stats-grid';
import { EffortBadge } from '@/components/trail-detail/effort-badge';
import { SuitabilityChips } from '@/components/trail-detail/suitability-chips';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Trail {
  id: number;
  slug: string;
  country: string;
  name: string;
  trail_code: string | null;
  route_type: string | null;
  description: string | null;
  source: string | null;
  distance_km: number;
  elevation_max_m: number | null;
  elevation_min_m: number | null;
  elevation_gain_m: number;
  elevation_loss_m: number;
  avg_elevation_m: number | null;
  max_slope_pct: number;
  is_circular: boolean;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  bbox_min_lat: number | null;
  bbox_max_lat: number | null;
  bbox_min_lng: number | null;
  bbox_max_lng: number | null;
  estimated_duration_min: number;
  effort_level: string;
  difficulty_score: number;
  child_friendly: boolean;
  pet_friendly: boolean;
  season_best: string;
  point_count: number | null;
  waypoint_count: number | null;
}

// ---------------------------------------------------------------------------
// Supabase (server-side)
// ---------------------------------------------------------------------------

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

async function getTrail(country: string, slug: string): Promise<Trail | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('trails')
    .select('*')
    .eq('country', country)
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data as Trail;
}

// ---------------------------------------------------------------------------
// Static params (ISR — generates all trail pages at build time)
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  const supabase = getSupabase();
  const { data } = await supabase.from('trails').select('country, slug');
  if (!data) return [];
  return data.map((row: { country: string; slug: string }) => ({
    country: row.country,
    slug: row.slug,
  }));
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, country, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'TrailPage' });
  const trail = await getTrail(country, slug);

  if (!trail) {
    return { title: t('notFound') };
  }

  const effortLabel = trail.effort_level === 'very_hard' ? t('veryHard') : t(trail.effort_level as 'easy' | 'moderate' | 'hard');
  const description = t('metaDescription', {
    distance: trail.distance_km.toFixed(1),
    elevationGain: trail.elevation_gain_m,
    effort: effortLabel,
  });

  return {
    title: trail.name,
    description,
    openGraph: {
      title: trail.name,
      description,
      type: 'article',
    },
  };
}

// ---------------------------------------------------------------------------
// Season icon helper
// ---------------------------------------------------------------------------

function SeasonIcon({ season }: { season: string }) {
  if (season === 'avoid_summer') return <Sun className="h-4 w-4 text-amber-500" />;
  if (season === 'avoid_winter') return <Snowflake className="h-4 w-4 text-sky-400" />;
  return <Thermometer className="h-4 w-4 text-emerald-500" />;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TrailPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; slug: string }>;
}) {
  const { locale, country, slug } = use(params);
  setRequestLocale(locale);

  // We use `use()` with a promise here — Next.js 16 server components support this
  const trail = use(getTrail(country, slug));
  if (!trail) notFound();

  // Build translations synchronously using a pattern compatible with server components
  // We inline what we need since this is a server component using use()
  return <TrailDetailContent trail={trail} locale={locale} />;
}

// Separate async component to allow awaiting translations
async function TrailDetailContent({ trail, locale }: { trail: Trail; locale: string }) {
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

  // Static map preview using MapTiler (uses same key as the main map)
  const mapKey = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? '';
  const centerLat = trail.bbox_min_lat != null && trail.bbox_max_lat != null
    ? (trail.bbox_min_lat + trail.bbox_max_lat) / 2
    : trail.start_lat;
  const centerLng = trail.bbox_min_lng != null && trail.bbox_max_lng != null
    ? (trail.bbox_min_lng + trail.bbox_max_lng) / 2
    : trail.start_lng;

  const staticMapUrl = mapKey
    ? `https://api.maptiler.com/maps/outdoor-v2/static/${centerLng},${centerLat},10/800x400.png?key=${mapKey}`
    : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#08090f] dark:text-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <Link
            href={`/${locale}`}
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

        {/* Static map */}
        {staticMapUrl && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={staticMapUrl}
              alt={trail.name}
              width={800}
              height={400}
              className="h-64 w-full object-cover sm:h-80"
            />
          </div>
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
              {trail.source && (
                <InfoRow label={t('source')} value={trail.source} />
              )}
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

// ---------------------------------------------------------------------------
// Info row helper
// ---------------------------------------------------------------------------

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
