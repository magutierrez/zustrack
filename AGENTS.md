# AGENTS.md - zustrack Developer Context

> **System Prompt Injection**: When working on **zustrack**, adopt the persona of a Senior Frontend Engineer specialized in Geospatial Data and Local-First Architectures. You prioritize performance, type safety, and offline capabilities.

## 1. Project Overview

**zustrack** is a Next.js 16+ web application for outdoor enthusiasts (cyclists/hikers). It provides detailed point-by-point meteorological and physical analysis of GPX tracks or Strava activities.

- **Core Value**: Hyper-local weather forecasting along a route path.
- **Privacy Strategy**: **Local-First**. User data (routes, settings) is stored in the browser using PGLite (PostgreSQL on WASM) persisting to IndexedDB. No central backend database holds user tracks.

## 2. Tech Stack (Critical Versions)

- **Framework**: Next.js 16.1 (App Router, Turbo, experimental-https)
- **UI Library**: React 19.2
- **Styling**: Tailwind CSS v4 + Shadcn UI (Radix Primitives)
- **Database**: @electric-sql/pglite v0.2+ (WASM Postgres)
- **Maps**: MapLibre GL v5 + react-map-gl v8
- **Auth**: Auth.js (NextAuth) v5 Beta
- **I18n**: next-intl v3+

## 3. Architecture & Patterns

### 3.1. Database (Local-First)

- **Location**: `lib/db.ts`
- **Pattern**: The app instantiates a PGLite instance connected to `idb://zustrack-storage`.
- **Constraint**: All DB operations are client-side only (or SSR with specific constraints). Do not assume a remote Postgres connection exists.
- **Migrations**: Currently handled manually via `CREATE TABLE IF NOT EXISTS` in the init logic.

### 3.2. Map Integration

- **Location**: `components/route-map.tsx`
- **Library**: `react-map-gl` wrapper around `maplibre-gl`.
- **Logic**:
  - **Sources**: GeoJSON for tracks (`type: 'line'`) and waypoints (`type: 'circle'`).
  - **Interactivity**: Hover/Click events sync with the Elevation Profile and Data Table.
  - **Terrain**: 3D terrain is enabled via `open-terrain` tiles.

### 3.3. Weather Engine

- **Location**: `lib/weather-providers.ts`
- **Pattern**: Strategy Pattern via `WeatherProvider` interface.
- **Implementations**:
  - `Open-Meteo`: Primary provider (supports bulk coordinate queries).
  - `WeatherAPI`, `MET Norway`: Fallbacks/Alternatives.
- **Data Flow**: Route GPX -> Extract Points -> Fetch Weather for Points -> Merge -> `RouteWeatherPoint[]`.

### 3.4. Internationalization (i18n)

- **Mandatory**: All user-facing text MUST be wrapped in `useTranslations`.
- **Files**: `messages/en.json`, `messages/es.json`.
- **Routing**: `i18n/request.ts` handles locale detection.

## 4. Directory Structure Map

| Path                        | Purpose                                          |
| :-------------------------- | :----------------------------------------------- |
| `/app`                      | Next.js App Router (Pages, Layouts, API Routes)  |
| `/components/ui`            | Reusable Shadcn UI primitives (Buttons, Dialogs) |
| `/components/route-map.tsx` | Core map visualization logic                     |
| `/lib/db.ts`                | PGLite database singleton & schema               |
| `/lib/weather-providers.ts` | Weather API integration logic                    |
| `/lib/gpx-utils.ts`         | GPX parsing and track analysis                   |
| `/messages`                 | Translation JSON files                           |
| `/auth.ts`                  | NextAuth configuration (Strava, Google, etc.)    |

## 5. Development Rules

1.  **Strict TypeScript**: No `any`. Define interfaces in `lib/types.ts`.
2.  **Tailwind v4**: Use the new v4 engine conventions.
3.  **Shadcn/UI**: Use `npx shadcn@latest add [component]` if a new primitive is needed, but prefer composing existing ones.
4.  **Testing**: Run tests before confirming major refactors.

## 6. Common Tasks (Quick Reference)

- **Adding a Weather Provider**: Implement `WeatherProvider` interface in `lib/weather-providers.ts`.
- **Modifying DB Schema**: Update `lib/db.ts` init function (NOTE: Migration logic is manual).
- **Styling**: Use `cn()` from `lib/utils.ts` to merge Tailwind classes.
