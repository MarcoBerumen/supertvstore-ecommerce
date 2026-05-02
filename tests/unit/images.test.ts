import { describe, it, expect } from "vitest";
import { firstImagePath, productImageUrl } from "@/lib/mariadb/images";

describe("firstImagePath", () => {
  it("returns the first segment of a comma-separated string", () => {
    expect(firstImagePath("a.jpg,b.jpg,c.jpg")).toBe("a.jpg");
  });

  it("trims surrounding whitespace on the first segment", () => {
    expect(firstImagePath("  a.jpg  ,b.jpg")).toBe("a.jpg");
  });

  it("returns null for null", () => {
    expect(firstImagePath(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(firstImagePath(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(firstImagePath("")).toBeNull();
  });

  it("returns null when the first segment is blank", () => {
    expect(firstImagePath(" , b.jpg")).toBeNull();
  });

  it("handles a single value with no comma", () => {
    expect(firstImagePath("only.jpg")).toBe("only.jpg");
  });
});

describe("productImageUrl", () => {
  // Regression pin: today this returns null for everything so the placeholder
  // gradient renders. When a CDN base URL is wired in, this test will fail
  // and force the implementer to update both the function and this test.
  it("returns null for any non-empty path (CDN not yet configured)", () => {
    expect(productImageUrl("foo.jpg")).toBeNull();
    expect(productImageUrl("nested/path/foo.jpg")).toBeNull();
  });

  it("returns null for null/undefined/empty", () => {
    expect(productImageUrl(null)).toBeNull();
    expect(productImageUrl(undefined)).toBeNull();
    expect(productImageUrl("")).toBeNull();
  });
});
