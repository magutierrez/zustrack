'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { TrendingUp, RefreshCcw } from 'lucide-react';
import {
  getSlopeColorHex,
  SLOPE_COLOR_FLAT,
  SLOPE_COLOR_GENTLE,
  SLOPE_COLOR_STEEP,
  SLOPE_COLOR_EXTREME,
} from '@/lib/slope-colors';

interface TrackPoint {
  lat: number;
  lng: number;
  d: number;
  e: number | null;
}

interface ChartPoint {
  distance: number;
  elevation: number;
  slope: number;
  color: string;
}

interface Labels {
  elevationProfile: string;
  slope: string;
  flat: string;
  gentle: string;
  steep: string;
  extreme: string;
  km: string;
  meters: string;
  resetZoom: string;
}

interface TooltipState {
  x: number;
  y: number;
  dist: number;
  ele: number;
  slope: number;
  color: string;
}

const MARGIN = { top: 8, right: 16, bottom: 28, left: 50 };

export function TrailElevationChart({
  trackProfile,
  labels,
  externalHoverDist,
  onHoverDist,
  onRangeSelect,
  onRangeReset,
}: {
  trackProfile: TrackPoint[];
  labels: Labels;
  externalHoverDist?: number | null;
  onHoverDist?: (dist: number | null) => void;
  onRangeSelect?: (start: number, end: number) => void;
  onRangeReset?: () => void;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Zoom/drag state
  const [zoomRange, setZoomRange] = useState<{ start: number; end: number } | null>(null);
  const [dragPreview, setDragPreview] = useState<{ start: number; end: number } | null>(null);
  const isDragging = useRef(false);
  const dragStartRef = useRef<number | null>(null);
  const dragStartPxRef = useRef<number | null>(null);
  const dragEndRef = useRef<number | null>(null);

  // Measure container
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Build chart data from track profile
  const chartData = useMemo<ChartPoint[]>(() => {
    const pts = trackProfile.filter((p) => p.e !== null);
    if (pts.length < 2) return [];
    return pts.map((p, i) => {
      let slope = 0;
      if (i > 0) {
        const prev = pts[i - 1];
        const distDiffKm = p.d - prev.d;
        const eleDiff = (p.e ?? 0) - (prev.e ?? 0);
        if (distDiffKm > 0.001) slope = (eleDiff / (distDiffKm * 1000)) * 100;
      }
      return {
        distance: p.d,
        elevation: p.e ?? 0,
        slope: Math.round(slope * 10) / 10,
        color: getSlopeColorHex(slope),
      };
    });
  }, [trackProfile]);

  const innerW = Math.max(0, size.w - MARGIN.left - MARGIN.right);
  const innerH = Math.max(0, size.h - MARGIN.top - MARGIN.bottom);

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

  // Colored area segments
  const colorSegmentPaths = useMemo(() => {
    if (!xScale || !yScale || !chartData.length) return [];

    // When zoomed, only draw segments within range
    const pts = zoomRange
      ? chartData.filter((d) => d.distance >= zoomRange.start && d.distance <= zoomRange.end)
      : chartData;

    const areaGen = d3
      .area<ChartPoint>()
      .x((d) => xScale(d.distance))
      .y0(innerH)
      .y1((d) => yScale(d.elevation))
      .curve(d3.curveLinear);

    const result: { color: string; path: string }[] = [];
    let i = 0;
    while (i < pts.length) {
      const color = pts[i].color;
      const group: ChartPoint[] = [];
      while (i < pts.length && pts[i].color === color) group.push(pts[i++]);
      if (i < pts.length) group.push(pts[i]);
      const path = areaGen(group);
      if (path) result.push({ color, path });
    }
    return result;
  }, [chartData, xScale, yScale, innerH, zoomRange]);

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
        .curve(d3.curveLinear)(pts) ?? ''
    );
  }, [chartData, xScale, yScale, zoomRange]);

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

  // X/Y ticks
  const xTicks = useMemo(
    () => (xScale ? xScale.ticks(5).map((v) => ({ v, x: xScale(v) })) : []),
    [xScale],
  );
  const yTicks = useMemo(
    () => (yScale ? yScale.ticks(4).map((v) => ({ v, y: yScale(v) })) : []),
    [yScale],
  );

  // Zoom helpers
  const confirmSelection = (start: number, end: number) => {
    const [s, e] = start <= end ? [start, end] : [end, start];
    setZoomRange({ start: s, end: e });
    setDragPreview(null);
    onRangeSelect?.(s, e);
  };

  const resetZoom = () => {
    setZoomRange(null);
    setDragPreview(null);
    onRangeReset?.();
  };

  // Window mouseup handler to finalize drag
  useEffect(() => {
    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      const start = dragStartRef.current;
      const end = dragEndRef.current;
      if (start !== null && end !== null && Math.abs(end - start) > 0.01) {
        confirmSelection(start, end);
      } else {
        setDragPreview(null);
      }
      dragStartRef.current = null;
      dragStartPxRef.current = null;
      dragEndRef.current = null;
    };
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  // confirmSelection is stable (no deps change it); we accept the lint rule here
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRangeSelect]);

  // Compute tooltip state for a given distance value
  const tooltipFromDist = (dist: number): TooltipState | null => {
    if (!xScale || !yScale || !chartData.length) return null;
    let best = chartData[0];
    let bestDiff = Math.abs(best.distance - dist);
    for (const d of chartData) {
      const diff = Math.abs(d.distance - dist);
      if (diff < bestDiff) { best = d; bestDiff = diff; }
    }
    return {
      x: xScale(best.distance),
      y: yScale(best.elevation),
      dist: best.distance,
      ele: best.elevation,
      slope: best.slope,
      color: best.color,
    };
  };

  // External hover indicator (from map) — only shown when chart is not being hovered and dist is in view
  const externalTooltip = useMemo<TooltipState | null>(() => {
    if (externalHoverDist == null || !xScale || !yScale || !chartData.length) return null;
    // Skip if outside zoomed range
    if (zoomRange && (externalHoverDist < zoomRange.start || externalHoverDist > zoomRange.end)) {
      return null;
    }
    let best = chartData[0];
    let bestDiff = Math.abs(best.distance - externalHoverDist);
    for (const d of chartData) {
      const diff = Math.abs(d.distance - externalHoverDist);
      if (diff < bestDiff) { best = d; bestDiff = diff; }
    }
    return {
      x: xScale(best.distance),
      y: yScale(best.elevation),
      dist: best.distance,
      ele: best.elevation,
      slope: best.slope,
      color: best.color,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalHoverDist, chartData, xScale, yScale, innerW, innerH, zoomRange]);

  // Active tooltip: local (chart hover) takes priority over external (map hover)
  const activeTooltip = tooltip ?? externalTooltip;

  // Mouse interaction
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !xScale || !yScale || !chartData.length) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - MARGIN.left;
    const dist = xScale.invert(Math.max(0, Math.min(innerW, x)));

    if (isDragging.current && dragStartRef.current !== null) {
      dragEndRef.current = dist;
      setDragPreview({ start: dragStartRef.current, end: dist });
      return; // don't show tooltip while dragging
    }

    const t = tooltipFromDist(dist);
    if (t) {
      setTooltip(t);
      onHoverDist?.(t.dist);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (zoomRange) return; // already zoomed — reset via button/dblclick
    if (!svgRef.current || !xScale) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - MARGIN.left;
    const dist = xScale.invert(Math.max(0, Math.min(innerW, x)));
    isDragging.current = true;
    dragStartRef.current = dist;
    dragStartPxRef.current = x;
    dragEndRef.current = dist;
    setTooltip(null);
  };

  const handleMouseLeave = () => {
    if (!isDragging.current) {
      setTooltip(null);
      onHoverDist?.(null);
    }
  };

  // Drag preview pixel bounds (relative to inner g transform)
  const dragPreviewPx = useMemo(() => {
    if (!dragPreview || !xScale) return null;
    const x0 = xScale(dragPreview.start);
    const x1 = xScale(dragPreview.end);
    return { left: Math.min(x0, x1), width: Math.abs(x1 - x0) };
  }, [dragPreview, xScale]);

  if (chartData.length < 2) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center gap-2">
        <div className="rounded-lg bg-slate-100 p-1.5 dark:bg-slate-800">
          <TrendingUp className="h-4 w-4 text-slate-600 dark:text-slate-300" />
        </div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          {labels.elevationProfile}
        </h2>
        {zoomRange && (
          <button
            onClick={resetZoom}
            className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-tight text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <RefreshCcw className="h-3 w-3" />
            {labels.resetZoom}
          </button>
        )}
      </div>

      {/* Chart area */}
      <div ref={outerRef} className="relative h-44 w-full select-none">
        {/* Tooltip */}
        {activeTooltip && !dragPreview && (
          <div
            className="pointer-events-none absolute top-1 z-10"
            style={
              activeTooltip.x + MARGIN.left < size.w / 2
                ? { left: activeTooltip.x + MARGIN.left + 10 }
                : { right: size.w - activeTooltip.x - MARGIN.left + 10 }
            }
          >
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white/95 px-2.5 py-1.5 shadow-lg backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95">
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                {Math.round(activeTooltip.ele)} {labels.meters}
              </span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="text-xs text-slate-500">{activeTooltip.dist.toFixed(1)} {labels.km}</span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: activeTooltip.color }} />
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                  {activeTooltip.slope}%
                </span>
              </div>
            </div>
          </div>
        )}

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
          <defs>
            <linearGradient id="trail-elev-stroke" x1="0" y1="0" x2="1" y2="0">
              {gradientStops.map((s, i) => (
                <stop key={i} offset={`${s.offset}%`} stopColor={s.color} />
              ))}
            </linearGradient>
            <clipPath id="trail-elev-clip">
              <rect x={0} y={0} width={innerW} height={innerH} />
            </clipPath>
          </defs>

          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            {/* Y gridlines */}
            {yTicks.map((t) => (
              <line
                key={t.v}
                x1={0} x2={innerW} y1={t.y} y2={t.y}
                stroke="currentColor" strokeOpacity={0.07} strokeWidth={1}
              />
            ))}

            {/* Colored area fills */}
            {colorSegmentPaths.map((seg, i) => (
              <path
                key={i} d={seg.path}
                fill={seg.color} fillOpacity={0.25}
                clipPath="url(#trail-elev-clip)"
              />
            ))}

            {/* Gradient stroke */}
            <path
              d={linePath} fill="none"
              stroke="url(#trail-elev-stroke)" strokeWidth={2.5}
              clipPath="url(#trail-elev-clip)"
            />

            {/* Drag preview rect */}
            {dragPreviewPx && dragPreviewPx.width > 0 && (
              <rect
                x={dragPreviewPx.left} y={0}
                width={dragPreviewPx.width} height={innerH}
                fill="hsl(var(--primary))" fillOpacity={0.2}
                stroke="hsl(var(--primary))" strokeOpacity={0.5} strokeWidth={1}
                clipPath="url(#trail-elev-clip)"
              />
            )}

            {/* Hover crosshair + dot */}
            {activeTooltip && !dragPreview && (
              <>
                <line
                  x1={activeTooltip.x} x2={activeTooltip.x} y1={0} y2={innerH}
                  stroke="currentColor" strokeOpacity={0.2} strokeWidth={1} strokeDasharray="3 3"
                />
                <circle
                  cx={activeTooltip.x} cy={activeTooltip.y} r={4}
                  fill={activeTooltip.color} stroke="white" strokeWidth={1.5}
                />
              </>
            )}

            {/* X axis */}
            <g transform={`translate(0,${innerH})`}>
              <line x1={0} x2={innerW} stroke="currentColor" strokeOpacity={0.1} />
              {xTicks.map((t) => (
                <text
                  key={t.v} x={t.x} dy="1.4em" textAnchor="middle"
                  fontSize={10} fill="currentColor" fillOpacity={0.55} fontWeight={500}
                >
                  {t.v.toFixed(1)} {labels.km}
                </text>
              ))}
            </g>

            {/* Y axis */}
            {yTicks.map((t) => (
              <text
                key={t.v} x={-6} y={t.y} dy="0.32em" textAnchor="end"
                fontSize={10} fill="currentColor" fillOpacity={0.55} fontWeight={500}
              >
                {Math.round(t.v)}
              </text>
            ))}
          </g>
        </svg>
      </div>

      {/* Color legend */}
      <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
        {[
          { color: SLOPE_COLOR_FLAT, label: labels.flat },
          { color: SLOPE_COLOR_GENTLE, label: labels.gentle },
          { color: SLOPE_COLOR_STEEP, label: labels.steep },
          { color: SLOPE_COLOR_EXTREME, label: labels.extreme },
        ].map(({ color, label }) => (
          <div key={color} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
