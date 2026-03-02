'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { TrendingUp, RefreshCcw, ArrowUp, ArrowDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/hooks/use-settings';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatElevation, formatDistance } from '@/lib/utils';
import { useElevationChart } from '@/hooks/use-elevation-chart';

const MARGIN = { top: 8, right: 16, bottom: 28, left: 52 };
const MARGIN_MOBILE = { top: 4, right: 4, bottom: 0, left: 0 };

type ChartPoint = {
  distance: number;
  elevation: number;
  slope: number;
  color: string;
};

type TooltipState = {
  svgX: number;
  svgY: number;
  dist: number;
  ele: number;
  slope: number;
  color: string;
};

export function AnalysisChart() {
  const t = useTranslations('WeatherTimeline');
  const { unitSystem } = useSettings();
  const isMobile = useIsMobile();

  const {
    chartData,
    visibleStats,
    selectedPoint,
    zoomRange,
    setHoverByDistance,
    confirmSelection,
    resetZoom,
  } = useElevationChart();

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [dragPreview, setDragPreview] = useState<{ start: number; end: number } | null>(null);

  // Drag refs — avoids closure staleness in window mouseup handler
  const isDragging = useRef(false);
  const dragStartRef = useRef<number | null>(null);
  const dragEndRef = useRef<number | null>(null);
  const confirmRef = useRef(confirmSelection);
  useEffect(() => { confirmRef.current = confirmSelection; }, [confirmSelection]);

  // ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Window mouseup — fires even if mouse released outside SVG
  useEffect(() => {
    const onUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      const s = dragStartRef.current;
      const e = dragEndRef.current;
      dragStartRef.current = null;
      dragEndRef.current = null;
      setDragPreview(null);
      if (s !== null && e !== null && Math.abs(s - e) > 0.01) {
        confirmRef.current(s, e);
      }
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, []);

  const margin = isMobile ? MARGIN_MOBILE : MARGIN;
  const innerW = Math.max(0, size.w - margin.left - margin.right);
  const innerH = Math.max(0, size.h - margin.top - margin.bottom);

  // ── Scales ──────────────────────────────────────────────────────────────
  const xScale = useMemo(() => {
    if (!chartData.length || innerW === 0) return null;
    return d3.scaleLinear()
      .domain([chartData[0].distance, chartData[chartData.length - 1].distance])
      .range([0, innerW]);
  }, [chartData, innerW]);

  const yScale = useMemo(() => {
    if (!chartData.length || innerH === 0) return null;
    const elevations = chartData.map((d) => d.elevation);
    const minE = Math.min(...elevations);
    const maxE = Math.max(...elevations);
    const pad = Math.max((maxE - minE) * 0.15, 15);
    return d3.scaleLinear()
      .domain([minE - pad, maxE + pad])
      .range([innerH, 0])
      .nice();
  }, [chartData, innerH]);

  // ── Paths ────────────────────────────────────────────────────────────────

  // One area path per slope-colour group — solid fill, no gradient
  const colorSegmentPaths = useMemo(() => {
    if (!xScale || !yScale || !chartData.length) return [];

    const areaGen = d3.area<ChartPoint>()
      .x((d) => xScale(d.distance))
      .y0(innerH)
      .y1((d) => yScale(d.elevation))
      .curve(d3.curveMonotoneX);

    const result: { color: string; path: string }[] = [];
    let i = 0;
    while (i < chartData.length) {
      const color = chartData[i].color;
      const group: ChartPoint[] = [];
      while (i < chartData.length && chartData[i].color === color) {
        group.push(chartData[i]);
        i++;
      }
      // Overlap one point into the next group to avoid hairline gaps at boundaries
      if (i < chartData.length) group.push(chartData[i]);
      const path = areaGen(group);
      if (path) result.push({ color, path });
    }
    return result;
  }, [chartData, xScale, yScale, innerH]);

  const linePath = useMemo(() => {
    if (!xScale || !yScale || !chartData.length) return '';
    return (
      d3.line<ChartPoint>()
        .x((d) => xScale(d.distance))
        .y((d) => yScale(d.elevation))
        .curve(d3.curveMonotoneX)(chartData) ?? ''
    );
  }, [chartData, xScale, yScale]);

  // ── Gradient stops ───────────────────────────────────────────────────────
  const gradientStops = useMemo(() => {
    if (!chartData.length) return [{ offset: 0, color: '#10b981' }];
    const totalMin = chartData[0].distance;
    const totalMax = chartData[chartData.length - 1].distance;
    const range = totalMax - totalMin;
    return chartData.map((d) => ({
      offset: range > 0 ? ((d.distance - totalMin) / range) * 100 : 0,
      color: d.color,
    }));
  }, [chartData]);

  // ── Axis ticks ───────────────────────────────────────────────────────────
  const xTicks = useMemo(() => {
    if (!xScale) return [];
    return xScale.ticks(6).map((v) => ({ v, x: xScale(v), label: formatDistance(v, unitSystem) }));
  }, [xScale, unitSystem]);

  const yTicks = useMemo(() => {
    if (!yScale) return [];
    return yScale.ticks(5).map((v) => ({ v, y: yScale(v), label: formatElevation(v, unitSystem) }));
  }, [yScale, unitSystem]);

  // ── Helper: pixel X → data distance ─────────────────────────────────────
  const clientXToDist = (clientX: number): number | null => {
    if (!svgRef.current || !xScale) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const x = clientX - rect.left - margin.left;
    return xScale.invert(Math.max(0, Math.min(innerW, x)));
  };

  const nearestPoint = (dist: number): ChartPoint | null => {
    if (!chartData.length) return null;
    let best = chartData[0];
    let bestDiff = Math.abs(best.distance - dist);
    for (const d of chartData) {
      const diff = Math.abs(d.distance - dist);
      if (diff < bestDiff) { best = d; bestDiff = diff; }
    }
    return best;
  };

  // ── SVG mouse handlers ───────────────────────────────────────────────────
  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const dist = clientXToDist(e.clientX);
    if (dist === null) return;

    const pt = nearestPoint(dist);
    if (pt && xScale && yScale) {
      setTooltip({
        svgX: xScale(pt.distance),
        svgY: yScale(pt.elevation),
        dist: pt.distance,
        ele: pt.elevation,
        slope: pt.slope,
        color: pt.color,
      });
      setHoverByDistance(pt.distance);
    }

    if (isDragging.current && dist !== null) {
      dragEndRef.current = dist;
      const s = dragStartRef.current!;
      setDragPreview({ start: Math.min(s, dist), end: Math.max(s, dist) });
    }
  };

  const onMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const dist = clientXToDist(e.clientX);
    if (dist === null) return;
    isDragging.current = true;
    dragStartRef.current = dist;
    dragEndRef.current = dist;
    setDragPreview(null);
  };

  const onMouseLeave = () => {
    setTooltip(null);
    setHoverByDistance(null);
    if (!isDragging.current) setDragPreview(null);
  };

  const onDblClick = () => {
    resetZoom();
    setDragPreview(null);
  };

  // ── Derived SVG coords for selection overlay ─────────────────────────────
  const selLeft  = zoomRange && xScale ? xScale(zoomRange.start) : null;
  const selRight = zoomRange && xScale ? xScale(zoomRange.end)   : null;

  // Drag preview pixel coords
  const dragPxStart = dragPreview && xScale ? xScale(dragPreview.start) : null;
  const dragPxWidth =
    dragPreview && xScale
      ? xScale(dragPreview.end) - xScale(dragPreview.start)
      : null;

  // Reference line for map-hover point
  const refLineX =
    selectedPoint && xScale && !zoomRange
      ? xScale(selectedPoint.distanceFromStart)
      : null;

  // Tooltip horizontal placement
  const tooltipOnRight = tooltip !== null && tooltip.svgX + margin.left < size.w / 2;

  return (
    <div className="border-border bg-card rounded-xl border p-4 shadow-sm select-none md:p-6">

      {/* ── Header ── */}
      <div className="mb-4 flex items-center justify-between md:mb-6">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="bg-primary/10 rounded-lg p-1.5 md:p-2">
            <TrendingUp className="text-primary h-3.5 w-3.5 md:h-4 md:w-4" />
          </div>
          <div>
            <h3 className="text-foreground text-xs leading-none font-bold md:text-sm">
              {t('elevationTitle')}
            </h3>
            {!isMobile && (
              <p className="text-muted-foreground mt-1 text-[10px] font-semibold tracking-wider uppercase">
                {formatDistance(visibleStats.distance, unitSystem)}
              </p>
            )}
          </div>
          {zoomRange !== null && (
            <Button
              variant="secondary"
              size="sm"
              onClick={resetZoom}
              className="h-6 gap-1 px-1.5 text-[9px] font-bold tracking-tight uppercase md:h-7 md:gap-1.5 md:px-2 md:text-[10px]"
            >
              <RefreshCcw className="h-2.5 w-2.5 md:h-3 md:w-3" />
              {t('chart.resetZoom')}
            </Button>
          )}
        </div>
        {selectedPoint && (
          <div className="bg-secondary/50 border-border/50 flex items-center gap-1.5 rounded-full border px-2 py-1 shadow-inner md:gap-2 md:px-3 md:py-1.5">
            <div className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full shadow-sm md:h-2 md:w-2" />
            <span className="text-foreground font-mono text-[10px] font-black md:text-xs">
              {formatElevation(selectedPoint.ele || 0, unitSystem)}
            </span>
          </div>
        )}
      </div>

      {/* ── Chart ── */}
      <div
        ref={containerRef}
        className={`relative mb-4 w-full cursor-crosshair md:mb-6 ${isMobile ? 'h-32' : 'h-56'}`}
      >
        {/* Floating tooltip — desktop */}
        {tooltip && !isMobile && (
          <div
            className="pointer-events-none absolute top-0 z-10"
            style={
              tooltipOnRight
                ? { left: tooltip.svgX + margin.left + 10 }
                : { right: size.w - (tooltip.svgX + margin.left) + 10 }
            }
          >
            <div className="border-border bg-background/95 flex items-center gap-3 rounded-xl border p-2 shadow-xl backdrop-blur-sm md:gap-4 md:p-3">
              <div className="flex flex-col gap-0.5">
                <p className="text-muted-foreground text-[8px] font-black tracking-widest uppercase md:text-[9px]">
                  {formatDistance(tooltip.dist, unitSystem)}
                </p>
                <span className="text-foreground text-xs font-black md:text-sm">
                  {formatElevation(tooltip.ele, unitSystem)}
                </span>
              </div>
              <div className="border-border flex flex-col items-center gap-1 border-l pl-3 md:pl-4">
                <span className="text-muted-foreground text-[7px] font-bold tracking-tighter uppercase md:text-[8px]">
                  {t('slope')}
                </span>
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-1.5 w-1.5 rounded-full shadow-sm md:h-2 md:w-2"
                    style={{ backgroundColor: tooltip.color }}
                  />
                  <span className="text-foreground font-mono text-[10px] font-black md:text-xs">
                    {tooltip.slope}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating tooltip — mobile */}
        {tooltip && isMobile && (
          <div className="pointer-events-none absolute top-1 left-2 z-10">
            <div className="border-border bg-background/90 flex items-center gap-1.5 rounded-md border px-2 py-1 shadow-md backdrop-blur-sm">
              <span className="text-foreground font-mono text-[10px] font-black">
                {formatElevation(tooltip.ele, unitSystem)}
              </span>
              <span className="text-muted-foreground text-[8px]">·</span>
              <span className="text-muted-foreground text-[9px] font-bold">
                {formatDistance(tooltip.dist, unitSystem)}
              </span>
              <span className="text-muted-foreground text-[8px]">·</span>
              <div className="flex items-center gap-0.5">
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: tooltip.color }}
                />
                <span className="text-foreground font-mono text-[9px] font-black">
                  {tooltip.slope}%
                </span>
              </div>
            </div>
          </div>
        )}

        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          onMouseMove={onMouseMove}
          onMouseDown={isMobile ? undefined : onMouseDown}
          onMouseLeave={onMouseLeave}
          onDoubleClick={isMobile ? undefined : onDblClick}
        >
          <defs>
            {/* Slope-coloured stroke gradient */}
            <linearGradient id="elev-stroke" x1="0" y1="0" x2="1" y2="0">
              {gradientStops.map((s, i) => (
                <stop key={i} offset={`${s.offset}%`} stopColor={s.color} />
              ))}
            </linearGradient>


            {/* Clip path so paths stay inside plot area */}
            <clipPath id="elev-clip">
              <rect x={0} y={0} width={innerW} height={innerH} />
            </clipPath>
          </defs>

          <g transform={`translate(${margin.left},${margin.top})`}>

            {/* Y gridlines */}
            {!isMobile && yTicks.map((tick) => (
              <line
                key={tick.v}
                x1={0} x2={innerW}
                y1={tick.y} y2={tick.y}
                stroke="currentColor" strokeOpacity={0.07} strokeWidth={1}
              />
            ))}

            {/* Area fill — one solid path per slope-colour zone */}
            {colorSegmentPaths.map((seg, i) => (
              <path key={i} d={seg.path} fill={seg.color} fillOpacity={0.25} clipPath="url(#elev-clip)" />
            ))}

            {/* Stroke line */}
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
                x1={refLineX} x2={refLineX}
                y1={0} y2={innerH}
                stroke="hsl(var(--primary))"
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
            )}

            {/* Live drag-select preview */}
            {dragPxStart !== null && dragPxWidth !== null && dragPxWidth > 0 && (
              <rect
                x={dragPxStart} y={0}
                width={dragPxWidth} height={innerH}
                fill="hsl(var(--primary))" fillOpacity={0.2}
                stroke="hsl(var(--primary))" strokeOpacity={0.5} strokeWidth={1}
              />
            )}

            {/* Confirmed selection: white overlay on non-selected parts */}
            {selLeft !== null && selLeft > 0 && (
              <rect x={0} y={0} width={selLeft} height={innerH} fill="white" fillOpacity={0.72} />
            )}
            {selRight !== null && selRight < innerW && (
              <rect x={selRight} y={0} width={innerW - selRight} height={innerH} fill="white" fillOpacity={0.72} />
            )}

            {/* Selection border lines */}
            {selLeft !== null && (
              <line
                x1={selLeft} x2={selLeft} y1={0} y2={innerH}
                stroke="hsl(var(--primary))" strokeWidth={2}
              />
            )}
            {selRight !== null && (
              <line
                x1={selRight} x2={selRight} y1={0} y2={innerH}
                stroke="hsl(var(--primary))" strokeWidth={2}
              />
            )}

            {/* Hover crosshair + dot */}
            {tooltip && (
              <>
                <line
                  x1={tooltip.svgX} x2={tooltip.svgX}
                  y1={0} y2={innerH}
                  stroke="currentColor" strokeOpacity={0.25} strokeWidth={1} strokeDasharray="3 3"
                />
                <circle
                  cx={tooltip.svgX} cy={tooltip.svgY}
                  r={4}
                  fill={tooltip.color}
                  stroke="white" strokeWidth={1.5}
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
            {!isMobile && yTicks.map((tick) => (
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
      </div>

      {/* ── Stats ── */}
      <div className="border-border/50 mt-2 grid grid-cols-2 gap-3 border-t pt-4 md:gap-4">
        <div className="bg-secondary/20 border-border/30 flex items-center gap-2 rounded-lg border px-1.5 py-1 md:gap-3 md:px-2 md:py-1.5">
          <div className="rounded-md bg-emerald-500/10 p-1 md:p-1.5">
            <ArrowUp className="h-3 w-3 text-emerald-600 md:h-3.5 md:w-3.5" />
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5 text-[8px] leading-none font-black tracking-widest uppercase md:mb-1 md:text-[9px]">
              {t('chart.ascent')}
            </p>
            <p className="text-foreground text-xs leading-none font-black md:text-sm">
              +{formatElevation(visibleStats.gain, unitSystem)}
            </p>
          </div>
        </div>
        <div className="bg-secondary/20 border-border/30 flex items-center gap-2 rounded-lg border px-1.5 py-1 md:gap-3 md:px-2 md:py-1.5">
          <div className="rounded-md bg-rose-500/10 p-1 md:p-1.5">
            <ArrowDown className="h-3 w-3 text-rose-600 md:h-3.5 md:w-3.5" />
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5 text-[8px] leading-none font-black tracking-widest uppercase md:mb-1 md:text-[9px]">
              {t('chart.descent')}
            </p>
            <p className="text-foreground text-xs leading-none font-black md:text-sm">
              -{formatElevation(visibleStats.loss, unitSystem)}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
