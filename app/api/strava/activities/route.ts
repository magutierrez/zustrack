import { auth } from '@/auth';
import { NextResponse } from 'next/server';

const RIDE_TYPES = new Set(['Ride', 'VirtualRide', 'EBikeRide', 'GravelRide', 'MountainBikeRide']);

export async function GET() {
  const session = await auth();
  if (!session?.accessToken || session.provider !== 'strava') {
    return NextResponse.json({ error: 'Not authenticated with Strava' }, { status: 401 });
  }

  const res = await fetch(
    'https://www.strava.com/api/v3/athlete/activities?per_page=15&page=1',
    { headers: { Authorization: `Bearer ${session.accessToken}` } },
  ).catch(() => null);

  if (!res?.ok) {
    const status = res?.status ?? 500;
    return NextResponse.json({ error: 'Failed to fetch Strava activities', expired: status === 401 }, { status });
  }

  const data = await res.json();
  return NextResponse.json(
    data
      .filter((a: any) => a.map?.summary_polyline) // only activities with GPS
      .map((a: any) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        activityType: RIDE_TYPES.has(a.type) ? 'cycling' : 'walking',
        distance: Math.round((a.distance / 1000) * 10) / 10,
        elevationGain: Math.round(a.total_elevation_gain),
        date: a.start_date_local,
      })),
  );
}
