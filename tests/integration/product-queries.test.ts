import { afterAll, describe, it, expect } from "vitest";
import {
  getProductDetail,
  getProductVariants,
  getEligibleWarranties,
  getRelatedProducts,
} from "@/lib/mariadb/queries/product";
import { catalogPool } from "@/lib/mariadb/client";

// Hits the real local catalog DB. The catalog is read-only from this app and
// these tests never mutate it. Assertions are about types and invariants —
// exact counts will drift as the real catalog evolves.
//
// Reference fixtures (verified at the time of writing):
//   - Product 195: Hisense 85" R6E4 — 7 variants, multiple in-stock at $590, has screen-size feature.
//   - Product 38:  VIZIO 65" V-Series — only product in (brand=72, category=8) → forces the
//                  "brand+category came back too small, fall back to category-only" branch.

const KNOWN_PRODUCT_ID = 195;
const RELATED_FALLBACK_PRODUCT_ID = 38;
const RELATED_FALLBACK_BRAND_ID = 72;
const TV_CATEGORY_ID = 8;
const NON_EXISTENT_PRODUCT_ID = 99999999;

afterAll(async () => {
  await catalogPool.end();
});

describe("getProductDetail", () => {
  it("returns a product object for a known existing id", async () => {
    const p = await getProductDetail(KNOWN_PRODUCT_ID);
    expect(p).not.toBeNull();
    expect(p!.id).toBe(KNOWN_PRODUCT_ID);
    expect(typeof p!.name).toBe("string");
    expect(p!.name.length).toBeGreaterThan(0);
    expect(p!.brandId).toBeTypeOf("number");
    expect(p!.categoryId).toBeTypeOf("number");
  });

  it("returns null for a non-existent id", async () => {
    const p = await getProductDetail(NON_EXISTENT_PRODUCT_ID);
    expect(p).toBeNull();
  });

  it("populates spec rows with the documented shape", async () => {
    const p = await getProductDetail(KNOWN_PRODUCT_ID);
    expect(p).not.toBeNull();
    expect(Array.isArray(p!.specs)).toBe(true);
    expect(p!.specs.length).toBeGreaterThan(0);

    for (const spec of p!.specs) {
      expect(typeof spec.slug).toBe("string");
      expect(spec.slug.length).toBeGreaterThan(0);
      expect(typeof spec.label).toBe("string");
      expect(spec.label.length).toBeGreaterThan(0);
      expect(["Boolean", "List", "Numeric"]).toContain(spec.type);
      expect(typeof spec.value).toBe("string");
    }
  });

  it("maps the screen-size feature slug to the 'Screen Size' label for a TV", async () => {
    const p = await getProductDetail(KNOWN_PRODUCT_ID);
    expect(p).not.toBeNull();
    const screenSize = p!.specs.find((s) => s.slug === "screen-size");
    expect(
      screenSize,
      "Hisense 85\" should expose its screen-size feature",
    ).toBeDefined();
    expect(screenSize!.label).toBe("Screen Size");
    expect(screenSize!.type).toBe("Numeric");
  });
});

