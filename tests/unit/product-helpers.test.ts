import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/mariadb/queries/product";

// `slugify` is the canonical-URL builder for product detail pages. The route
// 308-redirects when the slug in the path doesn't match this function's output,
// so any change to its rules has to stay in lockstep with what's already shipped.

describe("slugify", () => {
  it("lowercases and dash-separates a multi-word name", () => {
    expect(slugify("Sound bar")).toBe("sound-bar");
  });

  it('strips non-alphanumeric characters (e.g. quotes)', () => {
    expect(slugify('LG OLED 55"')).toBe("lg-oled-55");
  });

  it("collapses runs of whitespace into a single dash", () => {
    expect(slugify("Washing  Machine")).toBe("washing-machine");
  });

  it("trims leading and trailing whitespace", () => {
    expect(slugify("  Trim  ")).toBe("trim");
  });

  it("returns an empty string for whitespace-only input", () => {
    // The page handler guards against this with a `|| 'p'` fallback, so the
    // empty-string return here is the documented contract — verify it.
    expect(slugify("   ")).toBe("");
  });

  it("returns an empty string for empty input", () => {
    expect(slugify("")).toBe("");
  });

  it("strips smart and straight apostrophes without leaving a dash", () => {
    expect(slugify("Samsung's TV")).toBe("samsungs-tv");
    expect(slugify("Samsung’s TV")).toBe("samsungs-tv");
  });

  it("collapses multiple punctuation runs into a single dash", () => {
    expect(slugify("LG  --  C2")).toBe("lg-c2");
  });
});
