import { useMemo } from 'react';
import type { RouteWeatherPoint } from '@/lib/types';
import { getSunPosition, findNightPointIndex } from '@/lib/utils';

export function useWeatherSummary(weatherPoints: RouteWeatherPoint[]) {
  return useMemo(() => {
    if (weatherPoints.length === 0) {
      return {
        avgTemp: 0,
        maxWind: 0,
        maxGusts: 0,
        avgPrecipProb: 0,
        tailwindPct: 0,
        headwindPct: 0,
        crosswindPct: 0,
        intensePoints: 0,
        shadePoints: 0,
        total: 0,
        arrivesAtNight: false,
        lastTime: new Date(),
        avgSnowDepthCm: 0,
        hasSnow: false,
        nightPoint: null,
        nightPointIndex: null,
        isValleyAdjusted: false,
      };
    }

    const avgTemp =
      weatherPoints.reduce((s, w) => s + w.weather.temperature, 0) / weatherPoints.length;
    const maxWind = Math.max(...weatherPoints.map((w) => w.weather.windSpeed));
    const maxGusts = Math.max(...weatherPoints.map((w) => w.weather.windGusts));
    const avgPrecipProb =
      weatherPoints.reduce((s, w) => s + w.weather.precipitationProbability, 0) /
      weatherPoints.length;
    const tailwindPct =
      (weatherPoints.filter((w) => w.windEffect === 'tailwind').length / weatherPoints.length) *
      100;
    const headwindPct =
      (weatherPoints.filter((w) => w.windEffect === 'headwind').length / weatherPoints.length) *
      100;
    const crosswindPct = 100 - tailwindPct - headwindPct;
    const intensePoints = weatherPoints.filter((w) => w.solarIntensity === 'intense').length;
    const shadePoints = weatherPoints.filter((w) => w.solarIntensity === 'shade').length;
    const total = weatherPoints.length;

    const lastPoint = weatherPoints[weatherPoints.length - 1];
    const lastTime = new Date(lastPoint.weather.time);
    const sunPosAtLast = getSunPosition(lastTime, lastPoint.point.lat, lastPoint.point.lon);
    const arrivesAtNight = sunPosAtLast.altitude < 0;

    const avgSnowDepthCm =
      weatherPoints.reduce((s, w) => s + (w.weather.snowDepthCm ?? 0), 0) / weatherPoints.length;
    const hasSnow = weatherPoints.some((w) => (w.weather.snowDepthCm ?? 0) > 0);

    const { index: nightPointIndex, isValleyAdjusted } = findNightPointIndex(weatherPoints);
    const nightPoint = nightPointIndex !== null ? weatherPoints[nightPointIndex] : null;

    return {
      avgTemp,
      maxWind,
      maxGusts,
      avgPrecipProb,
      tailwindPct,
      headwindPct,
      crosswindPct,
      intensePoints,
      shadePoints,
      total,
      arrivesAtNight,
      lastTime,
      avgSnowDepthCm,
      hasSnow,
      nightPoint,
      nightPointIndex,
      isValleyAdjusted,
    };
  }, [weatherPoints]);
}
