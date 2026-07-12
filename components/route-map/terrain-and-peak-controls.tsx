'use client';

import { Loader2, Mountain, MountainSnow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MapRef } from 'react-map-gl/maplibre';
import { RefObject } from 'react';

interface TerrainAndPeakControlsProps {
  show3DTerrain: boolean;
  setShow3DTerrain: (show: boolean) => void;
  terrainLoading: boolean;
  terrainJustLoaded: boolean;
  activityType?: string;
  showMountainPeaks: boolean;
  setShowMountainPeaks: (show: boolean) => void;
  mountainPeaksLoading: boolean;
  mapRef: RefObject<MapRef | null>;
  tMap: (key: string) => string;
}

export function TerrainAndPeakControls({
  show3DTerrain,
  setShow3DTerrain,
  terrainLoading,
  terrainJustLoaded,
  activityType,
  showMountainPeaks,
  setShowMountainPeaks,
  mountainPeaksLoading,
  mapRef,
  tMap,
}: TerrainAndPeakControlsProps) {
  return (
    <div className="absolute top-[calc(3.5rem+2.75rem+0.25rem)] right-3 z-10 flex flex-col gap-1 lg:top-[calc(3rem+2.75rem+0.25rem)]">
      <Button
        variant={show3DTerrain ? 'default' : 'secondary'}
        size="icon"
        className="size-10 shadow-md"
        disabled={terrainLoading}
        onClick={() => {
          const next = !show3DTerrain;
          setShow3DTerrain(next);
          mapRef.current?.getMap()?.easeTo({ pitch: next ? 60 : 0, duration: 800 });
        }}
        aria-label={tMap(show3DTerrain ? 'terrain3DHide' : 'terrain3DShow')}
        title={tMap(show3DTerrain ? 'terrain3DHide' : 'terrain3DShow')}
      >
        {terrainLoading ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <MountainSnow
            className={cn(
              'size-5',
              terrainJustLoaded && 'animate-[pop-in_0.4s_cubic-bezier(0.16,1,0.3,1)_both]',
            )}
          />
        )}
      </Button>

      {activityType === 'walking' && (
        <Button
          variant={showMountainPeaks && !mountainPeaksLoading ? 'default' : 'secondary'}
          size="icon"
          className="size-10 shadow-md"
          onClick={() => setShowMountainPeaks(!showMountainPeaks)}
          disabled={mountainPeaksLoading}
          aria-label={tMap(showMountainPeaks ? 'mountainPeaksHide' : 'mountainPeaksShow')}
          title={tMap(showMountainPeaks ? 'mountainPeaksHide' : 'mountainPeaksShow')}
        >
          {mountainPeaksLoading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Mountain className="size-5" />
          )}
        </Button>
      )}
    </div>
  );
}
