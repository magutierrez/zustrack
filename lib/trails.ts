import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Trail {
  id: number;
  slug: string;
  country: string;
  name: string;
  trail_code: string | null;
  route_type: string | null;
  region: string | null;
  place: string | null;
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
  track_profile: Array<{ lat: number; lng: number; d: number; e: number | null }> | null;
  slope_breakdown: { flat: number; gentle: number; steep: number; extreme: number } | null;
  dominant_surface: string | null;
  surface_breakdown: Record<string, number> | null;
  dominant_path_type: string | null;
  path_type_breakdown: Record<string, number> | null;
  escape_points: Array<{
    lat: number;
    lng: number;
    name: string;
    type: 'town' | 'road' | 'shelter';
    distanceFromRoute: number;
  }> | null;
  water_sources: Array<{
    lat: number;
    lng: number;
    name: string;
    type: 'natural' | 'urban';
    distanceFromRoute: number;
    reliability: 'high' | 'medium' | 'low';
  }> | null;
}

export type TrailSummary = Pick<
  Trail,
  | 'id'
  | 'slug'
  | 'country'
  | 'name'
  | 'trail_code'
  | 'route_type'
  | 'region'
  | 'place'
  | 'distance_km'
  | 'elevation_gain_m'
  | 'estimated_duration_min'
  | 'effort_level'
  | 'difficulty_score'
  | 'child_friendly'
  | 'pet_friendly'
  | 'is_circular'
  | 'season_best'
  | 'elevation_max_m'
>;

export interface TrailSearchParams {
  q?: string;
  effort?: string;
  type?: string;
  shape?: string;
  child?: string;
  pet?: string;
  minDist?: string;
  maxDist?: string;
  minGain?: string;
  maxGain?: string;
  season?: string; // 'year_round' | 'avoid_summer' | 'avoid_winter'
  region?: string;
  page?: string;
  view?: string; // 'list' | 'map'
}

export interface TrailRanges {
  minDistance: number;
  maxDistance: number;
  minElevation: number;
  maxElevation: number;
  distanceHistogram: number[];
  elevationHistogram: number[];
}

export interface TrailSearchResult {
  trails: TrailSummary[];
  count: number;
  page: number;
  totalPages: number;
}

export const TRAILS_PAGE_SIZE = 24;

const TRAIL_SUMMARY_COLUMNS =
  'id,slug,country,name,trail_code,route_type,distance_km,elevation_gain_m,estimated_duration_min,effort_level,difficulty_score,child_friendly,pet_friendly,is_circular,season_best,elevation_max_m';

// ---------------------------------------------------------------------------
// Supabase client
// ---------------------------------------------------------------------------

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getTrail(country: string, slug: string): Promise<Trail | null> {
  const { data, error } = await getSupabase()
    .from('trails')
    .select('*')
    .eq('country', country)
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data as Trail;
}

export async function fetchTrails(country: string, sp: TrailSearchParams): Promise<TrailSearchResult> {
  const page = Math.max(1, parseInt(sp.page ?? '1', 10));
  const offset = (page - 1) * TRAILS_PAGE_SIZE;

  let query = getSupabase().from('trails').select(TRAIL_SUMMARY_COLUMNS, { count: 'exact' });

  query = query.eq('country', country);

  if (sp.q) query = query.ilike('name', `%${sp.q}%`);
  if (sp.effort) query = query.eq('effort_level', sp.effort);
  if (sp.type) query = query.eq('route_type', sp.type);
  if (sp.shape === 'circular') query = query.eq('is_circular', true);
  if (sp.shape === 'linear') query = query.eq('is_circular', false);
  if (sp.child === 'true') query = query.eq('child_friendly', true);
  if (sp.pet === 'true') query = query.eq('pet_friendly', true);
  if (sp.minDist) query = query.gte('distance_km', parseFloat(sp.minDist));
  if (sp.maxDist) query = query.lte('distance_km', parseFloat(sp.maxDist));
  if (sp.minGain) query = query.gte('elevation_gain_m', parseFloat(sp.minGain));
  if (sp.maxGain) query = query.lte('elevation_gain_m', parseFloat(sp.maxGain));
  if (sp.season) query = query.eq('season_best', sp.season);
  if (sp.region) query = query.eq('region', sp.region);

  query = query.order('difficulty_score').range(offset, offset + TRAILS_PAGE_SIZE - 1);

  const { data, count } = await query;
  const total = count ?? 0;

  return {
    trails: (data ?? []) as TrailSummary[],
    count: total,
    page,
    totalPages: Math.ceil(total / TRAILS_PAGE_SIZE),
  };
}

