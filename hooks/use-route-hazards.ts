'use client';

import { useMemo, useRef, useCallback } from 'react';
import type { RouteWeatherPoint, RoutePoint } from '@/lib/types';
import { analyzeRouteSegments } from '@/lib/utils';
import { getSlopeColorHex } from '@/lib/slope-colors';
import { interpolatePointOnRoute } from '@/lib/geometry';
import { useRouteStore } from '@/store/route-store';

export function useRouteHazards(weatherPoints: RouteWeatherPoint[]) {
  const lastUpdateRef = useRef<number>(0);
  const setChartHoverPoint = useRouteStore((s) => s.setChartHoverPoint);

  const sortedSegments = useMemo(() => {
    const segments = analyzeRouteSegments(weatherPoints);
    return [...segments]
      .sort((a, b) => {
        const levels = ['low', 'medium', 'high'];
        return (
          levels.indexOf(b.dangerLevel) - levels.indexOf(a.dangerLevel) || b.maxSlope - a.maxSlope
        );
      })
      .slice(0, 8);
  }, [weatherPoints]);

  const buildChartData = useCallback((densePoints: RoutePoint[]) => {
    return densePoints.map((p, pIdx) => {
      let slope = 0;
      if (pIdx > 0) {
        const prev = densePoints[pIdx - 1];
        const distDiff = (p.distanceFromStart - prev.distanceFromStart) * 1000;
        const eleDiff = (p.ele || 0) - (prev.ele || 0);
        if (distDiff > 0.1) {
          slope = (eleDiff / distDiff) * 100;
        }
      }
      return {
        dist: p.distanceFromStart,
        ele: p.ele || 0,
        slope: Math.abs(slope),
        color: getSlopeColorHex(slope),
      };
    });
  }, []);

  const handleMouseMove = useCallback(
    (
      e: any,
      segmentPoints: RoutePoint[],
      onSelectPoint: (point: RoutePoint | null) => void,
    ) => {
      const activeDistance: number | undefined =
        e?.activeLabel ?? e?.activePayload?.[0]?.payload?.dist;
      if (activeDistance !== undefined && segmentPoints.length > 1) {
        const now = Date.now();
        if (now - lastUpdateRef.current > 8) {
          const interpolated = interpolatePointOnRoute(segmentPoints, activeDistance);
          if (interpolated) {
            onSelectPoint(interpolated);
            setChartHoverPoint(interpolated);
          }
          lastUpdateRef.current = now;
        }
      }
    },
    [setChartHoverPoint],
  );

  const handleMouseLeave = useCallback(
    (onSelectPoint?: (point: RoutePoint | null) => void) => {
      onSelectPoint?.(null);
      setChartHoverPoint(null);
    },
    [setChartHoverPoint],
  );

  return { sortedSegments, buildChartData, handleMouseMove, handleMouseLeave };
}
