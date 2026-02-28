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
    const n = densePoints.length;
    if (n === 0) return [];

    // ── 1. Raw point-to-point slopes ─────────────────────────────────────────
    const rawSlopes = new Array<number>(n).fill(0);
    for (let i = 1; i < n; i++) {
      const distDiff = (densePoints[i].distanceFromStart - densePoints[i - 1].distanceFromStart) * 1000;
      const eleDiff = (densePoints[i].ele ?? 0) - (densePoints[i - 1].ele ?? 0);
      if (distDiff > 0.1) rawSlopes[i] = (eleDiff / distDiff) * 100;
    }

    // ── 2. Sliding-window slope average (200 m each side = 400 m total) ──────
    // O(n) two-pointer approach — keeps colours coherent across the segment
    const halfWindowKm = 0.2;
    const smoothSlopes = new Array<number>(n).fill(0);
    let left = 0, right = -1, wSum = 0, wCount = 0;
    for (let i = 0; i < n; i++) {
      const center = densePoints[i].distanceFromStart;
      while (right + 1 < n && densePoints[right + 1].distanceFromStart <= center + halfWindowKm) {
        right++; wSum += rawSlopes[right]; wCount++;
      }
      while (left <= right && densePoints[left].distanceFromStart < center - halfWindowKm) {
        wSum -= rawSlopes[left]; left++; wCount--;
      }
      smoothSlopes[i] = wCount > 0 ? wSum / wCount : 0;
    }

    // ── 3. Subsample to ≤ 100 points for the gradient (avoids SVG stop flood) ─
    const maxPts = 100;
    const step = n <= maxPts ? 1 : Math.ceil(n / maxPts);
    const indices: number[] = [];
    for (let i = 0; i < n; i += step) indices.push(i);
    if (indices[indices.length - 1] !== n - 1) indices.push(n - 1);

    return indices.map((i) => ({
      dist: densePoints[i].distanceFromStart,
      ele: densePoints[i].ele ?? 0,
      slope: Math.abs(smoothSlopes[i]),
      color: getSlopeColorHex(smoothSlopes[i]),
    }));
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
