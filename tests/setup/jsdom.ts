import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// RTL doesn't auto-clean when running under Vitest (no global afterEach hook
// from a Jest preset). Without this, every render leaks into the next test
// and queries like getByText return ambiguous matches.
afterEach(() => {
  cleanup();
});
