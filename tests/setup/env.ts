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
