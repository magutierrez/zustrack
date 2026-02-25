# AI Base Rules - Zustrack Project

## Core Stack
- Framework: Next.js 16 (App Router exclusively).
- UI: React 19, Tailwind CSS.
- Language: TypeScript (Strict).

## Critical Directives
1. ALWAYS use React Server Components (RSC) by default.
2. Use `'use client'` ONLY when interactivity is required (hooks, event listeners, interactive maps).
3. FORBIDDEN to use the Pages Router (`/pages`).
4. FORBIDDEN to use `getServerSideProps`, `getStaticProps`, or `getInitialProps`.
5. Use Server Actions (`"use server"`) for data mutations instead of Route Handlers (`/api`) whenever possible.
6. Strict typing: FORBIDDEN to use `any`. Create interfaces/types in the `types/` directory.

## Output Format
- Do not explain what Next.js or React is. Go straight to the code.
- Return only the modified code blocks or the full new files.