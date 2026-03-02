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
import { useRouteStore } from '@/store/route-store';

const MARGIN        = { top: 8, right: 16, bottom: 28, left: 52 };
const MARGIN_MOBILE = { top: 4, right: 4,  bottom: 0,  left: 0  };
const MAX_ZOOM      = 3;

type ChartPoint   = { distance: number; elevation: number; slope: number; color: string };
type TooltipState = { svgX: number; svgY: number; dist: number; ele: number; slope: number; color: string };

export function AnalysisChart() {
  const t              = useTranslations('WeatherTimeline');
  const { unitSystem } = useSettings();
  const isMobile       = useIsMobile();

  const {
    chartData, visibleStats, selectedPoint,
    zoomRange, setHoverByDistance, confirmSelection, resetZoom,
  } = useElevationChart();

  const weatherPoints       = useRouteStore((s) => s.weatherPoints);
  const setSelectedPointIdx = useRouteStore((s) => s.setSelectedPointIndex);

  // ── Refs & state ──────────────────────────────────────────────────────
  const outerRef  = useRef<HTMLDivElement>(null);  // viewport measurement
  const scrollRef = useRef<HTMLDivElement>(null);  // scrollable container
  const svgRef    = useRef<SVGSVGElement>(null);

  const [vpSize,     setVpSize]     = useState({ w: 0, h: 0 });
  const [scrollLeft, setScrollLeft] = useState(0);
  const [tooltip,     setTooltip]     = useState<TooltipState | null>(null);
  const [dragPreview, setDragPreview] = useState<{ start: number; end: number } | null>(null);

  // Drag refs
  const isDragging         = useRef(false);
  const dragStartRef       = useRef<number | null>(null);
  const dragEndRef         = useRef<number | null>(null);
  const dragStartPxRef     = useRef<number | null>(null);  // pixel position for click vs drag
  const wasSignificantDrag = useRef(false);                // true if dragged > 5px
  const shouldCenterRef    = useRef(false);    // set true only after a completed drag selection
  const confirmRef        = useRef(confirmSelection);
  useEffect(() => { confirmRef.current = confirmSelection; }, [confirmSelection]);

  // Resize-handle refs
  const isResizing   = useRef<'left' | 'right' | null>(null);
  const zoomRangeRef = useRef(zoomRange);
  useEffect(() => { zoomRangeRef.current = zoomRange; }, [zoomRange]);

  // ── ResizeObserver on the viewport div ───────────────────────────────
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setVpSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Reset scroll instantly when zoom is cleared
  useEffect(() => {
    if (!zoomRange && scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
      setScrollLeft(0);
    }
  }, [zoomRange]);

  // ── Window mouseup ────────────────────────────────────────────────────
  useEffect(() => {
    const onUp = () => {
      if (isResizing.current) { isResizing.current = null; return; }
      if (!isDragging.current) return;
      isDragging.current = false;
      const s = dragStartRef.current;
      const e = dragEndRef.current;
      dragStartRef.current = null;
      dragEndRef.current   = null;
      setDragPreview(null);
      if (s !== null && e !== null && Math.abs(s - e) > 0.01) {
        shouldCenterRef.current = true;  // flag: center viewport on this new selection
        confirmRef.current(s, e);
      }
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, []);

  // ── Zoom & dimensions ─────────────────────────────────────────────────
  const margin = isMobile ? MARGIN_MOBILE : MARGIN;

  const totalDist = useMemo(() =>
    chartData.length
      ? chartData[chartData.length - 1].distance - chartData[0].distance
      : 0,
  [chartData]);

  const zoomFactor = useMemo(() => {
    if (!zoomRange || totalDist === 0) return 1;
    const selW   = zoomRange.end - zoomRange.start;
    const padded = selW * 1.6; // generous context so zoom stays subtle
    return Math.min(MAX_ZOOM, totalDist / padded);
  }, [zoomRange, totalDist]);

  const chartWidth = vpSize.w > 0 ? Math.round(vpSize.w * zoomFactor) : 0;
  const innerW     = Math.max(0, chartWidth - margin.left - margin.right);
  const innerH     = Math.max(0, vpSize.h  - margin.top  - margin.bottom);

  // Auto-center on selection after a completed drag (not during resize drags)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!zoomRange || !shouldCenterRef.current || !scrollRef.current || chartWidth === 0 || vpSize.w === 0 || !chartData.length) return;
    shouldCenterRef.current = false;
    const firstDist   = chartData[0].distance;
    const localTotal  = chartData[chartData.length - 1].distance - firstDist;
    if (localTotal === 0) return;
    const centerDist   = (zoomRange.start + zoomRange.end) / 2;
    const ratio        = (centerDist - firstDist) / localTotal;
    const targetScroll = Math.max(0, ratio * chartWidth - vpSize.w / 2);
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = targetScroll;
        setScrollLeft(targetScroll);
      }
    });
  }, [zoomRange, chartWidth]);

  // ── Scales ────────────────────────────────────────────────────────────
  const xScale = useMemo(() => {
    if (!chartData.length || innerW === 0) return null;
    return d3.scaleLinear()
      .domain([chartData[0].distance, chartData[chartData.length - 1].distance])
      .range([0, innerW]);
  }, [chartData, innerW]);

  const yScale = useMemo(() => {
    if (!chartData.length || innerH === 0) return null;
    const elevs = chartData.map((d) => d.elevation);
    const pad   = Math.max((Math.max(...elevs) - Math.min(...elevs)) * 0.15, 15);
    return d3.scaleLinear()
      .domain([Math.min(...elevs) - pad, Math.max(...elevs) + pad])
      .range([innerH, 0]).nice();
  }, [chartData, innerH]);

  // ── Paths ─────────────────────────────────────────────────────────────
  const colorSegmentPaths = useMemo(() => {
    if (!xScale || !yScale || !chartData.length) return [];
    const areaGen = d3.area<ChartPoint>()
      .x((d) => xScale(d.distance)).y0(innerH).y1((d) => yScale(d.elevation))
      .curve(d3.curveMonotoneX);
    const result: { color: string; path: string }[] = [];
    let i = 0;
    while (i < chartData.length) {
      const color = chartData[i].color;
      const group: ChartPoint[] = [];
      while (i < chartData.length && chartData[i].color === color) group.push(chartData[i++]);
      if (i < chartData.length) group.push(chartData[i]);
      const path = areaGen(group);
      if (path) result.push({ color, path });
    }
    return result;
  }, [chartData, xScale, yScale, innerH]);

  const linePath = useMemo(() => {
    if (!xScale || !yScale || !chartData.length) return '';
    return d3.line<ChartPoint>()
      .x((d) => xScale(d.distance)).y((d) => yScale(d.elevation))
      .curve(d3.curveMonotoneX)(chartData) ?? '';
  }, [chartData, xScale, yScale]);

  const gradientStops = useMemo(() => {
    if (!chartData.length) return [{ offset: 0, color: '#10b981' }];
    const min   = chartData[0].distance;
    const range = totalDist;
    return chartData.map((d) => ({
      offset: range > 0 ? ((d.distance - min) / range) * 100 : 0,
      color:  d.color,
    }));
  }, [chartData, totalDist]);

  // ── Ticks ─────────────────────────────────────────────────────────────
  const xTicks = useMemo(() => {
    if (!xScale) return [];
    return xScale.ticks(6).map((v) => ({ v, x: xScale(v), label: formatDistance(v, unitSystem) }));
  }, [xScale, unitSystem]);

  const yTicks = useMemo(() => {
    if (!yScale) return [];
    return yScale.ticks(5).map((v) => ({ v, y: yScale(v), label: formatElevation(v, unitSystem) }));
  }, [yScale, unitSystem]);

  // ── Helpers ───────────────────────────────────────────────────────────
  // Convert clientX → data distance, accounting for scroll
  const clientXToDist = (clientX: number): number | null => {
    if (!svgRef.current || !xScale) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const x    = clientX - rect.left - margin.left;
    return xScale.invert(Math.max(0, Math.min(innerW, x)));
  };

  const nearestPoint = (dist: number): ChartPoint | null => {
    if (!chartData.length) return null;
    let best = chartData[0], bestDiff = Math.abs(best.distance - dist);
    for (const d of chartData) {
      const diff = Math.abs(d.distance - dist);
      if (diff < bestDiff) { best = d; bestDiff = diff; }
    }
    return best;
  };

  // ── SVG events ────────────────────────────────────────────────────────
  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const dist = clientXToDist(e.clientX);
    if (dist === null) return;

    // Resize handle
    if (isResizing.current && zoomRangeRef.current) {
      const cur = zoomRangeRef.current;
      if (isResizing.current === 'left')
        confirmRef.current(Math.min(dist, cur.end - 0.01), cur.end);
      else
        confirmRef.current(cur.start, Math.max(dist, cur.start + 0.01));
      return;
    }

    // Tooltip + map sync
    const pt = nearestPoint(dist);
    if (pt && xScale && yScale) {
      setTooltip({ svgX: xScale(pt.distance), svgY: yScale(pt.elevation),
                   dist: pt.distance, ele: pt.elevation, slope: pt.slope, color: pt.color });
      setHoverByDistance(pt.distance);
    }

    // Drag preview
    if (isDragging.current) {
      dragEndRef.current = dist;
      const s = dragStartRef.current!;
      // Use pixel distance (>5px) to distinguish drag from click
      if (dragStartPxRef.current !== null && Math.abs(e.clientX - dragStartPxRef.current) > 5) {
        wasSignificantDrag.current = true;
      }
      setDragPreview({ start: Math.min(s, dist), end: Math.max(s, dist) });
    }
  };

  const onMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const dist = clientXToDist(e.clientX);
    if (dist === null) return;
    isDragging.current         = true;
    wasSignificantDrag.current = false;
    dragStartPxRef.current     = e.clientX;
    dragStartRef.current       = dist;
    dragEndRef.current         = dist;
    setDragPreview(null);
  };

  const onMouseLeave = () => {
    setTooltip(null);
    setHoverByDistance(null);
    if (!isDragging.current) setDragPreview(null);
  };

  // Click on a chart point → select corresponding weather point on map (shows popup)
  const onChartClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (wasSignificantDrag.current) return; // was a drag, not a click
    const dist = clientXToDist(e.clientX);
    if (dist === null || !weatherPoints.length) return;
    let bestIdx = 0;
    let bestDiff = Math.abs(weatherPoints[0].point.distanceFromStart - dist);
    for (let i = 1; i < weatherPoints.length; i++) {
      const diff = Math.abs(weatherPoints[i].point.distanceFromStart - dist);
      if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
    }
    setSelectedPointIdx(bestIdx);
  };

  // ── Derived coords ────────────────────────────────────────────────────
  const selLeft  = zoomRange && xScale ? xScale(zoomRange.start) : null;
  const selRight = zoomRange && xScale ? xScale(zoomRange.end)   : null;

  const dragPxStart = dragPreview && xScale ? xScale(dragPreview.start) : null;
  const dragPxWidth = dragPreview && xScale
    ? xScale(dragPreview.end) - xScale(dragPreview.start) : null;

  const refLineX = selectedPoint && xScale && !zoomRange
    ? xScale(selectedPoint.distanceFromStart) : null;

  // Tooltip viewport X accounts for scroll offset so it stays visible
  const tooltipVpX    = tooltip !== null ? tooltip.svgX + margin.left - scrollLeft : 0;
  const tooltipOnRight = tooltip !== null && tooltipVpX < vpSize.w / 2;

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="border-border bg-card rounded-xl border p-4 shadow-sm select-none md:p-6">

      {/* Header */}
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
            <Button variant="secondary" size="sm" onClick={resetZoom}
              className="h-6 gap-1 px-1.5 text-[9px] font-bold tracking-tight uppercase md:h-7 md:gap-1.5 md:px-2 md:text-[10px]">
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

      {/* Chart area */}
      <div
        ref={outerRef}
        className={`relative mb-4 w-full md:mb-6 ${isMobile ? 'h-32' : 'h-56'}`}
      >
        {/* Tooltip — desktop: positioned in viewport space using tooltipVpX */}
        {tooltip && !isMobile && (
          <div
            className="pointer-events-none absolute top-1 z-10"
            style={tooltipOnRight
              ? { left: Math.max(0, tooltipVpX + 12) }
              : { right: Math.max(0, vpSize.w - tooltipVpX + 12) }}
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
                  <div className="h-1.5 w-1.5 rounded-full shadow-sm md:h-2 md:w-2"
                    style={{ backgroundColor: tooltip.color }} />
                  <span className="text-foreground font-mono text-[10px] font-black md:text-xs">
                    {tooltip.slope}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tooltip — mobile */}
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
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tooltip.color }} />
                <span className="text-foreground font-mono text-[9px] font-black">{tooltip.slope}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable viewport */}
        <div
          ref={scrollRef}
          className="h-full w-full overflow-x-auto"
          style={{ scrollbarWidth: zoomFactor > 1 ? 'thin' : 'none' }}
          onScroll={(e) => setScrollLeft((e.currentTarget).scrollLeft)}
        >
          {/* Inner div expands when zoomed */}
          <div
            className="h-full cursor-crosshair"
            style={{ width: chartWidth > 0 ? `${chartWidth}px` : '100%', minWidth: '100%' }}
          >
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              onMouseMove={onMouseMove}
              onMouseDown={isMobile ? undefined : onMouseDown}
              onMouseLeave={onMouseLeave}
              onClick={isMobile ? undefined : onChartClick}
              onDoubleClick={isMobile ? undefined : () => { resetZoom(); setDragPreview(null); }}
            >
              <defs>
                <linearGradient id="elev-stroke" x1="0" y1="0" x2="1" y2="0">
                  {gradientStops.map((s, i) => (
                    <stop key={i} offset={`${s.offset}%`} stopColor={s.color} />
                  ))}
                </linearGradient>
                <clipPath id="elev-clip">
                  <rect x={0} y={0} width={innerW} height={innerH} />
                </clipPath>
              </defs>

              <g transform={`translate(${margin.left},${margin.top})`}>

                {/* Y gridlines */}
                {!isMobile && yTicks.map((tick) => (
                  <line key={tick.v} x1={0} x2={innerW} y1={tick.y} y2={tick.y}
                    stroke="currentColor" strokeOpacity={0.07} strokeWidth={1} />
                ))}

                {/* Slope-coloured area fill */}
                {colorSegmentPaths.map((seg, i) => (
                  <path key={i} d={seg.path} fill={seg.color} fillOpacity={0.25} clipPath="url(#elev-clip)" />
                ))}

                {/* Stroke */}
                <path d={linePath} fill="none" stroke="url(#elev-stroke)"
                  strokeWidth={isMobile ? 2 : 2.5} clipPath="url(#elev-clip)" />

                {/* Map-hover reference line */}
                {refLineX !== null && (
                  <line x1={refLineX} x2={refLineX} y1={0} y2={innerH}
                    stroke="hsl(var(--primary))" strokeWidth={1.5} strokeDasharray="4 3" />
                )}

                {/* Drag-select preview */}
                {dragPxStart !== null && dragPxWidth !== null && dragPxWidth > 0 && (
                  <rect x={dragPxStart} y={0} width={dragPxWidth} height={innerH}
                    fill="hsl(var(--primary))" fillOpacity={0.2}
                    stroke="hsl(var(--primary))" strokeOpacity={0.5} strokeWidth={1} />
                )}

                {/* White overlay on non-selected parts */}
                {selLeft !== null && selLeft > 0 && (
                  <rect x={0} y={0} width={selLeft} height={innerH} fill="white" fillOpacity={0.72} />
                )}
                {selRight !== null && selRight < innerW && (
                  <rect x={selRight} y={0} width={innerW - selRight} height={innerH} fill="white" fillOpacity={0.72} />
                )}

                {/* Selection border lines + resize handles */}
                {selLeft !== null && (
                  <>
                    <line x1={selLeft} x2={selLeft} y1={0} y2={innerH}
                      stroke="hsl(var(--primary))" strokeWidth={2} />
                    <g transform={`translate(${selLeft},${innerH / 2})`}
                      style={{ cursor: 'ew-resize' }}
                      onMouseDown={(e) => { e.stopPropagation(); isResizing.current = 'left'; }}>
                      <rect x={-9} y={-18} width={18} height={36} rx={5} fill="hsl(var(--primary))" />
                      <line x1={-3} x2={3} y1={-6} y2={-6} stroke="white" strokeWidth={1.5} strokeLinecap="round" />
                      <line x1={-3} x2={3} y1={0}  y2={0}  stroke="white" strokeWidth={1.5} strokeLinecap="round" />
                      <line x1={-3} x2={3} y1={6}  y2={6}  stroke="white" strokeWidth={1.5} strokeLinecap="round" />
                    </g>
                  </>
                )}
                {selRight !== null && (
                  <>
                    <line x1={selRight} x2={selRight} y1={0} y2={innerH}
                      stroke="hsl(var(--primary))" strokeWidth={2} />
                    <g transform={`translate(${selRight},${innerH / 2})`}
                      style={{ cursor: 'ew-resize' }}
                      onMouseDown={(e) => { e.stopPropagation(); isResizing.current = 'right'; }}>
                      <rect x={-9} y={-18} width={18} height={36} rx={5} fill="hsl(var(--primary))" />
                      <line x1={-3} x2={3} y1={-6} y2={-6} stroke="white" strokeWidth={1.5} strokeLinecap="round" />
                      <line x1={-3} x2={3} y1={0}  y2={0}  stroke="white" strokeWidth={1.5} strokeLinecap="round" />
                      <line x1={-3} x2={3} y1={6}  y2={6}  stroke="white" strokeWidth={1.5} strokeLinecap="round" />
                    </g>
                  </>
                )}

                {/* Hover crosshair + dot */}
                {tooltip && (
                  <>
                    <line x1={tooltip.svgX} x2={tooltip.svgX} y1={0} y2={innerH}
                      stroke="currentColor" strokeOpacity={0.25} strokeWidth={1} strokeDasharray="3 3" />
                    <circle cx={tooltip.svgX} cy={tooltip.svgY} r={4}
                      fill={tooltip.color} stroke="white" strokeWidth={1.5} />
                  </>
                )}

                {/* X axis */}
                {!isMobile && (
                  <g transform={`translate(0,${innerH})`}>
                    <line x1={0} x2={innerW} stroke="currentColor" strokeOpacity={0.1} />
                    {xTicks.map((tick) => (
                      <text key={tick.v} x={tick.x} dy="1.4em" textAnchor="middle"
                        fontSize={10} fill="currentColor" fillOpacity={0.55} fontWeight={500}>
                        {tick.label}
                      </text>
                    ))}
                  </g>
                )}

                {/* Y axis */}
                {!isMobile && yTicks.map((tick) => (
                  <text key={tick.v} x={-6} y={tick.y} dy="0.32em" textAnchor="end"
                    fontSize={10} fill="currentColor" fillOpacity={0.55} fontWeight={500}>
                    {tick.label}
                  </text>
                ))}

              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* Stats */}
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
