import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  firstImagePath,
  presignProductImage,
  presignProductImages,
} from "@/lib/mariadb/images";

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

describe("presignProductImage", () => {
  const ORIGINAL = { ...process.env };

  beforeAll(() => {
    process.env.AWS_S3_BUCKET = "supertvstoreapp";
    process.env.AWS_S3_REGION = "us-west-1";
    process.env.AWS_ACCESS_KEY_ID = "AKIATEST";
    process.env.AWS_SECRET_ACCESS_KEY = "secrettest";
  });

  afterAll(() => {
    process.env = ORIGINAL;
  });

  it("returns null for null/undefined/empty input", async () => {
    expect(await presignProductImage(null)).toBeNull();
    expect(await presignProductImage(undefined)).toBeNull();
    expect(await presignProductImage("")).toBeNull();
  });

  it("returns a signed URL on the configured bucket host with the given key", async () => {
    const url = await presignProductImage("products/foo.jpg");
    expect(url).not.toBeNull();
    expect(url).toMatch(
      /^https:\/\/supertvstoreapp\.s3\.us-west-1\.amazonaws\.com\/products\/foo\.jpg\?/,
    );
    // SigV4 marker — proves we actually signed the request rather than
    // returning a bare URL.
    expect(url).toContain("X-Amz-Signature=");
  });

  it("presignProductImages drops nulls and preserves order for valid keys", async () => {
    const urls = await presignProductImages(["a.jpg", "b.jpg"]);
    expect(urls).toHaveLength(2);
    expect(urls[0]).toMatch(/\/a\.jpg\?/);
    expect(urls[1]).toMatch(/\/b\.jpg\?/);
  });
});
