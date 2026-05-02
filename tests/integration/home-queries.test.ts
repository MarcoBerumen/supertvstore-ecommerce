import { afterAll, describe, it, expect } from "vitest";
import {
  getCategoriesWithCounts,
  getTopBrands,
  getNewArrivals,
  getFeaturedTvs,
  getProductCountsByPriceBucket,
  getCatalogCounts,
} from "@/lib/mariadb/queries/home";
import { catalogPool } from "@/lib/mariadb/client";

// Hits the real local catalog DB. The catalog is read-only from this app,
// and these tests never INSERT/UPDATE/DELETE anything. We assert types and
// invariants, not exact counts — exact counts will drift as the store's real
// catalog changes and would make these tests flaky.

afterAll(async () => {
  // Let Vitest exit cleanly instead of waiting for the pool's idle keepalive.
  await catalogPool.end();
});

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TV_CATEGORY_ID = 8;

describe("getCategoriesWithCounts", () => {
  it("returns a non-empty list of categories with valid shape", async () => {
    const cats = await getCategoriesWithCounts();
    expect(cats.length).toBeGreaterThan(0);

    for (const c of cats) {
      expect(typeof c.id).toBe("number");
      expect(c.id).toBeGreaterThan(0);
      expect(typeof c.name).toBe("string");
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.slug).toMatch(SLUG_RE);
      expect(typeof c.productCount).toBe("number");
      expect(c.productCount).toBeGreaterThan(0);
    }
  });

  it("includes the TV category", async () => {
    const cats = await getCategoriesWithCounts();
    const tv = cats.find((c) => c.id === TV_CATEGORY_ID);
    expect(tv, "TV category (id=8) should be in the result").toBeDefined();
    expect(tv!.productCount).toBeGreaterThan(0);
  });

  it("orders categories by product count descending", async () => {
    const cats = await getCategoriesWithCounts();
    const counts = cats.map((c) => c.productCount);
    const sorted = [...counts].sort((a, b) => b - a);
    expect(counts).toEqual(sorted);
  });
});

describe("getTopBrands", () => {
  it("returns brands with valid shape, default limit of 12", async () => {
    const brands = await getTopBrands();
    expect(brands.length).toBeGreaterThan(0);
    expect(brands.length).toBeLessThanOrEqual(12);

    for (const b of brands) {
      expect(typeof b.id).toBe("number");
      expect(b.id).toBeGreaterThan(0);
      expect(typeof b.name).toBe("string");
      expect(b.name.length).toBeGreaterThan(0);
      expect(b.slug.length).toBeGreaterThan(0);
      expect(b.slug).toMatch(SLUG_RE);
    }
  });

  it("respects a custom limit", async () => {
    const brands = await getTopBrands(3);
    expect(brands.length).toBeLessThanOrEqual(3);
  });
});

describe("getNewArrivals", () => {
  it("returns products with valid shape", async () => {
    const products = await getNewArrivals();
    expect(products.length).toBeGreaterThan(0);
    expect(products.length).toBeLessThanOrEqual(12);

    for (const p of products) {
      expect(typeof p.id).toBe("number");
      expect(p.id).toBeGreaterThan(0);
      expect(typeof p.name).toBe("string");
      expect(p.name.length).toBeGreaterThan(0);
      // brand can be null but if present must be a string.
      if (p.brand !== null) expect(typeof p.brand).toBe("string");
      expect(typeof p.price).toBe("number");
      expect(p.price).toBeGreaterThan(0);
    }
  });

  it("orders products by id descending (newest first)", async () => {
    const products = await getNewArrivals();
    const ids = products.map((p) => p.id);
    const sorted = [...ids].sort((a, b) => b - a);
    expect(ids).toEqual(sorted);
  });

  it("respects a custom limit", async () => {
    const products = await getNewArrivals(4);
    expect(products.length).toBeLessThanOrEqual(4);
  });
});

describe("getFeaturedTvs", () => {
  it("returns products with valid shape, all in the TV category", async () => {
    const products = await getFeaturedTvs();
    expect(products.length).toBeGreaterThan(0);
    expect(products.length).toBeLessThanOrEqual(12);

    for (const p of products) {
      expect(typeof p.id).toBe("number");
      expect(p.id).toBeGreaterThan(0);
      expect(typeof p.name).toBe("string");
      expect(p.price).toBeGreaterThan(0);
    }

    // Verify category constraint by joining back to the products table.
    const ids = products.map((p) => p.id);
    const placeholders = ids.map(() => "?").join(",");
    const [rows] = await catalogPool.query(
      `SELECT product_id, category_id FROM products WHERE product_id IN (${placeholders})`,
      ids,
    );
    const list = rows as Array<{ product_id: number; category_id: number }>;
    for (const r of list) {
      expect(r.category_id).toBe(TV_CATEGORY_ID);
    }
  });
});

describe("getProductCountsByPriceBucket", () => {
  it("returns exactly 4 tiers (1..4) with non-negative counts", async () => {
    const buckets = await getProductCountsByPriceBucket();
    expect(buckets).toHaveLength(4);
    expect(buckets.map((b) => b.tier)).toEqual([1, 2, 3, 4]);

    for (const b of buckets) {
      expect(typeof b.label).toBe("string");
      expect(b.label.length).toBeGreaterThan(0);
      expect(typeof b.productCount).toBe("number");
      expect(b.productCount).toBeGreaterThanOrEqual(0);
    }
  });

  it("the sum of buckets is close to the in-stock total", async () => {
    const buckets = await getProductCountsByPriceBucket();
    const counts = await getCatalogCounts();
    const sum = buckets.reduce((acc, b) => acc + b.productCount, 0);

    // Buckets only include products with a resolvable price; totalInStock
    // counts every in-stock product. Allow some slack — the gap is products
    // that are in stock but missing both p.price and a price_list_id=1 row.
    expect(sum).toBeGreaterThan(0);
    expect(sum).toBeLessThanOrEqual(counts.totalInStock);
    // Sanity: shouldn't be wildly off either. 50% of in-stock as a floor is
    // generous and should hold for any reasonable catalog state.
    expect(sum / counts.totalInStock).toBeGreaterThanOrEqual(0.5);
  });
});

describe("getCatalogCounts", () => {
  it("returns positive integers for the headline counts", async () => {
    const counts = await getCatalogCounts();
    expect(Number.isInteger(counts.totalInStock)).toBe(true);
    expect(counts.totalInStock).toBeGreaterThan(0);
    expect(Number.isInteger(counts.tvInStock)).toBe(true);
    expect(counts.tvInStock).toBeGreaterThan(0);
    expect(Number.isInteger(counts.totalCategories)).toBe(true);
    expect(counts.totalCategories).toBeGreaterThan(0);
    // tvInStock is a subset of totalInStock.
    expect(counts.tvInStock).toBeLessThanOrEqual(counts.totalInStock);
  });
});
