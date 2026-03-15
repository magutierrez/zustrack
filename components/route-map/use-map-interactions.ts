'use client';

import { useState, useCallback, useEffect, useMemo, type RefObject } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import { useRouteStore } from '@/store/route-store';
import type { Annotation, MapPopupInfo, RoutePoint, RouteWeatherPoint } from '@/lib/types';
import {
  calculateBearing,
  findClosestPointIndex,
  interpolatePointOnRoute,
  projectOntoSegment,
} from '@/lib/geometry';

interface UseMapInteractionsParams {
  mapRef: RefObject<MapRef | null>;
  points: RoutePoint[];
  weatherPoints: RouteWeatherPoint[];
  annotations: Annotation[];
  isMobileFullscreen: boolean | undefined;
}

interface UseMapInteractionsReturn {
  onMapClick: (event: any) => void;
  onMapMouseMove: (event: any) => void;
  onMapMouseLeave: () => void;
  onHoverPoint: (index: number | null) => void;
  activePopupData: MapPopupInfo | null;
  activePopupAnnotation: Annotation | null;
  handleClosePopup: () => void;
}

export function useMapInteractions({
  mapRef,
  points,
  weatherPoints,
  annotations,
  isMobileFullscreen,
}: UseMapInteractionsParams): UseMapInteractionsReturn {
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);
  const [manualPopupInfo, setManualPopupInfo] = useState<MapPopupInfo | null>(null);

  const selectedPointIndex = useRouteStore((s) => s.selectedPointIndex);
  const focusPoint = useRouteStore((s) => s.focusPoint);
  const clickedChartPointDist = useRouteStore((s) => s.clickedChartPointDist);
  const chartHoverPoint = useRouteStore((s) => s.chartHoverPoint);
  const { setSelectedPointIndex, setExactSelectedPoint } = useRouteStore();

  const onMapClick = useCallback(
    (event: any) => {
      const feature = event.features?.[0];
      if (feature) {
        setSelectedPointIndex(feature.properties.index);
        setManualPopupInfo(null);
        return;
      }

      const { lng, lat } = event.lngLat;
      if (points.length === 0) return;

      const closestIdx = findClosestPointIndex(points, lat, lng);

      const segBeforeResult = projectOntoSegment(points, closestIdx - 1, lat, lng);
      const segAfterResult = projectOntoSegment(points, closestIdx, lat, lng);

      const winningResult = segBeforeResult ?? segAfterResult;
      const winningSegIdx = segBeforeResult !== null ? closestIdx - 1 : closestIdx;

      const basePoint = winningResult?.point ?? points[closestIdx];
      let slope = 0;
      let estimatedTime: Date | undefined;
      let bearing = 0;

      if (winningResult !== null && winningSegIdx >= 0 && winningSegIdx < points.length - 1) {
        const p1 = points[winningSegIdx];
        const p2 = points[winningSegIdx + 1];

        bearing = calculateBearing(p1, p2);

        const distDiff = (p2.distanceFromStart - p1.distanceFromStart) * 1000;
        const eleDiff = (p2.ele || 0) - (p1.ele || 0);
        slope = distDiff > 0.1 ? (eleDiff / distDiff) * 100 : 0;

        if (p1.estimatedTime && p2.estimatedTime) {
          estimatedTime = new Date(
            p1.estimatedTime.getTime() +
              winningResult.t * (p2.estimatedTime.getTime() - p1.estimatedTime.getTime()),
          );
        }
      }

      const interpolated: RoutePoint & { slope?: number } = {
        ...basePoint,
        slope,
        estimatedTime: estimatedTime ?? basePoint.estimatedTime,
      };

      const weatherIdx = Math.min(
        Math.floor(
          (interpolated.distanceFromStart / points[points.length - 1].distanceFromStart) *
            weatherPoints.length,
        ),
        weatherPoints.length - 1,
      );

      const weatherInfo = weatherPoints[weatherIdx] || {
        weather: { temperature: 0, weatherCode: 0, windSpeed: 0, time: new Date().toISOString() },
        windEffect: 'tailwind' as const,
        solarIntensity: 'moderate' as const,
      };

      setSelectedPointIndex(null);

      setManualPopupInfo({
        point: interpolated,
        weather: weatherInfo.weather,
        index: -1,
        bearing,
        windEffect: weatherInfo.windEffect,
        solarIntensity: weatherInfo.solarIntensity,
      });
    },
    [points, weatherPoints, setSelectedPointIndex],
  );

  const onMapMouseMove = useCallback(
    (e: any) => {
      const map = mapRef.current?.getMap();
      if (!map) return;

      const activeLayers = ['route-hover-target', 'highlight-line', 'range-line'].filter((id) =>
        map.getLayer(id),
      );

      if (activeLayers.length === 0) {
        setExactSelectedPoint(null);
        return;
      }

      const features = map.queryRenderedFeatures(e.point, { layers: activeLayers });

      if (features.length > 0) {
        map.getCanvas().style.cursor = 'pointer';

        const { lng, lat } = e.lngLat;

        if (points.length === 0) return;

        const closestIdx = findClosestPointIndex(points, lat, lng);

        const segBefore = projectOntoSegment(points, closestIdx - 1, lat, lng);
        const segAfter = projectOntoSegment(points, closestIdx, lat, lng);

        let interpolated;
        if (segBefore && segAfter) {
          interpolated = segBefore.distSq <= segAfter.distSq ? segBefore.point : segAfter.point;
        } else {
          interpolated = (segBefore ?? segAfter)?.point ?? points[closestIdx];
        }

        setExactSelectedPoint(interpolated);
      } else {
        map.getCanvas().style.cursor = '';
        setExactSelectedPoint(null);
      }
    },
    [setExactSelectedPoint, points, mapRef],
  );

  const onMapMouseLeave = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) map.getCanvas().style.cursor = '';
    setExactSelectedPoint(null);
  }, [setExactSelectedPoint, mapRef]);

  // Fly to focusPoint and open popup
  useEffect(() => {
    if (focusPoint) {
      const map = mapRef.current?.getMap();
      if (map) {
        map.flyTo({ center: [focusPoint.lon, focusPoint.lat], zoom: 14, duration: 2000 });
        if (focusPoint.silent) return;

        const weatherIdx = weatherPoints.findIndex(
          (wp) =>
            Math.abs(wp.point.lat - focusPoint.lat) < 0.0001 &&
            Math.abs(wp.point.lon - focusPoint.lon) < 0.0001,
        );

        if (weatherIdx !== -1) {
          const wp = weatherPoints[weatherIdx];

          let bearing = 0;
          if (weatherIdx < weatherPoints.length - 1) {
            bearing = calculateBearing(wp.point, weatherPoints[weatherIdx + 1].point);
          }

          let slope = 0;
          if (weatherIdx > 0) {
            const prev = weatherPoints[weatherIdx - 1];
            const distDiff = (wp.point.distanceFromStart - prev.point.distanceFromStart) * 1000;
            const eleDiff = (wp.point.ele || 0) - (prev.point.ele || 0);
            if (distDiff > 0.1) slope = (eleDiff / distDiff) * 100;
          }

          setManualPopupInfo({
            point: { ...wp.point, slope },
            weather: wp.weather,
            index: weatherIdx,
            bearing,
            windEffect: wp.windEffect,
            solarIntensity: wp.solarIntensity,
          });
          setHoveredPointIdx(null);
        }
      }
    }
  }, [focusPoint, weatherPoints, mapRef]);

  // Handle chart click exact point popup
  useEffect(() => {
    if (clickedChartPointDist !== null && points.length > 0) {
      const interpolatedPoint = interpolatePointOnRoute(points, clickedChartPointDist);
      if (!interpolatedPoint) return;

      let closestIdx = 0;
      for (let i = 0; i < points.length - 1; i++) {
        if (
          points[i].distanceFromStart <= clickedChartPointDist &&
          points[i + 1].distanceFromStart >= clickedChartPointDist
        ) {
          closestIdx = i;
          break;
        }
      }

      const p1 = points[closestIdx];
      const p2 = points[closestIdx + 1] || p1;

      const distDiff = (p2.distanceFromStart - p1.distanceFromStart) * 1000;
      const eleDiff = (p2.ele || 0) - (p1.ele || 0);
      const slope = distDiff > 0.1 ? (eleDiff / distDiff) * 100 : 0;

      const bearing = calculateBearing(p1, p2);

      const weatherIdx = Math.min(
        Math.floor(
          (interpolatedPoint.distanceFromStart / points[points.length - 1].distanceFromStart) *
            weatherPoints.length,
        ),
        weatherPoints.length - 1,
      );

      const weatherInfo = weatherPoints[weatherIdx] || {
        weather: { temperature: 0, weatherCode: 0, windSpeed: 0, time: new Date().toISOString() },
        windEffect: 'tailwind' as const,
        solarIntensity: 'moderate' as const,
      };

      setManualPopupInfo({
        point: { ...interpolatedPoint, slope },
        weather: weatherInfo.weather,
        index: -1,
        bearing,
        windEffect: weatherInfo.windEffect,
        solarIntensity: weatherInfo.solarIntensity,
      });
      setHoveredPointIdx(null);
    }
  }, [clickedChartPointDist, points, weatherPoints]);

  // On mobile fullscreen, pan to track the chart-hover point
  useEffect(() => {
    if (!isMobileFullscreen || !chartHoverPoint) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.easeTo({ center: [chartHoverPoint.lon, chartHoverPoint.lat], duration: 150 });
  }, [chartHoverPoint, isMobileFullscreen, mapRef]);

  const popupInfo = useMemo<MapPopupInfo | null>(() => {
    const idx = hoveredPointIdx !== null ? hoveredPointIdx : selectedPointIndex;
    if (idx === null || !weatherPoints?.[idx]) return null;
    const wp = weatherPoints[idx];
    return {
      point: wp.point,
      weather: wp.weather,
      windEffect: wp.windEffect,
      solarIntensity: wp.solarIntensity,
      bearing: wp.bearing,
      index: idx,
    };
  }, [hoveredPointIdx, selectedPointIndex, weatherPoints]);

  const activePopupData = useMemo<MapPopupInfo | null>(
    () => manualPopupInfo ?? popupInfo,
    [manualPopupInfo, popupInfo],
  );

  const activePopupAnnotation = useMemo<Annotation | null>(() => {
    if (!activePopupData || annotations.length === 0) return null;
    const { lat, lon } = activePopupData.point;
    return (
      annotations.find(
        (a) => Math.abs(a.lat - lat) < 0.00001 && Math.abs(a.lon - lon) < 0.00001,
      ) ?? null
    );
  }, [activePopupData, annotations]);

  const handleClosePopup = useCallback(() => {
    setManualPopupInfo(null);
    setHoveredPointIdx(null);
    setSelectedPointIndex(null);
  }, [setSelectedPointIndex]);

  return {
    onMapClick,
    onMapMouseMove,
    onMapMouseLeave,
    onHoverPoint: setHoveredPointIdx,
    activePopupData,
    activePopupAnnotation,
    handleClosePopup,
  };
}
