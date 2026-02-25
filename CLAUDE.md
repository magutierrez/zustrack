# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**zustrack** is a Next.js 16 (App Router) application that provides point-by-point meteorological and physical analysis for cyclists and hikers along GPX tracks. See `AGENTS.md` for the full developer context and persona.

## Commands

```bash
# Development (uses self-signed HTTPS + Turbo)
npm run dev
# → NODE_TLS_REJECT_UNAUTHORIZED=0 next dev -H 0.0.0.0 -p 3000 --experimental-https --turbo

npm run build       # Production build
npm run tsc         # Type-check only (no emit)
npm run lint        # ESLint
npm run format      # Prettier (write)
```

No test runner is configured. There is a `/testing` directory with test data fixtures.

## Architecture

### Data Flow

1. User uploads GPX or imports from Strava/Wikiloc
2. Client-side `lib/gpx-parser.ts` parses and samples points
3. `POST /api/weather` fetches weather from Open-Meteo (primary) with WeatherAPI/Tomorrow.io fallbacks
4. `POST /api/route-info` queries Overpass OSM for escape points/infrastructure and OpenCellID for coverage
5. Results merged into `RouteWeatherPoint[]` and rendered in map + timeline components

### Key File Locations

| Path | Purpose |
|------|---------|
| `lib/types.ts` | All TypeScript interfaces — add new types here |
| `lib/db.ts` | Dexie.js (IndexedDB) client-side database (`saved_routes` table) |
| `lib/gpx-parser.ts` | GPX parsing, bearing calculation, point sampling, polyline/TWKB decode |
| `lib/weather-providers.ts` | Weather strategy pattern (`WeatherProvider` interface) |
| `lib/utils.ts` | `cn()`, IBP index, Naismith rule, solar position/intensity, speed calc |
| `lib/mud-risk.ts` | Mud risk scoring (surface + precipitation + evaporation + slope) |
| `lib/snowshoe.ts` | Snow equipment recommendation (boots/snowshoes/crampons/mountaineering) |
| `lib/viability-score.ts` | Go/Caution/Danger composite viability rating |
| `lib/geometry.ts` | Geometric helpers (Haversine, slope, angle) |
| `store/route-store.ts` | Zustand global store — all route/map/analysis state |
| `hooks/use-route-analysis.ts` | Analysis orchestration (API calls, enrichment, store setters) |
| `hooks/use-route-hazards.ts` | Hazard segment computation from `weatherPoints` |
| `hooks/use-saved-routes.ts` | Dexie.js CRUD for saved routes |
| `hooks/use-analysis-metrics.ts` | IBP, Naismith, hydration metrics |
| `auth.ts` | NextAuth v5 config (Strava, Google, Facebook, Twitter) |
| `proxy.ts` | Middleware: i18n locale detection + auth-guard redirects |
| `components/route-map.tsx` | MapLibre GL map wrapper (dynamic import, SSR disabled) |
| `components/route-advice.tsx` | Main analysis output panel |
| `components/best-departure-finder.tsx` | Find optimal weather window UI |
| `app/api/weather/route.ts` | Weather endpoint (Open-Meteo → WeatherAPI → Tomorrow.io) |
| `app/api/weather/best-window/route.ts` | Best departure day finder (7-day scan) |
| `app/api/route-info/route.ts` | Terrain/infrastructure endpoint (Overpass + Elevation + OpenCellID) |
| `app/api/strava/activities/route.ts` | List user's Strava activities |
| `app/api/strava/routes/route.ts` | List user's Strava routes |
| `app/api/strava/gpx/route.ts` | Download GPX from Strava activity |
| `app/api/wikiloc/route.ts` | Import route from Wikiloc |

### State Management

- **Zustand** (`store/route-store.ts`): Global state for all route/map/analysis state. See `CONVENTIONS.md` for usage rules. Components read from the store directly — no prop drilling.
  - `exactSelectedPoint`: set by map hover → read by elevation chart for ReferenceLine
  - `chartHoverPoint`: set by chart/hazard hover → read by map for cursor dot
  - `activeFilter`, `selectedRange`, `weatherPoints`, `elevationData`, `gpxData`, etc.
- **React Context**: `SettingsContext` (units, wind unit) — persisted to `localStorage`
- **Custom hooks**: `useRouteAnalysis` (orchestrates analysis, uses store setters internally), `useSavedRoutes`, `useSettings`
- **Dexie.js**: `saved_routes` table keyed by `user_email` — all data is client-side only, no backend DB
- **Session**: NextAuth `useSession()` / server-side `auth()`

### Routing

- All pages are locale-scoped under `app/[locale]/`: `/login`, `/setup`, `/route`, `/terms`, `/privacy`
- API routes under `app/api/`: `weather`, `weather/best-window`, `route-info`, `strava/*`, `wikiloc`
- Middleware (`proxy.ts`): i18n locale detection → auth guard (public: `/`, `/terms`, `/privacy`, `/app/login`)
- i18n via `next-intl` v4 — locales: `en`, `es`, `ca` (configured in `i18n/routing.ts`)

## Development Rules

- **Strict TypeScript**: No `any`. All new interfaces go in `lib/types.ts`. Run `npm run tsc` to validate.
- **i18n is mandatory**: All user-facing strings must use `useTranslations()` (client) or `getTranslations()` (server). Add keys to `messages/en.json`, `messages/es.json`, and `messages/ca.json`.
- **Styling**: Tailwind CSS v4 + Shadcn/UI. Use `cn()` from `lib/utils.ts` for class merging. Add new Shadcn components via `npx shadcn@latest add [component]`.
- **Map components** must be dynamically imported with `ssr: false`.
- **No prop drilling**: Shared state goes in the Zustand store (`store/route-store.ts`). Components read from the store directly.
- **Dexie.js (client-only)**: Never import `lib/db.ts` in Server Components or API routes.
- **Weather providers**: Implement the `WeatherProvider` interface in `lib/weather-providers.ts` to add a new provider. Fallback chain: Open-Meteo → WeatherAPI → Tomorrow.io.
- **Risk engines**: New domain-specific risk logic goes in `lib/<feature>.ts` and is called from `hooks/use-route-analysis.ts` during the enrichment pipeline.
- **Environment variables**: See `.env.example` for required keys (`AUTH_*`, `WEATHERAPI_API_KEY`, `TOMORROW_IO_API_KEY`, `NEXT_PUBLIC_MAPTILER_KEY`, optional `OPENCELLID_API_KEY`).
