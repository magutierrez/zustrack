import { useMemo } from 'react';
import { TrackPoint, ChartPoint } from './types';
import { getSlopeColorHex } from '@/lib/slope-colors';

export function useChartData(trackProfile: TrackPoint[], isMobile: boolean) {
  return useMemo<ChartPoint[]>(() => {
    const pts = trackProfile.filter((p) => p.e !== null);
    if (pts.length < 2) return [];

    // On mobile keep at most 60 evenly-spaced points
    const sampled =
      isMobile && pts.length > 60
        ? pts.filter((_, i) => i % Math.ceil(pts.length / 60) === 0 || i === pts.length - 1)
        : pts;

    return sampled.map((p, i) => {
      let slope = 0;
      if (i > 0) {
        const prev = sampled[i - 1];
        const distDiffKm = p.d - prev.d;
        const eleDiff = (p.e ?? 0) - (prev.e ?? 0);
        if (distDiffKm > 0.001) slope = (eleDiff / (distDiffKm * 1000)) * 100;
      }
      return {
        distance: p.d,
        elevation: p.e ?? 0,
        slope: Math.round(slope * 10) / 10,
        color: getSlopeColorHex(slope),
      };
    });
  }, [trackProfile, isMobile]);
}
