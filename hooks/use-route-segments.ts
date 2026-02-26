'use client';

import { useMemo, useCallback } from 'react';
import { useRouteStore } from '@/store/route-store';
import { PATH_TYPE_COLORS, SURFACE_COLORS } from '@/lib/route-colors';

function getBreakdown(
  points: any[],
  key: 'pathType' | 'surface',
  colorMap: Record<string, string>,
) {
  const distances: Record<string, number> = {};
  let totalDist = 0;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const val = p[key] || 'unknown';
    const prevDist = i > 0 ? points[i - 1].distanceFromStart : 0;
    const segmentDist = p.distanceFromStart - prevDist;
    distances[val] = (distances[val] || 0) + segmentDist;
    totalDist += segmentDist;
  }

  return Object.entries(distances)
    .map(([name, dist]) => ({
      name,
      percent: totalDist > 0 ? (dist / totalDist) * 100 : 0,
      color: colorMap[name] || colorMap.unknown,
    }))
    .filter((item) => item.percent > 0.5)
    .sort((a, b) => b.percent - a.percent);
}

export function useRouteSegments() {
  const routeInfoData = useRouteStore((s) => s.routeInfoData);
  const activeFilter = useRouteStore((s) => s.activeFilter);
  const setActiveFilter = useRouteStore((s) => s.setActiveFilter);
  const setSelectedRange = useRouteStore((s) => s.setSelectedRange);

  const pathBreakdown = useMemo(
    () => getBreakdown(routeInfoData, 'pathType', PATH_TYPE_COLORS),
    [routeInfoData],
  );

  const surfaceBreakdown = useMemo(
    () => getBreakdown(routeInfoData, 'surface', SURFACE_COLORS),
    [routeInfoData],
  );

  const handleSegmentClick = useCallback(
    (key: 'pathType' | 'surface', value: string) => {
      if (activeFilter?.key === key && activeFilter.value === value) {
        setActiveFilter(null);
        setSelectedRange(null);
      } else {
        setActiveFilter({ key, value });
        const matchingPoints = routeInfoData.filter((p) => (p[key] || 'unknown') === value);
        if (matchingPoints.length > 0) {
          const distances = matchingPoints.map((p) => p.distanceFromStart);
          const startDist = Math.min(...distances);
          const endDist = Math.max(...distances);
          setSelectedRange({ start: startDist, end: endDist });
        }
      }
    },
    [activeFilter, setActiveFilter, setSelectedRange, routeInfoData],
  );

  return { pathBreakdown, surfaceBreakdown, handleSegmentClick, activeFilter };
}
