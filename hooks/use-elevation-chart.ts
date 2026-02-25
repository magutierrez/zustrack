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

  // The active cursor: chart hover takes priority, fallback to map hover
  const selectedPoint = chartHoverPoint ?? mapHoverPoint;

  const [refAreaLeft, setRefAreaLeft] = useState<number | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<number | null>(null);
  const [left, setLeft] = useState<number | 'dataMin'>('dataMin');
  const [right, setRight] = useState<number | 'dataMax'>('dataMax');

  const displayData = useMemo(() => {
    const rawData =
      elevationData && elevationData.length > 0
        ? elevationData
        : weatherPoints.map((wp) => ({
            distance: wp.point.distanceFromStart,
            elevation: wp.point.ele || 0,
          }));

    return rawData.map((d) => ({
      ...d,
      elevation: Math.round(d.elevation),
    }));
  }, [elevationData, weatherPoints]);

  const stats = useMemo(() => {
    if (!displayData.length) return { min: 0, max: 0 };
    const elevations = displayData.map((d) => d.elevation);
    return { min: Math.min(...elevations), max: Math.max(...elevations) };
  }, [displayData]);

  const chartData = useMemo(() => {
    return displayData.map((d, idx) => {
      let slope = 0;
      if (idx > 0) {
        const prev = displayData[idx - 1];
        const distDiff = (d.distance - prev.distance) * 1000;
        const eleDiff = d.elevation - prev.elevation;
        if (distDiff > 0.1) {
          slope = (eleDiff / distDiff) * 100;
        }
      }
      return {
        ...d,
        elevation: isNaN(d.elevation) ? 0 : d.elevation,
        slope: Math.round(slope * 10) / 10,
        color: getSlopeColorHex(slope),
      };
    });
  }, [displayData]);

  const gradientId = useMemo(
    () => `slope-${left}-${right}-${chartData.length}`,
    [left, right, chartData.length],
  );

  const gradientStops = useMemo(() => {
    if (!chartData.length) return [];

    const actualMin = chartData[0].distance;
    const actualMax = chartData[chartData.length - 1].distance;
    const domainMin = left === 'dataMin' ? actualMin : left;
    const domainMax = right === 'dataMax' ? actualMax : right;
    const domainRange = domainMax - domainMin;

    const stops: { offset: string; color: string }[] = [];
    const firstIndex = chartData.findIndex((d) => d.distance >= domainMin);
    const lastIndex = [...chartData].reverse().findIndex((d) => d.distance <= domainMax);
    const actualLastIndex = chartData.length - 1 - lastIndex;

    for (
      let i = Math.max(0, firstIndex - 1);
      i <= Math.min(chartData.length - 1, actualLastIndex + 1);
      i++
    ) {
      const d = chartData[i];
      const percentage = domainRange > 0 ? ((d.distance - domainMin) / domainRange) * 100 : 0;
      stops.push({
        offset: `${Math.max(0, Math.min(100, percentage))}%`,
        color: d.color || '#10b981',
      });
    }

    return stops.length
      ? stops
      : [
          { offset: '0%', color: '#10b981' },
          { offset: '100%', color: '#10b981' },
        ];
  }, [chartData, left, right]);

  const handleMouseMove = (e: any) => {
    const activeDistance: number | undefined =
      e?.activeLabel ?? e?.activePayload?.[0]?.payload?.distance;

    if (activeDistance !== undefined && allPoints.length > 1) {
      const interpolatedPoint = interpolatePointOnRoute(allPoints, activeDistance);
      if (interpolatedPoint) {
        setChartHoverPoint(interpolatedPoint);
      }
    }

    if (refAreaLeft !== null && e?.activeLabel !== undefined) {
      setRefAreaRight(e.activeLabel);
    }
  };

  const handleMouseLeave = () => {
    setChartHoverPoint(null);
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  const zoom = () => {
    if (refAreaLeft === refAreaRight || refAreaRight === null || refAreaLeft === null) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }

    let [start, end] = [refAreaLeft, refAreaRight];
    if (start > end) [start, end] = [end, start];

    const filteredData = chartData.filter((d) => d.distance >= start && d.distance <= end);
    if (filteredData.length > 0) {
      setLeft(start);
      setRight(end);
      setSelectedRange({ start, end });
    }

    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  const resetZoom = () => {
    setLeft('dataMin');
    setRight('dataMax');
    setRefAreaLeft(null);
    setRefAreaRight(null);
    setSelectedRange(null);
  };

  return {
    chartData,
    stats,
    gradientId,
    gradientStops,
    selectedPoint,
    left,
    right,
    refAreaLeft,
    refAreaRight,
    setRefAreaLeft,
    handleMouseMove,
    handleMouseLeave,
    zoom,
    resetZoom,
  };
}
