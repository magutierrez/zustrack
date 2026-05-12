import { useMemo } from 'react';
import * as d3 from 'd3';
import { ChartPoint, Labels } from './types';

interface ChartAxesProps {
  xScale: d3.ScaleLinear<number, number> | null;
  yScale: d3.ScaleLinear<number, number> | null;
  innerW: number;
  innerH: number;
  isMobile: boolean;
  compact: boolean;
  labels: Labels;
  showTooltip: boolean;
  zoomRange: { start: number; end: number } | null;
  chartData: ChartPoint[];
}

export function ChartAxes({
  xScale,
  yScale,
  innerW,
  innerH,
  isMobile,
  compact,
  labels,
  showTooltip,
  zoomRange,
  chartData,
}: ChartAxesProps) {
  const xTicks = useMemo(
    () => (xScale ? xScale.ticks(isMobile ? 3 : 5).map((v) => ({ v, x: xScale(v) })) : []),
    [xScale, isMobile],
  );
  const yTicks = useMemo(
    () => (!isMobile && yScale ? yScale.ticks(4).map((v) => ({ v, y: yScale(v) })) : []),
    [yScale, isMobile],
  );

  return (
    <>
      {/* Y gridlines — hidden in compact mode */}
      {!compact &&
        (isMobile
          ? yScale &&
            [0.25, 0.5, 0.75].map((frac) => {
              const y = innerH * frac;
              return (
                <line
                  key={frac}
                  x1={0}
                  x2={innerW}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.06}
                  strokeWidth={1}
                />
              );
            })
          : yTicks.map((t) => (
              <line
                key={t.v}
                x1={0}
                x2={innerW}
                y1={t.y}
                y2={t.y}
                stroke="currentColor"
                strokeOpacity={0.07}
                strokeWidth={1}
              />
            )))}

      {/* Min/max elevation markers — compact showTooltip mode */}
      {compact &&
        showTooltip &&
        yScale &&
        (() => {
          const visiblePts = zoomRange
            ? chartData.filter(
                (d) => d.distance >= zoomRange.start && d.distance <= zoomRange.end,
              )
            : chartData;
          if (visiblePts.length === 0) return null;
          const maxElev = Math.max(...visiblePts.map((d) => d.elevation));
          const minElev = Math.min(...visiblePts.map((d) => d.elevation));
          const yMax = yScale(maxElev);
          const yMin = yScale(minElev);
          return (
            <>
              <line
                x1={0}
                x2={innerW}
                y1={yMax}
                y2={yMax}
                stroke="currentColor"
                strokeWidth={0.75}
                strokeOpacity={0.2}
                strokeDasharray="3,4"
              />
              <text
                x={12}
                y={yMax - 2}
                fill="currentColor"
                fontSize={8}
                opacity={0.5}
                dominantBaseline="text-after-edge"
              >
                {Math.round(maxElev)}m
              </text>
              <line
                x1={0}
                x2={innerW}
                y1={yMin}
                y2={yMin}
                stroke="currentColor"
                strokeWidth={0.75}
                strokeOpacity={0.2}
                strokeDasharray="3,4"
              />
              <text
                x={12}
                y={yMin + 2}
                fill="currentColor"
                fontSize={8}
                opacity={0.5}
                dominantBaseline="text-before-edge"
              >
                {Math.round(minElev)}m
              </text>
            </>
          );
        })()}

      {/* X axis + ticks — hidden in compact mode */}
      {!compact && (
        <g transform={`translate(0,${innerH})`}>
          <line x1={0} x2={innerW} stroke="currentColor" strokeOpacity={0.1} />
          {xTicks.map((t) => (
            <text
              key={t.v}
              x={t.x}
              dy="1.4em"
              textAnchor={t.x < 20 ? 'start' : t.x > innerW - 20 ? 'end' : 'middle'}
              fontSize={10}
              fill="currentColor"
              fillOpacity={0.55}
              fontWeight={500}
            >
              {t.v.toFixed(1)} {labels.km}
            </text>
          ))}
        </g>
      )}

      {/* Y axis labels — hidden in compact mode */}
      {!compact &&
        yTicks.map((t) => (
          <text
            key={t.v}
            x={-6}
            y={t.y}
            dy="0.32em"
            textAnchor="end"
            fontSize={10}
            fill="currentColor"
            fillOpacity={0.55}
            fontWeight={500}
          >
            {Math.round(t.v)}
          </text>
        ))}
    </>
  );
}
