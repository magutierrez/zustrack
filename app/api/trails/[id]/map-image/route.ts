import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const StaticMaps = require('staticmaps') as new (opts: { width: number; height: number }) => any;

const MAX_IMAGE_POINTS = 100;
const MAX_DIMENSION = 2048;

const SIZE_PRESETS: Record<string, [number, number]> = {
  lsquare: [400, 400],
  square: [300, 300],
  wide: [600, 300],
  card: [400, 200],
};

type ImageFormat = 'webp' | 'jpeg' | 'png';

const MIME: Record<ImageFormat, string> = {
  webp: 'image/webp',
  jpeg: 'image/jpeg',
  png: 'image/png',
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

function resolveFormat(req: NextRequest): ImageFormat {
  const param = req.nextUrl.searchParams.get('format');
  if (param === 'webp') return 'webp';
  if (param === 'png') return 'png';
  if (param === 'jpeg' || param === 'jpg') return 'jpeg';
  // Auto-negotiate: serve WebP if the browser supports it
  const accept = req.headers.get('accept') ?? '';
  if (accept.includes('image/webp')) return 'webp';
  return 'jpeg';
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const { searchParams } = req.nextUrl;
  const sizeParam = searchParams.get('size') ?? '400x300';

  const dimensions = parseSize(sizeParam);
  if (!dimensions) {
    return NextResponse.json(
      { error: `Invalid size. Use a preset (lsquare, square, wide, card) or WxH (max ${MAX_DIMENSION})` },
      { status: 400 },
    );
  }
  const [width, height] = dimensions;
  const format = resolveFormat(req);

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

  const quality = format === 'png' ? undefined : 80;
  const buffer: Buffer = await map.image.buffer(MIME[format], quality !== undefined ? { quality } : {});

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': MIME[format],
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      Vary: 'Accept',
    },
  });
}
