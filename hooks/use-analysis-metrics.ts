'use client';

import { useMemo } from 'react';
import { useRouteStore } from '@/store/route-store';
import { analyzeRouteSegments, calculatePhysiologicalNeeds } from '@/lib/utils';

export function useAnalysisMetrics() {
  const weatherPoints = useRouteStore((s) => s.weatherPoints);
  const elevationData = useRouteStore((s) => s.elevationData);
  const activityType = useRouteStore((s) => s.fetchedActivityType);

  const routeDurationHours = useMemo(() => {
    if (
      weatherPoints.length > 0 &&
      weatherPoints[0].point.estimatedTime &&
      weatherPoints[weatherPoints.length - 1].point.estimatedTime
    ) {
      return (
        (weatherPoints[weatherPoints.length - 1].point.estimatedTime!.getTime() -
          weatherPoints[0].point.estimatedTime!.getTime()) /
        (1000 * 60 * 60)
      );
    }
    return 0;
  }, [weatherPoints]);

  const totalElevationGain = useMemo(
    () =>
      elevationData.length > 0
        ? elevationData[elevationData.length - 1].elevation - elevationData[0].elevation
        : 0,
    [elevationData],
  );

  const totalDistanceKm = useMemo(
    () => (elevationData.length > 0 ? elevationData[elevationData.length - 1].distance : 0),
    [elevationData],
  );

  const avgTemperatureCelsius = useMemo(
    () =>
      weatherPoints.length > 0
        ? weatherPoints.reduce((sum, wp) => sum + wp.weather.temperature, 0) / weatherPoints.length
        : 0,
    [weatherPoints],
  );

  const { calories, waterLiters } = useMemo(
    () =>
      calculatePhysiologicalNeeds(
        routeDurationHours,
        totalDistanceKm,
        totalElevationGain,
        avgTemperatureCelsius,
        activityType ?? 'cycling',
      ),
    [routeDurationHours, totalDistanceKm, totalElevationGain, avgTemperatureCelsius, activityType],
  );

  const routeSegments = useMemo(() => analyzeRouteSegments(weatherPoints), [weatherPoints]);
  const totalSegments = routeSegments.length;
  const highDangerSegments = useMemo(
    () => routeSegments.filter((s) => s.dangerLevel === 'high').length,
    [routeSegments],
  );
  const mediumDangerSegments = useMemo(
    () => routeSegments.filter((s) => s.dangerLevel === 'medium').length,
    [routeSegments],
  );
  const lowDangerSegments = useMemo(
    () => routeSegments.filter((s) => s.dangerLevel === 'low').length,
    [routeSegments],
  );

  return {
    routeDurationHours,
    totalElevationGain,
    totalDistanceKm,
    avgTemperatureCelsius,
    calories,
    waterLiters,
    routeSegments,
    totalSegments,
    highDangerSegments,
    mediumDangerSegments,
    lowDangerSegments,
  };
}
