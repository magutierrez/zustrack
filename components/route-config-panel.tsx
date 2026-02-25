'use client';

import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { GPXUpload } from '@/components/gpx-upload';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, RotateCcw } from 'lucide-react';
import type { GPXData } from '@/lib/types';
import { calculateIBP, getIBPDifficulty, cn, formatDistance, formatElevation } from '@/lib/utils';
import { useSettings } from '@/hooks/use-settings';

interface RouteConfigPanelProps {
  gpxData: GPXData | null;
  onGPXLoaded: (content: string, fileName: string) => void;
  gpxFileName: string | null;
  onClearGPX: () => void;
  onReverseRoute: () => void;
  activityType?: 'cycling' | 'walking';
}

const difficultyColors: Record<string, string> = {
  veryEasy: 'bg-emerald-500 hover:bg-emerald-600 text-white border-transparent',
  easy: 'bg-green-500 hover:bg-green-600 text-white border-transparent',
  moderate: 'bg-amber-500 hover:bg-amber-600 text-white border-transparent',
  hard: 'bg-orange-600 hover:bg-orange-700 text-white border-transparent',
  veryHard: 'bg-red-600 hover:bg-red-700 text-white border-transparent',
  extreme: 'bg-purple-900 hover:bg-purple-900 text-white border-transparent',
};

export function RouteConfigPanel({
  gpxData,
  onGPXLoaded,
  gpxFileName,
  onClearGPX,
  onReverseRoute,
  activityType = 'cycling',
}: RouteConfigPanelProps) {
  const t = useTranslations('RouteConfigPanel');
  const tibp = useTranslations('IBP');
  const { unitSystem } = useSettings();

  const ibpIndex = gpxData
    ? calculateIBP(gpxData.totalDistance, gpxData.totalElevationGain, activityType, gpxData.totalElevationLoss)
    : 0;
  const difficulty = getIBPDifficulty(ibpIndex, activityType);

  return (
    <div className="flex flex-col gap-5">
      {/* GPX Upload */}
      <div className="mb-2 flex items-center justify-between">
        <Label className="text-muted-foreground block text-xs font-semibold tracking-wider uppercase">
          {t('gpxFile')}
        </Label>
        {gpxData && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary h-7 gap-1.5 px-2 text-[10px]"
            onClick={onReverseRoute}
          >
            <span className="rotate-90">
              <RotateCcw />
            </span>{' '}
            {t('reverseRoute')}
          </Button>
        )}
      </div>
      <div>
        <GPXUpload onFileLoaded={onGPXLoaded} fileName={gpxFileName} onClear={onClearGPX} />
      </div>

      {/* Route Stats */}
      {gpxData && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-secondary rounded-lg p-3 text-center">
              <p className="text-foreground font-mono text-lg font-bold">
                {formatDistance(gpxData.totalDistance, unitSystem).split(' ')[0]}
              </p>
              <p className="text-muted-foreground text-xs">
                {formatDistance(gpxData.totalDistance, unitSystem).split(' ')[1]}
              </p>
            </div>
            <div className="bg-secondary rounded-lg p-3 text-center">
              <p className="text-primary font-mono text-lg font-bold">
                +{formatElevation(gpxData.totalElevationGain, unitSystem).split(' ')[0]}
              </p>
              <p className="text-muted-foreground text-xs">
                {formatElevation(gpxData.totalElevationGain, unitSystem).split(' ')[1]}
              </p>
            </div>
            <div className="bg-secondary rounded-lg p-3 text-center">
              <p className="text-destructive font-mono text-lg font-bold">
                -{formatElevation(gpxData.totalElevationLoss, unitSystem).split(' ')[0]}
              </p>
              <p className="text-muted-foreground text-xs">
                {formatElevation(gpxData.totalElevationLoss, unitSystem).split(' ')[1]}
              </p>
            </div>
          </div>

          <div className="bg-secondary/50 flex items-center justify-between rounded-lg px-3 py-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                  {tibp('title')}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="text-muted-foreground/50 hover:text-muted-foreground h-3 w-3 transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="max-w-[200px] text-[11px] leading-relaxed"
                    >
                      {tibp('description')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-foreground font-mono text-lg font-bold">{ibpIndex}</span>
            </div>
            <Badge
              className={cn(
                'px-3 py-1 text-[10px] tracking-wider uppercase',
                difficultyColors[difficulty],
              )}
            >
              {tibp(`difficulty.${difficulty}`)}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
