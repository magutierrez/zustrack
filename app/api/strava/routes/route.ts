import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session?.accessToken || session.provider !== 'strava') {
    return NextResponse.json({ error: 'Not authenticated with Strava' }, { status: 401 });
  }

  const athleteId = session.user.id;
  const res = await fetch(
    `https://www.strava.com/api/v3/athletes/${athleteId}/routes?per_page=15&page=1`,
    { headers: { Authorization: `Bearer ${session.accessToken}` } },
  ).catch(() => null);

  if (!res?.ok) {
    const status = res?.status ?? 500;
    return NextResponse.json({ error: 'Failed to fetch Strava routes', expired: status === 401 }, { status });
  }

  const data = await res.json();
  return NextResponse.json(
    data.map((r: any) => ({
      // Use id_str to avoid JS precision loss on large 64-bit Strava IDs
      id: r.id_str ?? String(r.id),
      name: r.name,
      // type: 1 = ride, 2 = run/walk
      activityType: r.type === 1 ? 'cycling' : 'walking',
      distance: Math.round((r.distance / 1000) * 10) / 10,
      elevationGain: Math.round(r.elevation_gain),
    })),
  );
}
