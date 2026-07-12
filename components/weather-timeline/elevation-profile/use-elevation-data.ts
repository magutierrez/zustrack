'use client';

import { useMemo } from 'react';
import * as d3 from 'd3';
import { formatElevation, formatDistance } from '@/lib/utils';

import { UnitSystem } from '@/hooks/use-settings';

type ChartPoint = { distance: number; elevation: number; slope: number; color: string };

interface UseElevationDataProps {
  chartData: ChartPoint[];
  innerW: number;
  innerH: number;
  unitSystem: UnitSystem;
  totalDist: number;
}

export function useElevationData({
  chartData,
  innerW,
  innerH,
  unitSystem,
  totalDist,
}: UseElevationDataProps) {
  const xScale = useMemo(() => {
    if (!chartData.length || innerW === 0) return null;
    return d3
      .scaleLinear()
      .domain([chartData[0].distance, chartData[chartData.length - 1].distance])
      .range([0, innerW]);
  }, [chartData, innerW]);

  const yScale = useMemo(() => {
    if (!chartData.length || innerH === 0) return null;
    const elevs = chartData.map((d) => d.elevation);
    const pad = Math.max((Math.max(...elevs) - Math.min(...elevs)) * 0.15, 15);
    return d3
      .scaleLinear()
      .domain([Math.min(...elevs) - pad, Math.max(...elevs) + pad])
      .range([innerH, 0])
      .nice();
  }, [chartData, innerH]);

  const colorSegmentPaths = useMemo(() => {
    if (!xScale || !yScale || !chartData.length) return [];
    const areaGen = d3
      .area<ChartPoint>()
      .x((d) => xScale(d.distance))
      .y0(innerH)
      .y1((d) => yScale(d.elevation))
      .curve(d3.curveLinear);
    const result: { color: string; path: string; startDist: number }[] = [];
    let i = 0;
    while (i < chartData.length) {
      const color = chartData[i].color;
      const startDist = chartData[i].distance;
      const group: ChartPoint[] = [];
      while (i < chartData.length && chartData[i].color === color) group.push(chartData[i++]);
      if (i < chartData.length) group.push(chartData[i]);
      const path = areaGen(group);
      if (path) result.push({ color, path, startDist });
    }
    return result;
  }, [chartData, xScale, yScale, innerH]);

  const linePath = useMemo(() => {
    if (!xScale || !yScale || !chartData.length) return '';
    return (
      d3
        .line<ChartPoint>()
        .x((d) => xScale(d.distance))
        .y((d) => yScale(d.elevation))
        .curve(d3.curveLinear)(chartData) ?? ''
    );
  }, [chartData, xScale, yScale]);

  const gradientStops = useMemo(() => {
    if (!chartData.length) return [{ offset: 0, color: '#10b981' }];
    const min = chartData[0].distance;
    const range = totalDist;
    return chartData.map((d) => ({
      offset: range > 0 ? ((d.distance - min) / range) * 100 : 0,
      color: d.color,
    }));
  }, [chartData, totalDist]);

  const xTicks = useMemo(() => {
    if (!xScale) return [];
    return xScale.ticks(6).map((v) => ({ v, x: xScale(v), label: formatDistance(v, unitSystem) }));
  }, [xScale, unitSystem]);

  const yTicks = useMemo(() => {
    if (!yScale) return [];
    return yScale.ticks(5).map((v) => ({ v, y: yScale(v), label: formatElevation(v, unitSystem) }));
  }, [yScale, unitSystem]);

  return {
    xScale,
    yScale,
    colorSegmentPaths,
    linePath,
    gradientStops,
    xTicks,
    yTicks,
  };
}
