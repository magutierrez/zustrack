export const SLOPE_COLOR_FLAT = '#10b981';
export const SLOPE_COLOR_GENTLE = '#f59e0b';
export const SLOPE_COLOR_STEEP = '#ef4444';
export const SLOPE_COLOR_EXTREME = '#991b1b';

export function getSlopeColorHex(slope: number): string {
  const absSlope = Math.abs(slope);
  if (absSlope <= 1) return SLOPE_COLOR_FLAT;
  if (absSlope < 5) return SLOPE_COLOR_GENTLE;
  if (absSlope < 10) return SLOPE_COLOR_STEEP;
  return SLOPE_COLOR_EXTREME;
}