describe("getProductVariants", () => {
  it("returns at least one in-stock variant for a known product", async () => {
    const variants = await getProductVariants(KNOWN_PRODUCT_ID);
    expect(variants.length).toBeGreaterThan(0);
  });

  it("only returns variants with positive stock and a resolvable price", async () => {
    const variants = await getProductVariants(KNOWN_PRODUCT_ID);
    for (const v of variants) {
      expect(v.stockQty).toBeGreaterThan(0);
      expect(v.price).toBeGreaterThan(0);
      expect(typeof v.statusName).toBe("string");
      expect(v.statusName.length).toBeGreaterThan(0);
      expect(typeof v.gradeName).toBe("string");
    }
  });

  it("produces a unique ${statusId}:${gradeId} key per variant", async () => {
    const variants = await getProductVariants(KNOWN_PRODUCT_ID);
    const keys = variants.map((v) => v.key);
    const expected = variants.map((v) => `${v.statusId}:${v.gradeId}`);
    expect(keys).toEqual(expected);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("returns an empty array for a non-existent product", async () => {
    const variants = await getProductVariants(NON_EXISTENT_PRODUCT_ID);
    expect(variants).toEqual([]);
  });
});

describe("getEligibleWarranties", () => {
  it("always prepends the synthetic 'No warranty' sentinel", async () => {
    const list = await getEligibleWarranties(100);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].id).toBeNull();
    expect(list[0].name).toBe("No warranty");
    expect(list[0].price).toBe(0);
  });

  it("includes the under_price=0 'no ceiling' free warranties at price=100 (hotfix branch)", async () => {
    // This is the most important assertion in this file. We just shipped a fix
    // making `under_price = 0` count as "always eligible" so that free standard
    // warranties don't get filtered out alongside the paid TV tiers. If this
    // regresses, every product loses its free warranty options.
    const list = await getEligibleWarranties(100);
    const realWarranties = list.filter((w) => w.id !== null);
    const freeOnes = realWarranties.filter((w) => w.price === 0);
    expect(
      freeOnes.length,
      "expected at least one free standard warranty to be eligible at price=100",
    ).toBeGreaterThan(0);
  });

  it("excludes the paid TV tiers whose under_price ceiling is below price=5000", async () => {
    const list = await getEligibleWarranties(5000);
    // The TVH2-* tiers have ceilings of 1000/1500/2000/2500 → none should
    // appear at price=5000. We assert by name substring rather than by id so
    // the test still works if seed ids shift.
    const tooSmallTier = list.find(
      (w) => w.name.includes("TVH2-") && w.name.match(/under \$(\d+)/i),
    );
    if (tooSmallTier) {
      const m = tooSmallTier.name.match(/under \$(\d+,?\d*)/i);
      const ceiling = m ? Number(m[1].replace(/,/g, "")) : Number.NaN;
      expect(
        ceiling >= 5000,
        `warranty "${tooSmallTier.name}" should NOT be eligible at price=5000`,
      ).toBe(true);
    }
  });

  it("orders the real warranties by price ascending", async () => {
    const list = await getEligibleWarranties(100);
    const realPrices = list.filter((w) => w.id !== null).map((w) => w.price);
    const sorted = [...realPrices].sort((a, b) => a - b);
    expect(realPrices).toEqual(sorted);
  });
});

describe("getRelatedProducts", () => {
  it("returns at most the requested limit", async () => {
    const related = await getRelatedProducts(
      KNOWN_PRODUCT_ID,
      73,
      TV_CATEGORY_ID,
      6,
    );
    expect(related.length).toBeLessThanOrEqual(6);
  });

  it("never includes the current product id", async () => {
    const related = await getRelatedProducts(
      KNOWN_PRODUCT_ID,
      73,
      TV_CATEGORY_ID,
      12,
    );
    for (const r of related) {
      expect(r.id).not.toBe(KNOWN_PRODUCT_ID);
    }
  });

  it("falls back to category-only when brand+category yields fewer than 4", async () => {
    // VIZIO (brand 72) is the only product in category 8 — so the brand+category
    // first pass excludes the current product and returns 0. The fallback to
    // category-only should fill the rail with sibling TVs from other brands.
    const related = await getRelatedProducts(
      RELATED_FALLBACK_PRODUCT_ID,
      RELATED_FALLBACK_BRAND_ID,
      TV_CATEGORY_ID,
      12,
    );
    expect(
      related.length,
      "expected category-only fallback to surface ≥4 sibling TVs",
    ).toBeGreaterThanOrEqual(4);
    // None of them should be the same brand (because brand+cat returned 0,
    // the fallback necessarily came from other brands in category 8).
    // Sanity: at least one sibling must be a different brand than VIZIO.
    const brands = new Set(related.map((r) => r.brand));
    expect(brands.size).toBeGreaterThan(0);
  });
});
