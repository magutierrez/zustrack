import { useMemo } from 'react';
import type { RoutePoint, RouteWeatherPoint } from '@/lib/types';
import type { Feature, FeatureCollection, LineString, Point } from 'geojson';
import { getSlopeColorHex } from '@/lib/slope-colors';
import { PATH_TYPE_COLORS, SURFACE_COLORS } from '@/lib/route-colors';
import type { ActiveFilter } from '@/store/route-store';

export function useMapLayers(
  points: RoutePoint[],
  weatherPoints?: RouteWeatherPoint[],
  activeFilter?: ActiveFilter,
  selectedRange?: { start: number; end: number } | null,
  routeInfoData?: any[],
) {
  const routeData = useMemo<Feature<LineString> | null>(() => {
    if (points.length === 0) return null;
    const validPoints = points.filter(
      (p) =>
        typeof p.lon === 'number' && typeof p.lat === 'number' && !isNaN(p.lon) && !isNaN(p.lat),
    );
    if (validPoints.length < 2) return null;

    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: validPoints.map((p) => [p.lon, p.lat]),
      },
    };
  }, [points]);

  const highlightedData = useMemo<FeatureCollection<LineString> | null>(() => {
    if (!activeFilter || points.length < 2) return null;

    const features: Feature<LineString>[] = [];

    if (activeFilter.key === 'hazard') {
      const [start, end] = activeFilter.value.split('-').map(Number);
      const segPts = points.filter(
        (p) => p.distanceFromStart >= start && p.distanceFromStart <= end,
      );

      if (segPts.length >= 2) {
        const n = segPts.length;

        // ── 1. Raw point-to-point slopes ──────────────────────────────────
        const rawSlopes = new Array<number>(n).fill(0);
        for (let i = 1; i < n; i++) {
          const distDiffM =
            (segPts[i].distanceFromStart - segPts[i - 1].distanceFromStart) * 1000;
          const eleDiffM = (segPts[i].ele ?? 0) - (segPts[i - 1].ele ?? 0);
          if (distDiffM > 0.1) rawSlopes[i] = (eleDiffM / distDiffM) * 100;
        }

        // ── 2. 400 m sliding-window smoothing (same as hazard chart) ──────
        const halfWindowKm = 0.2;
        const smoothSlopes = new Array<number>(n).fill(0);
        let left = 0,
          right = -1,
          wSum = 0,
          wCount = 0;
        for (let i = 0; i < n; i++) {
          const center = segPts[i].distanceFromStart;
          while (
            right + 1 < n &&
            segPts[right + 1].distanceFromStart <= center + halfWindowKm
          ) {
            right++;
            wSum += rawSlopes[right];
            wCount++;
          }
          while (
            left <= right &&
            segPts[left].distanceFromStart < center - halfWindowKm
          ) {
            wSum -= rawSlopes[left];
            left++;
            wCount--;
          }
          smoothSlopes[i] = wCount > 0 ? wSum / wCount : 0;
        }

        // ── 3. Merge consecutive same-color edges into one LineString each ─
        let groupStart = 0;
        let prevColor = getSlopeColorHex(smoothSlopes[1]);

        for (let i = 2; i < n; i++) {
          const color = getSlopeColorHex(smoothSlopes[i]);
          if (color !== prevColor) {
            const coords = segPts.slice(groupStart, i).map((p) => [p.lon, p.lat]);
            if (coords.length >= 2)
              features.push({
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: coords },
                properties: { color: prevColor },
              });
            groupStart = i - 1; // overlap one point → seamless join
            prevColor = color;
          }
        }

        const finalCoords = segPts.slice(groupStart).map((p) => [p.lon, p.lat]);
        if (finalCoords.length >= 2)
          features.push({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: finalCoords },
            properties: { color: prevColor },
          });
      }
    } else {
      const filterKey = activeFilter.key;
      const colorMap = filterKey === 'pathType' ? PATH_TYPE_COLORS : SURFACE_COLORS;
      const segmentColor = colorMap[activeFilter.value] || colorMap.unknown;

      // Use routeInfoData as priority for pathType/surface, fallback to weatherPoints
      const dataForFiltering =
        routeInfoData && routeInfoData.length > 0 ? routeInfoData : weatherPoints;

      if (!dataForFiltering || dataForFiltering.length === 0) return null;

      let currentSegment: number[][] = [];

      points.forEach((p) => {
        let matchingData = dataForFiltering[0];
        for (let j = 0; j < dataForFiltering.length; j++) {
          const dataPoint = dataForFiltering[j];
          const dataDist = dataPoint.distanceFromStart ?? dataPoint.point?.distanceFromStart;

          if (p.distanceFromStart <= dataDist) {
            matchingData = dataPoint;
            break;
          }
          if (j === dataForFiltering.length - 1) matchingData = dataPoint;
        }

        const currentFilterValue = matchingData[filterKey] || 'unknown';

        if (currentFilterValue === activeFilter.value) {
          currentSegment.push([p.lon, p.lat]);
        } else {
          if (currentSegment.length > 1) {
            features.push({
              type: 'Feature',
              geometry: { type: 'LineString', coordinates: currentSegment },
              properties: { color: segmentColor },
            });
          }
          currentSegment = [];
        }
      });

      if (currentSegment.length > 1) {
        features.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: currentSegment },
          properties: { color: segmentColor },
        });
      }
    }

    return features.length > 0 ? { type: 'FeatureCollection', features } : null;
  }, [activeFilter, weatherPoints, points, routeInfoData]);

  const rangeHighlightData = useMemo<Feature<LineString> | null>(() => {
    if (!selectedRange || points.length < 2) return null;

    const rangePoints = points.filter(
      (p) =>
        typeof p.lon === 'number' &&
        typeof p.lat === 'number' &&
        !isNaN(p.lon) &&
        !isNaN(p.lat) &&
        p.distanceFromStart >= selectedRange.start &&
        p.distanceFromStart <= selectedRange.end,
    );

    if (rangePoints.length < 2) return null;

    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: rangePoints.map((p) => [p.lon, p.lat]),
      },
    };
  }, [selectedRange, points]);

  const weatherPointsData = useMemo<FeatureCollection<Point> | null>(() => {
    if (!weatherPoints || weatherPoints.length === 0) return null;

    const validWeatherPoints = weatherPoints.filter(
      (wp) =>
        wp.point &&
        typeof wp.point.lon === 'number' &&
        typeof wp.point.lat === 'number' &&
        !isNaN(wp.point.lon) &&
        !isNaN(wp.point.lat),
    );

    if (validWeatherPoints.length === 0) return null;

    return {
      type: 'FeatureCollection',
      features: validWeatherPoints.map((wp, idx) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [wp.point.lon, wp.point.lat] },
        properties: {
          index: idx,
          bearing: typeof wp.weather.windDirection === 'number' ? wp.weather.windDirection : 0,
          effect: wp.windEffect,
          pathType: wp.pathType || 'unknown',
          surface: wp.surface || 'unknown',
          distanceFromStart: wp.point.distanceFromStart,
        },
      })),
    };
  }, [weatherPoints]);

  const markerData = useMemo<FeatureCollection<Point> | null>(() => {
    if (points.length < 2) return null;

    const start = points[0];
    const end = points[points.length - 1];

    const features: Feature<Point>[] = [];

    if (
      typeof start.lon === 'number' &&
      typeof start.lat === 'number' &&
      !isNaN(start.lon) &&
      !isNaN(start.lat)
    ) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [start.lon, start.lat] },
        properties: { label: 'A', type: 'start' },
      });
    }

    if (
      typeof end.lon === 'number' &&
      typeof end.lat === 'number' &&
      !isNaN(end.lon) &&
      !isNaN(end.lat)
    ) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [end.lon, end.lat] },
        properties: { label: 'B', type: 'end' },
      });
    }

    return { type: 'FeatureCollection', features };
  }, [points]);

  return { routeData, highlightedData, rangeHighlightData, weatherPointsData, markerData };
}
