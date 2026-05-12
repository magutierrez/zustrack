import { useMemo } from 'react';
import * as d3 from 'd3';
import { ChartPoint } from './types';
import { SLOPE_COLOR_FLAT } from '@/lib/slope-colors';

interface ChartPathsProps {
  chartData: ChartPoint[];
  xScale: d3.ScaleLinear<number, number> | null;
  yScale: d3.ScaleLinear<number, number> | null;
  innerW: number;
  innerH: number;
  zoomRange: { start: number; end: number } | null;
  isMobile: boolean;
  compact: boolean;
  singleColor?: string;
  strokeGradientId: string;
  clipPathId: string;
}

export function ChartPaths({
  chartData,
  xScale,
  yScale,
  innerW,
  innerH,
  zoomRange,
  isMobile,
  compact,
  singleColor,
  strokeGradientId,
  clipPathId,
}: ChartPathsProps) {
  // Colored area segments
  const colorSegmentPaths = useMemo(() => {
    if (!xScale || !yScale || !chartData.length) return [];

    const curve = isMobile ? d3.curveMonotoneX : d3.curveLinear;
    const areaGen = d3
      .area<ChartPoint>()
      .x((d) => xScale(d.distance))
      .y0(innerH)
      .y1((d) => yScale(d.elevation))
      .curve(curve);

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
  }, [chartData, xScale, yScale, innerH, isMobile]);

  // Single-color area path
  const singleAreaPath = useMemo(() => {
    if (!singleColor || !xScale || !yScale || !chartData.length) return '';
    return (
      d3
        .area<ChartPoint>()
        .x((d) => xScale(d.distance))
        .y0(innerH)
        .y1((d) => yScale(d.elevation))
        .curve(d3.curveMonotoneX)(chartData) ?? ''
    );
  }, [singleColor, chartData, xScale, yScale, innerH]);

  // Gradient stroke line
  const linePath = useMemo(() => {
    if (!xScale || !yScale || !chartData.length) return '';
    return (
      d3
        .line<ChartPoint>()
        .x((d) => xScale(d.distance))
        .y((d) => yScale(d.elevation))
        .curve(isMobile ? d3.curveMonotoneX : d3.curveLinear)(chartData) ?? ''
    );
  }, [chartData, xScale, yScale, isMobile]);

  return (
    <>
      {singleColor ? (
        <>
          <path
            d={singleAreaPath}
            fill={`url(#${strokeGradientId}-area)`}
            fillOpacity={1}
            clipPath={`url(#${clipPathId})`}
          />
          <path
            d={linePath}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={2}
            strokeOpacity={0.9}
            clipPath={`url(#${clipPathId})`}
          />
        </>
      ) : (
        <>
          {colorSegmentPaths.map((seg, i) => (
            <path
              key={`${seg.startDist}-${seg.color}-${i}`}
              d={seg.path}
              fill={seg.color}
              fillOpacity={compact ? 0.85 : isMobile ? 0.55 : 0.25}
              clipPath={`url(#${clipPathId})`}
            />
          ))}
          <path
            d={linePath}
            fill="none"
            stroke={`url(#${strokeGradientId})`}
            strokeWidth={compact ? 3 : 2.5}
            clipPath={`url(#${clipPathId})`}
          />
        </>
      )}
    </>
  );
}
