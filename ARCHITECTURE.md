# Zustrack Project Architecture

## Directory Structure

```text
/app                        # Next.js 16 App Router
  /[locale]                 # i18n locale wrapper (en, es, ca)
    /page.tsx               # Landing/home
    /landing/               # Landing page
    /privacy/               # Privacy policy
    /terms/                 # Terms of service
    /app/
      /login/               # OAuth login page
      /setup/               # Initial configuration
      /route/               # Main route analysis page
  /api
    /auth/                  # NextAuth handlers
    /weather/route.ts       # POST — weather analysis
    /weather/best-window/   # POST — find optimal weather day
    /route-info/route.ts    # POST — terrain & infrastructure
    /strava/activities/     # POST — list Strava activities
    /strava/routes/         # POST — list Strava routes
    /strava/gpx/            # POST — download GPX from Strava
    /wikiloc/route.ts       # POST — import Wikiloc route

/components                 # Reusable UI components
  /ui                       # ~52 Shadcn/UI primitives (Button, Dialog, Card…)
  /route-map/               # MapLibre GL map (sub-components: controls, markers, layers)
  /weather-timeline/        # Timeline visualization of weather along route
  route-map.tsx             # Main MapLibre GL wrapper (dynamic, SSR disabled)
  route-advice.tsx          # Main analysis output panel
  route-config-panel.tsx    # Date/time/speed configuration controls
  route-hazards.tsx         # Hazard segment visualization
  best-departure-finder.tsx # Optimal weather window UI
  saved-routes-list.tsx     # Saved routes browser (Dexie-backed)
  gpx-upload.tsx            # GPX file uploader
  strava-import.tsx         # Strava OAuth + route picker
  wikiloc-import.tsx        # Wikiloc route import modal
  settings-provider.tsx     # SettingsContext (units, wind unit)
  theme-provider.tsx        # Theme context
  weather-icon.tsx          # WMO code → Lucide icon
  wind-arrow.tsx            # Directional wind indicator

/hooks                      # Custom React hooks
  use-route-analysis.ts     # Main analysis orchestrator (calls APIs, enriches points)
  use-route-hazards.ts      # Hazard computation from weatherPoints
  use-saved-routes.ts       # Dexie.js CRUD for saved routes
  use-settings.ts           # SettingsContext accessor
  use-route-segments.ts     # Path type/surface segment grouping
  use-weather-summary.ts    # Aggregated weather stats for a route
  use-elevation-chart.ts    # Elevation profile data formatting
  use-activity-config.ts    # Activity-type-aware defaults
  use-analysis-metrics.ts   # IBP, Naismith, hydration metrics
  use-toast.ts              # Sonner toast helper

/lib                        # Core business logic & utilities
  types.ts                  # ALL TypeScript interfaces — single source of truth
  db.ts                     # Dexie.js (IndexedDB) client & SavedRoute schema
  gpx-parser.ts             # GPX parsing, bearing, wind effect, polyline decode
  weather-providers.ts      # Weather strategy pattern (Open-Meteo → WeatherAPI → Tomorrow.io)
  utils.ts                  # cn(), IBP index, solar position/intensity, Naismith, speeds
  mud-risk.ts               # Mud risk scoring (surface, precipitation, evaporation, slope)
  snowshoe.ts               # Snow equipment recommendation (boots/snowshoes/crampons)
  viability-score.ts        # Go/caution/danger route viability engine
  route-colors.ts           # Hex palettes for path types and surfaces
  slope-colors.ts           # Hex palettes for slope gradient visualization
  geometry.ts               # Haversine, slope, bearing helpers
  i18n.ts                   # i18n utilities
  twkb-parser.ts            # TWKB binary geometry decoder (Wikiloc)
  tkwb-parser.ts            # Legacy TKWB decoder (fallback)

/store                      # Zustand global state
  route-store.ts            # Unified route/map/analysis store

/messages                   # next-intl translation files
  en.json                   # English
  es.json                   # Spanish
  ca.json                   # Catalan

/i18n
  routing.ts                # Locale detection & routing config

/styles
  globals.css               # Tailwind v4 base + animations

/testing                    # Test fixtures and mock GPX data

auth.ts                     # NextAuth v5 config (Strava, Google, Facebook, Twitter)
proxy.ts                    # Middleware: i18n locale detection + auth-guard redirects
next.config.mjs             # Next.js configuration
tsconfig.json               # TypeScript strict config
components.json             # Shadcn/UI config
postcss.config.mjs          # PostCSS + Tailwind
.env.example                # Required environment variables
```

