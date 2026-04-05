import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const MAX_PREVIEW_POINTS = 300;

interface TrackPoint {
  lat: number;
  lng: number;
  d: number;
  e: number | null;
}

function downsample(points: TrackPoint[]): TrackPoint[] {
  if (points.length <= MAX_PREVIEW_POINTS) {
    return points;
  }
  const step = (points.length - 1) / (MAX_PREVIEW_POINTS - 1);
  const result: TrackPoint[] = [];
  for (let i = 0; i < MAX_PREVIEW_POINTS; i++) {
    result.push(points[Math.round(i * step)]);
  }
  return result;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error } = await supabase
    .from('trails')
    .select('track_profile,bbox_min_lat,bbox_max_lat,bbox_min_lng,bbox_max_lng')
    .eq('id', numericId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const trackProfile = (data.track_profile as TrackPoint[]) || [];
  const sampledProfile = downsample(trackProfile);

  const bbox =
    data.bbox_min_lng != null && data.bbox_min_lat != null &&
    data.bbox_max_lng != null && data.bbox_max_lat != null
      ? ([data.bbox_min_lng, data.bbox_min_lat, data.bbox_max_lng, data.bbox_max_lat] as [number, number, number, number])
      : null;

  return NextResponse.json(
    {
      profile: sampledProfile,
      coordinates: sampledProfile.map(p => [p.lng, p.lat]),
      bbox
    },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
  );
}
