'use client';

import { TrendingUp, RefreshCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { formatElevation, formatDistance } from '@/lib/utils';

interface ElevationHeaderProps {
  distance: number;
  unitSystem: 'metric' | 'imperial';
  isMobile: boolean;
  zoomRange: { start: number; end: number } | null;
  resetZoom: () => void;
  selectedPoint: { ele?: number } | null;
}

export function ElevationHeader({
  distance,
  unitSystem,
  isMobile,
  zoomRange,
  resetZoom,
  selectedPoint,
}: ElevationHeaderProps) {
  const t = useTranslations('WeatherTimeline');

  return (
    <div className="mb-4 flex items-center justify-between md:mb-6">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="bg-primary/10 rounded-lg p-1.5 md:p-2">
          <TrendingUp className="text-primary size-3.5 md:h-4 md:w-4" />
        </div>
        <div>
          <h3 className="text-foreground text-xs leading-none font-semibold md:text-sm">
            {t('elevationTitle')}
          </h3>
          {!isMobile && (
            <p className="text-muted-foreground mt-1 text-[10px] font-semibold tracking-wider uppercase">
              {formatDistance(distance, unitSystem)}
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
            <RefreshCcw className="size-2.5 md:h-3 md:w-3" />
            {t('chart.resetZoom')}
          </Button>
        )}
      </div>
      {selectedPoint && (
        <div className="bg-secondary/50 border-border/50 flex items-center gap-1.5 rounded-full border px-2 py-1 shadow-inner md:gap-2 md:px-3 md:py-1.5">
          <div className="bg-primary size-1.5 animate-pulse rounded-full shadow-sm md:h-2 md:w-2" />
          <span className="text-foreground font-mono text-[10px] font-black md:text-xs">
            {formatElevation(selectedPoint.ele || 0, unitSystem)}
          </span>
        </div>
      )}
    </div>
  );
}
