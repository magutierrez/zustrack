import { WeatherData } from './types';

export interface WeatherProvider {
  name: string;
  fetchWeather: (params: {
    locations: { lat: number; lon: number; indices: number[]; times: string[] }[];
    startDate: string;
    endDate: string;
  }) => Promise<Array<{ index: number; weather: WeatherData }>>;
}

/** Sums hourly values in a N-hour window strictly before targetTime. */
function computeWindowSum(
  hourlyTimes: string[],
  hourlyValues: (number | null)[],
  targetTime: string,
  windowHours: number,
): number {
  const target = new Date(targetTime).getTime();
  const cutoff = target - windowHours * 3_600_000;
  let total = 0;
  for (let i = 0; i < hourlyTimes.length; i++) {
    const t = new Date(hourlyTimes[i]).getTime();
    if (t >= cutoff && t < target) total += hourlyValues[i] ?? 0;
  }
  return Math.round(total * 10) / 10;
}

/**
 * Returns true if within the last 48 h the temperature crossed both above +2 °C
 * and below -2 °C — indicating a freeze/thaw cycle.
 */
function detectFreezeThaw(
  hourlyTimes: string[],
  hourlyTemps: (number | null)[],
  targetTime: string,
): boolean {
  const target = new Date(targetTime).getTime();
  const cutoff = target - 48 * 3_600_000;
  let hadWarm = false;
  let hadFreezing = false;
  for (let i = 0; i < hourlyTimes.length; i++) {
    const t = new Date(hourlyTimes[i]).getTime();
    if (t >= cutoff && t < target) {
      const temp = hourlyTemps[i] ?? 0;
      if (temp > 2) hadWarm = true;
      if (temp < -2) hadFreezing = true;
    }
  }
  return hadWarm && hadFreezing;
}

/** Sums hourly precipitation in the 72-hour window before targetTime. */
function computePast72hPrecip(
  hourlyTimes: string[],
  hourlyPrecip: (number | null)[],
  targetTime: string,
): number {
  const target = new Date(targetTime).getTime();
  const cutoff = target - 72 * 3_600_000;
  let total = 0;
  for (let i = 0; i < hourlyTimes.length; i++) {
    const t = new Date(hourlyTimes[i]).getTime();
    if (t >= cutoff && t < target) {
      total += hourlyPrecip[i] ?? 0;
    }
  }
  return Math.round(total * 10) / 10;
}

// Helper to find the closest hourly data point
export function findClosestWeather(
  hourlyTimes: string[],
  targetTime: string,
  dataArrays: Record<string, any[]>,
) {
  const targetDate = new Date(targetTime).getTime();
  let closestIdx = 0;
  let closestDiff = Infinity;

  hourlyTimes.forEach((t, idx) => {
    const diff = Math.abs(new Date(t).getTime() - targetDate);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIdx = idx;
    }
  });

  const result: any = { time: hourlyTimes[closestIdx] };
  for (const key in dataArrays) {
    result[key] = dataArrays[key][closestIdx];
  }
  return result;
}

