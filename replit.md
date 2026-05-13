# OFF/BEAT Creator-Brand Sync

A creator-vetting tool for OFF/BEAT — an edgy music & culture label — to analyze creator handles and score their cultural brand fit using a mock AI engine.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/offbeat run dev` — run the frontend (port auto-assigned)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned by Replit)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + lucide-react
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- OpenAPI spec: `lib/api-spec/openapi.yaml`
- DB schema: `lib/db/src/schema/analyses.ts`
- Mock AI engine: `artifacts/api-server/src/lib/aiEngine.ts`
- API routes: `artifacts/api-server/src/routes/analyze.ts`
- Frontend app: `artifacts/offbeat/src/App.tsx`
- Theme (dark/light): `artifacts/offbeat/src/components/theme-provider.tsx`
- Localization: `artifacts/offbeat/src/components/locale-provider.tsx`

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → typed React Query hooks + Zod validation schemas
- Mock AI engine: 2-second delay + randomized vibe/brand-fit scoring in `aiEngine.ts`, no paid API required
- Locale system: Global (USD/$) and Bharat Edition (INR/₹) with translated badge labels and UI copy
- Dark/Light theme: Class-based Tailwind dark mode, persisted to localStorage, lime-400 accent in dark, indigo-600 in light
- Single-page app: All sections on one scrollable page — no routing needed

## Product

- Hero section with OFF/BEAT brand identity and "Build from Scratch" messaging
- Creator handle input that triggers mock AI analysis (2-second simulated engine)
- Results dashboard with circular score rings (Vibe Match + Brand Fit), gamification badges (bronze/silver/gold/platinum), audience size, and engagement rate
- Stats bar showing aggregate totals and averages across all analyses
- Recent analyses list showing all past runs with handle, category, scores, and badges
- Locale toggle: switches between Global Edition (USD) and Bharat Edition (INR) with Hindi badge labels
- Dark/Light mode toggle with the Offbeat aesthetic (dark = black + lime, light = slate + indigo)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After schema changes in `lib/db/src/schema/`, run `pnpm run typecheck:libs` to rebuild lib declarations before typechecking server/frontend
- After any `openapi.yaml` change, run codegen before using updated hooks
- The API server must be restarted after adding new routes (it builds to a bundle)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
