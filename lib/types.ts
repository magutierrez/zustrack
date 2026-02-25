declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    provider?: string;
  }
}

export interface RoutePoint {
  lat: number;
  lon: number;
  ele?: number;
  distanceFromStart: number; // km
  estimatedTime?: Date;
}

export type MudRiskLevel = 'none' | 'low' | 'medium' | 'high';
export type SnowCondition = 'none' | 'boots' | 'snowshoes' | 'crampons' | 'mountaineering';
export type ViabilityRating = 'go' | 'caution' | 'danger';

export interface ViabilityThreat {
  type: 'wind' | 'storm' | 'temperature' | 'visibility';
  severity: 'low' | 'medium' | 'high' | 'critical';
  deduction: number;
  km: number;
  value: number;
  terrainFactor: number;
}

export interface ViabilityResult {
  score: number;
  rating: ViabilityRating;
  threats: ViabilityThreat[];
}

export interface WeatherData {
  time: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  precipitationProbability: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  cloudCover: number;
  visibility: number;
  isDay?: number;
  directRadiation?: number;
  diffuseRadiation?: number;
  past72hPrecipMm?: number;
  snowDepthCm?: number;
  recent48hSnowfallCm?: number;
  freezeThawCycle?: boolean;
}

export interface EscapePoint {
  lat: number;
  lon: number;
  name: string;
  type: 'town' | 'road' | 'shelter';
  distanceFromRoute: number;
}

export interface WaterSource {
  lat: number;
  lon: number;
  name: string;
  type: 'natural' | 'urban';
  distanceFromRoute: number;
  reliability: 'high' | 'medium' | 'low';
}

export interface RouteWeatherPoint {
  point: RoutePoint;
  weather: WeatherData;
  windEffect: 'tailwind' | 'headwind' | 'crosswind-left' | 'crosswind-right';
  windEffectAngle: number; // angle between travel direction and wind
  bearing: number; // direction of travel at this point
  pathType?: string; // e.g., cycleway, path, primary, etc.
  surface?: string; // e.g., asphalt, gravel, unpaved
  solarExposure?: 'sun' | 'shade' | 'night';
  solarIntensity?: 'shade' | 'weak' | 'moderate' | 'intense' | 'night';
  escapePoint?: EscapePoint;
  mobileCoverage?: 'none' | 'low' | 'full' | 'unknown';
  waterSources?: WaterSource[];
  mudRisk?: MudRiskLevel;
  mudRiskScore?: number;
  snowCondition?: SnowCondition;
}

export interface RouteSegmentMetadata {
  name: string;
  value: number; // distance or percentage
  color: string;
}

export interface RouteStats {
  pathTypes: RouteSegmentMetadata[];
  surfaces: RouteSegmentMetadata[];
}

export interface RouteConfig {
  date: string;
  time: string;
  speed: number;
}

export interface GPXData {
  points: RoutePoint[];
  name: string;
  totalDistance: number;
  totalElevationGain: number;
  totalElevationLoss: number;
}

export const WEATHER_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: 'Despejado', icon: 'sun' },
  1: { description: 'Mayormente despejado', icon: 'sun' },
  2: { description: 'Parcialmente nublado', icon: 'cloud-sun' },
  3: { description: 'Nublado', icon: 'cloud' },
  45: { description: 'Niebla', icon: 'cloud-fog' },
  48: { description: 'Niebla con escarcha', icon: 'cloud-fog' },
  51: { description: 'Llovizna ligera', icon: 'cloud-drizzle' },
  53: { description: 'Llovizna moderada', icon: 'cloud-drizzle' },
  55: { description: 'Llovizna intensa', icon: 'cloud-drizzle' },
  56: { description: 'Llovizna helada ligera', icon: 'cloud-drizzle' },
  57: { description: 'Llovizna helada intensa', icon: 'cloud-drizzle' },
  61: { description: 'Lluvia ligera', icon: 'cloud-rain' },
  63: { description: 'Lluvia moderada', icon: 'cloud-rain' },
  65: { description: 'Lluvia intensa', icon: 'cloud-rain' },
  66: { description: 'Lluvia helada ligera', icon: 'cloud-rain' },
  67: { description: 'Lluvia helada intensa', icon: 'cloud-rain' },
  71: { description: 'Nevada ligera', icon: 'snowflake' },
  73: { description: 'Nevada moderada', icon: 'snowflake' },
  75: { description: 'Nevada intensa', icon: 'snowflake' },
  77: { description: 'Granizo fino', icon: 'snowflake' },
  80: { description: 'Chubascos ligeros', icon: 'cloud-rain-wind' },
  81: { description: 'Chubascos moderados', icon: 'cloud-rain-wind' },
  82: { description: 'Chubascos violentos', icon: 'cloud-rain-wind' },
  85: { description: 'Chubascos de nieve ligeros', icon: 'snowflake' },
  86: { description: 'Chubascos de nieve intensos', icon: 'snowflake' },
  95: { description: 'Tormenta', icon: 'cloud-lightning' },
  96: { description: 'Tormenta con granizo ligero', icon: 'cloud-lightning' },
  99: { description: 'Tormenta con granizo intenso', icon: 'cloud-lightning' },
};