export const openMeteoProvider: WeatherProvider = {
  name: 'Open-Meteo',
  fetchWeather: async ({ locations, startDate, endDate }) => {
    // Extend 3 days back to capture historical precipitation for mud-risk calculation
    const historicalStart = new Date(new Date(startDate).getTime() - 3 * 86_400_000)
      .toISOString()
      .split('T')[0];

    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', locations.map((l) => l.lat).join(','));
    url.searchParams.set('longitude', locations.map((l) => l.lon).join(','));
    url.searchParams.set(
      'hourly',
      'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover,visibility,is_day,direct_radiation,diffuse_radiation,snow_depth,snowfall',
    );
    url.searchParams.set('start_date', historicalStart);
    url.searchParams.set('end_date', endDate);
    url.searchParams.set('timezone', 'auto');

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json', 'User-Agent': 'zustrack/1.0' },
    });

    if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
    const data = await res.json();
    const resultsArray = Array.isArray(data) ? data : [data];

    const weatherResults: Array<{ index: number; weather: WeatherData }> = [];

    resultsArray.forEach((locationData, locationIdx) => {
      const loc = locations[locationIdx];
      const hourlyPrecip: number[] = locationData.hourly.precipitation;
      const hourlyTemps: number[] = locationData.hourly.temperature_2m;
      const hourlySnowfall: number[] = locationData.hourly.snowfall ?? [];
      // snow_depth is in metres; convert to cm
      const hourlySnowDepthM: number[] = locationData.hourly.snow_depth ?? [];
      const hourlyTimes: string[] = locationData.hourly.time;

      loc.indices.forEach((pointIndex, i) => {
        const raw = findClosestWeather(hourlyTimes, loc.times[i], {
          temperature: hourlyTemps,
          apparentTemperature: locationData.hourly.apparent_temperature,
          humidity: locationData.hourly.relative_humidity_2m,
          precipitation: hourlyPrecip,
          precipitationProbability: locationData.hourly.precipitation_probability,
          weatherCode: locationData.hourly.weather_code,
          windSpeed: locationData.hourly.wind_speed_10m,
          windDirection: locationData.hourly.wind_direction_10m,
          windGusts: locationData.hourly.wind_gusts_10m,
          cloudCover: locationData.hourly.cloud_cover,
          visibility: locationData.hourly.visibility,
          isDay: locationData.hourly.is_day,
          directRadiation: locationData.hourly.direct_radiation,
          diffuseRadiation: locationData.hourly.diffuse_radiation,
          _snowDepthM: hourlySnowDepthM,
        });

        // Convert snow_depth from metres to cm and remove the internal key
        raw.snowDepthCm = Math.round((raw._snowDepthM ?? 0) * 100);
        delete raw._snowDepthM;

        raw.past72hPrecipMm = computePast72hPrecip(hourlyTimes, hourlyPrecip, loc.times[i]);
        raw.recent48hSnowfallCm = computeWindowSum(hourlyTimes, hourlySnowfall, loc.times[i], 48);
        raw.freezeThawCycle = detectFreezeThaw(hourlyTimes, hourlyTemps, loc.times[i]);

        weatherResults.push({ index: pointIndex, weather: raw });
      });
    });

    return weatherResults;
  },
};

// Mapping WeatherAPI codes to WMO (Open-Meteo) codes for consistency
// This is a simplified mapping
const weatherApiToWmo: Record<number, number> = {
  1000: 0, // Sunny/Clear
  1003: 1, // Partly cloudy
  1006: 3, // Cloudy
  1009: 3, // Overcast
  1030: 45, // Mist
  1063: 51, // Patchy rain possible
  1183: 61, // Light rain
  1189: 63, // Moderate rain
  1195: 65, // Heavy rain
  // ... more mappings could be added
};

export const weatherApiProvider: WeatherProvider = {
  name: 'WeatherAPI',
  fetchWeather: async ({ locations, startDate }) => {
    const apiKey = process.env.WEATHERAPI_API_KEY;
    if (!apiKey) throw new Error('WeatherAPI key missing');

    // WeatherAPI doesn't support batching locations in one call easily for historical/forecast
    // So we fetch for each unique location. Since we rounded locations to 2 decimals,
    // it should be manageable.
    const allResults = await Promise.all(
      locations.map(async (loc) => {
        const url = new URL('https://api.weatherapi.com/v1/forecast.json');
        url.searchParams.set('key', apiKey);
        url.searchParams.set('q', `${loc.lat},${loc.lon}`);
        url.searchParams.set('days', '3');
        url.searchParams.set('aqi', 'no');

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`WeatherAPI error: ${res.status}`);
        const data = await res.json();

        const hourlyData = data.forecast.forecastday.flatMap((day: any) => day.hour);
        const hourlyTimes = hourlyData.map((h: any) => h.time);

        return loc.indices.map((pointIndex, i) => {
          const closest = findClosestWeather(hourlyTimes, loc.times[i], {
            temperature: hourlyData.map((h: any) => h.temp_c),
            apparentTemperature: hourlyData.map((h: any) => h.feelslike_c),
            humidity: hourlyData.map((h: any) => h.humidity),
            precipitation: hourlyData.map((h: any) => h.precip_mm),
            precipitationProbability: hourlyData.map((h: any) => h.chance_of_rain), // simplified
            weatherCode: hourlyData.map((h: any) => weatherApiToWmo[h.condition.code] || 0),
            windSpeed: hourlyData.map((h: any) => h.wind_kph),
            windDirection: hourlyData.map((h: any) => h.wind_degree),
            windGusts: hourlyData.map((h: any) => h.gust_kph),
            cloudCover: hourlyData.map((h: any) => h.cloud),
            visibility: hourlyData.map((h: any) => h.vis_km * 1000),
          });
          return { index: pointIndex, weather: closest };
        });
      }),
    );

    return allResults.flat();
  },
};

