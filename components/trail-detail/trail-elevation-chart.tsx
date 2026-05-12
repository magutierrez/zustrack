'use client';

import { useRef, useState, useId } from 'react';
import { cn } from '@/lib/utils';

import { TrackPoint, Labels } from './elevation-chart/types';
import { useChartDimensions } from './elevation-chart/use-chart-dimensions';
import { useChartData } from './elevation-chart/use-chart-data';
import { useChartScales } from './elevation-chart/use-chart-scales';
import { useChartInteractions } from './elevation-chart/use-chart-interactions';

import { ChartHeader } from './elevation-chart/chart-header';
import { CompactInfoBar } from './elevation-chart/compact-info-bar';
import { ChartTooltip } from './elevation-chart/chart-tooltip';
import { ChartAxes } from './elevation-chart/chart-axes';
import { ChartPaths } from './elevation-chart/chart-paths';
import { ChartLegend } from './elevation-chart/chart-legend';

export function TrailElevationChart({
  trackProfile,
  labels,
  externalHoverDist,
  onHoverDist,
  onRangeSelect,
  onRangeReset,
  compact = false,
  singleColor,
  selectable = true,
  noGradient = false,
  showTooltip = false,
}: {
  trackProfile: TrackPoint[];
  labels: Labels;
  externalHoverDist?: number | null;
  onHoverDist?: (dist: number | null) => void;
  onRangeSelect?: (start: number, end: number) => void;
  onRangeReset?: () => void;
  compact?: boolean;
  singleColor?: string;
  selectable?: boolean;
  noGradient?: boolean;
  showTooltip?: boolean;
}) {
  const rawId = useId();
  const uid = rawId.replace(/:/g, '');
  const outerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [zoomRange, setZoomRange] = useState<{ start: number; end: number } | null>(null);

  const { size, margin, innerW, innerH, isMobile } = useChartDimensions(outerRef, compact);
  const chartData = useChartData(trackProfile, isMobile);
  const { xScale, yScale } = useChartScales(chartData, innerW, innerH, zoomRange);

  const {
    activeTooltip,
    dragPreview,
    dragPreviewPx,
    handleMouseMove,
    handleMouseDown,
    handleMouseLeave,
  } = useChartInteractions({
    svgRef,
    xScale,
    yScale,
    chartData,
    innerW,
    margin,
    selectable,
    zoomRange,
    setZoomRange,
    onRangeSelect,
    onHoverDist,
    externalHoverDist,
  });

  const resetZoom = () => {
    setZoomRange(null);
    onRangeReset?.();
  };

  const strokeGradientId = `elev-stroke-${uid}`;
  const clipPathId = `elev-clip-${uid}`;

  if (chartData.length < 2) return null;

  return (
    <div
      className={
        compact
          ? 'relative w-full'
          : 'rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900'
      }
    >
      {/* Gradient overlay — only in compact mode when not suppressed */}
      {compact && !noGradient && (
        <div
          className={cn(
            'pointer-events-none absolute inset-0 z-10',
            !singleColor && 'bg-linear-to-b from-black/75 via-black/40 to-transparent',
          )}
        />
      )}

      {/* Title + reset — hidden in compact mode */}
      {!compact && (
        <ChartHeader labels={labels} zoomRange={zoomRange} onResetZoom={resetZoom} />
      )}

      {/* Info bar — compact+showTooltip mode: touch point data + reset zoom button */}
      {compact && showTooltip && (
        <CompactInfoBar
          activeTooltip={activeTooltip}
          dragPreview={dragPreview}
          labels={labels}
          zoomRange={zoomRange}
          onResetZoom={resetZoom}
        />
      )}

      {/* Chart area */}
      <div ref={outerRef} className={`relative w-full select-none ${compact ? 'h-20' : 'h-44'}`}>
        {/* Tooltip — only in non-compact mode (compact uses the info bar above) */}
        {!compact && activeTooltip && !dragPreview && innerW > 0 && (
          <ChartTooltip
            activeTooltip={activeTooltip}
            labels={labels}
            margin={margin}
            size={size}
          />
        )}

        {innerW > 0 && innerH > 0 ? (
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onDoubleClick={resetZoom}
            className={zoomRange ? 'cursor-zoom-out' : 'cursor-crosshair'}
          >
            <ChartPaths
              chartData={chartData}
              xScale={xScale}
              yScale={yScale}
              innerW={innerW}
              innerH={innerH}
              zoomRange={zoomRange}
              isMobile={isMobile}
              compact={compact}
              singleColor={singleColor}
              strokeGradientId={strokeGradientId}
              clipPathId={clipPathId}
            />

            <g transform={`translate(${margin.left},${margin.top})`}>
              <ChartAxes
                xScale={xScale}
                yScale={yScale}
                innerW={innerW}
                innerH={innerH}
                isMobile={isMobile}
                compact={compact}
                labels={labels}
                showTooltip={showTooltip}
                zoomRange={zoomRange}
                chartData={chartData}
              />

              {/* Drag preview rect */}
              {dragPreviewPx && dragPreviewPx.width > 0 && (
                <rect
                  x={dragPreviewPx.left}
                  y={0}
                  width={dragPreviewPx.width}
                  height={innerH}
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                  stroke="hsl(var(--primary))"
                  strokeOpacity={0.5}
                  strokeWidth={1}
                  clipPath={`url(#${clipPathId})`}
                />
              )}

              {/* Hover crosshair + dot */}
              {activeTooltip && !dragPreview && (
                <>
                  <line
                    x1={activeTooltip.x}
                    x2={activeTooltip.x}
                    y1={0}
                    y2={innerH}
                    stroke="currentColor"
                    strokeOpacity={0.2}
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx={activeTooltip.x}
                    cy={activeTooltip.y}
                    r={compact ? 3 : 4}
                    fill={activeTooltip.color}
                    stroke="white"
                    strokeWidth={1.5}
                  />
                </>
              )}
            </g>
          </svg>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="size-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-700 dark:border-t-zinc-400" />
          </div>
        )}
      </div>

      {/* Color legend — hidden in compact mode */}
      {!compact && <ChartLegend labels={labels} />}
    </div>
  );
}
