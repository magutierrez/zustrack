'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ExternalLink } from 'lucide-react';
import { useRouteStore } from '@/store/route-store';
import { useSettings } from '@/hooks/use-settings';
import { calculateIBP, getIBPDifficulty, formatDistance, formatElevation } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function RouteSummary() {
  const t = useTranslations('RouteConfigPanel');
  const tibp = useTranslations('IBP');
  const { unitSystem } = useSettings();

  const gpxData = useRouteStore((s) => s.gpxData);
  const recalculatedTotalDistance = useRouteStore((s) => s.recalculatedTotalDistance);
  const recalculatedElevationGain = useRouteStore((s) => s.recalculatedElevationGain);
  const recalculatedElevationLoss = useRouteStore((s) => s.recalculatedElevationLoss);
  const fetchedActivityType = useRouteStore((s) => s.fetchedActivityType);
  const error = useRouteStore((s) => s.error);

  const activityType = fetchedActivityType || 'cycling';

  // IBP calculation for route summary
  const ibpIndex = gpxData
    ? calculateIBP(recalculatedTotalDistance, recalculatedElevationGain, activityType, recalculatedElevationLoss)
    : 0;
  const difficulty = getIBPDifficulty(ibpIndex, activityType);

  const startPoint = useMemo(() => gpxData?.points[0] ?? null, [gpxData]);
  const endPoint = useMemo(
    () => (gpxData ? gpxData.points[gpxData.points.length - 1] : null),
    [gpxData],
  );

  const mapsUrl = (lat: number, lon: number) =>
    `https://www.google.com/maps?q=${lat.toFixed(6)},${lon.toFixed(6)}`;

  const getDifficultyBadgeVariant = (
    difficultyLevel: 'veryEasy' | 'easy' | 'moderate' | 'hard' | 'veryHard' | 'extreme',
  ) => {
    switch (difficultyLevel) {
      case 'veryEasy':
      case 'easy':
        return 'outline';
      case 'moderate':
        return 'secondary';
      case 'hard':
        return 'destructive';
      case 'veryHard':
      case 'extreme':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <div className="border-border bg-card rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <Label className="text-muted-foreground block text-xs font-semibold tracking-wider uppercase">
          {t('routeSummary')}
        </Label>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="bg-secondary rounded-lg p-3 text-center">
          <p className="text-muted-foreground mb-1 text-[8px] font-black tracking-widest uppercase">
            {t('distance')}
          </p>
          <p className="text-foreground font-mono text-lg font-bold">
            {formatDistance(recalculatedTotalDistance, unitSystem).split(' ')[0]}
          </p>
          <p className="text-muted-foreground text-xs">
            {formatDistance(recalculatedTotalDistance, unitSystem).split(' ')[1]}
          </p>
        </div>
        <div className="bg-secondary rounded-lg p-3 text-center">
          <p className="text-muted-foreground mb-1 text-[8px] font-black tracking-widest uppercase">
            {t('positiveElevation')}
          </p>
          <p className="text-primary font-mono text-lg font-bold">
            +{formatElevation(recalculatedElevationGain, unitSystem).split(' ')[0]}
          </p>
          <p className="text-muted-foreground text-xs">
            {formatElevation(recalculatedElevationGain, unitSystem).split(' ')[1]}
          </p>
        </div>
        <div className="bg-secondary rounded-lg p-3 text-center">
          <p className="text-muted-foreground mb-1 text-[8px] font-black tracking-widest uppercase">
            {t('negativeElevation')}
          </p>
          <p className="text-destructive font-mono text-lg font-bold">
            -{formatElevation(recalculatedElevationLoss, unitSystem).split(' ')[0]}
          </p>
          <p className="text-muted-foreground text-xs">
            {formatElevation(recalculatedElevationLoss, unitSystem).split(' ')[1]}
          </p>
        </div>
        <div className="bg-secondary group relative flex flex-col items-center justify-center rounded-lg p-3 text-center">
          <p className="text-muted-foreground mb-1 text-[8px] font-black tracking-widest uppercase">
            {t('difficulty')}
          </p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <p className="text-primary font-mono text-lg font-bold">{ibpIndex}</p>
                  <Badge
                    variant={getDifficultyBadgeVariant(difficulty)}
                    className="h-4 px-1 text-[8px] font-bold uppercase"
                  >
                    {tibp(`difficulty.${difficulty}`)}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                <p className="font-bold">{tibp('title')}</p>
                <p>{tibp('description')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {startPoint && endPoint && (
        <div className="mt-3 flex flex-col gap-2 lg:flex-row">
          <a
            href={mapsUrl(startPoint.lat, startPoint.lon)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-1 items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/20"
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white shadow-sm">
              A
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-[8px] font-bold tracking-wider uppercase">
                {t('startPoint')}
              </p>
              <p className="text-foreground truncate font-mono text-[10px] font-semibold">
                {startPoint.lat.toFixed(4)}, {startPoint.lon.toFixed(4)}
              </p>
            </div>
            <ExternalLink className="h-3 w-3 shrink-0 text-emerald-600 opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
          <a
            href={mapsUrl(endPoint.lat, endPoint.lon)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-1 items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 transition-colors hover:border-rose-500/40 hover:bg-rose-500/20"
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-sm">
              B
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-[8px] font-bold tracking-wider uppercase">
                {t('endPoint')}
              </p>
              <p className="text-foreground truncate font-mono text-[10px] font-semibold">
                {endPoint.lat.toFixed(4)}, {endPoint.lon.toFixed(4)}
              </p>
            </div>
            <ExternalLink className="h-3 w-3 shrink-0 text-rose-600 opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
        </div>
      )}

      {error && (
        <div className="border-destructive/30 bg-destructive/10 mt-4 rounded-lg border p-3">
          <p className="text-destructive text-xs">{error}</p>
        </div>
      )}
    </div>
  );
}
