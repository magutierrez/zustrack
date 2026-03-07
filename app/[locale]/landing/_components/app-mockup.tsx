'use client';

import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  CloudRain,
  Filter,
  Navigation,
  Settings2,
  Thermometer,
  Wind,
} from 'lucide-react';
import Map, { Layer, MapRef, Source } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

export function AppMockup() {
  const t = useTranslations('Landing.mockup');
  const [mounted, setMounted] = useState(false);
  const mapRef = useRef<MapRef>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const initialZoom = mounted
    ? typeof window !== 'undefined' && window.innerWidth < 768
      ? 9.5
      : typeof window !== 'undefined' && window.innerWidth < 1024
        ? 10
        : 11
    : 11;

  const { coords, elevData, center } = useMemo(() => {
    const rawCoords = [
      [-5.84141, 43.35548],
      [-5.83914, 43.35704],
      [-5.83851, 43.35929],
      [-5.83863, 43.36113],
      [-5.834776676934933, 43.36427001158861],
      [-5.82674, 43.36725],
      [-5.81978, 43.36911],
      [-5.815650008992579, 43.37147333775833],
      [-5.81202, 43.37251],
      [-5.80831, 43.37479],
      [-5.8033700048532335, 43.37740500400702],
      [-5.79472, 43.37887],
      [-5.78955, 43.37931],
      [-5.784145002326871, 43.38098000199424],
      [-5.778602024647321, 43.382624030152485],
      [-5.77221, 43.38381],
      [-5.764474425893337, 43.38368900997828],
      [-5.75858, 43.38345],
      [-5.75673, 43.38337],
      [-5.74935499499903, 43.382995016136704],
      [-5.74535, 43.38234],
      [-5.740984007321162, 43.38153803505108],
      [-5.73479, 43.38185],
      [-5.72883, 43.38213],
      [-5.72594, 43.38528],
      [-5.72013799123337, 43.38611003197281],
      [-5.714774995699464, 43.385745018213456],
      [-5.709724986926612, 43.38516502081223],
      [-5.70637, 43.38457],
      [-5.704595006610666, 43.38533500556649],
      [-5.7016, 43.38585],
      [-5.70246, 43.3877],
      [-5.70231, 43.39059],
      [-5.70311, 43.39251],
      [-5.70291, 43.3955],
      [-5.70201, 43.39862],
      [-5.70251, 43.40202],
      [-5.70476, 43.40389],
      [-5.70715, 43.40564],
      [-5.70886, 43.40863],
      [-5.70989, 43.41157],
      [-5.70981, 43.41442],
      [-5.71062, 43.41694],
      [-5.70801, 43.42045],
      [-5.70711, 43.42182],
      [-5.7046, 43.42169],
      [-5.70072, 43.42104],
      [-5.698375002764508, 43.42254500014624],
      [-5.696453338420239, 43.424130007333105],
      [-5.69289, 43.42472],
      [-5.690806674620484, 43.427166668238],
      [-5.688085004093023, 43.42931500268169],
      [-5.6848, 43.43055],
      [-5.68296, 43.43157],
      [-5.68355, 43.43258],
      [-5.68219, 43.43443],
      [-5.68341, 43.43521],
      [-5.68294, 43.43656],
      [-5.68423, 43.43756],
      [-5.68313, 43.43813],
      [-5.68155, 43.44074],
      [-5.67914, 43.44338],
      [-5.67667, 43.44384],
      [-5.67668, 43.44486],
      [-5.67673, 43.44636],
      [-5.6759, 43.4474],
      [-5.67712, 43.44841],
      [-5.67684, 43.44945],
      [-5.67649, 43.45109],
      [-5.677639992305925, 43.45204000556895],
      [-5.68052, 43.45281],
      [-5.68306, 43.45416],
      [-5.68686, 43.45497],
      [-5.688769996520287, 43.45650500097965],
      [-5.690679987777886, 43.458283336696546],
      [-5.69181, 43.4602],
      [-5.69273, 43.4615],
      [-5.69383, 43.46241],
      [-5.69372, 43.46429],
      [-5.6953, 43.4652],
      [-5.69585, 43.46621],
      [-5.69509, 43.46691],
      [-5.69423, 43.46771],
      [-5.69572, 43.46852],
      [-5.69601, 43.46971],
      [-5.69469, 43.47097],
      [-5.69317, 43.47121],
    ];
    const rawEle = [
      { distance: 0, ele: 241.47 },
      { distance: 20, ele: 220.45 },
      { distance: 40, ele: 203.92 },
      { distance: 60, ele: 197.9 },
      { distance: 80, ele: 185.36 },
      { distance: 100, ele: 176.77 },
      { distance: 120, ele: 174.13 },
      { distance: 140, ele: 178.31 },
      { distance: 160, ele: 178.97 },
      { distance: 180, ele: 176.85 },
      { distance: 200, ele: 180.65 },
      { distance: 220, ele: 173.3 },
      { distance: 240, ele: 170.38 },
      { distance: 260, ele: 171.88 },
      { distance: 280, ele: 186.86 },
      { distance: 300, ele: 191.34 },
      { distance: 320, ele: 186.06 },
      { distance: 340, ele: 182.47 },
      { distance: 360, ele: 182.54 },
      { distance: 380, ele: 189.06 },
      { distance: 400, ele: 188.2 },
      { distance: 420, ele: 186.9 },
      { distance: 440, ele: 191.5 },
      { distance: 460, ele: 196.03 },
      { distance: 480, ele: 201.01 },
      { distance: 500, ele: 202.16 },
      { distance: 520, ele: 209.1 },
      { distance: 540, ele: 209.93 },
      { distance: 560, ele: 211.91 },
      { distance: 580, ele: 212.9 },
      { distance: 600, ele: 208.9 },
      { distance: 620, ele: 198.53 },
      { distance: 640, ele: 188.38 },
      { distance: 660, ele: 190.26 },
      { distance: 680, ele: 190.09 },
      { distance: 700, ele: 189.74 },
      { distance: 720, ele: 194.49 },
      { distance: 740, ele: 196.32 },
      { distance: 760, ele: 196.09 },
      { distance: 780, ele: 197.46 },
      { distance: 800, ele: 200.01 },
      { distance: 820, ele: 207.09 },
      { distance: 840, ele: 202.82 },
      { distance: 860, ele: 205.66 },
      { distance: 880, ele: 206.96 },
      { distance: 900, ele: 207.36 },
      { distance: 920, ele: 208.58 },
      { distance: 940, ele: 214.29 },
      { distance: 960, ele: 214.31 },
      { distance: 980, ele: 217.24 },
      { distance: 1000, ele: 218.7 },
      { distance: 1020, ele: 219.49 },
      { distance: 1040, ele: 231.22 },
      { distance: 1060, ele: 237.56 },
      { distance: 1080, ele: 244.35 },
      { distance: 1100, ele: 256.22 },
      { distance: 1120, ele: 263.4 },
      { distance: 1140, ele: 269.41 },
      { distance: 1160, ele: 274.96 },
      { distance: 1180, ele: 280.53 },
      { distance: 1200, ele: 293.15 },
      { distance: 1220, ele: 306.9 },
      { distance: 1240, ele: 316.08 },
      { distance: 1260, ele: 320.74 },
      { distance: 1280, ele: 329.28 },
      { distance: 1300, ele: 333.27 },
      { distance: 1320, ele: 333.75 },
      { distance: 1340, ele: 328.86 },
      { distance: 1360, ele: 321.13 },
      { distance: 1380, ele: 314.16 },
      { distance: 1400, ele: 303.33 },
      { distance: 1420, ele: 292.79 },
      { distance: 1440, ele: 279.99 },
      { distance: 1460, ele: 275.24 },
      { distance: 1480, ele: 267.24 },
      { distance: 1500, ele: 259.26 },
      { distance: 1520, ele: 254.28 },
      { distance: 1540, ele: 250.72 },
      { distance: 1560, ele: 245.2 },
      { distance: 1580, ele: 239.06 },
      { distance: 1600, ele: 236.72 },
      { distance: 1620, ele: 235.19 },
      { distance: 1640, ele: 231.11 },
      { distance: 1660, ele: 226.8 },
      { distance: 1680, ele: 222.02 },
      { distance: 1700, ele: 214.93 },
      { distance: 1720, ele: 210.54 },
    ];

    return {
      coords: rawCoords,
      elevData: rawEle,
      center: { lon: -5.76, lat: 43.42 },
    };
  }, []);

  const routeGeojson = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          properties: {},
          geometry: { type: 'LineString' as const, coordinates: coords },
        },
      ],
    }),
    [coords],
  );

  const citiesGeojson = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          properties: { name: 'Oviedo' },
          geometry: { type: 'Point' as const, coordinates: [-5.8494, 43.3614] },
        },
        {
          type: 'Feature' as const,
          properties: { name: 'Gijón' },
          geometry: { type: 'Point' as const, coordinates: [-5.6611, 43.5357] },
        },
        {
          type: 'Feature' as const,
          properties: { name: 'Llanes' },
          geometry: { type: 'Point' as const, coordinates: [-4.7548, 43.4208] },
        },
      ],
    }),
    [],
  );

  const mapStyle = {
    version: 8 as const,
    sources: {
      satellite: {
        type: 'raster' as const,
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        attribution: 'Esri, Maxar, Earthstar Geographics',
      },
    },
    layers: [
      {
        id: 'satellite-layer',
        type: 'raster' as const,
        source: 'satellite',
        paint: {
          'raster-opacity': 0.8,
        },
      },
    ],
  };

  return (
    <div
      aria-hidden="true"
      className="bg-background dark:border-border relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-slate-200 shadow-2xl shadow-slate-300/50 dark:shadow-blue-900/10"
    >
      {/* App Header Mockup */}
      <div className="border-border bg-card flex h-14 items-center justify-between border-b px-4 md:px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-400 shadow-sm" />
            <div className="h-3 w-3 rounded-full bg-amber-400 shadow-sm" />
            <div className="h-3 w-3 rounded-full bg-green-400 shadow-sm" />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="bg-muted/50 text-muted-foreground flex h-8 w-full max-w-sm items-center justify-center gap-2 rounded-md text-xs font-medium">
            <Navigation className="h-3 w-3" />
            zustrack.com/app/route
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-muted h-8 w-8 rounded-full" />
        </div>
      </div>

      {/* Main App Layout Mockup (Two Columns) */}
      <div className="bg-background flex h-[600px] flex-col overflow-y-auto md:h-auto lg:h-[600px] lg:flex-row lg:overflow-hidden">
        {/* Left Column */}
        <div className="border-border custom-scrollbar bg-background flex w-full shrink-0 flex-col gap-4 p-4 md:gap-6 md:p-6 lg:w-[45%] lg:overflow-y-auto lg:border-r">
          {/* Activity Config */}
          <div className="border-border bg-card rounded-xl border p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
                <Settings2 className="text-primary h-4 w-4" />
                {t('config')}
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="border-border bg-muted/50 flex flex-col justify-center gap-1 rounded-lg border p-3">
                <span className="text-muted-foreground text-xs">{t('activity')}</span>
                <span className="text-sm font-medium">{t('cycling')}</span>
              </div>
              <div className="border-border bg-muted/50 flex flex-col justify-center gap-1 rounded-lg border p-3">
                <span className="text-muted-foreground text-xs">{t('date')}</span>
                <span className="text-sm font-medium">{t('dateValue')}</span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <div className="bg-primary text-primary-foreground flex h-10 flex-1 items-center justify-center rounded-md text-sm font-medium shadow-sm">
                {t('analyzeBtn')}
              </div>
              <div className="border-input bg-background flex h-10 w-10 items-center justify-center rounded-md border">
                <Filter className="text-muted-foreground h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Elevation Tabs */}
          <div className="border-border bg-card flex flex-col overflow-hidden rounded-xl border shadow-sm">
            <div className="border-border bg-muted/20 flex border-b">
              <div className="border-primary text-foreground flex-1 border-b-2 py-3 text-center text-sm font-medium">
                {t('tabElev')}
              </div>
              <div className="text-muted-foreground flex-1 py-3 text-center text-sm font-medium">
                {t('tabTerrain')}
              </div>
              <div className="text-muted-foreground flex-1 py-3 text-center text-sm font-medium">
                {t('tabWeather')}
              </div>
            </div>

            <div className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
                  {t('profile')}
                </span>
                <span className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-[10px] font-bold">
                  {t('gain')}
                </span>
              </div>

              <div className="mt-2 h-32 w-full">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={elevData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorEleReal" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor={resolvedTheme === 'dark' ? '#3b82f6' : '#2563eb'}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor={resolvedTheme === 'dark' ? '#3b82f6' : '#2563eb'}
                            stopOpacity={0.0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="distance" hide />
                      <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
                      <Area
                        type="monotone"
                        dataKey="ele"
                        stroke={resolvedTheme === 'dark' ? '#3b82f6' : '#2563eb'}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorEleReal)"
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Summary Route */}
          <div className="border-border bg-card rounded-xl border p-4 shadow-sm">
            <h3 className="text-foreground mb-4 flex items-center gap-2 text-sm font-semibold">
              <Activity className="text-primary h-4 w-4" />
              {t('summary')}
            </h3>
            <div className="grid grid-cols-3 gap-x-2 gap-y-4">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[10px] tracking-wider uppercase">
                  {t('distLabel')}
                </span>
                <span className="text-lg font-bold">42.5 km</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[10px] tracking-wider uppercase">
                  {t('timeLabel')}
                </span>
                <span className="text-lg font-bold">3h 15m</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[10px] tracking-wider uppercase">
                  {t('altLabel')}
                </span>
                <span className="text-lg font-bold">333m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Map */}
        <div className="bg-muted relative h-[400px] w-full flex-shrink-0 overflow-hidden lg:h-full lg:w-[55%]">
          {mounted && (
            <Map
              ref={mapRef}
              initialViewState={{
                longitude: center.lon,
                latitude: center.lat,
                zoom: initialZoom,
                pitch: 0,
                bearing: 0,
              }}
              mapStyle={mapStyle}
              interactive={false}
              style={{ width: '100%', height: '100%' }}
              maxZoom={14}
              attributionControl={false}
            >
              <Source id="route" type="geojson" data={routeGeojson}>
                <Layer
                  id="route-line-casing"
                  type="line"
                  layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                  paint={{ 'line-color': '#ffffff', 'line-width': 6, 'line-opacity': 0.8 }}
                />
                <Layer
                  id="route-line"
                  type="line"
                  layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                  paint={{ 'line-color': '#ef4444', 'line-width': 4 }}
                />
              </Source>

              <Source id="cities" type="geojson" data={citiesGeojson}>
                <Layer
                  id="city-points"
                  type="circle"
                  paint={{
                    'circle-radius': 4,
                    'circle-color': '#ffffff',
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#000000',
                  }}
                />
                <Layer
                  id="city-labels"
                  type="symbol"
                  layout={{
                    'text-field': ['get', 'name'],
                    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                    'text-size': 12,
                    'text-offset': [0, 1.2],
                    'text-anchor': 'top',
                  }}
                  paint={{
                    'text-color': '#ffffff',
                    'text-halo-color': '#000000',
                    'text-halo-width': 2,
                  }}
                />
              </Source>
            </Map>
          )}

          {/* Stats Overlay */}
          <div className="no-scrollbar absolute right-4 bottom-4 left-4 z-10 flex flex-col gap-2 overflow-x-auto pb-2 sm:pb-0 lg:flex-row">
            {[
              {
                icon: <Thermometer className="h-4 w-4 text-orange-500" />,
                val: '18°C',
                sub: t('avgLabel'),
              },
              {
                icon: <Wind className="h-4 w-4 text-blue-500" />,
                val: '15 km/h',
                sub: t('windLabel'),
              },
              {
                icon: <CloudRain className="h-4 w-4 text-indigo-500" />,
                val: '0 mm',
                sub: t('rainLabel'),
              },
            ].map((s, i) => (
              <div
                key={i}
                className="border-border bg-background/90 flex min-w-[110px] items-center gap-3 rounded-lg border px-3 py-2 shadow-sm backdrop-blur-md sm:min-w-fit sm:px-4"
              >
                <div className="bg-muted shrink-0 rounded-full p-1.5">{s.icon}</div>
                <div className="min-w-0">
                  <div className="text-foreground truncate text-xs font-bold sm:text-sm">
                    {s.val}
                  </div>
                  <div className="text-muted-foreground truncate text-[9px] sm:text-[10px]">
                    {s.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
