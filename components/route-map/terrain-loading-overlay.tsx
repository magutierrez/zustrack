'use client';

import { cn } from '@/lib/utils';

interface TerrainLoadingOverlayProps {
  terrainLoading: boolean;
}

export function TerrainLoadingOverlay({ terrainLoading }: TerrainLoadingOverlayProps) {
  if (!terrainLoading) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      <div
        className="absolute inset-x-0 bottom-0 h-3/4 animate-[terrain-pulse_2s_ease-in-out_infinite]"
        style={{
          background:
            'linear-gradient(to top, rgba(34,197,94,0.18) 0%, rgba(234,179,8,0.08) 45%, transparent 100%)',
        }}
      />
      <div
        className="absolute inset-x-0 h-[3px] animate-[terrain-scanline_2.2s_ease-in_infinite]"
        style={{
          background:
            'linear-gradient(to right, transparent 0%, rgba(34,197,94,0.7) 30%, rgba(234,179,8,0.9) 50%, rgba(34,197,94,0.7) 70%, transparent 100%)',
          boxShadow: '0 0 12px 3px rgba(34,197,94,0.4)',
        }}
      />
    </div>
  );
}
