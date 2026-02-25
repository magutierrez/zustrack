# Coding Conventions - Zustrack

## Naming

- **Components & Files**: `PascalCase` (e.g., `RouteConfigPanel.tsx`).
- **Hooks**: `camelCase` with `use` prefix (e.g., `useRouteAnalysis.ts`).
- **Store files**: `camelCase`, exported hook named `use<Name>Store` (e.g., `useRouteStore`).
- **Lib / utility files**: `kebab-case` (e.g., `gpx-parser.ts`, `mud-risk.ts`).
- **Types/Interfaces**: `PascalCase`, no `I` prefix (e.g., `RouteWeatherPoint`, not `IRouteWeatherPoint`).
- **All new interfaces** go in `lib/types.ts` — no local type definitions scattered across files.

## Styling (Tailwind CSS v4 + Shadcn/UI)

- Use Tailwind utility classes directly in `className`.
- For conditional/dynamic classes use `cn()` from `lib/utils.ts` (clsx + tailwind-merge).
- Do not create separate `.css` or `.scss` files except `styles/globals.css`.
- Add new Shadcn components via `npx shadcn@latest add [component]`. Prefer composing existing primitives.
- Dark mode and theming are handled by `components/theme-provider.tsx`.

## TypeScript

- **Strict TypeScript**: `any` is forbidden. Enable `tsc --noEmit` with `npm run tsc` before merging.
- All shared interfaces live in `lib/types.ts`.
- Zod schemas for API request/response validation when needed.

## Global State Management (Zustand)

- **Zustand is the global state solution.** Do NOT use prop drilling for shared UI/map/analysis state.
- Store lives in `store/route-store.ts`. One unified store for route/map/analysis state.
- Store file exports a single `useRouteStore` hook created with `create<State>()()`.
- Components read from the store directly: `useRouteStore((s) => s.field)` — never receive shared state as props.
- Complex side-effect logic (API calls, parsing, `useEffect`s) stays in custom hooks under `hooks/`. Those hooks use store setters internally and return only action-trigger functions.
- Only pass as props what is genuinely local to a component tree and not shared elsewhere.

## Client-Side Database (Dexie.js)

- The local database is managed by `lib/db.ts` using Dexie.js v4 (IndexedDB).
- The `saved_routes` table is keyed by `user_email`. No remote DB exists.
- All DB operations are client-side only; never import `lib/db.ts` in Server Components or API routes.
- Use `use-saved-routes.ts` hook to interact with the DB from components.

## i18n (Internationalization)

- **Mandatory for all user-facing strings.** No hardcoded UI text.
- Client components: `useTranslations('NamespaceName')` from `next-intl`.
- Server components: `getTranslations('NamespaceName')`.
- Add new keys to **all three** files: `messages/en.json`, `messages/es.json`, `messages/ca.json`.
- Namespaces mirror the component or feature name (e.g., `RouteAdvice.warning`).

## Map Components

- All map components must be **dynamically imported with `ssr: false`** to prevent SSR failures.
- MapLibre GL sources use GeoJSON (`type: 'line'` for tracks, `type: 'circle'` for points).
- Hover/click events on the map sync with the elevation chart via `exactSelectedPoint` and `chartHoverPoint` in the Zustand store.

## API Routes & Server Actions

- **Prefer Route Handlers** (`/app/api/`) for external API aggregation (weather, OSM, Strava).
- API routes validate input, call external services, and return typed JSON. No DB access.
- Use `Server Actions` (`"use server"`) only for lightweight mutations that don't need the full HTTP layer.
- Server Actions must return: `{ success: boolean, data?: T, error?: string }`.

## Weather Providers

- Implement the `WeatherProvider` interface in `lib/weather-providers.ts` to add a new provider.
- The fallback chain is: **Open-Meteo → WeatherAPI → Tomorrow.io**. Do not change provider order without discussion.
- `useRouteAnalysis` handles 429 retries with exponential backoff (3 attempts).

## Error Handling & Loading State

- Every async route in `/app` that consumes data must have its `loading.tsx` and `error.tsx`.
- Loading and error state for analysis is managed in the Zustand store (`isLoading`, `error`).

## Components: React Server vs Client

- Default to **React Server Components (RSC)**.
- Add `'use client'` only when interactivity is required: hooks, event listeners, map rendering.
- FORBIDDEN: Pages Router (`/pages`), `getServerSideProps`, `getStaticProps`, `getInitialProps`.
