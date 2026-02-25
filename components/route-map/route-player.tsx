'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Source, Layer } from 'react-map-gl/maplibre';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslations } from 'next-intl';
import type { RoutePoint } from '@/lib/types';

interface RoutePlayerProps {
  points: RoutePoint[];
  onStop: () => void;
  map: any;
}

export function RoutePlayer({ points, onStop, map }: RoutePlayerProps) {
  const t = useTranslations('RouteMap.player');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);

  const currentIndexRef = useRef(0);
  const currentBearingRef = useRef<number | null>(null);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lastUiUpdateRef = useRef<number>(0);

  const updateMapCamera = useCallback(
    (fractionalIdx: number, forceUiUpdate = false) => {
      const mapInstance = map?.getMap();
      if (!mapInstance || points.length < 2) return;

      const idx = Math.floor(fractionalIdx);
      const nextIdx = Math.min(idx + 1, points.length - 1);
      const ratio = fractionalIdx - idx;

      const p1 = points[idx];
      const p2 = points[nextIdx];

      // 1. Precise Position Interpolation
      const interpolatedLat = p1.lat + (p2.lat - p1.lat) * ratio;
      const interpolatedLon = p1.lon + (p2.lon - p1.lon) * ratio;

      // 2. Update Dynamic Marker Layer (Bypass React for 60fps)
      const source = mapInstance.getSource('player-position');
      if (source) {
        source.setData({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [interpolatedLon, interpolatedLat] },
          properties: {},
        });
      }

      // 3. Smooth Cinematic Bearing
      const lookAheadPoints = Math.max(10, Math.floor(20 / speed));
      const targetIdx = Math.min(idx + lookAheadPoints, points.length - 1);
      const targetPoint = points[targetIdx];
      const targetBearing = calculateBearing(
        interpolatedLat,
        interpolatedLon,
        targetPoint.lat,
        targetPoint.lon,
      );

      if (currentBearingRef.current === null) {
        currentBearingRef.current = targetBearing;
      } else {
        let diff = targetBearing - currentBearingRef.current;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        currentBearingRef.current += diff * 0.1;
        currentBearingRef.current = (currentBearingRef.current + 360) % 360;
      }

      // 4. Frame-Perfect Camera Positioning
      mapInstance.jumpTo({
        center: [interpolatedLon, interpolatedLat],
        bearing: currentBearingRef.current,
        pitch: 60,
        zoom: 16.5,
      });

      const now = Date.now();
      if (forceUiUpdate || now - lastUiUpdateRef.current > 66) {
        setProgress((idx / (points.length - 1)) * 100);
        lastUiUpdateRef.current = now;
      }
    },
    [map, points, speed],
  );

  const animate = useCallback(
    (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const deltaTime = time - lastTimeRef.current;

      const increment = (speed * deltaTime) / 300;
      currentIndexRef.current += increment;

      if (currentIndexRef.current >= points.length - 1) {
        currentIndexRef.current = points.length - 1;
        updateMapCamera(currentIndexRef.current, true);
        setIsPlaying(false);
        return;
      }

      updateMapCamera(currentIndexRef.current);

      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    },
    [points, speed, updateMapCamera],
  );

  const startPlayback = () => {
    if (currentIndexRef.current >= points.length - 1) {
      currentIndexRef.current = 0;
      currentBearingRef.current = null;
    }
    setIsPlaying(true);
    lastTimeRef.current = 0;
    requestRef.current = requestAnimationFrame(animate);
  };

  const pausePlayback = () => {
    setIsPlaying(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  const stopPlayback = () => {
    pausePlayback();
    currentIndexRef.current = 0;
    currentBearingRef.current = null;
    updateMapCamera(0, true);
    onStop();
  };

  const handleSeek = (value: number[]) => {
    const newProgress = value[0];
    const newIndex = Math.floor((newProgress / 100) * (points.length - 1));
    currentIndexRef.current = newIndex;
    currentBearingRef.current = null;
    updateMapCamera(newIndex, true);
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <>
      <Source
        id="player-position"
        type="geojson"
        data={{
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [0, 0] },
          properties: {},
        }}
      >
        <Layer
          id="player-marker-glow"
          type="circle"
          paint={{
            'circle-radius': 12,
            'circle-color': '#3b82f6',
            'circle-opacity': 0.3,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          }}
        />
        <Layer
          id="player-marker-core"
          type="circle"
          paint={{
            'circle-radius': 6,
            'circle-color': '#ffffff',
            'circle-stroke-width': 3,
            'circle-stroke-color': '#3b82f6',
          }}
        />
      </Source>

      <div className="animate-in fade-in slide-in-from-bottom-4 absolute bottom-20 left-1/2 z-20 w-[95%] max-w-lg -translate-x-1/2">
        <div className="bg-background/95 border-border rounded-2xl border p-4 shadow-2xl backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="bg-primary h-2 w-2 animate-pulse rounded-full" />
              <h4 className="text-foreground/70 text-[10px] font-black tracking-widest uppercase">
                {t('title')}
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <Select value={speed.toString()} onValueChange={(v) => setSpeed(parseFloat(v))}>
                <SelectTrigger className="bg-secondary/50 h-7 w-20 border-none text-[10px] font-bold focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1" className="cursor-pointer text-[10px] font-bold">
                    1x
                  </SelectItem>
                  <SelectItem value="2" className="cursor-pointer text-[10px] font-bold">
                    2x
                  </SelectItem>
                  <SelectItem value="3" className="cursor-pointer text-[10px] font-bold">
                    3x
                  </SelectItem>
                  <SelectItem value="4" className="cursor-pointer text-[10px] font-bold">
                    4x
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {!isPlaying ? (
                <Button
                  size="icon"
                  variant="ghost"
                  className="hover:bg-primary/10 hover:text-primary h-9 w-9 rounded-full transition-colors"
                  onClick={startPlayback}
                >
                  <Play className="h-5 w-5 fill-current" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-primary bg-primary/5 hover:bg-primary/20 h-9 w-9 rounded-full"
                  onClick={pausePlayback}
                >
                  <Pause className="h-5 w-5 fill-current" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 h-9 w-9 rounded-full"
                onClick={stopPlayback}
              >
                <Square className="h-4 w-4 fill-current" />
              </Button>
            </div>

            <div className="flex-1 px-2">
              <Slider
                value={[progress]}
                min={0}
                max={100}
                step={0.1}
                onValueChange={handleSeek}
                className="cursor-pointer"
              />
            </div>

            <div className="min-w-[40px] text-right">
              <span className="text-muted-foreground font-mono text-[10px] font-black">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}
