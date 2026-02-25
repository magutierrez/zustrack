import type { MudRiskLevel } from './types';

// How much water each surface retains (0 = drains/sheds instantly, 1 = holds water like a sponge)
const SURFACE_RETENTION: Record<string, number> = {
  asphalt: 0.0,
  concrete: 0.0,
  paved: 0.0,
  metal: 0.0,
  rock: 0.0,
  stone: 0.05,
  cobblestone: 0.05,
  sett: 0.05,
  gravel: 0.2,
  fine_gravel: 0.2,
  pebblestone: 0.2,
  sand: 0.25,
  compacted: 0.4,
  dirt: 0.6,
  earth: 0.65,
  ground: 0.65,
  grass: 0.7,
  unpaved: 0.7,
  mud: 1.0,
  clay: 1.0,
};

function getSurfaceRetention(surface?: string): number {
  if (!surface) return 0.55; // unknown → assume moderately absorbent
  return SURFACE_RETENTION[surface.toLowerCase()] ?? 0.55;
}

// How much recent precipitation contributes to mud formation
function getPrecipFactor(mm: number): number {
  if (mm <= 2) return 0.0;
  if (mm <= 8) return 0.15;
  if (mm <= 20) return 0.4;
  if (mm <= 40) return 0.7;
  if (mm <= 60) return 0.85;
  return 1.0;
}

// Fraction of moisture that has evaporated since the rain (reduces mud risk)
function getEvaporationFactor(
  temperature: number,
  windSpeed: number,
  cloudCover: number,
  isShaded: boolean,
): number {
  let base: number;
  if (temperature >= 25) base = 0.7;
  else if (temperature >= 15) base = 0.5;
  else if (temperature >= 8) base = 0.3;
  else base = 0.1;

  const isClear = cloudCover < 30;
  const isWindy = windSpeed > 20;

  if (isClear && isWindy && !isShaded) base = Math.min(1.0, base + 0.25);
  else if (isClear && !isShaded) base = Math.min(1.0, base + 0.1);
  else if (isWindy) base = Math.min(1.0, base + 0.05);

  // Forest / shade slows evaporation significantly
  if (isShaded) base *= 0.5;

  return base;
}

// Slope modifies how water accumulates vs. drains
// Flat zones → water stagnates (risk ×1). Steep → water drains but surface is slippery (risk ×0.45)
function getSlopeFactor(slopePercent: number): number {
  const abs = Math.abs(slopePercent);
  if (abs < 2) return 1.0;
  if (abs < 5) return 0.85;
  if (abs < 10) return 0.65;
  return 0.45;
}

export interface MudRiskParams {
  past72hPrecipMm: number;
  surface?: string;
  temperature: number;
  windSpeed: number;
  cloudCover: number;
  isShaded: boolean;
  slopePercent: number;
}

/** Returns a score in [0, 1]. 0 = no mud, 1 = worst mud. */
export function computeMudRiskScore(params: MudRiskParams): number {
  const { past72hPrecipMm, surface, temperature, windSpeed, cloudCover, isShaded, slopePercent } =
    params;

  const surfaceRetention = getSurfaceRetention(surface);
  // Impermeable surfaces → no mud, ever
  if (surfaceRetention === 0) return 0;

  const precipFactor = getPrecipFactor(past72hPrecipMm);
  // No meaningful rain → no mud
  if (precipFactor === 0) return 0;

  const evapFactor = getEvaporationFactor(temperature, windSpeed, cloudCover, isShaded);
  const slopeFactor = getSlopeFactor(slopePercent);

  const score = precipFactor * surfaceRetention * (1 - evapFactor) * slopeFactor;
  return Math.min(1, Math.max(0, score));
}

export function scoreToRiskLevel(score: number): MudRiskLevel {
  if (score < 0.15) return 'none';
  if (score < 0.35) return 'low';
  if (score < 0.6) return 'medium';
  return 'high';
}

export interface MudRiskSegment {
  startKm: number;
  endKm: number;
  level: MudRiskLevel;
}

/** Groups consecutive route points with medium/high mud risk into km segments. */
export function getMudRiskSegments(
  points: { distanceFromStart: number; mudRisk: MudRiskLevel }[],
): MudRiskSegment[] {
  const segments: MudRiskSegment[] = [];
  let segStart: number | null = null;
  let segLevel: MudRiskLevel = 'none';

  for (let i = 0; i < points.length; i++) {
    const { distanceFromStart, mudRisk } = points[i];
    const isRisky = mudRisk === 'medium' || mudRisk === 'high';

    if (isRisky && segStart === null) {
      segStart = distanceFromStart;
      segLevel = mudRisk;
    } else if (isRisky && segStart !== null) {
      // Upgrade segment level if we hit a higher risk
      if (mudRisk === 'high') segLevel = 'high';
    } else if (!isRisky && segStart !== null) {
      segments.push({
        startKm: Math.round(segStart * 10) / 10,
        endKm: Math.round(points[i - 1].distanceFromStart * 10) / 10,
        level: segLevel,
      });
      segStart = null;
      segLevel = 'none';
    }
  }

  // Close any open segment
  if (segStart !== null && points.length > 0) {
    segments.push({
      startKm: Math.round(segStart * 10) / 10,
      endKm: Math.round(points[points.length - 1].distanceFromStart * 10) / 10,
      level: segLevel,
    });
  }

  return segments;
}
