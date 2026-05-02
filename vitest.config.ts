import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

const repoAlias = { "@": path.resolve(__dirname, ".") };

// Single config, two named projects:
//   unit        — jsdom, fast, no network/DB. Components and pure helpers.
//   integration — node, hits the real local catalog DB. Run via
//                 `pnpm test:integration` so Node loads .env.local for the
//                 catalog connection.
//
// `next/cache` is aliased to a no-op shim. The home queries are tagged with
// `"use cache"` + cacheLife(), which only makes sense inside a Next.js render.
// In a plain Node test runner the real module throws; the shim lets us call
// the query functions directly and assert against the SQL result.
const nextCacheAlias = {
  "next/cache": path.resolve(
    __dirname,
    "tests/integration/__mocks__/next-cache.ts",
  ),
};

export default defineConfig({
  plugins: [react()],
  resolve: { alias: repoAlias },
  test: {
    projects: [
      {
        plugins: [react()],
        resolve: { alias: repoAlias },
        test: {
          name: "unit",
          environment: "jsdom",
          include: ["tests/unit/**/*.test.{ts,tsx}"],
          globals: false,
          setupFiles: ["tests/setup/jsdom.ts"],
        },
      },
      {
        resolve: {
          alias: { ...repoAlias, ...nextCacheAlias },
        },
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          globals: false,
          setupFiles: ["tests/setup/env.ts"],
          // Catalog DB lives on localhost; queries are cheap but we run
          // sequentially to avoid hammering the pool.
          fileParallelism: false,
          testTimeout: 15_000,
        },
      },
    ],
  },
});
