'use client';

import { Map as MapIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MapPopupInfo } from '@/lib/types';

interface StreetViewSectionProps {
  popupInfo: MapPopupInfo;
  onBack: () => void;
  onClose: () => void;
  t: (key: string) => string;
}

export function StreetViewSection({ popupInfo, onBack, onClose, t }: StreetViewSectionProps) {
  return (
    <div className="bg-background animate-in fade-in absolute inset-0 z-[170] flex flex-col duration-200">
      <div className="border-border bg-card flex items-center justify-between border-b px-4 py-3 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 font-bold tracking-wider uppercase"
            onClick={onBack}
          >
            <MapIcon className="size-4" />
            {t('backToMap')}
          </Button>
          <div className="bg-border h-6 w-px" aria-hidden="true" />
          <div className="text-muted-foreground flex items-center gap-4 text-xs font-medium tracking-wider uppercase">
            <span className="flex items-center gap-1">
              <span className="text-foreground font-bold">
                {popupInfo.point.distanceFromStart.toFixed(1)}
              </span>{' '}
              km
            </span>
            <span className="flex items-center gap-1">
              <span className="text-foreground font-bold">
                {Math.round(popupInfo.point.ele || 0)}
              </span>{' '}
              m
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-destructive/10 hover:text-destructive size-9 rounded-full transition-colors"
          onClick={onClose}
          aria-label={t('close')}
        >
          <X className="size-5" />
        </Button>
      </div>
      <div className="bg-muted relative flex-1">
        <iframe
          src={`https://www.google.com/maps?layer=c&cbll=${popupInfo.point.lat},${popupInfo.point.lon}&cbp=12,${popupInfo.bearing || 0},0,0,0&output=svembed`}
          className="h-full w-full border-0"
          allowFullScreen
          loading="lazy"
          title="Street View"
        />
      </div>
    </div>
  );
}
