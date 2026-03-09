import { NextRequest, NextResponse } from 'next/server';
import type { MountainPeak } from '@/lib/types';

export const runtime = 'edge';

interface OverpassNode {
  type: 'node';
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassNode[];
}

export async function POST(request: NextRequest) {
  const { bbox } = await request.json();

  const query =
    `[out:json][timeout:25];` +
    `node["natural"="peak"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});` +
    `out body;`;

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Overpass request failed' }, { status: 502 });
  }

  const data: OverpassResponse = await res.json();

  const peaks: MountainPeak[] = data.elements
    .filter((el) => el.tags?.name)
    .map((el) => ({
      lat: el.lat,
      lng: el.lon,
      name: el.tags!.name!,
      elevation: el.tags?.ele ? parseInt(el.tags.ele, 10) || undefined : undefined,
    }));

  return NextResponse.json({ peaks });
}
