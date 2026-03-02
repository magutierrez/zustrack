'use client';

import { useMemo, useState } from 'react';
import { useRouteStore } from '@/store/route-store';
import { getSlopeColorHex } from '@/lib/slope-colors';
import { interpolatePointOnRoute } from '@/lib/geometry';

export function useElevationChart() {
  const weatherPoints = useRouteStore((s) => s.weatherPoints);
  const allPoints = useRouteStore((s) => s.gpxData?.points || []);
  const elevationData = useRouteStore((s) => s.elevationData);
  const mapHoverPoint = useRouteStore((s) => s.exactSelectedPoint);
  const chartHoverPoint = useRouteStore((s) => s.chartHoverPoint);
  const setChartHoverPoint = useRouteStore((s) => s.setChartHoverPoint);
  const setSelectedRange = useRouteStore((s) => s.setSelectedRange);

  // Chart hover takes priority over map hover for the reference line
  const selectedPoint = chartHoverPoint ?? mapHoverPoint;

  const [zoomRange, setZoomRange] = useState<{ start: number; end: number } | null>(null);

  const displayData = useMemo(() => {
    const rawData =
      elevationData && elevationData.length > 0
        ? elevationData
        : weatherPoints.map((wp) => ({
            distance: wp.point.distanceFromStart,
            elevation: wp.point.ele || 0,
          }));

    if (!rawData.length) return [];

    // Resample to 100m (0.1km) steps
    const step = 0.1;
    const maxDist = rawData[rawData.length - 1].distance;
    const resampled = [];

    let currentIdx = 0;
    for (let d = 0; d <= maxDist; d += step) {
      while (currentIdx < rawData.length - 1 && rawData[currentIdx + 1].distance < d) {
        currentIdx++;
      }

      const p1 = rawData[currentIdx];
      const p2 = rawData[currentIdx + 1] || p1;

      let elevation = p1.elevation;
      if (p2.distance > p1.distance) {
        const ratio = (d - p1.distance) / (p2.distance - p1.distance);
        elevation = p1.elevation + ratio * (p2.elevation - p1.elevation);
      }

      resampled.push({
        distance: Math.round(d * 10) / 10,
        elevation: Math.round(elevation),
      });
    }

    // Ensure the last point is included if it doesn't align exactly with the step
    if (resampled.length === 0 || resampled[resampled.length - 1].distance < maxDist) {
      resampled.push({
        distance: maxDist,
        elevation: Math.round(rawData[rawData.length - 1].elevation),
      });
    }

    return resampled;
  }, [elevationData, weatherPoints]);

  const chartData = useMemo(() => {
    const n = displayData.length;

    return displayData.map((d, idx) => {
      let slope = 0;
      // Calculate slope based on the 100m segment leading up to this point
      if (idx > 0) {
        const prev = displayData[idx - 1];
        const distDiff = (d.distance - prev.distance) * 1000;
        const eleDiff = d.elevation - prev.elevation;
        if (distDiff > 0.1) slope = (eleDiff / distDiff) * 100;
      } else if (n > 1) {
        // First point uses the slope of the first segment
        const next = displayData[1];
        const distDiff = (next.distance - d.distance) * 1000;
        const eleDiff = next.elevation - d.elevation;
        if (distDiff > 0.1) slope = (eleDiff / distDiff) * 100;
      }

      return {
        ...d,
        elevation: isNaN(d.elevation) ? 0 : d.elevation,
        slope: Math.round(slope * 10) / 10,
        color: getSlopeColorHex(slope),
      };
    });
  }, [displayData]);

  const visibleStats = useMemo(() => {
    if (!chartData.length) return { min: 0, max: 0, gain: 0, loss: 0, distance: 0 };

    const actualMin = chartData[0].distance;
    const actualMax = chartData[chartData.length - 1].distance;
    const domainMin = zoomRange?.start ?? actualMin;
    const domainMax = zoomRange?.end ?? actualMax;

    const visible = chartData.filter((d) => d.distance >= domainMin && d.distance <= domainMax);
    if (!visible.length) return { min: 0, max: 0, gain: 0, loss: 0, distance: 0 };

    const elevations = visible.map((d) => d.elevation);
    let gain = 0,
      loss = 0;
    for (let i = 1; i < visible.length; i++) {
      const diff = visible[i].elevation - visible[i - 1].elevation;
      if (diff > 0) gain += diff;
      else loss += Math.abs(diff);
    }

    return {
      min: Math.min(...elevations),
      max: Math.max(...elevations),
      gain: Math.round(gain),
      loss: Math.round(loss),
      distance: domainMax - domainMin,
    };
  }, [chartData, zoomRange]);

  // Recharts-compatible handlers (used by MobileElevationChart)
  const handleMouseMove = (e: any) => {
    const dist = e?.activePayload?.[0]?.payload?.distance ?? e?.activeLabel;
    if (dist != null && allPoints.length > 1) {
      const pt = interpolatePointOnRoute(allPoints, Number(dist));
      if (pt) setChartHoverPoint(pt);
    }
  };

  const handleMouseLeave = () => {
    setChartHoverPoint(null);
  };

  const setHoverByDistance = (dist: number | null) => {
    if (dist === null) {
      setChartHoverPoint(null);
      return;
    }
    if (allPoints.length > 1) {
      const pt = interpolatePointOnRoute(allPoints, dist);
      if (pt) setChartHoverPoint(pt);
    }
  };

  const confirmSelection = (start: number, end: number) => {
    const [s, e] = start <= end ? [start, end] : [end, start];
    setZoomRange({ start: s, end: e });
    setSelectedRange({ start: s, end: e });
  };

  const resetZoom = () => {
    setZoomRange(null);
    setSelectedRange(null);
  };

  return {
    chartData,
    visibleStats,
    selectedPoint,
    zoomRange,
    setHoverByDistance,
    confirmSelection,
    resetZoom,
    // Recharts-compatible (MobileElevationChart)
    handleMouseMove,
    handleMouseLeave,
  };
}
