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
}

export type TrailSummary = Pick<
  Trail,
  | 'id' | 'slug' | 'country' | 'name' | 'trail_code' | 'route_type'
  | 'distance_km' | 'elevation_gain_m' | 'estimated_duration_min'
  | 'effort_level' | 'difficulty_score' | 'child_friendly' | 'pet_friendly'
  | 'is_circular' | 'season_best' | 'elevation_max_m'
>;

export interface TrailSearchParams {
  q?: string;
  effort?: string;
  type?: string;
  shape?: string;
  child?: string;
  pet?: string;
  page?: string;
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

export async function fetchTrails(sp: TrailSearchParams): Promise<TrailSearchResult> {
  const page = Math.max(1, parseInt(sp.page ?? '1', 10));
  const offset = (page - 1) * TRAILS_PAGE_SIZE;

  let query = getSupabase()
    .from('trails')
    .select(TRAIL_SUMMARY_COLUMNS, { count: 'exact' });

  if (sp.q) query = query.ilike('name', `%${sp.q}%`);
  if (sp.effort) query = query.eq('effort_level', sp.effort);
  if (sp.type) query = query.eq('route_type', sp.type);
  if (sp.shape === 'circular') query = query.eq('is_circular', true);
  if (sp.shape === 'linear') query = query.eq('is_circular', false);
  if (sp.child === 'true') query = query.eq('child_friendly', true);
  if (sp.pet === 'true') query = query.eq('pet_friendly', true);

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

export async function getTrailStaticParams() {
  const { data } = await getSupabase().from('trails').select('country, slug');
  return (data ?? []).map((row: { country: string; slug: string }) => ({
    country: row.country,
    slug: row.slug,
  }));
}
