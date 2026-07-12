'use client';

import { useTranslations } from 'next-intl';
import { formatElevation, formatDistance } from '@/lib/utils';
import { UnitSystem } from '@/hooks/use-settings';

export type TooltipState = {
  svgX: number;
  svgY: number;
  dist: number;
  ele: number;
  slope: number;
  color: string;
};

interface ElevationTooltipProps {
  tooltip: TooltipState | null;
  isMobile: boolean;
  unitSystem: UnitSystem;
  vpWidth: number;
  marginLeft: number;
  scrollLeft: number;
}

export function ElevationTooltip({
  tooltip,
  isMobile,
  unitSystem,
  vpWidth,
  marginLeft,
  scrollLeft,
}: ElevationTooltipProps) {
  const t = useTranslations('WeatherTimeline');

  if (!tooltip) return null;

  // Tooltip viewport X accounts for scroll offset so it stays visible
  const tooltipVpX = isFinite(tooltip.svgX) ? tooltip.svgX + marginLeft - scrollLeft : 0;
  const tooltipOnRight = tooltipVpX < vpWidth / 2;

  if (isMobile) {
    return (
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
            <div className="size-1.5 rounded-full" style={{ backgroundColor: tooltip.color }} />
            <span className="text-foreground font-mono text-[9px] font-black">
              {tooltip.slope}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none absolute top-1 z-10"
      style={
        tooltipOnRight
          ? { left: Math.max(0, tooltipVpX + 12) }
          : { right: Math.max(0, vpWidth - tooltipVpX + 12) }
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
              className="size-1.5 rounded-full shadow-sm md:h-2 md:w-2"
              style={{ backgroundColor: tooltip.color }}
            />
            <span className="text-foreground font-mono text-[10px] font-black md:text-xs">
              {tooltip.slope}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
