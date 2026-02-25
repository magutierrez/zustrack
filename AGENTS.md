# AGENTS.md — zustrack Developer Context

> **System Prompt Injection**: When working on **zustrack**, adopt the persona of a Senior Frontend Engineer specialized in Geospatial Data and Local-First Architectures. You prioritize performance, type safety, and offline capabilities.

## 1. Project Overview

**zustrack** is a Next.js 16 web application for outdoor enthusiasts (cyclists and hikers). It provides detailed point-by-point meteorological and physical analysis of GPX tracks or Strava/Wikiloc activities.

- **Core Value**: Hyper-local weather forecasting along a route path, enriched with terrain, safety, and physiology data.
- **Privacy Strategy**: **Local-First**. User route data is stored in the browser via Dexie.js (IndexedDB). No central backend database stores user tracks.

## 2. Tech Stack (Critical Versions)

| Package              | Version  | Role                                      |
| :------------------- | :------- | :---------------------------------------- |
| Next.js              | 16.1.6   | App Router, Turbo, experimental-https     |
| React                | 19.2.3   | UI library                                |
| TypeScript           | strict   | Language                                  |
| Tailwind CSS         | v4       | Styling                                   |
| Shadcn/UI            | latest   | Component primitives (Radix-based)        |
| Zustand              | 5.0.11   | Global state management                   |
| Dexie.js             | 4.3.0    | IndexedDB client-side database            |
| MapLibre GL          | 5.18.0   | Map rendering                             |
| react-map-gl         | 8.1.0    | React wrapper for MapLibre                |
| Recharts             | 2.15.0   | Elevation and weather charts              |
| Auth.js (NextAuth)   | v5 beta  | Authentication                            |
| next-intl            | 4.8.2    | i18n (en, es, ca)                         |
| React Hook Form      | 7.54.1   | Form management                           |
| Zod                  | 3.24.1   | Schema validation                         |
| SWR                  | 2.3.3    | Data fetching cache                       |
| Sonner               | latest   | Toast notifications                       |
| gpxparser            | 3.0.8    | GPX XML parsing                           |
| date-fns             | 4.1.0    | Date utilities                            |

## 3. Architecture & Patterns

### 3.1 Database (Local-First — Dexie.js)

- **Location**: `lib/db.ts`
- **Engine**: Dexie.js v4 backed by IndexedDB (`idb://zustrack-storage` equivalent).
- **Schema**: `saved_routes` table, indexed on `id`, `user_email`, `created_at`.
- **Constraint**: All DB operations are client-side only. Never import `lib/db.ts` in Server Components or API routes.
- **Hook**: `hooks/use-saved-routes.ts` wraps all DB access for components.

### 3.2 Map Integration

- **Location**: `components/route-map.tsx` (dynamic import, `ssr: false`)
- **Library**: `react-map-gl` v8 wrapping `maplibre-gl` v5.
- **Sources**: GeoJSON for tracks (`type: 'line'`) and waypoints (`type: 'circle'`).
- **Interactivity**: Hover/click sync with the Elevation Profile via `exactSelectedPoint` and `chartHoverPoint` in the Zustand store.
- **Layers**: Standard, Satellite, Hybrid, Topographic; 3D terrain via open-terrain tiles.
- **Segment coloring**: Route colored by path type, surface, hazard level, or slope gradient.

### 3.3 Weather Engine

