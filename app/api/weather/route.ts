import { NextRequest, NextResponse } from 'next/server';
import { openMeteoProvider, weatherApiProvider, tomorrowIoProvider } from '@/lib/weather-providers';
import { z } from 'zod';

const pointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  estimatedTime: z.string().datetime(),
});
const bodySchema = z.object({ points: z.array(pointSchema).min(1).max(500) });

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const { points } = parsed.data;

    // Group points by unique lat/lon (rounded to reduce API calls)
    const uniqueLocationsMap = new Map<
      string,
      { lat: number; lon: number; times: string[]; indices: number[] }
    >();

    points.forEach((point, index) => {
      const key = `${point.lat.toFixed(2)},${point.lon.toFixed(2)}`;
      if (!uniqueLocationsMap.has(key)) {
        uniqueLocationsMap.set(key, {
          lat: parseFloat(point.lat.toFixed(2)),
          lon: parseFloat(point.lon.toFixed(2)),
          times: [],
          indices: [],
        });
      }
      const loc = uniqueLocationsMap.get(key)!;
      loc.times.push(point.estimatedTime);
      loc.indices.push(index);
    });

    const locations = Array.from(uniqueLocationsMap.values());

    // Get global date range
    const allTimes = points.map((p) => new Date(p.estimatedTime).getTime());
    const minTime = new Date(Math.min(...allTimes));
    const maxTime = new Date(Math.max(...allTimes));
    const startDate = minTime.toISOString().split('T')[0];
    const endDate = maxTime.toISOString().split('T')[0];

    // List of providers in priority order
    const providers = [openMeteoProvider, weatherApiProvider, tomorrowIoProvider];

    let weatherResults: any[] = [];
    let success = false;
    let lastError = null;

    // Try providers one by one
    for (const provider of providers) {
      try {
        weatherResults = await provider.fetchWeather({ locations, startDate, endDate });
        success = true;
        break;
      } catch (e) {
        lastError = e;
        continue;
      }
    }

    if (!success) {
      throw lastError || new Error('All weather providers failed');
    }

    // Sort by original index to maintain order
    weatherResults.sort((a, b) => a.index - b.index);

    return NextResponse.json({
      weather: weatherResults.map((r) => r.weather),
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data from all providers' },
      { status: 500 },
    );
  }
}
