import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  let query = supabase
    .from('trails')
    .select('id,slug,country,name,trail_code,effort_level,distance_km,start_lat,start_lng,elevation_gain_m,elevation_loss_m,elevation_min_m,elevation_max_m')
    .limit(10000);

  const country = sp.get('country');
  if (country) query = query.eq('country', country);

  const q = sp.get('q');
  const effort = sp.get('effort');
  const type = sp.get('type');
  const shape = sp.get('shape');
  const child = sp.get('child');
  const pet = sp.get('pet');

  const minDist = sp.get('minDist');
  const maxDist = sp.get('maxDist');
  const minGain = sp.get('minGain');
  const maxGain = sp.get('maxGain');
  const season  = sp.get('season');
  const region  = sp.get('region');

  if (q) query = query.ilike('name', `%${q}%`);
  if (effort) query = query.eq('effort_level', effort);
  if (type) query = query.eq('route_type', type);
  if (shape === 'circular') query = query.eq('is_circular', true);
  if (shape === 'linear') query = query.eq('is_circular', false);
  if (child === 'true') query = query.eq('child_friendly', true);
  if (pet === 'true') query = query.eq('pet_friendly', true);
  if (minDist) query = query.gte('distance_km', parseFloat(minDist));
  if (maxDist) query = query.lte('distance_km', parseFloat(maxDist));
  if (minGain) query = query.gte('elevation_gain_m', parseFloat(minGain));
  if (maxGain) query = query.lte('elevation_gain_m', parseFloat(maxGain));
  if (season)  query = query.eq('season_best', season);
  if (region)  query = query.eq('region', region);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const features = (data ?? [])
    .filter((t) => t.start_lat != null && t.start_lng != null)
    .map((t) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [t.start_lng, t.start_lat] as [number, number] },
      properties: {
        id: t.id,
        slug: t.slug,
        country: t.country,
        name: t.name,
        trail_code: t.trail_code,
        effort_level: t.effort_level,
        distance_km: t.distance_km,
        elevation_gain_m: t.elevation_gain_m,
        elevation_loss_m: t.elevation_loss_m,
        elevation_min_m: t.elevation_min_m,
        elevation_max_m: t.elevation_max_m,
      },
    }));

  return NextResponse.json(
    { type: 'FeatureCollection', features },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
  );
}
