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
    return rawData.map((d) => ({ ...d, elevation: Math.round(d.elevation) }));
  }, [elevationData, weatherPoints]);

  const chartData = useMemo(() => {
    const n = displayData.length;

    // Raw point-to-point slopes
    const rawSlopes = new Array<number>(n).fill(0);
    for (let i = 1; i < n; i++) {
      const distDiff = (displayData[i].distance - displayData[i - 1].distance) * 1000;
      const eleDiff = displayData[i].elevation - displayData[i - 1].elevation;
      if (distDiff > 0.1) rawSlopes[i] = (eleDiff / distDiff) * 100;
    }

    // 1 km sliding-window smooth (500 m each side)
    const halfWindowKm = 0.5;
    const smoothSlopes = new Array<number>(n).fill(0);
    let sl = 0, sr = -1, wSum = 0, wCount = 0;
    for (let i = 0; i < n; i++) {
      const center = displayData[i].distance;
      while (sr + 1 < n && displayData[sr + 1].distance <= center + halfWindowKm) {
        sr++; wSum += rawSlopes[sr]; wCount++;
      }
      while (sl <= sr && displayData[sl].distance < center - halfWindowKm) {
        wSum -= rawSlopes[sl]; sl++; wCount--;
      }
      smoothSlopes[i] = wCount > 0 ? wSum / wCount : 0;
    }

    return displayData.map((d, idx) => ({
      ...d,
      elevation: isNaN(d.elevation) ? 0 : d.elevation,
      slope: Math.round(smoothSlopes[idx] * 10) / 10,
      color: getSlopeColorHex(smoothSlopes[idx]),
    }));
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
    let gain = 0, loss = 0;
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
