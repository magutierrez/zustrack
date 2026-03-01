'use client';

import { useMemo } from 'react';
import type { RouteWeatherPoint, MudRiskLevel, SnowCondition } from '@/lib/types';
import { getMudRiskSegments } from '@/lib/mud-risk';
import { getSnowSegments, getOverallSnowCondition } from '@/lib/snowshoe';
import { calculatePhysiologicalNeeds } from '@/lib/utils';
import { computeViabilityScore } from '@/lib/viability-score';

export function useAdviceMetrics(
  weatherPoints: RouteWeatherPoint[],
  activityType: 'cycling' | 'walking',
) {
  const viability = useMemo(
    () => (weatherPoints.length > 0 ? computeViabilityScore(weatherPoints) : null),
    [weatherPoints],
  );

  const physiologyNeeds = useMemo(() => {
    if (weatherPoints.length === 0) return null;
    const firstPoint = weatherPoints[0];
    const lastPoint = weatherPoints[weatherPoints.length - 1];
    const durationHours =
      (new Date(lastPoint.weather.time).getTime() - new Date(firstPoint.weather.time).getTime()) /
      3600000;
    const distance = lastPoint.point.distanceFromStart;
    const elevationGain = weatherPoints.reduce((acc, curr, i) => {
      if (i === 0) return 0;
      const diff = (curr.point.ele || 0) - (weatherPoints[i - 1].point.ele || 0);
      return acc + Math.max(0, diff);
    }, 0);
    const avgTemp =
      weatherPoints.reduce((acc, curr) => acc + curr.weather.temperature, 0) /
      weatherPoints.length;
    const needs = calculatePhysiologicalNeeds(
      durationHours,
      distance,
      elevationGain,
      avgTemp,
      activityType,
    );
    return { durationHours, needs };
  }, [weatherPoints, activityType]);

  const mudMetrics = useMemo(() => {
    const mudPoints = weatherPoints.map((wp) => ({
      distanceFromStart: wp.point.distanceFromStart,
      mudRisk: (wp.mudRisk ?? 'none') as MudRiskLevel,
    }));
    const mudSegments = getMudRiskSegments(mudPoints);
    const overallMudRisk: MudRiskLevel = mudSegments.reduce<MudRiskLevel>((worst, s) => {
      const order: MudRiskLevel[] = ['none', 'low', 'medium', 'high'];
      return order.indexOf(s.level) > order.indexOf(worst) ? s.level : worst;
    }, 'none');
    const hasMudData = weatherPoints.some((wp) => wp.weather.past72hPrecipMm !== undefined);

    const mudInputs = hasMudData
      ? (() => {
          const withData = weatherPoints.filter((wp) => wp.weather.past72hPrecipMm !== undefined);
          const avgPrecip =
            Math.round(
              (withData.reduce((s, wp) => s + (wp.weather.past72hPrecipMm ?? 0), 0) /
                withData.length) *
                10,
            ) / 10;
          const surfaceCounts: Record<string, number> = {};
          weatherPoints.forEach((wp) => {
            if (wp.surface) surfaceCounts[wp.surface] = (surfaceCounts[wp.surface] ?? 0) + 1;
          });
          const dominantSurface = Object.entries(surfaceCounts).sort(
            (a, b) => b[1] - a[1],
          )[0]?.[0];
          const avgTemp =
            Math.round(
              (weatherPoints.reduce((s, wp) => s + wp.weather.temperature, 0) /
                weatherPoints.length) *
                10,
            ) / 10;
          const avgWind =
            Math.round(
              (weatherPoints.reduce((s, wp) => s + wp.weather.windSpeed, 0) /
                weatherPoints.length) *
                10,
            ) / 10;
          const shadedPct = Math.round(
            (weatherPoints.filter((wp) => wp.solarExposure === 'shade').length /
              weatherPoints.length) *
              100,
          );
          return { avgPrecip, dominantSurface, avgTemp, avgWind, shadedPct };
        })()
      : null;

    return { mudSegments, overallMudRisk, hasMudData, mudInputs };
  }, [weatherPoints]);

  const snowMetrics = useMemo(() => {
    const snowPoints = weatherPoints.map((wp) => ({
      distanceFromStart: wp.point.distanceFromStart,
      snowCondition: (wp.snowCondition ?? 'none') as SnowCondition,
    }));
    const snowSegments = getSnowSegments(snowPoints);
    const overallSnowCondition = getOverallSnowCondition(snowPoints.map((p) => p.snowCondition));
    const hasSnow = overallSnowCondition !== 'none';
    const maxSnowDepthCm = hasSnow
      ? Math.max(...weatherPoints.map((wp) => wp.weather.snowDepthCm ?? 0))
      : 0;
    return { snowSegments, overallSnowCondition, hasSnow, maxSnowDepthCm };
  }, [weatherPoints]);

  const uniqueEscapePoints = useMemo(
    () =>
      Array.from(new Set(weatherPoints.map((wp) => wp.escapePoint?.name).filter(Boolean))).map(
        (name) => weatherPoints.find((wp) => wp.escapePoint?.name === name)!.escapePoint!,
      ),
    [weatherPoints],
  );

  return { viability, physiologyNeeds, mudMetrics, snowMetrics, uniqueEscapePoints };
}
