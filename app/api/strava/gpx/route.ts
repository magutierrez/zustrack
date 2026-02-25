import { auth } from '@/auth';
import { NextResponse } from 'next/server';

function buildGpx(points: { lat: number; lon: number; ele?: number }[], name: string): string {
  const trkpts = points
    .map((p) => {
      const ele = p.ele !== undefined ? `\n        <ele>${p.ele.toFixed(1)}</ele>` : '';
      return `      <trkpt lat="${p.lat}" lon="${p.lon}">${ele}\n      </trkpt>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="zustrack" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${name}</name>
  </metadata>
  <trk>
    <name>${name}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.accessToken || session.provider !== 'strava') {
    return NextResponse.json({ error: 'Not authenticated with Strava' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'activity' | 'route'
  const id = searchParams.get('id');
  const name = searchParams.get('name') || 'Strava Route';

  if (!type || !id) {
    return NextResponse.json({ error: 'Missing type or id' }, { status: 400 });
  }

  if (type === 'route') {
    const res = await fetch(`https://www.strava.com/api/v3/routes/${id}/export_gpx`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    }).catch(() => null);

    if (!res?.ok) {
      const status = res?.status ?? 500;
      return NextResponse.json(
        { error: 'Failed to fetch route GPX', expired: status === 401 },
        { status },
      );
    }

    const gpxText = await res.text();
    return new Response(gpxText, { headers: { 'Content-Type': 'application/gpx+xml' } });
  }

  if (type === 'activity') {
    const res = await fetch(
      `https://www.strava.com/api/v3/activities/${id}/streams?keys=latlng,altitude&key_by_type=true`,
      { headers: { Authorization: `Bearer ${session.accessToken}` } },
    ).catch(() => null);

    if (!res?.ok) {
      const status = res?.status ?? 500;
      return NextResponse.json(
        { error: 'Failed to fetch activity streams', expired: status === 401 },
        { status },
      );
    }

    const streams = await res.json();
    const latlng: [number, number][] = streams?.latlng?.data ?? [];
    const altitude: number[] = streams?.altitude?.data ?? [];

    if (latlng.length === 0) {
      return NextResponse.json(
        { error: 'No GPS data available for this activity' },
        { status: 404 },
      );
    }

    const points = latlng.map(([lat, lon], i) => ({ lat, lon, ele: altitude[i] }));
    const gpxText = buildGpx(points, name);
    return new Response(gpxText, { headers: { 'Content-Type': 'application/gpx+xml' } });
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
