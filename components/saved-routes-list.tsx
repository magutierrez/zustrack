'use client';

import { useSavedRoutes, SavedRoute } from '@/hooks/use-saved-routes';
import {
  MapPin,
  Trash2,
  Calendar,
  Route,
  Pencil,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Bike,
  Footprints,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { parseGPX, sampleRoutePoints } from '@/lib/gpx-parser';

interface SavedRoutesListProps {
  onLoadRoute: (content: string, fileName: string, id?: string) => void;
  selectedRouteId?: string | null;
}

export function SavedRoutesList({ onLoadRoute, selectedRouteId }: SavedRoutesListProps) {
  const t = useTranslations('SetupPage');
  const { routes, isLoading, deleteRoute, updateRouteName } = useSavedRoutes();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const stripExtension = (name: string) => name.replace(/\.gpx$/i, '');

  const handleStartEdit = (e: React.MouseEvent, route: SavedRoute) => {
    e.stopPropagation();
    setEditingId(route.id);
    setEditName(stripExtension(route.name));
  };

  const handleSaveEdit = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editName.trim()) {
      await updateRouteName(id, `${editName.trim()}.gpx`);
    }
    setEditingId(null);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  if (isLoading)
    return (
      <div className="text-muted-foreground animate-pulse p-4 text-center text-xs">
        {t('loading')}
      </div>
    );
  if (routes.length === 0) {
    return (
      <div className="bg-secondary/20 border-border flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <Route className="text-muted-foreground mb-3 h-8 w-8 opacity-20" />
        <p className="text-muted-foreground text-xs">{t('noSavedRoutes')}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <Route className="text-primary h-4 w-4" />
        <h3 className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
          {t('title')}
        </h3>
      </div>

      <ScrollArea className="h-[350px]">
        <div className="flex w-full flex-col gap-2 pr-4">
          {routes.map((route) => (
            <div
              key={route.id}
              className={cn(
                'group border-border relative flex min-w-0 flex-col rounded-lg border p-3 transition-all',
                selectedRouteId === route.id
                  ? 'border-primary bg-primary/10 ring-primary/20 ring-2'
                  : 'bg-secondary/30 hover:border-primary/30 hover:bg-secondary/50',
              )}
            >
              {editingId === route.id ? (
                <div
                  className="flex w-full min-w-0 items-start gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="border-primary/50 bg-background h-8 min-w-0 flex-1 text-xs focus-visible:ring-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(e as any, route.id);
                      if (e.key === 'Escape') handleCancelEdit(e as any);
                    }}
                  />
                  <div className="flex shrink-0 items-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-primary hover:bg-primary/10 h-8 w-8"
                      onClick={(e) => handleSaveEdit(e, route.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:bg-muted h-8 w-8"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex w-full items-start justify-between gap-3">
                  <button
                    className="block min-w-0 flex-1 text-left"
                    onClick={() => onLoadRoute(route.gpx_content, route.name, route.id)}
                  >
                    <div className="flex items-start gap-2">
                      <p className="text-foreground text-sm leading-tight font-semibold break-words whitespace-normal">
                        {stripExtension(route.name)}
                      </p>
                      {selectedRouteId === route.id && (
                        <Check className="text-primary mt-0.5 h-3.5 w-3.5 shrink-0" />
                      )}
                    </div>
                    <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-medium tracking-wider uppercase">
                      <span className="flex shrink-0 items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {Number(route.distance).toFixed(1)} km
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        <ArrowUp className="h-3 w-3 text-emerald-500" />
                        {Math.round(route.elevation_gain)}m
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        <ArrowDown className="h-3 w-3 text-rose-500" />
                        {Math.round(route.elevation_loss || 0)}m
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        {route.activity_type === 'walking' ? (
                          <Footprints className="h-3 w-3" />
                        ) : (
                          <Bike className="h-3 w-3" />
                        )}
                        {route.activity_type === 'walking' ? 'Hiking' : 'Bicicleta'}
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(route.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </button>

                  <div className="flex shrink-0 items-center gap-3">
                    {(() => {
                      try {
                        let points = route.elevation_points;
                        if (!points || points.length === 0) {
                          const parsed = parseGPX(route.gpx_content);
                          points = sampleRoutePoints(parsed.points, 30).map((p) => p.ele || 0);
                        }
                        if (points.length < 2) return null;

                        const min = Math.min(...points);
                        const max = Math.max(...points);
                        const range = max - min || 1;
                        const pathData = points
                          .map((p, i) => {
                            const x = (i / (points.length - 1)) * 64;
                            const y = 30 - ((p - min) / range) * 28; // Leave a 2px margin
                            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                          })
                          .join(' ');

                        return (
                          <div className="h-8 w-16 shrink-0 overflow-visible opacity-60 transition-opacity group-hover:opacity-100">
                            <svg
                              width="64"
                              height="32"
                              viewBox="0 0 64 32"
                              className="text-primary"
                              preserveAspectRatio="none"
                            >
                              <path
                                d={pathData}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        );
                      } catch (e) {
                        return null;
                      }
                    })()}
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:bg-primary/5 hover:text-primary h-8 w-8 transition-colors"
                        onClick={(e) => handleStartEdit(e, route)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:bg-destructive/5 hover:text-destructive h-8 w-8 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRoute(route.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
