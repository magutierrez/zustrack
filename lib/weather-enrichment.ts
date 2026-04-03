import type { RoutePoint, WeatherData, RouteWeatherPoint, EscapePoint, WaterSource } from './types';
import { calculateBearing, getWindEffect } from './gpx-parser';
import { computeMudRiskScore, scoreToRiskLevel } from './mud-risk';
import { computeSnowCondition } from './snowshoe';
import { getSunPosition, getSolarExposure, getSolarIntensity, calculateSmartSpeed } from './utils';

export interface RouteInfoDataItem {
  distanceFromStart: number;
  elevation?: number;
  pathType?: string;
  surface?: string;
  escapePoint?: EscapePoint;
  mobileCoverage?: 'none' | 'low' | 'full' | 'unknown';
  waterSources?: WaterSource[];
}

export function calculateRouteTimings(
  points: RoutePoint[],
  startTime: Date,
  speed: number,
  activityType: 'cycling' | 'walking',
): Array<RoutePoint & { estimatedTime: Date }> {
  const result: Array<RoutePoint & { estimatedTime: Date }> = [];
  let currentElapsedTime = 0;

  points.forEach((point, idx) => {
    if (idx === 0) {
      result.push({ ...point, estimatedTime: new Date(startTime.getTime()) });
    } else {
      const prevPoint = points[idx - 1];
      const segmentDist = point.distanceFromStart - prevPoint.distanceFromStart;
      const segmentEleGain = Math.max(0, (point.ele || 0) - (prevPoint.ele || 0));
      const speedAtSegment = calculateSmartSpeed(speed, segmentDist, segmentEleGain, activityType);
      currentElapsedTime += segmentDist / speedAtSegment;
      result.push({
        ...point,
        estimatedTime: new Date(startTime.getTime() + currentElapsedTime * 3600000),
      });
    }
  });

  return result;
}

export function enrichWeatherPoint(
  point: RoutePoint & { estimatedTime: Date },
  nextPoint: RoutePoint & { estimatedTime: Date },
  prevPoint: RoutePoint & { estimatedTime: Date },
  weather: WeatherData,
  routeInfoData: RouteInfoDataItem[],
): RouteWeatherPoint {
  const bearing = calculateBearing(point.lat, point.lon, nextPoint.lat, nextPoint.lon);
  const windResult = getWindEffect(bearing, weather.windDirection);

  const info: Partial<RouteInfoDataItem> =
    routeInfoData.length > 0
      ? routeInfoData.reduce((prev, curr) =>
          Math.abs(curr.distanceFromStart - point.distanceFromStart) <
          Math.abs(prev.distanceFromStart - point.distanceFromStart)
            ? curr
            : prev,
        )
      : {};

  const ele = point.ele !== undefined && point.ele !== 0 ? point.ele : info.elevation || 0;

  const distDiff = (nextPoint.distanceFromStart - prevPoint.distanceFromStart) * 1000;
  const eleDiff =
    (nextPoint.ele !== undefined
      ? nextPoint.ele
      : routeInfoData.find((d) => d.distanceFromStart === nextPoint.distanceFromStart)?.elevation ||
        0) -
    (prevPoint.ele !== undefined
      ? prevPoint.ele
      : routeInfoData.find((d) => d.distanceFromStart === prevPoint.distanceFromStart)?.elevation ||
        0);
  const slopeRad = distDiff > 0 ? Math.atan(eleDiff / distDiff) : 0;
  const slopeDeg = (slopeRad * 180) / Math.PI;
  const aspectDeg = eleDiff > 0 ? (bearing + 180) % 360 : bearing;

  const sunPos = getSunPosition(point.estimatedTime, point.lat, point.lon);
  const solarExposure = getSolarExposure(weather, sunPos, Math.abs(slopeDeg), aspectDeg);
  const solarIntensity = getSolarIntensity(weather.directRadiation, solarExposure);

  const slopePercent = distDiff > 0 ? (eleDiff / distDiff) * 100 : 0;
  const snowCond = computeSnowCondition({
    snowDepthCm: weather.snowDepthCm ?? 0,
    recent48hSnowfallCm: weather.recent48hSnowfallCm ?? 0,
    freezeThawCycle: weather.freezeThawCycle ?? false,
    temperature: weather.temperature,
    slopeDeg,
  });
  const mudScore = computeMudRiskScore({
    past72hPrecipMm: weather.past72hPrecipMm ?? 0,
    surface: info.surface,
    temperature: weather.temperature,
    windSpeed: weather.windSpeed,
    cloudCover: weather.cloudCover ?? 0,
    isShaded: solarExposure === 'shade',
    slopePercent,
    humidity: weather.humidity,
  });

  return {
    point: { ...point, ele },
    weather,
    windEffect: windResult.effect,
    windEffectAngle: windResult.angle,
    bearing,
    pathType: info.pathType,
    surface: info.surface,
    solarExposure,
    solarIntensity,
    escapePoint: info.escapePoint,
    mobileCoverage: info.mobileCoverage,
    waterSources: info.waterSources,
    mudRisk: scoreToRiskLevel(mudScore),
    mudRiskScore: mudScore,
    snowCondition: snowCond,
  };
}
