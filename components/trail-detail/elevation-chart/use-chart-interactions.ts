import { useState, useRef, useEffect, useMemo, RefObject } from 'react';
import * as d3 from 'd3';
import { ChartPoint, TooltipState, Margin } from './types';

export function useChartInteractions({
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
}: {
  svgRef: RefObject<SVGSVGElement | null>;
  xScale: d3.ScaleLinear<number, number> | null;
  yScale: d3.ScaleLinear<number, number> | null;
  chartData: ChartPoint[];
  innerW: number;
  margin: Margin;
  selectable: boolean;
  zoomRange: { start: number; end: number } | null;
  setZoomRange: (range: { start: number; end: number } | null) => void;
  onRangeSelect?: (start: number, end: number) => void;
  onHoverDist?: (dist: number | null) => void;
  externalHoverDist?: number | null;
}) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [dragPreview, setDragPreview] = useState<{ start: number; end: number } | null>(null);
  const isDragging = useRef(false);
  const dragStartRef = useRef<number | null>(null);
  const dragEndRef = useRef<number | null>(null);

  // Compute tooltip state for a given distance value
  const tooltipFromDist = (dist: number): TooltipState | null => {
    if (!xScale || !yScale || !chartData.length) return null;
    let best = chartData[0];
    let bestDiff = Math.abs(best.distance - dist);
    for (const d of chartData) {
      const diff = Math.abs(d.distance - dist);
      if (diff < bestDiff) {
        best = d;
        bestDiff = diff;
      }
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

  const confirmSelection = (start: number, end: number) => {
    const [s, e] = start <= end ? [start, end] : [end, start];
    setZoomRange({ start: s, end: e });
    setDragPreview(null);
    onRangeSelect?.(s, e);
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
      dragEndRef.current = null;
    };
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRangeSelect]);

  // Use a ref to store current values for the touch effect to avoid recreating it
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const liveRef = useRef<any>({});
  useEffect(() => {
    liveRef.current = {
      xScale,
      margin,
      innerW,
      chartData,
      selectable,
      zoomRange,
      tooltipFromDist,
      onHoverDist,
      confirmSelection,
    };
  });

  // Non-passive touch handlers on the SVG
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const getDistFromTouch = (clientX: number): number | null => {
      const { xScale: xs, margin: m, innerW: iw } = liveRef.current;
      if (!xs) return null;
      const rect = svg.getBoundingClientRect();
      const x = clientX - rect.left - m.left;
      return xs.invert(Math.max(0, Math.min(iw, x)));
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const dist = getDistFromTouch(e.touches[0].clientX);
      if (dist == null) return;
      if (liveRef.current.selectable && !liveRef.current.zoomRange) {
        isDragging.current = true;
        dragStartRef.current = dist;
        dragEndRef.current = dist;
        setTooltip(null);
      } else {
        const t = liveRef.current.tooltipFromDist(dist);
        if (t) {
          setTooltip(t);
          liveRef.current.onHoverDist?.(t.dist);
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const dist = getDistFromTouch(e.touches[0].clientX);
      if (dist == null) return;
      if (isDragging.current && dragStartRef.current !== null) {
        dragEndRef.current = dist;
        setDragPreview({ start: dragStartRef.current, end: dist });
        return;
      }
      const t = liveRef.current.tooltipFromDist(dist);
      if (t) {
        setTooltip(t);
        liveRef.current.onHoverDist?.(t.dist);
      }
    };

    const onTouchEnd = () => {
      if (isDragging.current) {
        isDragging.current = false;
        const start = dragStartRef.current;
        const end = dragEndRef.current;
        if (start !== null && end !== null && Math.abs(end - start) > 0.01) {
          liveRef.current.confirmSelection(start, end);
        } else {
          setDragPreview(null);
        }
        dragStartRef.current = null;
        dragEndRef.current = null;
      } else {
        setTooltip(null);
        liveRef.current.onHoverDist?.(null);
      }
    };

    svg.addEventListener('touchstart', onTouchStart, { passive: false });
    svg.addEventListener('touchmove', onTouchMove, { passive: false });
    svg.addEventListener('touchend', onTouchEnd);
    return () => {
      svg.removeEventListener('touchstart', onTouchStart);
      svg.removeEventListener('touchmove', onTouchMove);
      svg.removeEventListener('touchend', onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svgRef]);

  // Mouse interaction
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !xScale || !yScale || !chartData.length) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - margin.left;
    const dist = xScale.invert(Math.max(0, Math.min(innerW, x)));

    if (isDragging.current && dragStartRef.current !== null) {
      dragEndRef.current = dist;
      setDragPreview({ start: dragStartRef.current, end: dist });
      return;
    }

    const t = tooltipFromDist(dist);
    if (t) {
      setTooltip(t);
      onHoverDist?.(t.dist);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!selectable) return;
    if (zoomRange) return;
    if (!svgRef.current || !xScale) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - margin.left;
    const dist = xScale.invert(Math.max(0, Math.min(innerW, x)));
    isDragging.current = true;
    dragStartRef.current = dist;
    dragEndRef.current = dist;
    setTooltip(null);
  };

  const handleMouseLeave = () => {
    if (!isDragging.current) {
      setTooltip(null);
      onHoverDist?.(null);
    }
  };

  // External hover indicator
  const externalTooltip = useMemo<TooltipState | null>(() => {
    if (externalHoverDist == null || !xScale || !yScale || !chartData.length) return null;
    if (zoomRange && (externalHoverDist < zoomRange.start || externalHoverDist > zoomRange.end)) {
      return null;
    }
    let best = chartData[0];
    let bestDiff = Math.abs(best.distance - externalHoverDist);
    for (const d of chartData) {
      const diff = Math.abs(d.distance - externalHoverDist);
      if (diff < bestDiff) {
        best = d;
        bestDiff = diff;
      }
    }
    return {
      x: xScale(best.distance),
      y: yScale(best.elevation),
      dist: best.distance,
      ele: best.elevation,
      slope: best.slope,
      color: best.color,
    };
  }, [externalHoverDist, chartData, xScale, yScale, zoomRange]);

  const activeTooltip = tooltip ?? externalTooltip;

  const dragPreviewPx = useMemo(() => {
    if (!dragPreview || !xScale) return null;
    const x0 = xScale(dragPreview.start);
    const x1 = xScale(dragPreview.end);
    return { left: Math.min(x0, x1), width: Math.abs(x1 - x0) };
  }, [dragPreview, xScale]);

  return {
    tooltip,
    activeTooltip,
    dragPreview,
    dragPreviewPx,
    handleMouseMove,
    handleMouseDown,
    handleMouseLeave,
    confirmSelection,
  };
}
