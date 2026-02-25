import type { SnowCondition } from './types';

export interface SnowshoeParams {
  snowDepthCm: number;
  recent48hSnowfallCm: number;
  freezeThawCycle: boolean;
  temperature: number;
  slopeDeg: number; // degrees (not percent), absolute value will be taken
}

/**
 * Decision tree for snow equipment recommendation.
 *
 * Priority (highest first):
 * 1. Slope > 30° + any snow  → mountaineering (crampons + ice axe)
 * 2. Depth ≥ 20 cm + powder  → snowshoes
 * 3. Depth ≥ 20 cm + hard    → crampons / microspikes
 * 4. Depth ≥  5 cm           → waterproof boots
 * 5. Otherwise               → none
 */
export function computeSnowCondition(params: SnowshoeParams): SnowCondition {
  const { snowDepthCm, recent48hSnowfallCm, freezeThawCycle, temperature, slopeDeg } = params;

  if (snowDepthCm < 5) return 'none';

  // Steep alpine terrain: raquetas are dangerous, need technical gear
  if (Math.abs(slopeDeg) > 30) return 'mountaineering';

  if (snowDepthCm >= 20) {
    // Powder / deep fresh snow: snowshoes essential
    const isFreshPowder = recent48hSnowfallCm > 3 && !freezeThawCycle && temperature < 0;
    return isFreshPowder ? 'snowshoes' : 'crampons';
  }

  // 5–19 cm: manageable with waterproof boots
  return 'boots';
}

export interface SnowSegment {
  startKm: number;
  endKm: number;
  condition: SnowCondition;
}

const CONDITION_ORDER: SnowCondition[] = ['none', 'boots', 'snowshoes', 'crampons', 'mountaineering'];

function isMoreSevere(a: SnowCondition, b: SnowCondition) {
  return CONDITION_ORDER.indexOf(a) > CONDITION_ORDER.indexOf(b);
}

/**
 * Groups consecutive route points that require equipment (anything above 'none')
 * into segments with the worst condition within that segment.
 */
export function getSnowSegments(
  points: { distanceFromStart: number; snowCondition: SnowCondition }[],
): SnowSegment[] {
  const segments: SnowSegment[] = [];
  let segStart: number | null = null;
  let segCondition: SnowCondition = 'none';

  for (let i = 0; i < points.length; i++) {
    const { distanceFromStart, snowCondition } = points[i];
    const needsGear = snowCondition !== 'none';

    if (needsGear && segStart === null) {
      segStart = distanceFromStart;
      segCondition = snowCondition;
    } else if (needsGear && segStart !== null) {
      if (isMoreSevere(snowCondition, segCondition)) segCondition = snowCondition;
    } else if (!needsGear && segStart !== null) {
      segments.push({
        startKm: Math.round(segStart * 10) / 10,
        endKm: Math.round(points[i - 1].distanceFromStart * 10) / 10,
        condition: segCondition,
      });
      segStart = null;
      segCondition = 'none';
    }
  }

  if (segStart !== null && points.length > 0) {
    segments.push({
      startKm: Math.round(segStart * 10) / 10,
      endKm: Math.round(points[points.length - 1].distanceFromStart * 10) / 10,
      condition: segCondition,
    });
  }

  return segments;
}

/** Returns the worst condition found across all points. */
export function getOverallSnowCondition(conditions: SnowCondition[]): SnowCondition {
  return conditions.reduce<SnowCondition>(
    (worst, c) => (isMoreSevere(c, worst) ? c : worst),
    'none',
  );
}
