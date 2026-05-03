// The integration runner is invoked with `node --env-file=.env.local` (see the
// "test:integration" script in package.json), so MARIADB_* env vars are
// already present here. This setup file just validates that fact and shouts
// loudly if someone runs the suite without the env file.
const required = [
  "MARIADB_HOST",
  "MARIADB_PORT",
  "MARIADB_USER",
  "MARIADB_PASSWORD",
  "MARIADB_DATABASE",
] as const;

for (const k of required) {
  if (!process.env[k]) {
    throw new Error(
      `Integration tests require ${k}. Run via "pnpm test:integration" so .env.local is loaded.`,
    );
  }
}

// Supabase-touching tests (cart helpers, server actions) need the local stack
// running and a service-role key for admin cleanup. These vars are *optional*
// at the env-validation layer — tests that need them check for themselves and
// `it.skip(...)` when the stack isn't available, so a developer can still run
// the catalog-only integration tests without `supabase start`.
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  // eslint-disable-next-line no-console
  console.warn(
    "[tests] NEXT_PUBLIC_SUPABASE_URL not set — Supabase integration tests will be skipped.",
  );
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    "[tests] SUPABASE_SERVICE_ROLE_KEY not set — anon-user cleanup will be skipped (orphan rows possible).",
  );
}
