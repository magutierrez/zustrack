'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSettings } from '@/hooks/use-settings';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatElevation, formatDistance } from '@/lib/utils';
import { useElevationChart } from '@/hooks/use-elevation-chart';
import { useRouteStore } from '@/store/route-store';
import { ElevationHeader } from './elevation-profile/elevation-header';
import { ElevationTooltip } from './elevation-profile/elevation-tooltip';
import { ElevationSvg } from './elevation-profile/elevation-svg';
import { useElevationData } from './elevation-profile/use-elevation-data';
import { useElevationInteractions } from './elevation-profile/use-elevation-interactions';

const MARGIN = { top: 8, right: 16, bottom: 28, left: 52 };
const MARGIN_MOBILE = { top: 4, right: 4, bottom: 0, left: 0 };
const MAX_ZOOM = 3;

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

  const setSelectedPointIdx = useRouteStore((s) => s.setSelectedPointIndex);
  const setClickedChartPointDist = useRouteStore((s) => s.setClickedChartPointDist);

  // ── Refs & state ──────────────────────────────────────────────────────
  const outerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [vpSize, setVpSize] = useState({ w: 0, h: 0 });
  const [scrollLeft, setScrollLeft] = useState(0);

  // ── ResizeObserver ──────────────────────────────────────────────────
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

  // ── Zoom & dimensions ─────────────────────────────────────────────────
  const margin = isMobile ? MARGIN_MOBILE : MARGIN;

  const totalDist = useMemo(
    () => (chartData.length ? chartData[chartData.length - 1].distance - chartData[0].distance : 0),
    [chartData],
  );

  const zoomFactor = useMemo(() => {
    if (!zoomRange || totalDist === 0) return 1;
    const selW = zoomRange.end - zoomRange.start;
    const padded = selW * 1.6;
    return Math.min(MAX_ZOOM, totalDist / padded);
  }, [zoomRange, totalDist]);

  const chartWidth = vpSize.w > 0 ? Math.round(vpSize.w * zoomFactor) : 0;
  const innerW = Math.max(0, chartWidth - margin.left - margin.right);
  const innerH = Math.max(0, vpSize.h - margin.top - margin.bottom);

  const {
    xScale,
    yScale,
    colorSegmentPaths,
    linePath,
    gradientStops,
    xTicks,
    yTicks,
  } = useElevationData({
    chartData,
    innerW,
    innerH,
    unitSystem,
    totalDist,
  });

  const {
    tooltip,
    dragPreview,
    setDragPreview,
    shouldCenterRef,
    isResizing,
    onMouseMove,
    onMouseDown,
    onMouseLeave,
    onChartClick,
  } = useElevationInteractions({
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
  });

  // Auto-center on selection after a completed drag
  useEffect(() => {
    if (
      !zoomRange ||
      !shouldCenterRef.current ||
      !scrollRef.current ||
      chartWidth === 0 ||
      vpSize.w === 0 ||
      !chartData.length
    )
      return;
    shouldCenterRef.current = false;
    const firstDist = chartData[0].distance;
    const localTotal = chartData[chartData.length - 1].distance - firstDist;
    if (localTotal === 0) return;
    const centerDist = (zoomRange.start + zoomRange.end) / 2;
    const ratio = (centerDist - firstDist) / localTotal;
    const targetScroll = Math.max(0, ratio * chartWidth - vpSize.w / 2);
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = targetScroll;
        setScrollLeft(targetScroll);
      }
    });
  }, [zoomRange, chartWidth, chartData, vpSize.w, shouldCenterRef]);

  // ── Derived coords for SVG ───────────────────────────────────────────
  const selLeft = zoomRange && xScale ? xScale(zoomRange.start) : null;
  const selRight = zoomRange && xScale ? xScale(zoomRange.end) : null;
  const dragPxStart = dragPreview && xScale ? xScale(dragPreview.start) : null;
  const dragPxWidth = dragPreview && xScale ? xScale(dragPreview.end) - xScale(dragPreview.start) : null;
  const refLineX = selectedPoint && xScale && !zoomRange ? xScale(selectedPoint.distanceFromStart) : null;

  return (
    <div className="border-border bg-card rounded-xl border p-4 shadow-sm select-none md:p-6">
      <ElevationHeader
        distance={visibleStats.distance}
        unitSystem={unitSystem}
        isMobile={isMobile}
        zoomRange={zoomRange}
        resetZoom={resetZoom}
        selectedPoint={selectedPoint}
      />

      <div ref={outerRef} className={`relative mb-4 w-full md:mb-6 ${isMobile ? 'h-32' : 'h-56'}`}>
        <ElevationTooltip
          tooltip={tooltip}
          isMobile={isMobile}
          unitSystem={unitSystem}
          vpWidth={vpSize.w}
          marginLeft={margin.left}
          scrollLeft={scrollLeft}
        />

        <div
          ref={scrollRef}
          className="h-full w-full overflow-x-auto"
          style={{ scrollbarWidth: zoomFactor > 1 ? 'thin' : 'none' }}
          onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
        >
          <div
            className="h-full cursor-crosshair"
            style={{ width: chartWidth > 0 ? `${chartWidth}px` : '100%', minWidth: '100%' }}
          >
            {innerW > 0 && innerH > 0 ? (
              <ElevationSvg
                svgRef={svgRef}
                innerW={innerW}
                innerH={innerH}
                margin={margin}
                isMobile={isMobile}
                gradientStops={gradientStops}
                yTicks={yTicks}
                xTicks={xTicks}
                colorSegmentPaths={colorSegmentPaths}
                linePath={linePath}
                refLineX={refLineX}
                dragPxStart={dragPxStart}
                dragPxWidth={dragPxWidth}
                selLeft={selLeft}
                selRight={selRight}
                tooltip={tooltip}
                onMouseMove={onMouseMove}
                onMouseDown={onMouseDown}
                onMouseLeave={onMouseLeave}
                onChartClick={onChartClick}
                resetZoom={resetZoom}
                setDragPreview={setDragPreview}
                setIsResizing={(type) => (isResizing.current = type)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <div className="size-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-700 dark:border-t-zinc-400" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-border/50 mt-2 grid grid-cols-2 gap-3 border-t pt-4 md:gap-4">
        <div className="bg-secondary/20 border-border/30 flex items-center gap-2 rounded-lg border px-1.5 py-1 md:gap-3 md:px-2 md:py-1.5">
          <div className="rounded-md bg-emerald-500/10 p-1 md:p-1.5">
            <ArrowUp className="size-3 text-emerald-600 md:h-3.5 md:w-3.5" />
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5 text-[8px] leading-none font-black tracking-widest uppercase md:mb-1 md:text-[9px]">
              {zoomRange !== null ? t('chart.ascent') : t('chart.highestPoint')}
            </p>
            <p className="text-foreground text-xs leading-none font-black md:text-sm">
              {zoomRange !== null ? '+' : ''}
              {formatElevation(zoomRange !== null ? visibleStats.gain : visibleStats.max, unitSystem)}
            </p>
          </div>
        </div>
        <div className="bg-secondary/20 border-border/30 flex items-center gap-2 rounded-lg border px-1.5 py-1 md:gap-3 md:px-2 md:py-1.5">
          <div className="rounded-md bg-rose-500/10 p-1 md:p-1.5">
            <ArrowDown className="size-3 text-rose-600 md:h-3.5 md:w-3.5" />
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5 text-[8px] leading-none font-black tracking-widest uppercase md:mb-1 md:text-[9px]">
              {zoomRange !== null ? t('chart.descent') : t('chart.lowestPoint')}
            </p>
            <p className="text-foreground text-xs leading-none font-black md:text-sm">
              {zoomRange !== null ? '-' : ''}
              {formatElevation(zoomRange !== null ? visibleStats.loss : visibleStats.min, unitSystem)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

