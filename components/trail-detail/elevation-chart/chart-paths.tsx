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

    const pts = zoomRange
      ? chartData.filter((d) => d.distance >= zoomRange.start && d.distance <= zoomRange.end)
      : chartData;

    const curve = isMobile ? d3.curveMonotoneX : d3.curveLinear;
    const areaGen = d3
      .area<ChartPoint>()
      .x((d) => xScale(d.distance))
      .y0(innerH)
      .y1((d) => yScale(d.elevation))
      .curve(curve);

    const result: { color: string; path: string; startDist: number }[] = [];
    let i = 0;
    while (i < pts.length) {
      const color = pts[i].color;
      const startDist = pts[i].distance;
      const group: ChartPoint[] = [];
      while (i < pts.length && pts[i].color === color) group.push(pts[i++]);
      if (i < pts.length) group.push(pts[i]);
      const path = areaGen(group);
      if (path) result.push({ color, path, startDist });
    }
    return result;
  }, [chartData, xScale, yScale, innerH, zoomRange, isMobile]);

  // Single-color area path
  const singleAreaPath = useMemo(() => {
    if (!singleColor || !xScale || !yScale || !chartData.length) return '';
    const pts = zoomRange
      ? chartData.filter((d) => d.distance >= zoomRange.start && d.distance <= zoomRange.end)
      : chartData;
    return (
      d3
        .area<ChartPoint>()
        .x((d) => xScale(d.distance))
        .y0(innerH)
        .y1((d) => yScale(d.elevation))
        .curve(d3.curveMonotoneX)(pts) ?? ''
    );
  }, [singleColor, chartData, xScale, yScale, innerH, zoomRange]);

  // Gradient stroke line
  const linePath = useMemo(() => {
    if (!xScale || !yScale || !chartData.length) return '';
    const pts = zoomRange
      ? chartData.filter((d) => d.distance >= zoomRange.start && d.distance <= zoomRange.end)
      : chartData;
    return (
      d3
        .line<ChartPoint>()
        .x((d) => xScale(d.distance))
        .y((d) => yScale(d.elevation))
        .curve(isMobile ? d3.curveMonotoneX : d3.curveLinear)(pts) ?? ''
    );
  }, [chartData, xScale, yScale, zoomRange, isMobile]);

  const gradientStops = useMemo(() => {
    if (!chartData.length) return [{ offset: 0, color: SLOPE_COLOR_FLAT }];
    const pts = zoomRange
      ? chartData.filter((d) => d.distance >= zoomRange.start && d.distance <= zoomRange.end)
      : chartData;
    const min = pts[0]?.distance ?? 0;
    const range = (pts[pts.length - 1]?.distance ?? 0) - min;
    return pts.map((d) => ({
      offset: range > 0 ? ((d.distance - min) / range) * 100 : 0,
      color: d.color,
    }));
  }, [chartData, zoomRange]);

  return (
    <>
      <defs>
        <linearGradient id={strokeGradientId} x1="0" y1="0" x2="1" y2="0">
          {gradientStops.map((s) => (
            <stop key={s.offset} offset={`${s.offset}%`} stopColor={s.color} />
          ))}
        </linearGradient>
        {singleColor && (
          <linearGradient id={`${strokeGradientId}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.75" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        )}
        <clipPath id={clipPathId}>
          <rect x={0} y={0} width={innerW} height={innerH} />
        </clipPath>
      </defs>

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
          {colorSegmentPaths.map((seg) => (
            <path
              key={seg.startDist}
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
