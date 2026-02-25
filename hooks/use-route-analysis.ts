'use client';

import { useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  parseGPX,
  sampleRoutePoints,
  calculateBearing,
  getWindEffect,
  reverseGPXData,
} from '@/lib/gpx-parser';
import type { RouteWeatherPoint, WeatherData } from '@/lib/types';
import { computeMudRiskScore, scoreToRiskLevel } from '@/lib/mud-risk';
import { computeSnowCondition } from '@/lib/snowshoe';
import {
  getSunPosition,
  getSolarExposure,
  getSolarIntensity,
  calculateSmartSpeed,
  calculateElevationGainLoss,
} from '@/lib/utils';
import { useRouteStore } from '@/store/route-store';

export function useRouteAnalysis() {
  const t = useTranslations('HomePage');

  // Read reactive state from store (for useEffect dependencies)
  const gpxData = useRouteStore((s) => s.gpxData);
  const fetchedRawGpxContent = useRouteStore((s) => s.fetchedRawGpxContent);
  const fetchedGpxFileName = useRouteStore((s) => s.fetchedGpxFileName);
  const routeInfoData = useRouteStore((s) => s.routeInfoData);
  const elevationData = useRouteStore((s) => s.elevationData);

  // Store setters
  const {
    setGpxData,
    setGpxFileName,
    setRawGPXContent,
    setWeatherPoints,
    setElevationData,
    setRouteInfoData,
    setIsLoading,
    setIsRouteInfoLoading,
    setError,
    setRecalculatedElevationGain,
    setRecalculatedElevationLoss,
    setRecalculatedTotalDistance,
    setIsWeatherAnalyzed,
    setBestWindows,
    setIsFindingWindow,
    setSelectedPointIndex,
  } = useRouteStore();

  const handleReverseRoute = useCallback(() => {
    const currentGpxData = useRouteStore.getState().gpxData;
    if (!currentGpxData) return;
    const reversed = reverseGPXData(currentGpxData);
    setGpxData(reversed);
    setRecalculatedElevationGain(reversed.totalElevationGain);
    setRecalculatedElevationLoss(reversed.totalElevationLoss);
    setRecalculatedTotalDistance(reversed.totalDistance);
    setWeatherPoints([]);
    setSelectedPointIndex(null);
    setIsWeatherAnalyzed(false);
  }, [
    setGpxData,
    setRecalculatedElevationGain,
    setRecalculatedElevationLoss,
    setRecalculatedTotalDistance,
    setWeatherPoints,
    setSelectedPointIndex,
    setIsWeatherAnalyzed,
  ]);

  const fetchRouteInfo = useCallback(async () => {
    const currentGpxData = useRouteStore.getState().gpxData;
    if (!currentGpxData) {
      setRouteInfoData([]);
      return;
    }

    setIsRouteInfoLoading(true);
    try {
      const response = await fetch('/api/route-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points: sampleRoutePoints(currentGpxData.points, 100).map((p) => ({
            lat: p.lat,
            lon: p.lon,
            distanceFromStart: p.distanceFromStart,
          })),
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setRouteInfoData(data.pathData || []);
      }
    } catch {
      setError(t('errors.unknownError'));
    } finally {
      setIsRouteInfoLoading(false);
    }
  }, [setRouteInfoData, setIsRouteInfoLoading, setError, t]);

  // Initialize GPX data from fetched route content
  useEffect(() => {
    if (fetchedRawGpxContent && fetchedGpxFileName && !gpxData) {
      try {
        const trimmedContent = fetchedRawGpxContent.trim();
        if (trimmedContent.startsWith('{')) {
          throw new Error('JSON data is currently disabled');
        }

        const data = parseGPX(trimmedContent);
        if (data.points.length < 2) {
          setError(t('errors.insufficientPoints'));
          return;
        }

        const { initialDistance, initialElevationGain, initialElevationLoss } =
          useRouteStore.getState();

        setGpxData(data);
        setGpxFileName(fetchedGpxFileName);
        setRawGPXContent(fetchedRawGpxContent);
        setRecalculatedTotalDistance(initialDistance || data.totalDistance || 0);
        setRecalculatedElevationGain(initialElevationGain || data.totalElevationGain || 0);
        setRecalculatedElevationLoss(initialElevationLoss || data.totalElevationLoss || 0);
        setError(null);
        setIsWeatherAnalyzed(false);
      } catch (err) {
        console.error('Error parsing GPX content:', err);
        setError(t('errors.readError'));
      }
    }
  }, [
    fetchedRawGpxContent,
    fetchedGpxFileName,
    gpxData,
    t,
    setGpxData,
    setGpxFileName,
    setRawGPXContent,
    setRecalculatedTotalDistance,
    setRecalculatedElevationGain,
    setRecalculatedElevationLoss,
    setError,
    setIsWeatherAnalyzed,
  ]);

  // Update elevation data and fetch route info when gpxData changes
  useEffect(() => {
    if (gpxData) {
      const dense = sampleRoutePoints(gpxData.points, 3000);
      const initialElevation = dense.map((p) => ({
        distance: p.distanceFromStart,
        elevation: p.ele || 0,
      }));
      setElevationData(initialElevation);
      fetchRouteInfo();
    } else {
      setElevationData([]);
      setRecalculatedElevationGain(0);
      setRecalculatedElevationLoss(0);
      setRecalculatedTotalDistance(0);
      setRouteInfoData([]);
      setWeatherPoints([]);
      setIsWeatherAnalyzed(false);
    }
  }, [
    gpxData,
    fetchRouteInfo,
    setElevationData,
    setRecalculatedElevationGain,
    setRecalculatedElevationLoss,
    setRecalculatedTotalDistance,
    setRouteInfoData,
    setWeatherPoints,
    setIsWeatherAnalyzed,
  ]);

  // Update elevation data when routeInfoData arrives
  useEffect(() => {
    if (routeInfoData.length > 0) {
      const newElevationData = routeInfoData.map((item) => ({
        distance: item.distanceFromStart,
        elevation: item.elevation || 0,
      }));
      setElevationData(newElevationData);
    }
  }, [routeInfoData, setElevationData]);

  // Recalculate totals when elevationData changes
  useEffect(() => {
    if (elevationData.length > 0) {
      const { totalElevationGain, totalElevationLoss } = calculateElevationGainLoss(elevationData);
      setRecalculatedElevationGain(totalElevationGain);
      setRecalculatedElevationLoss(totalElevationLoss);
      setRecalculatedTotalDistance(elevationData[elevationData.length - 1].distance);
    }
  }, [
    elevationData,
    setRecalculatedElevationGain,
    setRecalculatedElevationLoss,
    setRecalculatedTotalDistance,
  ]);

  const handleClearGPX = useCallback(() => {
    setGpxData(null);
    setGpxFileName(null);
    setRawGPXContent(null);
    setWeatherPoints([]);
    setRouteInfoData([]);
    setSelectedPointIndex(null);
    setError(null);
    setIsWeatherAnalyzed(false);
  }, [
    setGpxData,
    setGpxFileName,
    setRawGPXContent,
    setWeatherPoints,
    setRouteInfoData,
    setSelectedPointIndex,
    setError,
    setIsWeatherAnalyzed,
  ]);

  const handleAnalyze = useCallback(
    async (overrideConfig?: any) => {
      const currentGpxData = useRouteStore.getState().gpxData;
      const currentRouteInfoData = useRouteStore.getState().routeInfoData;
      const storeConfig = useRouteStore.getState().config;
      const storeActivityType = useRouteStore.getState().fetchedActivityType;

      // Guard against React MouseEvent or other non-config objects being passed
      const isConfigObject =
        overrideConfig &&
        typeof overrideConfig === 'object' &&
        'date' in overrideConfig &&
        'time' in overrideConfig;

      const analysisConfig = isConfigObject
        ? (overrideConfig as {
            date: string;
            time: string;
            speed: number;
            activityType: 'cycling' | 'walking';
          })
        : {
            ...storeConfig,
            activityType: storeActivityType || 'cycling',
          };

      // Ensure we use the latest speed from the store if not overridden by a valid config object
      if (!isConfigObject) {
        analysisConfig.speed = storeConfig.speed;
      }

      if (!currentGpxData) return;

      setIsLoading(true);
      setError(null);
      setWeatherPoints([]);
      setIsWeatherAnalyzed(false);

      const fetchWithRetry = async (
        url: string,
        options: RequestInit,
        maxRetries = 3,
      ): Promise<Response> => {
        let lastError: Error | null = null;
        for (let i = 0; i < maxRetries; i++) {
          try {
            const response = await fetch(url, options);
            if (response.status === 429) {
              await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
              continue;
            }
            return response;
          } catch (err) {
            lastError = err instanceof Error ? err : new Error('Unknown error');
            await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
          }
        }
        throw lastError || new Error('Retry limit reached');
      };

      try {
        const sampled = sampleRoutePoints(currentGpxData.points, 48);
        const startTime = new Date(`${analysisConfig.date}T${analysisConfig.time}:00`);

        if (isNaN(startTime.getTime())) {
          throw new Error('Invalid start time configuration');
        }

        const pointsWithTime: any[] = [];
        let currentElapsedTime = 0;

        sampled.forEach((point, idx) => {
          if (idx === 0) {
            pointsWithTime.push({ ...point, estimatedTime: new Date(startTime.getTime()) });
          } else {
            const prevPoint = sampled[idx - 1];
            const segmentDist = point.distanceFromStart - prevPoint.distanceFromStart;
            const segmentEleGain = Math.max(0, (point.ele || 0) - (prevPoint.ele || 0));
            const speedAtSegment = calculateSmartSpeed(
              analysisConfig.speed,
              segmentDist,
              segmentEleGain,
              analysisConfig.activityType,
            );
            currentElapsedTime += segmentDist / speedAtSegment;
            pointsWithTime.push({
              ...point,
              estimatedTime: new Date(startTime.getTime() + currentElapsedTime * 3600000),
            });
          }
        });

        const response = await fetchWithRetry('/api/weather', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            points: pointsWithTime.map((p) => ({
              lat: p.lat,
              lon: p.lon,
              estimatedTime: p.estimatedTime.toISOString(),
            })),
          }),
        });

        if (!response.ok) {
          throw new Error(
            response.status === 429 ? t('errors.tooManyRequests') : t('errors.weatherFetchError'),
          );
        }

        const weatherDataObj = await response.json();
        const weatherData: WeatherData[] = weatherDataObj.weather;

        const routeWeatherPoints: RouteWeatherPoint[] = pointsWithTime.map((point, idx) => {
          const nextIdx = Math.min(idx + 1, pointsWithTime.length - 1);
          const prevIdx = Math.max(0, idx - 1);
          const nextPoint = pointsWithTime[nextIdx];
          const prevPoint = pointsWithTime[prevIdx];

          const bearing = calculateBearing(point.lat, point.lon, nextPoint.lat, nextPoint.lon);
          const weather = weatherData[idx];
          const windResult = getWindEffect(bearing, weather.windDirection);

          const info = currentRouteInfoData.reduce(
            (prev, curr) =>
              Math.abs(curr.distanceFromStart - point.distanceFromStart) <
              Math.abs(prev.distanceFromStart - point.distanceFromStart)
                ? curr
                : prev,
            currentRouteInfoData[0] || {},
          );

          const ele = point.ele !== undefined && point.ele !== 0 ? point.ele : info.elevation || 0;

          const distDiff = (nextPoint.distanceFromStart - prevPoint.distanceFromStart) * 1000;
          const eleDiff =
            (nextPoint.ele !== undefined
              ? nextPoint.ele
              : currentRouteInfoData.find(
                  (d: any) => d.distanceFromStart === nextPoint.distanceFromStart,
                )?.elevation || 0) -
            (prevPoint.ele !== undefined
              ? prevPoint.ele
              : currentRouteInfoData.find(
                  (d: any) => d.distanceFromStart === prevPoint.distanceFromStart,
                )?.elevation || 0);
          const slopeRad = distDiff > 0 ? Math.atan(eleDiff / distDiff) : 0;
          const slopeDeg = (slopeRad * 180) / Math.PI;
          const aspectDeg = eleDiff > 0 ? (bearing + 180) % 360 : bearing;

          const sunPos = getSunPosition(point.estimatedTime, point.lat, point.lon);
          const solarExposure = getSolarExposure(weather, sunPos, Math.abs(slopeDeg), aspectDeg);
          const solarIntensity = getSolarIntensity(weather.directRadiation, solarExposure);

          const slopePercent = distDiff > 0 ? (eleDiff / distDiff) * 100 : 0;
          const snowCond = computeSnowCondition({
            snowDepthCm: weather.snowDepthCm ?? 0,
            recent48hSnowfallCm: weather.recent48hSnowfallCm ?? 0,
            freezeThawCycle: weather.freezeThawCycle ?? false,
            temperature: weather.temperature,
            slopeDeg,
          });
          const mudScore = computeMudRiskScore({
            past72hPrecipMm: weather.past72hPrecipMm ?? 0,
            surface: info.surface,
            temperature: weather.temperature,
            windSpeed: weather.windSpeed,
            cloudCover: weather.cloudCover ?? 0,
            isShaded: solarExposure === 'shade',
            slopePercent,
          });

          return {
            point: { ...point, ele },
            weather,
            windEffect: windResult.effect,
            windEffectAngle: windResult.angle,
            bearing,
            pathType: info.pathType,
            surface: info.surface,
            solarExposure,
            solarIntensity,
            escapePoint: info.escapePoint,
            mobileCoverage: info.mobileCoverage,
            waterSources: info.waterSources,
            mudRisk: scoreToRiskLevel(mudScore),
            mudRiskScore: mudScore,
            snowCondition: snowCond,
          };
        });

        setWeatherPoints(routeWeatherPoints);
        setSelectedPointIndex(0);
        setIsWeatherAnalyzed(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('errors.unknownError'));
      } finally {
        setIsLoading(false);
      }
    },
    [t, setIsLoading, setError, setWeatherPoints, setIsWeatherAnalyzed, setSelectedPointIndex],
  );

  const handleFindBestWindow = useCallback(async () => {
    const currentGpxData = useRouteStore.getState().gpxData;
    if (!currentGpxData) return;

    setIsFindingWindow(true);
    setBestWindows([]);

    try {
      const { config: storeConfig, fetchedActivityType } = useRouteStore.getState();

      const calculateApproxBearing = (idx: number) => {
        const p1 = currentGpxData.points[idx];
        const p2 = currentGpxData.points[Math.min(idx + 10, currentGpxData.points.length - 1)];
        return calculateBearing(p1.lat, p1.lon, p2.lat, p2.lon);
      };

      const keyPoints = [
        { ...currentGpxData.points[0], bearing: calculateApproxBearing(0) },
        {
          ...currentGpxData.points[Math.floor(currentGpxData.points.length / 2)],
          bearing: calculateApproxBearing(Math.floor(currentGpxData.points.length / 2)),
        },
        {
          ...currentGpxData.points[currentGpxData.points.length - 1],
          bearing: calculateApproxBearing(currentGpxData.points.length - 1),
        },
      ];

      const response = await fetch('/api/weather/best-window', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyPoints,
          activityType: fetchedActivityType,
          baseSpeed: storeConfig.speed,
          startTime: `${storeConfig.date}T${storeConfig.time}:00`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBestWindows(data.windows || []);
      }
    } catch {
      // Ignore
    } finally {
      setIsFindingWindow(false);
    }
  }, [setIsFindingWindow, setBestWindows]);

  return {
    handleAnalyze,
    handleClearGPX,
    handleReverseRoute,
    handleFindBestWindow,
  };
}