export async function getTrailRanges(country: string): Promise<TrailRanges> {
  const sb = getSupabase();

  // 1. Get absolute min/max efficiently for the whole dataset
  const [maxDistRes, minDistRes, maxGainRes, minGainRes] = await Promise.all([
    sb.from('trails').select('distance_km').eq('country', country).order('distance_km', { ascending: false }).limit(1).single(),
    sb.from('trails').select('distance_km').eq('country', country).order('distance_km', { ascending: true }).limit(1).single(),
    sb.from('trails').select('elevation_gain_m').eq('country', country).order('elevation_gain_m', { ascending: false }).limit(1).single(),
    sb.from('trails').select('elevation_gain_m').eq('country', country).order('elevation_gain_m', { ascending: true }).limit(1).single(),
  ]);

  const minDistance = Math.floor((minDistRes.data as any)?.distance_km ?? 0);
  const maxDistance = Math.ceil((maxDistRes.data as any)?.distance_km ?? 100);
  const minElevation = Math.floor((minGainRes.data as any)?.elevation_gain_m ?? 0);
  const maxElevation = Math.ceil((maxGainRes.data as any)?.elevation_gain_m ?? 3000);

  // 2. Fetch all values for the histogram (limit to 10k to be safe)
  const { data: allPoints } = await sb
    .from('trails')
    .select('distance_km, elevation_gain_m')
    .eq('country', country)
    .limit(10000);

  const trails = allPoints ?? [];
  const BINS = 40;
  const distanceHistogram = new Array(BINS).fill(0);
  const elevationHistogram = new Array(BINS).fill(0);

  const distStep = (maxDistance - minDistance) / BINS;
  const elevStep = (maxElevation - minElevation) / BINS;

  trails.forEach((t) => {
    if (t.distance_km != null && distStep > 0) {
      let bin = Math.floor((t.distance_km - minDistance) / distStep);
      if (bin >= BINS) bin = BINS - 1;
      if (bin < 0) bin = 0;
      distanceHistogram[bin]++;
    }
    if (t.elevation_gain_m != null && elevStep > 0) {
      let bin = Math.floor((t.elevation_gain_m - minElevation) / elevStep);
      if (bin >= BINS) bin = BINS - 1;
      if (bin < 0) bin = 0;
      elevationHistogram[bin]++;
    }
  });

  return {
    minDistance,
    maxDistance,
    minElevation,
    maxElevation,
    distanceHistogram,
    elevationHistogram,
  };
}

export async function getRegions(country: string): Promise<string[]> {
  const { data } = await getSupabase()
    .from('trails')
    .select('region')
    .eq('country', country)
    .not('region', 'is', null);
  const seen = new Set<string>();
  for (const row of (data ?? []) as { region: string | null }[]) {
    if (row.region) seen.add(row.region);
  }
  return Array.from(seen).sort();
}

export async function getSimilarTrails(
  country: string,
  id: number,
  difficultyScore: number,
): Promise<TrailSummary[]> {
  const { data } = await getSupabase()
    .from('trails')
    .select(TRAIL_SUMMARY_COLUMNS)
    .eq('country', country)
    .neq('id', id)
    .gte('difficulty_score', difficultyScore - 10)
    .lte('difficulty_score', difficultyScore + 10)
    .limit(3);
  return (data ?? []) as TrailSummary[];
}

export async function getTrailStaticParams() {
  const { data } = await getSupabase().from('trails').select('country, slug');
  return (data ?? []).map((row: { country: string; slug: string }) => ({
    country: row.country,
    slug: row.slug,
  }));
}
