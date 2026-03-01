export const SLOPE_COLOR_FLAT = '#10b981';
export const SLOPE_COLOR_GENTLE = '#f59e0b';
export const SLOPE_COLOR_STEEP = '#ef4444';
export const SLOPE_COLOR_EXTREME = '#991b1b';

export function getSlopeColorHex(slope: number): string {
  // Descents: green unless steeper than 20 % (very rare, dangerous)
  if (slope < 0) return Math.abs(slope) >= 20 ? SLOPE_COLOR_EXTREME : SLOPE_COLOR_FLAT;
  // Flat and climbs
  if (slope <= 1) return SLOPE_COLOR_FLAT;
  if (slope < 5) return SLOPE_COLOR_GENTLE;
  if (slope < 10) return SLOPE_COLOR_STEEP;
  return SLOPE_COLOR_EXTREME;
}
