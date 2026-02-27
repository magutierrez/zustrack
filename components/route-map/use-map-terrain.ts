'use client';

import { useCallback, useEffect, useRef, RefObject } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';

export function useMapTerrain(
  mapRef: RefObject<MapRef | null>,
  mapStyle: any,
  isPlayerActive: boolean,
) {
  // Ref keeps the latest isPlayerActive readable by the stable syncTerrain callback.
  // This way the 'styledata' listener (attached once) always reads the current value.
  const isPlayerActiveRef = useRef(isPlayerActive);
  isPlayerActiveRef.current = isPlayerActive;

  const syncTerrain = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map || !map.isStyleLoaded()) return;

    if (isPlayerActiveRef.current) {
      // ── Enable 3D terrain ──
      const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;
      if (!map.getSource('terrain-dem')) {
        map.addSource('terrain-dem', {
          type: 'raster-dem',
          url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${key}`,
          tileSize: 256,
        });
      }
      if (!map.getTerrain()) {
        map.setTerrain({ source: 'terrain-dem', exaggeration: 1.5 });
      }
    } else {
      // ── Disable 3D terrain ──
      if (map.getTerrain()) map.setTerrain(null);
      if (map.getSource('terrain-dem')) map.removeSource('terrain-dem');
    }
  }, [mapRef]);

  // Re-apply whenever the style reloads (style swap removes all programmatic sources/layers)
  // or when isPlayerActive changes.
  useEffect(() => {
    syncTerrain();
  }, [mapStyle, isPlayerActive, syncTerrain]);

  return { syncTerrain };
}
