'use client';

import { useEffect, RefObject, useCallback } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import type { RoutePoint } from '@/lib/types';

export function useMapView(
  mapRef: RefObject<MapRef | null>,
  points: RoutePoint[],
  selectedRange: { start: number; end: number } | null,
) {
  const fitFullRoute = useCallback(() => {
    const validPoints = points.filter(
      (p) =>
        typeof p.lon === 'number' && typeof p.lat === 'number' && !isNaN(p.lon) && !isNaN(p.lat),
    );
    if (validPoints.length > 0 && mapRef.current) {
      const lons = validPoints.map((p) => p.lon);
      const lats = validPoints.map((p) => p.lat);
      mapRef.current.fitBounds(
        [
          [Math.min(...lons), Math.min(...lats)],
          [Math.max(...lons), Math.max(...lats)],
        ],
        { padding: 40, duration: 1000 },
      );
    }
  }, [points, mapRef]);

  // Initial fit bounds
  useEffect(() => {
    fitFullRoute();
  }, [fitFullRoute]);

  // Fit bounds on range selection
  useEffect(() => {
    if (selectedRange && mapRef.current) {
      const rangePoints = points.filter(
        (p) =>
          typeof p.lon === 'number' &&
          typeof p.lat === 'number' &&
          !isNaN(p.lon) &&
          !isNaN(p.lat) &&
          p.distanceFromStart >= selectedRange.start &&
          p.distanceFromStart <= selectedRange.end,
      );
      if (rangePoints.length > 0) {
        const lons = rangePoints.map((p) => p.lon);
        const lats = rangePoints.map((p) => p.lat);
        mapRef.current.fitBounds(
          [
            [Math.min(...lons), Math.min(...lats)],
            [Math.max(...lons), Math.max(...lats)],
          ],
          { padding: 60, duration: 800 },
        );
      }
    }
  }, [selectedRange, points, mapRef]);

  return { resetToFullRouteView: fitFullRoute };
}
