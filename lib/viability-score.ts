import type { RouteWeatherPoint, ViabilityThreat, ViabilityResult } from './types';

// ─── Terrain factor ───────────────────────────────────────────────────────────
// 'shade' (terrain shadow) = protected valley / forest / north face → ×0.5
// High elevation + direct sun = exposed ridge → ×2.0
// Otherwise neutral → ×1.0
function getTerrainFactor(wp: RouteWeatherPoint, avgElevation: number): number {
  if (wp.solarExposure === 'shade') return 0.5;
  const ele = wp.point.ele ?? 0;
  if (wp.solarExposure === 'sun' && ele > avgElevation + 250) return 2.0;
  return 1.0;
}

// ─── Per-category deduction functions ────────────────────────────────────────

/** Max 30 pts — terrain-adjusted */
function rawWindDeduction(gustsKmh: number): number {
  if (gustsKmh < 20) return 0;
  if (gustsKmh < 30) return 4;
  if (gustsKmh < 40) return 10;
  if (gustsKmh < 50) return 18;
  if (gustsKmh < 65) return 25;
  return 30;
}

/** Max 40 pts */
function stormDeduction(weatherCode: number, precipMm: number): number {
  if (weatherCode >= 95) return 40; // thunderstorm
  if (weatherCode === 82) return 25; // violent showers
  if (weatherCode === 65 || weatherCode === 67) return 18; // heavy / freezing rain
  if (weatherCode === 63) return 10; // moderate rain
  if (weatherCode === 61 || weatherCode === 81) return 6;
  // fallback on precipitation intensity
  if (precipMm > 10) return 18;
  if (precipMm > 5) return 10;
  if (precipMm > 2) return 5;
  return 0;
}

/** Max 15 pts */
function temperatureDeduction(apparentTemp: number): number {
  if (apparentTemp < -10) return 15;
  if (apparentTemp < -5) return 12;
  if (apparentTemp < 0) return 8;
  if (apparentTemp < 5) return 4;
  if (apparentTemp > 40) return 15;
  if (apparentTemp > 35) return 8;
  if (apparentTemp > 32) return 3;
  return 0;
}

/** Max 15 pts */
function visibilityDeduction(visM: number): number {
  if (visM < 100) return 15;
  if (visM < 300) return 12;
  if (visM < 500) return 8;
  if (visM < 1000) return 5;
  if (visM < 2000) return 2;
  return 0;
}

function getSeverity(deduction: number, max: number): ViabilityThreat['severity'] {
  const r = deduction / max;
  if (r < 0.25) return 'low';
  if (r < 0.5) return 'medium';
  if (r < 0.75) return 'high';
  return 'critical';
}

// ─── Main entry ───────────────────────────────────────────────────────────────
export function computeViabilityScore(weatherPoints: RouteWeatherPoint[]): ViabilityResult {
  if (!weatherPoints.length) return { score: 100, rating: 'go', threats: [] };

  const avgElevation =
    weatherPoints.reduce((s, wp) => s + (wp.point.ele ?? 0), 0) / weatherPoints.length;

  // Track worst deduction per category
  let worstWind = { deduction: 0, km: 0, value: 0, terrainFactor: 1 };
  let worstStorm = { deduction: 0, km: 0, value: 0 };
  let worstTemp = { deduction: 0, km: 0, value: 0 };
  let worstVis = { deduction: 0, km: 0, value: 0 };

  for (const wp of weatherPoints) {
    const km = wp.point.distanceFromStart;
    const tf = getTerrainFactor(wp, avgElevation);

    // Wind (terrain-adjusted, capped at 30)
    const gusts = wp.weather.windGusts ?? 0;
    const wd = Math.min(30, rawWindDeduction(gusts) * tf);
    if (wd > worstWind.deduction) worstWind = { deduction: wd, km, value: gusts, terrainFactor: tf };

    // Storm (max 40)
    const sd = stormDeduction(wp.weather.weatherCode ?? 0, wp.weather.precipitation ?? 0);
    if (sd > worstStorm.deduction) worstStorm = { deduction: sd, km, value: wp.weather.weatherCode ?? 0 };

    // Temperature (max 15)
    const apparentTemp = wp.weather.apparentTemperature ?? wp.weather.temperature ?? 20;
    const td = temperatureDeduction(apparentTemp);
    if (td > worstTemp.deduction) worstTemp = { deduction: td, km, value: apparentTemp };

    // Visibility (max 15)
    const vis = wp.weather.visibility ?? 10000;
    const vd = visibilityDeduction(vis);
    if (vd > worstVis.deduction) worstVis = { deduction: vd, km, value: vis };
  }

  const totalDeduction = Math.min(
    100,
    worstWind.deduction + worstStorm.deduction + worstTemp.deduction + worstVis.deduction,
  );
  const score = Math.max(0, Math.round(100 - totalDeduction));
  const rating: ViabilityResult['rating'] = score >= 80 ? 'go' : score >= 40 ? 'caution' : 'danger';

  const threats: ViabilityThreat[] = [];

  if (worstWind.deduction > 0) {
    threats.push({
      type: 'wind',
      severity: getSeverity(worstWind.deduction, 30),
      deduction: Math.round(worstWind.deduction),
      km: worstWind.km,
      value: Math.round(worstWind.value),
      terrainFactor: worstWind.terrainFactor,
    });
  }
  if (worstStorm.deduction > 0) {
    threats.push({
      type: 'storm',
      severity: getSeverity(worstStorm.deduction, 40),
      deduction: worstStorm.deduction,
      km: worstStorm.km,
      value: worstStorm.value,
      terrainFactor: 1,
    });
  }
  if (worstTemp.deduction > 0) {
    threats.push({
      type: 'temperature',
      severity: getSeverity(worstTemp.deduction, 15),
      deduction: worstTemp.deduction,
      km: worstTemp.km,
      value: Math.round(worstTemp.value * 10) / 10,
      terrainFactor: 1,
    });
  }
  if (worstVis.deduction > 0) {
    threats.push({
      type: 'visibility',
      severity: getSeverity(worstVis.deduction, 15),
      deduction: worstVis.deduction,
      km: worstVis.km,
      value: Math.round(worstVis.value),
      terrainFactor: 1,
    });
  }

  // Sort by impact (highest deduction first)
  threats.sort((a, b) => b.deduction - a.deduction);

  return { score, rating, threats };
}
