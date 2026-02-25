# zustrack — Pro Outdoor Route Forecast

**zustrack** is a high-performance web application for cyclists and hikers who need more than a generic weather forecast. By analyzing GPX tracks or Strava/Wikiloc activities, the app delivers a point-by-point meteorological and physical analysis for safer, better-prepared outdoor sessions.

## Core Features

### 1. Smart Meteorological Analysis

- **Point-by-Point Forecast**: Temperature, wind speed, and precipitation probability for specific coordinates at the exact time you'll be passing through them.
- **Wind Effect Logic**: Calculates tailwind, headwind, or crosswind based on your travel bearing at every segment.
- **Solar Exposure & Hillshading**: Using astronomical algorithms, detects direct sun vs mountain shadow at every point.
- **Solar Intensity Scale**: A "Solar Sensation" scale from "Cool/Shade" to "Scorching Sun" based on real-time solar radiation (W/m²).
- **Best Departure Window**: Scans a 7-day forecast to find the optimal start day for your route.

### 2. Safety & Evacuation (Hiking Mode)

- **Automatic Escape Points**: Identifies nearest villages and main roads within 2.5 km using OpenStreetMap (OSM).
- **Water Sources**: Detects drinking water, springs, and taps along the route.
- **Daylight Countdown**: Real-time remaining light calculation based on your pace. Alerts if you are expected to arrive after sunset.
- **Mobile Coverage Estimation**: Estimates 4G/5G coverage availability based on proximity to cell towers (OpenCellID).
- **Mud Risk Score**: Surface + precipitation + evaporation + slope combined into a 0–1 risk index.
- **Snow Equipment Recommendation**: Recommends boots, snowshoes, crampons, or mountaineering gear based on snow depth and slope.

### 3. Physiology & Effort

- **IBP Index**: Objective difficulty score (cyclists and hikers have separate formulas).
- **Naismith's Rule**: Realistic arrival times with penalties for vertical gain.
- **Viability Rating**: Go / Caution / Danger composite score from wind, storm, temperature, and visibility conditions.
- **Hydration & Calorie Estimation**: Water (L) and energy (kcal) needs based on temperature, duration, and elevation profile.

### 4. Advanced Mapping

- **Interactive Layers**: Standard, Satellite, Hybrid, and Topographic (OpenTopoMap).
- **Colored Route Segments**: Visualize path type, surface, hazards, or slope gradient along the track.
- **Elevation Profile**: High-resolution chart synchronized with the map (hover on chart → cursor on map, and vice versa).

### 5. Route Import

- **GPX Upload**: Direct file upload.
- **Strava Import**: OAuth-authenticated activity and route fetch.
- **Wikiloc Import**: Route import via Wikiloc integration.
- **Saved Routes**: Client-side storage (IndexedDB via Dexie.js) — no server database.

## Tech Stack

| Layer         | Technology                                                                    |
| :------------ | :---------------------------------------------------------------------------- |
| Framework     | [Next.js 16](https://nextjs.org/) (App Router, Turbo, experimental-https)    |
| Language      | TypeScript (strict)                                                           |
| UI Library    | React 19                                                                      |
| Styling       | Tailwind CSS v4 + [Shadcn/UI](https://ui.shadcn.com/) (Radix primitives)     |
| State         | [Zustand](https://zustand-docs.pmnd.rs/) v5                                   |
| Local DB      | [Dexie.js](https://dexie.org/) v4 (IndexedDB)                                |
| Maps          | [MapLibre GL](https://maplibre.org/) v5 + [react-map-gl](https://visgl.github.io/react-map-gl/) v8 |
| Charts        | [Recharts](https://recharts.org/) v2                                          |
| Auth          | [Auth.js (NextAuth)](https://authjs.dev/) v5 — Strava, Google, Facebook, X   |
| i18n          | [next-intl](https://next-intl-docs.vercel.app/) v4 — English, Spanish, Catalan |
| Forms         | React Hook Form v7 + Zod v3                                                   |
| HTTP Cache    | SWR v2                                                                        |

## External APIs

| API                                                           | Purpose                                            |
| :------------------------------------------------------------ | :------------------------------------------------- |
| [Open-Meteo](https://open-meteo.com/)                         | Primary weather (temp, wind, radiation, snow depth)|
| [WeatherAPI](https://www.weatherapi.com/)                     | Weather fallback #1                                |
| [Tomorrow.io](https://www.tomorrow.io/)                       | Weather fallback #2                                |
| [Overpass API (OSM)](https://overpass-turbo.eu/)              | Escape points, water sources, path surfaces        |
| [Open-Meteo Elevation](https://open-meteo.com/)               | Elevation data (DEM)                               |
| [OpenCellID](https://opencellid.org/)                         | Mobile coverage estimation                         |
| [Strava API](https://developers.strava.com/)                  | Activity and route synchronization                 |
| [MapTiler](https://www.maptiler.com/)                         | Map tile hosting                                   |

## Pages

1. **`/[locale]/app/login`** — OAuth entry point (Strava, Google, Facebook, X).
2. **`/[locale]/app/setup`** — Initial activity and units configuration.
3. **`/[locale]/app/route`** — Main analysis engine:
   - Sidebar: date/time/speed config, GPX upload, Strava/Wikiloc import, saved routes.
   - Main area: Weather Analysis, Safety Advice, Effort/Hazards tabs.
   - Map: sticky interactive map with track visualization, segment coloring, and data popups.
4. **`/[locale]/terms`** — Terms of service.
5. **`/[locale]/privacy`** — Privacy policy.

## Privacy & Data

**zustrack is built with a "Privacy First" philosophy:**

- **No Persistent Server Storage**: GPX files and Strava tracks are processed in real-time. We do not store geographic tracks in any server database.
- **Local-First Storage**: Saved routes are stored in the browser's IndexedDB (Dexie.js), keyed by authenticated user email. Data is yours, locally.
- **Minimal Collection**: Authentication is used solely to provide a personalized experience and to fetch your own data from Strava with your explicit permission.

## Setup

```bash
# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env.local

# Start development server (HTTPS + Turbo)
npm run dev

# Type-check
npm run tsc

# Lint
npm run lint

# Format
npm run format
```

### Required Environment Variables (`.env.example`)

```
AUTH_SECRET=
AUTH_STRAVA_ID=
AUTH_STRAVA_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_FACEBOOK_ID=
AUTH_FACEBOOK_SECRET=
AUTH_TWITTER_ID=
AUTH_TWITTER_SECRET=
WEATHERAPI_API_KEY=
TOMORROW_IO_API_KEY=
NEXT_PUBLIC_MAPTILER_KEY=
OPENCELLID_API_KEY=   # optional
```

---

Built for those who reach the peaks.
