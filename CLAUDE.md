# supertvstore-ecommerce

Next.js + Supabase storefront for **Super TV Store**, a brick-and-mortar electronics retailer putting their catalog online.

## Data architecture (read this before any data work)

This app talks to **two databases**. Picking the wrong one will create a mess later — match the table to the system.

| System                 | Owns                                                                 | Why                                                                     |
| ---------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **MariaDB** (`supertvstore`, local) | Product catalog, inventory, pricing, categories, brands, stock | Already exists. Source of truth for the physical store. Read-only from this app's perspective unless we explicitly extend it. |
| **Supabase** (Postgres) | Auth (users), carts, orders, order items, payments, addresses, reviews, wishlists, anything ecommerce-only | New surface area owned by this web app. Use RLS for per-user isolation. |

Rules of thumb:
- If the same data point also matters to the in-store POS, it lives in **MariaDB**.
- If it only exists because a customer is shopping online, it lives in **Supabase**.
- Never duplicate catalog data into Supabase. Reference it by `product_id` (the MariaDB primary key) and join at the application layer.

The MariaDB instance runs on `localhost`. Connection details belong in `.env.local` — never hardcode. Suggested env vars: `MARIADB_HOST`, `MARIADB_PORT`, `MARIADB_USER`, `MARIADB_PASSWORD`, `MARIADB_DATABASE=supertvstore`.

## Working on features

Use the `/feature-workflow` skill to plan → design → implement → test new features. It coordinates the four expert subagents:

- `supabase-expert` — auth, RLS, Supabase schema, edge functions
- `nextjs-expert` — App Router, RSC, server actions, the MariaDB data layer
- `design-expert` — UI design, Tailwind + shadcn, ecommerce UX patterns
- `testing-expert` — unit, integration, e2e

Don't skip the plan step for anything non-trivial — the plan is where the MariaDB-vs-Supabase decision gets made.

## Stack

- Next.js (App Router) + React 19 + TypeScript
- Tailwind CSS + shadcn/ui (Radix primitives already installed)
- Supabase JS + `@supabase/ssr` for cookie-based auth
- MariaDB driver: not yet installed — pick one during the first feature that needs catalog data (`mysql2` is the usual pick)

## Testing

Test stack and conventions are in place — extend, don't reinstall.

- **Vitest** for unit + integration. One config (`vitest.config.ts`) with two named projects:
  - `unit` — jsdom env, lives in `tests/unit/**/*.test.{ts,tsx}`. Pure helpers, components.
  - `integration` — node env, lives in `tests/integration/**/*.test.ts`. Hits the real local catalog DB (read-only) — never mock the data layer. Setup file in `tests/setup/env.ts` validates required env vars are present.
- **`next/cache`** is aliased to a no-op shim (`tests/integration/__mocks__/next-cache.ts`) for the integration project. The home queries are tagged `"use cache"` + `cacheLife()`, which only works inside a Next.js render — the shim lets us call them directly from Node.
- **Playwright** for e2e (`tests/e2e/**/*.spec.ts`, config at `playwright.config.ts`). One project (chromium). Reuses an existing dev server on port 3000 if one is already running, otherwise starts `pnpm dev` itself.

Scripts:
- `pnpm test` — unit then integration (sequential).
- `pnpm test:unit`, `pnpm test:integration`, `pnpm test:e2e` — individual.
- `pnpm test:integration` is invoked via `node --env-file=.env.local` so MARIADB_* envs reach the catalog client. Don't run the integration project through plain `vitest` or it will fail to connect.

Rules:
- Never mock the catalog DB or `mysql2`. Integration tests assert types and invariants, not exact counts (counts will drift as the real catalog changes).
- E2E should be a small, hand-picked set covering the critical user journey only. The home page e2e is one spec with four tests; that is the bar.
- If `next/cache` ever stops being a no-op-friendly module, update the shim, don't move queries around.
