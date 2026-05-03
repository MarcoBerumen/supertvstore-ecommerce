import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Stub MARIADB_* env vars for the unit project. Some unit tests import from
// `lib/mariadb/queries/product` to test pure helpers (e.g. `slugify`) that
// happen to live in the same module as the SQL helpers. Importing that
// module evaluates `lib/mariadb/client.ts`, which throws if these aren't set.
// The pool itself is lazy — no connection is opened — so harmless dummy
// values are enough to satisfy the import-time check.
process.env.MARIADB_HOST ??= "127.0.0.1";
process.env.MARIADB_PORT ??= "3306";
process.env.MARIADB_USER ??= "test";
process.env.MARIADB_PASSWORD ??= "test";
process.env.MARIADB_DATABASE ??= "supertvstore";

// RTL doesn't auto-clean when running under Vitest (no global afterEach hook
// from a Jest preset). Without this, every render leaks into the next test
// and queries like getByText return ambiguous matches.
afterEach(() => {
  cleanup();
});
