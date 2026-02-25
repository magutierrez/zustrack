import { NextRequest, NextResponse } from 'next/server';
import {
  openMeteoProvider,
  weatherApiProvider,
  tomorrowIoProvider,
  metNorwayProvider,
} from '@/lib/weather-providers';
import { calculateWindowScore } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { keyPoints, activityType, baseSpeed, startTime } = await request.json();

    if (!keyPoints || keyPoints.length < 2) {
      return NextResponse.json({ error: 'At least 2 key points are required' }, { status: 400 });
    }

    // Optimization: For short routes (< 15km), only use 2 points (Start, End) to save API calls
    const totalDistance = keyPoints[keyPoints.length - 1].distanceFromStart;
    const optimizedKeyPoints =
      totalDistance < 15 ? [keyPoints[0], keyPoints[keyPoints.length - 1]] : keyPoints;

    // 1. Prepare virtual points for 12 windows starting from the provided startTime or now
    const baseDate = startTime ? new Date(startTime) : new Date();
    baseDate.setMinutes(0, 0, 0);
    const virtualPoints: any[] = [];

    for (let offset = 0; offset < 12; offset++) {
      const windowStartTime = new Date(baseDate.getTime() + offset * 3600 * 1000);
      let totalTimeHours = 0;

      for (let i = 0; i < optimizedKeyPoints.length; i++) {
        const p = optimizedKeyPoints[i];
        if (i > 0) {
          const prev = optimizedKeyPoints[i - 1];
          const dist = p.distanceFromStart - prev.distanceFromStart;
          totalTimeHours += dist / baseSpeed;
        }

        const arrivalAtPoint = new Date(windowStartTime.getTime() + totalTimeHours * 3600 * 1000);
        virtualPoints.push({
          lat: p.lat,
          lon: p.lon,
          estimatedTime: arrivalAtPoint.toISOString(),
          windowOffset: offset,
          keyPointIdx: i,
          bearing: p.bearing || 0,
        });
      }
    }

    // 2. Group for provider call
    const uniqueLocationsMap = new Map<
      string,
      { lat: number; lon: number; times: string[]; indices: number[] }
    >();
    virtualPoints.forEach((point, index) => {
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
    const allTimes = virtualPoints.map((p) => new Date(p.estimatedTime).getTime());
    const startDate = new Date(Math.min(...allTimes)).toISOString().split('T')[0];
    const endDate = new Date(Math.max(...allTimes)).toISOString().split('T')[0];

    // 3. Fallback loop including MET Norway (Free, no key)
    const providers = [
      openMeteoProvider,
      metNorwayProvider,
      weatherApiProvider,
      tomorrowIoProvider,
    ];
    let weatherResults: any[] = [];
    let success = false;
    let lastError = null;

    for (const provider of providers) {
      try {
        weatherResults = await provider.fetchWeather({ locations, startDate, endDate });
        success = true;
        break;
      } catch (e) {
        console.warn(`Provider ${provider.name} failed for best-window:`, e);
        lastError = e;
        continue;
      }
    }

    if (!success) {
      throw lastError || new Error('All weather providers failed');
    }

    // 4. Process results back into windows
    weatherResults.sort((a, b) => a.index - b.index);

    const windows = [];
    for (let offset = 0; offset < 12; offset++) {
      const windowPoints = virtualPoints
        .map((vp, idx) => ({ ...vp, weather: weatherResults[idx]?.weather }))
        .filter((p) => p.windowOffset === offset);

      if (
        windowPoints.length === optimizedKeyPoints.length &&
        windowPoints.every((p) => p.weather)
      ) {
        const { score, reasons } = calculateWindowScore(windowPoints, activityType);

        const avgTemp =
          windowPoints.reduce((sum, s) => sum + s.weather.temperature, 0) / windowPoints.length;
        const maxWind = Math.max(...windowPoints.map((s) => s.weather.windSpeed));
        const maxPrecipProb = Math.max(
          ...windowPoints.map((s) => s.weather.precipitationProbability),
        );
        const isNight = windowPoints.some((s) => s.weather.isDay === 0);

        windows.push({
          startTime: new Date(baseDate.getTime() + offset * 3600 * 1000).toISOString(),
          score,
          reasons,
          avgTemp,
          maxWind,
          maxPrecipProb,
          isNight,
        });
      }
    }

    return NextResponse.json({ windows: windows.sort((a, b) => b.score - a.score) });
  } catch (error) {
    console.error('Best window API error:', error);
    return NextResponse.json({ error: 'Failed to analyze windows' }, { status: 500 });
  }
}