- **Location**: `lib/weather-providers.ts`
- **Pattern**: Strategy Pattern via `WeatherProvider` interface.
- **Fallback Chain**:
  1. **Open-Meteo** (primary — free, bulk queries, hourly resolution, includes radiation + snow depth)
  2. **WeatherAPI** (fallback #1 — requires `WEATHERAPI_API_KEY`)
  3. **Tomorrow.io** (fallback #2 — requires `TOMORROW_IO_API_KEY`)
- **Data Flow**: GPX → 48 sampled points → `/api/weather` → provider chain → `WeatherData[]` → enrichment → `RouteWeatherPoint[]`.
- **Extended data**: Open-Meteo also fetches 72h past precipitation (mud risk) and 48h snow history (freeze/thaw detection).

### 3.4 State Management (Zustand)

- **Location**: `store/route-store.ts`
- **Rule**: All route/map/analysis state lives here. No prop drilling for shared state.
- **Key cross-component signals**:
  - `exactSelectedPoint`: map hover → elevation chart ReferenceLine
  - `chartHoverPoint`: chart hover → map cursor dot
  - `activeFilter`, `selectedRange`, `weatherPoints`, `elevationData`, `gpxData`
- **Complex logic** (API calls, parsing, effects) stays in `hooks/` and uses store setters internally.

### 3.5 Analysis Enrichment (useRouteAnalysis)

- **Location**: `hooks/use-route-analysis.ts`
- **Exports**: `handleAnalyze`, `handleClearGPX`, `handleReverseRoute`, `handleFindBestWindow`
- **Enrichment pipeline** (per point):
  1. Bearing + wind effect (tailwind / headwind / crosswind)
  2. Solar exposure (sun / shade / night) + intensity (shade / weak / moderate / intense)
  3. Mud risk score (`lib/mud-risk.ts`)
  4. Snow equipment recommendation (`lib/snowshoe.ts`)
- **Retry logic**: 429 errors are retried up to 3 times with exponential backoff.

### 3.6 Risk & Viability Engines

| File                     | Purpose                                                              |
| :----------------------- | :------------------------------------------------------------------- |
| `lib/mud-risk.ts`        | Surface retention + precipitation + evaporation + slope → 0–1 score |
| `lib/snowshoe.ts`        | Snow depth + slope angle → equipment recommendation                  |
| `lib/viability-score.ts` | Wind + storm + temperature + visibility → Go/Caution/Danger rating   |

### 3.7 Internationalization (i18n)

- **Mandatory for all user-facing text.**
- Client: `useTranslations('Namespace')` | Server: `getTranslations('Namespace')`.
- Translation files: `messages/en.json`, `messages/es.json`, `messages/ca.json`.
- Locale routing via `i18n/routing.ts`; middleware in `proxy.ts`.

## 4. Directory Structure Map

| Path                           | Purpose                                                     |
| :----------------------------- | :---------------------------------------------------------- |
| `/app/[locale]/app/route`      | Main route analysis page                                    |
| `/app/api/weather`             | Weather endpoint (POST)                                     |
| `/app/api/weather/best-window` | Best departure window endpoint (POST)                       |
| `/app/api/route-info`          | Terrain + infrastructure endpoint (POST)                    |
| `/app/api/strava/*`            | Strava integration (activities, routes, GPX download)       |
| `/app/api/wikiloc`             | Wikiloc import endpoint (POST)                              |
| `/components/ui`               | Shadcn/UI primitives (~52 components)                       |
| `/components/route-map.tsx`    | MapLibre GL map (dynamic import, SSR disabled)              |
| `/components/route-advice.tsx` | Main analysis output panel                                  |
| `/hooks/use-route-analysis.ts` | Analysis orchestrator — calls APIs, enriches points         |
| `/lib/types.ts`                | ALL TypeScript interfaces — single source of truth          |
| `/lib/db.ts`                   | Dexie.js IndexedDB client + SavedRoute schema               |
| `/lib/gpx-parser.ts`           | GPX parsing, bearing, wind effect, polyline/TWKB decode     |
| `/lib/weather-providers.ts`    | Weather provider strategy implementations                   |
| `/lib/utils.ts`                | `cn()`, IBP, solar position/intensity, Naismith, speed calc |
| `/lib/mud-risk.ts`             | Mud risk computation                                        |
| `/lib/snowshoe.ts`             | Snow equipment recommendation                               |
| `/lib/viability-score.ts`      | Route viability rating                                      |
| `/store/route-store.ts`        | Zustand global store                                        |
| `/messages/{en,es,ca}.json`    | Localization strings                                        |
| `/auth.ts`                     | NextAuth v5 config (Strava, Google, Facebook, Twitter)      |
| `/proxy.ts`                    | Middleware: i18n locale detection + auth-guard              |

## 5. Development Rules

1. **Strict TypeScript**: `any` is forbidden. All interfaces go in `lib/types.ts`.
2. **Tailwind v4**: Use v4 engine conventions; `cn()` from `lib/utils.ts` for merging.
3. **Shadcn/UI**: `npx shadcn@latest add [component]` for new primitives; prefer composing existing ones.
4. **i18n mandatory**: All user-facing strings must use `useTranslations()`. Add keys to all three locale files.
5. **Map components**: Always dynamically imported with `ssr: false`.
6. **No prop drilling**: Shared state goes in the Zustand store.
7. **New weather providers**: Implement `WeatherProvider` interface in `lib/weather-providers.ts`.
8. **Type-check**: Run `npm run tsc` to validate before merging.

## 6. Common Tasks (Quick Reference)

- **Add a weather provider**: Implement `WeatherProvider` interface in `lib/weather-providers.ts`, add to fallback chain in `/api/weather/route.ts`.
- **Modify saved route schema**: Update `lib/db.ts` — Dexie migration is manual (bump version + add stores/indexes).
- **Add a new UI string**: Add the key to `messages/en.json`, `messages/es.json`, and `messages/ca.json`.
- **Add a new Shadcn component**: `npx shadcn@latest add [component-name]`.
- **Add new global state**: Extend the store type in `store/route-store.ts`; new interfaces in `lib/types.ts`.
- **Add a new risk engine**: Create `lib/<feature>.ts`, call it from `hooks/use-route-analysis.ts` during enrichment.