// Tomorrow.io mapping
const tomorrowToWmo: Record<number, number> = {
  1000: 0, // Clear
  1100: 1, // Mostly Clear
  1101: 2, // Partly Cloudy
  1102: 3, // Mostly Cloudy
  1001: 3, // Cloudy
  4000: 51, // Drizzle
  4001: 61, // Rain
  4200: 61, // Light Rain
  4201: 65, // Heavy Rain
  // ...
};

export const metNorwayProvider: WeatherProvider = {
  name: 'MET Norway',
  fetchWeather: async ({ locations }) => {
    const allResults = await Promise.all(
      locations.map(async (loc) => {
        const url = new URL('https://api.met.no/weatherapi/locationforecast/2.0/compact');
        url.searchParams.set('lat', loc.lat.toString());
        url.searchParams.set('lon', loc.lon.toString());

        const res = await fetch(url.toString(), {
          headers: { 'User-Agent': 'zustrack/1.0 github.com/magutierrez/peakone' },
        });

        if (!res.ok) throw new Error(`MET Norway error: ${res.status}`);
        const data = await res.json();

        const timeseries = data.properties.timeseries;
        const hourlyTimes = timeseries.map((t: any) => t.time);

        return loc.indices.map((pointIndex, i) => {
          const closest = findClosestWeather(hourlyTimes, loc.times[i], {
            temperature: timeseries.map((t: any) => t.data.instant.details.air_temperature),
            apparentTemperature: timeseries.map((t: any) => t.data.instant.details.air_temperature), // MET doesn't give feels-like in compact
            humidity: timeseries.map((t: any) => t.data.instant.details.relative_humidity),
            precipitation: timeseries.map(
              (t: any) => t.data.next_1_hours?.details?.precipitation_amount || 0,
            ),
            precipitationProbability: timeseries.map(
              (t: any) => t.data.next_1_hours?.details?.probability_of_precipitation || 0,
            ),
            weatherCode: timeseries.map(() => 0), // MET uses symbols, mapping would be complex
            windSpeed: timeseries.map((t: any) => (t.data.instant.details.wind_speed || 0) * 3.6), // m/s to km/h
            windDirection: timeseries.map((t: any) => t.data.instant.details.wind_from_direction),
            windGusts: timeseries.map(
              (t: any) =>
                (t.data.instant.details.wind_speed_of_gust ||
                  t.data.instant.details.wind_speed ||
                  0) * 3.6,
            ),
            isDay: timeseries.map(() => 1), // Simplified
          });
          return { index: pointIndex, weather: closest };
        });
      }),
    );

    return allResults.flat();
  },
};

export const tomorrowIoProvider: WeatherProvider = {
  name: 'Tomorrow.io',
  fetchWeather: async ({ locations, startDate, endDate }) => {
    const apiKey = process.env.TOMORROW_IO_API_KEY;
    if (!apiKey) throw new Error('Tomorrow.io key missing');

    const allResults = await Promise.all(
      locations.map(async (loc) => {
        const url = new URL('https://api.tomorrow.io/v4/weather/forecast');
        url.searchParams.set('location', `${loc.lat},${loc.lon}`);
        url.searchParams.set('apikey', apiKey);
        url.searchParams.set('units', 'metric');

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`Tomorrow.io error: ${res.status}`);
        const data = await res.json();

        const hourlyData = data.timelines.hourly;
        const hourlyTimes = hourlyData.map((h: any) => h.time);

        return loc.indices.map((pointIndex, i) => {
          const closest = findClosestWeather(hourlyTimes, loc.times[i], {
            temperature: hourlyData.map((h: any) => h.values.temperature),
            apparentTemperature: hourlyData.map((h: any) => h.values.temperatureApparent),
            humidity: hourlyData.map((h: any) => h.values.humidity),
            precipitation: hourlyData.map((h: any) => h.values.precipitationIntensity),
            precipitationProbability: hourlyData.map((h: any) => h.values.precipitationProbability),
            weatherCode: hourlyData.map((h: any) => tomorrowToWmo[h.values.weatherCode] || 0),
            windSpeed: hourlyData.map((h: any) => h.values.windSpeed * 3.6), // m/s to km/h
            windDirection: hourlyData.map((h: any) => h.values.windDirection),
            windGusts: hourlyData.map((h: any) => h.values.windGust * 3.6), // m/s to km/h
            cloudCover: hourlyData.map((h: any) => h.values.cloudCover),
            visibility: hourlyData.map((h: any) => h.values.visibility * 1000),
          });
          return { index: pointIndex, weather: closest };
        });
      }),
    );

    return allResults.flat();
  },
};
