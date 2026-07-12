'use client';

import { useRef, useState, useEffect } from 'react';
import * as d3 from 'd3';
import type { TooltipState } from './elevation-tooltip';

interface ChartPoint {
  distance: number;
  elevation: number;
  slope: number;
  color: string;
}

interface UseElevationInteractionsProps {
  chartData: ChartPoint[];
  xScale: d3.ScaleLinear<number, number> | null;
  yScale: d3.ScaleLinear<number, number> | null;
  innerW: number;
  margin: { left: number };
  svgRef: React.RefObject<SVGSVGElement | null>;
  confirmSelection: (start: number, end: number) => void;
  setHoverByDistance: (dist: number | null) => void;
  setClickedChartPointDist: (dist: number | null) => void;
  setSelectedPointIdx: (idx: number | null) => void;
  zoomRange: { start: number; end: number } | null;
}

export function useElevationInteractions({
  chartData,
  xScale,
  yScale,
  innerW,
  margin,
  svgRef,
  confirmSelection,
  setHoverByDistance,
  setClickedChartPointDist,
  setSelectedPointIdx,
  zoomRange,
}: UseElevationInteractionsProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [dragPreview, setDragPreview] = useState<{ start: number; end: number } | null>(null);

  const isDragging = useRef(false);
  const dragStartRef = useRef<number | null>(null);
  const dragEndRef = useRef<number | null>(null);
  const dragStartPxRef = useRef<number | null>(null);
  const wasSignificantDrag = useRef(false);
  const shouldCenterRef = useRef(false);

  const isResizing = useRef<'left' | 'right' | null>(null);

  const confirmRef = useRef(confirmSelection);
  useEffect(() => {
    confirmRef.current = confirmSelection;
  }, [confirmSelection]);

  const zoomRangeRef = useRef(zoomRange);
  useEffect(() => {
    zoomRangeRef.current = zoomRange;
  }, [zoomRange]);

  useEffect(() => {
    const onUp = () => {
      if (isResizing.current) {
        isResizing.current = null;
        return;
      }
      if (!isDragging.current) return;
      isDragging.current = false;
      const s = dragStartRef.current;
      const e = dragEndRef.current;
      dragStartRef.current = null;
      dragEndRef.current = null;
      setDragPreview(null);
      if (s !== null && e !== null && Math.abs(s - e) > 0.01) {
        shouldCenterRef.current = true;
        confirmRef.current(s, e);
      }
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, []);

  const clientXToDist = (clientX: number): number | null => {
    if (!svgRef.current || !xScale) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const x = clientX - rect.left - margin.left;
    return xScale.invert(Math.max(0, Math.min(innerW, x)));
  };

  const nearestPoint = (dist: number): ChartPoint | null => {
    if (!chartData.length) return null;
    let best = chartData[0],
      bestDiff = Math.abs(best.distance - dist);
    for (const d of chartData) {
      const diff = Math.abs(d.distance - dist);
      if (diff < bestDiff) {
        best = d;
        bestDiff = diff;
      }
    }
    return best;
  };

  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const dist = clientXToDist(e.clientX);
    if (dist === null) return;
    if (isResizing.current && zoomRangeRef.current) {
      const cur = zoomRangeRef.current;
      if (isResizing.current === 'left')
        confirmRef.current(Math.min(dist, cur.end - 0.01), cur.end);
      else confirmRef.current(cur.start, Math.max(dist, cur.start + 0.01));
      return;
    }
    const pt = nearestPoint(dist);
    if (pt && xScale && yScale) {
      const svgX = xScale(pt.distance);
      const svgY = yScale(pt.elevation);
      if (isFinite(svgX) && isFinite(svgY)) {
        setTooltip({
          svgX,
          svgY,
          dist: pt.distance,
          ele: pt.elevation,
          slope: pt.slope,
          color: pt.color,
        });
        setHoverByDistance(pt.distance);
      }
    }
    if (isDragging.current) {
      dragEndRef.current = dist;
      if (dragStartPxRef.current !== null && Math.abs(e.clientX - dragStartPxRef.current) > 5) {
        wasSignificantDrag.current = true;
      }
      setDragPreview({
        start: Math.min(dragStartRef.current!, dist),
        end: Math.max(dragStartRef.current!, dist),
      });
    }
  };

  const onMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const dist = clientXToDist(e.clientX);
    if (dist === null) return;
    isDragging.current = true;
    wasSignificantDrag.current = false;
    dragStartPxRef.current = e.clientX;
    dragStartRef.current = dist;
    dragEndRef.current = dist;
    setDragPreview(null);
  };

  const onMouseLeave = () => {
    setTooltip(null);
    setHoverByDistance(null);
    if (!isDragging.current) setDragPreview(null);
  };

  const onChartClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (wasSignificantDrag.current) return;
    const dist = clientXToDist(e.clientX);
    if (dist === null) return;
    setClickedChartPointDist(dist);
    setSelectedPointIdx(null);
  };

  return {
    tooltip,
    setTooltip,
    dragPreview,
    setDragPreview,
    shouldCenterRef,
    isResizing,
    onMouseMove,
    onMouseDown,
    onMouseLeave,
    onChartClick,
  };
}
