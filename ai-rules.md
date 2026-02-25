# AI Base Rules — Zustrack Project

## Core Stack

- **Framework**: Next.js 16 (App Router exclusively).
- **UI**: React 19, Tailwind CSS v4, Shadcn/UI.
- **Language**: TypeScript (Strict — `any` is forbidden).
- **State**: Zustand v5 (`store/route-store.ts`).
- **Local DB**: Dexie.js v4 (`lib/db.ts` — IndexedDB, client-side only).
- **Maps**: MapLibre GL v5 + react-map-gl v8 (always dynamically imported, `ssr: false`).
- **i18n**: next-intl v4 — locales: `en`, `es`, `ca`.

## Critical Directives

1. **ALWAYS use React Server Components (RSC) by default.**
2. Use `'use client'` ONLY when interactivity is required (hooks, event listeners, interactive maps).
3. **FORBIDDEN**: Pages Router (`/pages`), `getServerSideProps`, `getStaticProps`, `getInitialProps`.
4. Use Server Actions (`"use server"`) for lightweight data mutations; use Route Handlers (`/api/`) for external API aggregation (weather, OSM, Strava).
5. **Strict typing**: FORBIDDEN to use `any`. Define all interfaces in `lib/types.ts`.
6. **i18n is mandatory**: All user-facing strings must use `useTranslations()` (client) or `getTranslations()` (server). Add keys to `messages/en.json`, `messages/es.json`, and `messages/ca.json`.
7. **No prop drilling**: Shared UI/map/analysis state goes in the Zustand store (`store/route-store.ts`). Components read directly from the store.
8. **Never import `lib/db.ts` in Server Components or API routes.** Dexie.js is client-side only.
9. **Map components must be dynamically imported** with `{ ssr: false }`.
10. New **Shadcn components** must be added via `npx shadcn@latest add [component]`.

## Output Format

- Do not explain what Next.js or React is. Go straight to the code.
- Return only the modified code blocks or the full new files.
- Quote exact file paths using the key locations table in `ARCHITECTURE.md`.
- After any change to shared types, verify `lib/types.ts` is the source of truth.
