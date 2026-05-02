---
name: feature-workflow
description: End-to-end workflow for building a new ecommerce feature in supertvstore — plan, design, implement, and test. Use this whenever the user asks to add a feature ("add wishlists", "build the product detail page", "implement checkout"), refactor a flow, or ship a vertical slice. Do NOT use for one-line bug fixes or trivial tweaks.
---

# Feature workflow

This skill is the orchestrator. You are the conductor; the four expert subagents do the domain work. Your job is to keep the four phases distinct and to feed each subagent the right context.

## The four phases

Run them **in order**. Do not start phase N+1 until phase N is signed off by the user. The phases are intentionally separate so the user can redirect cheaply before code is written.

### Phase 1 — Plan (you, the main agent)

Goal: produce a one-page spec the user agrees to before any design or code happens.

Do this yourself; do not delegate. The plan is where the most important decision gets made — **what data lives where**.

The spec must cover:

1. **User-facing description.** Two sentences. What can the user do that they couldn't before?
2. **Data architecture.** For every piece of data the feature touches, mark it `MariaDB` (catalog/inventory/pricing — already in the `supertvstore` DB on `localhost`) or `Supabase` (auth, orders, payments, carts, anything ecommerce-only). If you don't know the MariaDB schema yet, inspect it before guessing — connect with the credentials in `.env.local` and `SHOW TABLES` / `DESCRIBE` the relevant ones. Never invent column names.
3. **Routes & server actions.** Which Next.js routes (App Router) are added or changed; which server actions / route handlers are needed.
4. **Auth & access.** Who can see/do this? Anonymous? Logged in? Admin? Translate to Supabase RLS policies in plain English.
5. **Open questions.** Anything you'd guess at — list it instead. Better to ask than to assume.

If the data architecture decision is non-trivial (e.g. "should reviews live in MariaDB so the POS can see them?"), call it out explicitly and recommend one option with the tradeoff.

End phase 1 by showing the spec to the user and asking for approval. Do not proceed without it.

### Phase 2 — Design (delegate to `design-expert`)

Goal: a visual + structural plan for the UI before a single component is written.

Brief the `design-expert` with:
- The approved spec from phase 1.
- The routes/screens involved.
- Any existing screens this needs to feel consistent with (point them at the file paths).

Expect back: layout description per screen, component breakdown (which are new, which reuse existing shadcn/Radix primitives), states to handle (loading, empty, error, hover, mobile), and accessibility notes. **Not code yet.** If the agent returns code, push back — design first.

Show the design to the user. Iterate until they're happy.

### Phase 3 — Implement (delegate to `supabase-expert` and `nextjs-expert`)

Split the work along the data-architecture line:

- `supabase-expert` owns: Supabase migrations, RLS policies, server-side Supabase clients, edge functions, anything Postgres-side.
- `nextjs-expert` owns: routes, server components, server actions, the MariaDB data access layer (`lib/mariadb/`), wiring components to data, and integrating Supabase client calls inside Next.js.

If the feature touches both, **run them in parallel** (a single message with two Agent tool calls) for the schema/data layer, then have `nextjs-expert` glue the pieces together once both report back. Keep the design-expert's design doc as required reading in both prompts.

UI components themselves (the actual JSX/Tailwind) should be written by `nextjs-expert` following the `design-expert`'s spec — don't ping-pong back to design unless something genuinely needs a visual decision.

### Phase 4 — Test (delegate to `testing-expert`)

Goal: the feature has automated coverage proportional to its risk.

Brief `testing-expert` with the spec, the diff (or list of changed files), and any tricky edge cases surfaced during implementation. Expect:
- **Unit** for pure functions and complex component logic (Vitest + Testing Library).
- **Integration** for server actions and data layer (MariaDB queries, Supabase calls — using a test DB, not mocks for DB shape).
- **E2E** for the user-facing happy path (Playwright). Skip e2e for purely internal/admin features unless asked.

If the project doesn't have a test framework set up yet, the first run of phase 4 will install and configure it — that's expected.

## When to skip phases

- Tiny copy/style tweaks: skip the whole skill, just edit.
- Bug fixes with a clear repro: skip phases 1–2, go straight to 3 + 4 (write the failing test first).
- Spike/exploration the user explicitly labels as throwaway: phases 1 + 3 only.

## Coordination rules

- Always tell each subagent **what phase you're in and what they're being asked to produce** — they're stateless across invocations.
- Pass the previous phase's artifact (spec, design doc, diff) as context, not a summary of it.
- Don't have two subagents editing the same file at once — sequence those.
- If a subagent's output reveals the spec was wrong, stop and renegotiate the spec with the user. Don't paper over it.
