import { useMemo } from 'react';
import * as d3 from 'd3';
import { ChartPoint } from './types';

export function useChartScales(
  chartData: ChartPoint[],
  innerW: number,
  innerH: number,
  zoomRange: { start: number; end: number } | null
) {
  const xScale = useMemo(() => {
    if (!chartData.length || innerW === 0) return null;
    const domain = zoomRange
      ? [zoomRange.start, zoomRange.end]
      : [chartData[0].distance, chartData[chartData.length - 1].distance];
    return d3.scaleLinear().domain(domain).range([0, innerW]);
  }, [chartData, innerW, zoomRange]);

  const yScale = useMemo(() => {
    if (!chartData.length || innerH === 0) return null;
    // When zoomed, compute y range from visible points only
    const visible = zoomRange
      ? chartData.filter((d) => d.distance >= zoomRange.start && d.distance <= zoomRange.end)
      : chartData;
    const elevs = (visible.length > 0 ? visible : chartData).map((d) => d.elevation);
    const pad = Math.max((Math.max(...elevs) - Math.min(...elevs)) * 0.15, 15);
    return d3
      .scaleLinear()
      .domain([Math.min(...elevs) - pad, Math.max(...elevs) + pad])
      .range([innerH, 0])
      .nice();
  }, [chartData, innerH, zoomRange]);

  return { xScale, yScale };
}
