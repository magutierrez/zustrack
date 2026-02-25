# Coding Conventions - Zustrack

## Naming
- Components & Component Files: `PascalCase` (e.g., `MapContainer.tsx`).
- Hooks & Functions: `camelCase` (e.g., `useMapLocation.ts`).
- Server Actions: File must end in `.action.ts` (e.g., `saveLocation.action.ts`).
- Types/Interfaces: Start with a capital letter, no `I` prefix (e.g., `LocationData`, not `ILocationData`).

## Styling (Tailwind CSS)
- Use utility classes directly in `className`.
- For dynamic components, use `clsx` and `tailwind-merge` (usually via a `cn` utility function).
- Do not create separate `.css` or `.scss` files, except for `globals.css`.

## Global State Management (Zustand)
- **Zustand** is the global state solution. Do NOT use prop drilling for shared UI/map/analysis state.
- Stores live in `store/` (e.g., `store/route-store.ts`). One store per feature domain.
- Store files export a single `use<Name>Store` hook created with `create<State>()()`.
- Components read from the store directly via `useRouteStore((s) => s.field)` — never receive that state as props from a parent.
- Complex side-effect logic (API calls, parsing, `useEffect`s) stays in custom hooks under `hooks/`. Those hooks use store setters internally and return only action functions.
- Only pass as props what is genuinely local to a component tree and not shared elsewhere.

## Error Handling & Loading State
- Every route in `/app` that consumes async data must have its respective `loading.tsx` and `error.tsx`.
- Server Actions must return a typed object: `{ success: boolean, data?: any, error?: string }`.