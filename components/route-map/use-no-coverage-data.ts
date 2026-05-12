'use client';

import { useMemo } from 'react';
import type { Feature, FeatureCollection } from 'geojson';
import { RoutePoint, RouteWeatherPoint } from '@/lib/types';

interface UseNoCoverageDataProps {
  showNoCoverageZones: boolean;
  weatherPoints: RouteWeatherPoint[];
  points: RoutePoint[];
}

export function useNoCoverageData({
  showNoCoverageZones,
  weatherPoints,
  points,
}: UseNoCoverageDataProps) {
  return useMemo((): FeatureCollection | null => {
    if (!showNoCoverageZones || weatherPoints.length === 0 || points.length === 0) return null;

    // Build distance ranges from the sparse weather points.
    // Each weather point "owns" from the midpoint with its predecessor to the midpoint with its successor.
    const ranges: { start: number; end: number; weight: number }[] = [];
    for (let i = 0; i < weatherPoints.length; i++) {
      const wp = weatherPoints[i];
      if (wp.mobileCoverage !== 'none' && wp.mobileCoverage !== 'low') continue;
      const d = wp.point.distanceFromStart;
      const prev = i > 0 ? weatherPoints[i - 1].point.distanceFromStart : d;
      const next = i < weatherPoints.length - 1 ? weatherPoints[i + 1].point.distanceFromStart : d;
      ranges.push({
        start: (d + prev) / 2,
        end: (d + next) / 2,
        weight: wp.mobileCoverage === 'none' ? 1.0 : 0.5,
      });
    }
    if (ranges.length === 0) return null;

    // Merge overlapping / adjacent ranges
    ranges.sort((a, b) => a.start - b.start);
    const merged: typeof ranges = [];
    for (const r of ranges) {
      const last = merged[merged.length - 1];
      if (last && r.start <= last.end) {
        last.end = Math.max(last.end, r.end);
        last.weight = Math.max(last.weight, r.weight);
      } else {
        merged.push({ ...r });
      }
    }

    // Use the dense GPX points so the heatmap flows continuously along the route shape.
    const features: Feature[] = [];
    for (const p of points) {
      const range = merged.find(
        (r) => p.distanceFromStart >= r.start && p.distanceFromStart <= r.end,
      );
      if (!range) continue;
      features.push({
        type: 'Feature',
        properties: { weight: range.weight },
        geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
      });
    }

    return features.length > 0 ? { type: 'FeatureCollection', features } : null;
  }, [showNoCoverageZones, weatherPoints, points]);
}
