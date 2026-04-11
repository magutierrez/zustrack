import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const StaticMaps = require('staticmaps') as new (opts: { width: number; height: number }) => any;

const MAX_IMAGE_POINTS = 100;
const MAX_DIMENSION = 2048;

const SIZE_PRESETS: Record<string, [number, number]> = {
  lsquare: [400, 400],
  square: [300, 300],
  wide: [600, 300],
};

interface TrackPoint {
  lat: number;
  lng: number;
  d: number;
  e: number | null;
}

function downsample(points: TrackPoint[], max: number): TrackPoint[] {
  if (points.length <= max) return points;
  const step = (points.length - 1) / (max - 1);
  const result: TrackPoint[] = [];
  for (let i = 0; i < max; i++) {
    result.push(points[Math.round(i * step)]);
  }
  return result;
}

function parseSize(size: string): [number, number] | null {
  if (SIZE_PRESETS[size]) return SIZE_PRESETS[size];
  const match = size.match(/^(\d+)x(\d+)$/);
  if (!match) return null;
  const w = parseInt(match[1], 10);
  const h = parseInt(match[2], 10);
  if (w < 1 || h < 1 || w > MAX_DIMENSION || h > MAX_DIMENSION) return null;
  return [w, h];
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const { searchParams } = req.nextUrl;
  const sizeParam = searchParams.get('size') ?? '400x300';
  const format = searchParams.get('format') === 'png' ? 'png' : 'jpeg';

  const dimensions = parseSize(sizeParam);
  if (!dimensions) {
    return NextResponse.json(
      { error: `Invalid size. Use a preset (lsquare, square, wide) or WxH (max ${MAX_DIMENSION})` },
      { status: 400 },
    );
  }
  const [width, height] = dimensions;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error } = await supabase
    .from('trails')
    .select('track_profile')
    .eq('id', numericId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Trail not found' }, { status: 404 });
  }

  const trackProfile = (data.track_profile as TrackPoint[]) ?? [];
  if (trackProfile.length < 2) {
    return NextResponse.json({ error: 'Trail has no map data' }, { status: 400 });
  }

  const sampled = downsample(trackProfile, MAX_IMAGE_POINTS);
  const coords = sampled.map((p) => [p.lng, p.lat] as [number, number]);

  const map = new StaticMaps({ width, height });
  map.addLine({ coords, color: '#ffffff', width: 5 });
  map.addLine({ coords, color: '#e85d04', width: 3 });
  await map.render();

  const buffer: Buffer = await map.image.buffer(
    format === 'png' ? 'image/png' : 'image/jpeg',
    { quality: 85 },
  );

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': format === 'png' ? 'image/png' : 'image/jpeg',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