## Data Flow

```
User uploads GPX / imports from Strava / Wikiloc
       ↓
lib/gpx-parser.ts — parse XML, sample 48 points, calculate bearings
       ↓
POST /api/weather — Open-Meteo (primary) → WeatherAPI → Tomorrow.io (fallbacks)
POST /api/route-info — Overpass OSM (escape points, water, surface) + Open-Meteo Elevation
       ↓
hooks/use-route-analysis.ts — enrich points:
  bearing + wind effect (tailwind/headwind/crosswind)
  solar exposure & intensity (sun/shade/night)
  mud risk score (lib/mud-risk.ts)
  snow condition (lib/snowshoe.ts)
  viability rating (lib/viability-score.ts)
       ↓
store/route-store.ts — weatherPoints: RouteWeatherPoint[] persisted in Zustand
       ↓
Map + Weather Timeline + Route Advice + Hazards components read from store
```

## State Architecture

| State Layer      | Location                    | Purpose                                              |
| :--------------- | :-------------------------- | :--------------------------------------------------- |
| Zustand Store    | `store/route-store.ts`      | All route/map/analysis state; no prop drilling       |
| React Context    | `components/settings-provider.tsx` | Units and wind unit preferences (localStorage) |
| Dexie.js         | `lib/db.ts`                 | Client-side `saved_routes` table (IndexedDB)         |
| NextAuth Session | `auth.ts`                   | Auth state (JWT → session, `accessToken`, `provider`)|

### Key Zustand State Fields

| Field                    | Set by                  | Read by                          |
| :----------------------- | :---------------------- | :------------------------------- |
| `weatherPoints`          | `useRouteAnalysis`      | All analysis components          |
| `exactSelectedPoint`     | Map hover               | Elevation chart (ReferenceLine)  |
| `chartHoverPoint`        | Chart/hazard hover      | Map (cursor dot)                 |
| `activeFilter`           | UI controls             | Map layer coloring               |
| `selectedRange`          | Chart selection         | Filtered analysis views          |
| `config`                 | `RouteConfigPanel`      | `useRouteAnalysis` (date/time/speed) |
| `isWeatherAnalyzed`      | `useRouteAnalysis`      | UI guards for action buttons     |
| `bestWindows`            | `handleFindBestWindow`  | `BestDepartureFinder` component  |

## Weather Provider Chain

```
Open-Meteo (free, bulk queries, hourly, radiation + snow depth)
    → on failure →
WeatherAPI (WEATHERAPI_API_KEY, per-location)
    → on failure →
Tomorrow.io (TOMORROW_IO_API_KEY, per-location)
```

## API Endpoints

| Endpoint                      | Method | Purpose                                   |
| :---------------------------- | :----- | :---------------------------------------- |
| `/api/weather`                | POST   | Weather data for route points             |
| `/api/weather/best-window`    | POST   | Find optimal departure day (7-day scan)   |
| `/api/route-info`             | POST   | Terrain, surfaces, escape points, coverage|
| `/api/strava/activities`      | POST   | List user's Strava activities             |
| `/api/strava/routes`          | POST   | List user's Strava routes                 |
| `/api/strava/gpx`             | POST   | Download GPX from a Strava activity       |
| `/api/wikiloc`                | POST   | Import route from Wikiloc                 |
| `/api/auth/*`                 | ANY    | NextAuth handlers (public)                |

## Routing & Middleware

- All pages are locale-scoped: `app/[locale]/...`
- `proxy.ts` handles:
  1. Bypass for `/api/auth/*`
  2. Locale detection and redirect (root → `/{locale}/`)
  3. Auth guard: public paths (`/`, `/terms`, `/privacy`, `/app/login`) pass through; all others require session
- Locales: `en`, `es`, `ca` (defined in `i18n/routing.ts`)
