'use client';

import {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  CloudFog,
  Snowflake,
  CloudRainWind,
} from 'lucide-react';
import { WEATHER_CODES } from '@/lib/types';

interface WeatherIconProps {
  code: number;
  className?: string;
}

export function WeatherIcon({ code, className = 'h-5 w-5' }: WeatherIconProps) {
  const info = WEATHER_CODES[code];
  const iconName = info?.icon || 'cloud';

  switch (iconName) {
    case 'sun':
      return <Sun className={`${className} text-amber-500`} />;
    case 'cloud-sun':
      return <CloudSun className={`${className} text-amber-500`} />;
    case 'cloud':
      return <Cloud className={`${className} text-slate-400`} />;
    case 'cloud-fog':
      return <CloudFog className={`${className} text-slate-400`} />;
    case 'cloud-drizzle':
      return <CloudDrizzle className={`${className} text-blue-400`} />;
    case 'cloud-rain':
      return <CloudRain className={`${className} text-blue-500`} />;
    case 'cloud-rain-wind':
      return <CloudRainWind className={`${className} text-blue-600`} />;
    case 'snowflake':
      return <Snowflake className={`${className} text-sky-300`} />;
    case 'cloud-lightning':
      return <CloudLightning className={`${className} text-yellow-500`} />;
    default:
      return <Cloud className={`${className} text-slate-400`} />;
  }
}
