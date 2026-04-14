'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface DayForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  windspeed: number;
  weathercode: number;
}

interface Labels {
  weatherForecast: string;
  bestDay: string;
  weatherLoading: string;
  precipitation: string;
  wind: string;
}

// WMO Weather code → emoji + description
function weatherEmoji(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 2) return '⛅';
  if (code === 3) return '☁️';
  if (code <= 49) return '🌫️';
  if (code <= 59) return '🌧️';
  if (code <= 69) return '🌨️';
  if (code <= 79) return '❄️';
  if (code <= 82) return '🌦️';
  if (code <= 86) return '🌨️';
  if (code <= 99) return '⛈️';
  return '🌡️';
}

function formatShortDate(dateStr: string, locale?: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric' });
}

function bestDayScore(day: DayForecast): number {
  const tempScore = day.tempMax >= 10 && day.tempMax <= 25 ? 2 : day.tempMax > 5 ? 1 : 0;
  const rainScore = day.precipitation < 2 ? 2 : day.precipitation < 8 ? 1 : 0;
  const windScore = day.windspeed < 20 ? 1 : 0;
  return tempScore + rainScore * 2 + windScore;
}

export function TrailWeatherForecast({
  lat,
  lng,
  labels,
  locale,
}: {
  lat: number;
  lng: number;
  labels: Labels;
  locale?: string;
}) {
  const [forecast, setForecast] = useState<DayForecast[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode` +
      `&timezone=auto&forecast_days=7`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const days: DayForecast[] = data.daily.time.map((date: string, i: number) => ({
          date,
          tempMax: Math.round(data.daily.temperature_2m_max[i]),
          tempMin: Math.round(data.daily.temperature_2m_min[i]),
          precipitation: Math.round(data.daily.precipitation_sum[i] * 10) / 10,
          windspeed: Math.round(data.daily.windspeed_10m_max[i]),
          weathercode: data.daily.weathercode[i],
        }));
        setForecast(days);
      })
      .catch(() => setError(true));
  }, [lat, lng]);

  if (error) return null;

  const bestIdx = forecast
    ? forecast.reduce((bi, day, i) => (bestDayScore(day) > bestDayScore(forecast[bi]) ? i : bi), 0)
    : -1;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{labels.weatherForecast}</h2>

      {!forecast ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-28 w-20 shrink-0 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pt-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {forecast.map((day, i) => {
            const isBest = i === bestIdx;
            return (
              <div
                key={day.date}
                className={cn(
                  'relative flex w-20 shrink-0 flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition-all',
                  isBest
                    ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-900/20'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
                )}
              >
                {isBest && (
                  <span className="absolute -top-2 left-1/2 z-50 w-[70px] -translate-x-1/2 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[8px] font-bold tracking-wide text-white uppercase">
                    {labels.bestDay}
                  </span>
                )}
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {formatShortDate(day.date, locale)}
                </span>
                <span className="text-2xl leading-none">{weatherEmoji(day.weathercode)}</span>
                <div className="flex flex-col items-center">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {day.tempMax}°
                  </span>
                  <span className="text-xs text-slate-400">{day.tempMin}°</span>
                </div>
                <div className="mt-0.5 space-y-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center justify-center gap-0.5">
                    <span>💧</span>
                    <span>{day.precipitation}mm</span>
                  </div>
                  <div className="flex items-center justify-center gap-0.5">
                    <span>💨</span>
                    <span>{day.windspeed}km/h</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
