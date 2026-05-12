'use client';

import { RefObject } from 'react';
import type { TooltipState } from './elevation-tooltip';

interface ElevationSvgProps {
  svgRef: RefObject<SVGSVGElement | null>;
  innerW: number;
  innerH: number;
  margin: { top: number; left: number; right: number; bottom: number };
  isMobile: boolean;
  gradientStops: { offset: number; color: string }[];
  yTicks: { v: number; y: number; label: string }[];
  xTicks: { v: number; x: number; label: string }[];
  colorSegmentPaths: { color: string; path: string; startDist: number }[];
  linePath: string;
  refLineX: number | null;
  dragPxStart: number | null;
  dragPxWidth: number | null;
  selLeft: number | null;
  selRight: number | null;
  tooltip: TooltipState | null;
  onMouseMove: (e: React.MouseEvent<SVGSVGElement>) => void;
  onMouseDown: (e: React.MouseEvent<SVGSVGElement>) => void;
  onMouseLeave: () => void;
  onChartClick: (e: React.MouseEvent<SVGSVGElement>) => void;
  resetZoom: () => void;
  setDragPreview: (preview: { start: number; end: number } | null) => void;
  setIsResizing: (type: 'left' | 'right' | null) => void;
}

export function ElevationSvg({
  svgRef,
  innerW,
  innerH,
  margin,
  isMobile,
  gradientStops,
  yTicks,
  xTicks,
  colorSegmentPaths,
  linePath,
  refLineX,
  dragPxStart,
  dragPxWidth,
  selLeft,
  selRight,
  tooltip,
  onMouseMove,
  onMouseDown,
  onMouseLeave,
  onChartClick,
  resetZoom,
  setDragPreview,
  setIsResizing,
}: ElevationSvgProps) {
  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      onMouseMove={onMouseMove}
      onMouseDown={isMobile ? undefined : onMouseDown}
      onMouseLeave={onMouseLeave}
      onClick={isMobile ? undefined : onChartClick}
      onDoubleClick={
        isMobile
          ? undefined
          : () => {
              resetZoom();
              setDragPreview(null);
            }
      }
    >
      <defs>
        <linearGradient id="elev-stroke" x1="0" y1="0" x2="1" y2="0">
          {gradientStops.map((s) => (
            <stop key={s.offset} offset={`${s.offset}%`} stopColor={s.color} />
          ))}
        </linearGradient>
        <clipPath id="elev-clip">
          <rect x={0} y={0} width={innerW} height={innerH} />
        </clipPath>
      </defs>

      <g transform={`translate(${margin.left},${margin.top})`}>
        {/* Y gridlines */}
        {!isMobile &&
          yTicks.map((tick) => (
            <line
              key={tick.v}
              x1={0}
              x2={innerW}
              y1={tick.y}
              y2={tick.y}
              stroke="currentColor"
              strokeOpacity={0.07}
              strokeWidth={1}
            />
          ))}

        {/* Slope-coloured area fill */}
        {colorSegmentPaths.map((seg) => (
          <path
            key={seg.startDist}
            d={seg.path}
            fill={seg.color}
            fillOpacity={0.25}
            clipPath="url(#elev-clip)"
          />
        ))}

        {/* Stroke */}
        <path
          d={linePath}
          fill="none"
          stroke="url(#elev-stroke)"
          strokeWidth={isMobile ? 2 : 2.5}
          clipPath="url(#elev-clip)"
        />

        {/* Map-hover reference line */}
        {refLineX !== null && (
          <line
            x1={refLineX}
            x2={refLineX}
            y1={0}
            y2={innerH}
            stroke="hsl(var(--primary))"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        )}

        {/* Drag-select preview */}
        {dragPxStart !== null && dragPxWidth !== null && dragPxWidth > 0 && (
          <rect
            x={dragPxStart}
            y={0}
            width={dragPxWidth}
            height={innerH}
            fill="hsl(var(--primary))"
            fillOpacity={0.2}
            stroke="hsl(var(--primary))"
            strokeOpacity={0.5}
            strokeWidth={1}
          />
        )}

        {/* White overlay on non-selected parts */}
        {selLeft !== null && selLeft > 0 && (
          <rect x={0} y={0} width={selLeft} height={innerH} fill="white" fillOpacity={0.72} />
        )}
        {selRight !== null && selRight < innerW && (
          <rect
            x={selRight}
            y={0}
            width={innerW - selRight}
            height={innerH}
            fill="white"
            fillOpacity={0.72}
          />
        )}

        {/* Selection border lines + resize handles */}
        {selLeft !== null && (
          <>
            <line
              x1={selLeft}
              x2={selLeft}
              y1={0}
              y2={innerH}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
            />
            <g
              transform={`translate(${selLeft},${innerH / 2})`}
              style={{ cursor: 'ew-resize' }}
              onMouseDown={(e) => {
                e.stopPropagation();
                setIsResizing('left');
              }}
            >
              <rect x={-9} y={-18} width={18} height={36} rx={5} fill="hsl(var(--primary))" />
              <line
                x1={-3}
                x2={3}
                y1={-6}
                y2={-6}
                stroke="white"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
              <line
                x1={-3}
                x2={3}
                y1={0}
                y2={0}
                stroke="white"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
              <line
                x1={-3}
                x2={3}
                y1={6}
                y2={6}
                stroke="white"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            </g>
          </>
        )}
        {selRight !== null && (
          <>
            <line
              x1={selRight}
              x2={selRight}
              y1={0}
              y2={innerH}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
            />
            <g
              transform={`translate(${selRight},${innerH / 2})`}
              style={{ cursor: 'ew-resize' }}
              onMouseDown={(e) => {
                e.stopPropagation();
                setIsResizing('right');
              }}
            >
              <rect x={-9} y={-18} width={18} height={36} rx={5} fill="hsl(var(--primary))" />
              <line
                x1={-3}
                x2={3}
                y1={-6}
                y2={-6}
                stroke="white"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
              <line
                x1={-3}
                x2={3}
                y1={0}
                y2={0}
                stroke="white"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
              <line
                x1={-3}
                x2={3}
                y1={6}
                y2={6}
                stroke="white"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            </g>
          </>
        )}

        {/* Hover crosshair + dot */}
        {tooltip && (
          <>
            <line
              x1={tooltip.svgX}
              x2={tooltip.svgX}
              y1={0}
              y2={innerH}
              stroke="currentColor"
              strokeOpacity={0.25}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle
              cx={tooltip.svgX}
              cy={tooltip.svgY}
              r={4}
              fill={tooltip.color}
              stroke="white"
              strokeWidth={1.5}
            />
          </>
        )}

        {/* X axis */}
        {!isMobile && (
          <g transform={`translate(0,${innerH})`}>
            <line x1={0} x2={innerW} stroke="currentColor" strokeOpacity={0.1} />
            {xTicks.map((tick) => (
              <text
                key={tick.v}
                x={tick.x}
                dy="1.4em"
                textAnchor="middle"
                fontSize={10}
                fill="currentColor"
                fillOpacity={0.55}
                fontWeight={500}
              >
                {tick.label}
              </text>
            ))}
          </g>
        )}

        {/* Y axis */}
        {!isMobile &&
          yTicks.map((tick) => (
            <text
              key={tick.v}
              x={-6}
              y={tick.y}
              dy="0.32em"
              textAnchor="end"
              fontSize={10}
              fill="currentColor"
              fillOpacity={0.55}
              fontWeight={500}
            >
              {tick.label}
            </text>
          ))}
      </g>
    </svg>
  );
}
