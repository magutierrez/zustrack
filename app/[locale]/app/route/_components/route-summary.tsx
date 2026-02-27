'use client';

import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ExternalLink, Pencil, Check, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useRouteStore } from '@/store/route-store';
import { useSettings } from '@/hooks/use-settings';
import { useSavedRoutes } from '@/hooks/use-saved-routes';
import { calculateIBP, getIBPDifficulty, formatDistance, formatElevation } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function stripGpxExtension(name: string): string {
  return name.endsWith('.gpx') ? name.slice(0, -4) : name;
}

export function RouteSummary() {
  const t = useTranslations('RouteConfigPanel');
  const tibp = useTranslations('IBP');
  const { unitSystem } = useSettings();
  const searchParams = useSearchParams();
  const routeId = searchParams.get('routeId');

  const gpxData = useRouteStore((s) => s.gpxData);
  const recalculatedTotalDistance = useRouteStore((s) => s.recalculatedTotalDistance);
  const recalculatedElevationGain = useRouteStore((s) => s.recalculatedElevationGain);
  const recalculatedElevationLoss = useRouteStore((s) => s.recalculatedElevationLoss);
  const fetchedActivityType = useRouteStore((s) => s.fetchedActivityType);
  const error = useRouteStore((s) => s.error);
  const { setGpxData, setGpxFileName } = useRouteStore();

  const { updateRouteName } = useSavedRoutes();

  const activityType = fetchedActivityType || 'cycling';

  const currentName = stripGpxExtension(gpxData?.name ?? '');

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(currentName);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep editValue in sync if gpxData.name changes from outside
  useEffect(() => {
    if (!isEditing) setEditValue(currentName);
  }, [currentName, isEditing]);

  const startEditing = useCallback(() => {
    setEditValue(currentName);
    setIsEditing(true);
    // Focus next tick so the input is rendered
    setTimeout(() => inputRef.current?.select(), 0);
  }, [currentName]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditValue(currentName);
  }, [currentName]);

  const commitName = useCallback(async () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === currentName) {
      cancelEditing();
      return;
    }

    // Update the Zustand store
    if (gpxData) {
      setGpxData({ ...gpxData, name: trimmed });
      setGpxFileName(trimmed);
    }

    // Update Dexie only when viewing a saved route (not a shared hash route)
    if (routeId) {
      await updateRouteName(routeId, trimmed);
    }

    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [editValue, currentName, gpxData, routeId, setGpxData, setGpxFileName, updateRouteName, cancelEditing]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') commitName();
      if (e.key === 'Escape') cancelEditing();
    },
    [commitName, cancelEditing],
  );

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
      <div className="mb-3 flex items-center justify-between gap-2">
        <Label className="text-muted-foreground block text-xs font-semibold tracking-wider uppercase shrink-0">
          {t('routeSummary')}
        </Label>

        {/* Editable route name */}
        {gpxData && (
          <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
            {isEditing ? (
              <>
                <input
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={commitName}
                  placeholder={t('routeNamePlaceholder')}
                  className="border-border bg-background text-foreground min-w-0 flex-1 truncate rounded border px-2 py-0.5 text-right text-sm font-medium focus:outline-none focus:ring-1 focus:ring-ring"
                  maxLength={80}
                  autoFocus
                />
                <button
                  onClick={commitName}
                  className="text-primary hover:text-primary/80 shrink-0"
                  aria-label={t('editRouteName')}
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={cancelEditing}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                  aria-label="Cancel"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <button
                onClick={startEditing}
                className="group flex min-w-0 items-center gap-1 rounded px-1 py-0.5 transition-colors hover:bg-secondary"
                aria-label={t('editRouteName')}
                title={t('editRouteName')}
              >
                <span className="text-foreground min-w-0 truncate text-right text-sm font-medium">
                  {saved ? (
                    <span className="text-primary text-xs">{t('routeNameSaved')}</span>
                  ) : (
                    currentName
                  )}
                </span>
                <Pencil className="text-muted-foreground h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
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
