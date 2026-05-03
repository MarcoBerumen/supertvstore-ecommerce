import type { RowDataPacket } from "mysql2";
import { cacheLife } from "next/cache";
import { catalogPool } from "@/lib/mariadb/client";
import {
  firstImagePath,
  presignProductImage,
  presignProductImages,
} from "@/lib/mariadb/images";

const STORE_ID = 1;
const PRICE_LIST_ID = 1;

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------- Product detail ----------

export interface SpecRow {
  slug: string;
  label: string;
  type: "Boolean" | "List" | "Numeric";
  value: string;
}

export interface ProductDetail {
  id: number;
  name: string;
  description: string | null;
  model: string | null;
  sku: string | null;
  brandId: number | null;
  brandName: string | null;
  categoryId: number | null;
  categoryName: string | null;
  year: number | null;
  screenSize: number | null;
  imageUrls: string[];
  basePrice: number | null;
  specs: SpecRow[];
}

interface ProductDetailRow extends RowDataPacket {
  product_id: number;
  name: string;
  description: string | null;
  model: string | null;
  sku: string | null;
  brand_id: number | null;
  brand_name: string | null;
  category_id: number | null;
  category_name: string | null;
  year: number | null;
  screen_size: number | null;
  images: string | null;
  base_price: number | null;
  features: string | null;
}

interface FeatureMasterRow extends RowDataPacket {
  slug: string;
  name: string;
  type: "Boolean" | "List" | "Numeric";
}

function parseImages(images: string | null): string[] {
  if (!images) return [];
  return images
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function parseSpecs(
  featuresJson: string | null,
  master: Map<string, { label: string; type: SpecRow["type"] }>,
): SpecRow[] {
  if (!featuresJson) return [];
  let raw: unknown;
  try {
    raw = JSON.parse(featuresJson);
  } catch (err) {
    console.error("[product] failed to parse features JSON", err);
    return [];
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];

  const out: SpecRow[] = [];
  for (const [slug, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value === null || value === undefined || value === "") continue;
    const meta = master.get(slug);
    if (!meta) continue;
    let display = String(value);
    if (meta.type === "Boolean") {
      display = display === "1" || display.toLowerCase() === "true" ? "Yes" : "No";
    }
    out.push({ slug, label: meta.label, type: meta.type, value: display });
  }
  return out;
}

export async function getProductDetail(
  id: number,
): Promise<ProductDetail | null> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });

  const sql = `
    SELECT
      p.product_id,
      p.name,
      p.description,
      p.model,
      p.sku,
      p.brand_id,
      b.name AS brand_name,
      p.category_id,
      c.name AS category_name,
      p.year,
      p.screen_size,
      p.images,
      p.features,
      COALESCE(
        p.price,
        (
          SELECT MIN(pp.price)
          FROM product_pricing pp
          WHERE pp.product_id = p.product_id
            AND pp.price_list_id = ?
            AND pp.price IS NOT NULL
        )
      ) AS base_price
    FROM products p
    LEFT JOIN brands b ON b.brand_id = p.brand_id
    LEFT JOIN categories c ON c.category_id = p.category_id
    WHERE p.product_id = ?
    LIMIT 1
  `;

  const [rows] = await catalogPool.query<ProductDetailRow[]>(sql, [
    PRICE_LIST_ID,
    id,
  ]);
  const row = rows[0];
  if (!row) return null;

  const [features] = await catalogPool.query<FeatureMasterRow[]>(
    `SELECT slug, name, type FROM features WHERE slug IS NOT NULL AND slug <> ''`,
  );
  const master = new Map<string, { label: string; type: SpecRow["type"] }>();
  for (const f of features) {
    if (!f.slug) continue;
    master.set(f.slug, { label: f.name, type: f.type });
  }

  return {
    id: row.product_id,
    name: row.name.trim().replace(/\s+/g, " "),
    description: row.description ? row.description.trim() : null,
    model: row.model ? row.model.trim() : null,
    sku: row.sku ? row.sku.trim() : null,
    brandId: row.brand_id,
    brandName: row.brand_name ? row.brand_name.trim() : null,
    categoryId: row.category_id,
    categoryName: row.category_name ? row.category_name.trim().replace(/\s+/g, " ") : null,
    year: row.year,
    screenSize: row.screen_size === null ? null : Number(row.screen_size),
    imageUrls: await presignProductImages(parseImages(row.images)),
    basePrice: row.base_price === null ? null : Number(row.base_price),
    specs: parseSpecs(row.features, master),
  };
}

// ---------- Variants ----------

export interface ProductVariant {
  key: string; // `${statusId}:${gradeId}` — the contract used by cart helpers
  statusId: number;
  statusName: string;
  gradeId: number;
  gradeName: string;
  price: number;
  stockQty: number;
}

interface VariantRow extends RowDataPacket {
  status_id: number;
  status_name: string;
  grade_id: number;
  grade_name: string | null;
  price: number | null;
  stock_qty: number;
}

export async function getProductVariants(
  productId: number,
): Promise<ProductVariant[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });

  const sql = `
    SELECT
      s.status_id,
      st.name AS status_name,
      s.grade_id,
      g.name AS grade_name,
      pp.price,
      SUM(s.stock) AS stock_qty
    FROM stock s
    JOIN status st ON st.status_id = s.status_id
    LEFT JOIN grades g ON g.grade_id = s.grade_id
    LEFT JOIN product_pricing pp
      ON pp.product_id = s.product_id
     AND pp.status_id = s.status_id
     AND pp.grade_id = s.grade_id
     AND pp.price_list_id = ?
    WHERE s.product_id = ?
      AND s.store_id = ?
    GROUP BY s.status_id, st.name, s.grade_id, g.name, pp.price
    HAVING SUM(s.stock) > 0
       AND pp.price IS NOT NULL
    ORDER BY st.status_id ASC, g.grade_id ASC
  `;

  const [rows] = await catalogPool.query<VariantRow[]>(sql, [
    PRICE_LIST_ID,
    productId,
    STORE_ID,
  ]);

  return rows
    .filter((r) => r.grade_id !== null && r.price !== null)
    .map((r) => ({
      key: `${r.status_id}:${r.grade_id}`,
      statusId: r.status_id,
      statusName: r.status_name.trim(),
      gradeId: r.grade_id,
      gradeName: (r.grade_name ?? "").trim(),
      price: Number(r.price),
      stockQty: Number(r.stock_qty),
    }));
}

// ---------- Warranties ----------

export interface Warranty {
  id: number | null; // null → synthetic "No warranty" sentinel
  name: string;
  days: number;
  price: number;
}

interface WarrantyRow extends RowDataPacket {
  warranty_id: number;
  name: string | null;
  warranty_days: number | null;
  price: number | null;
}

export async function getEligibleWarranties(
  price: number,
): Promise<Warranty[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });

  // under_price = 0 is the "no ceiling" sentinel (free standard warranties),
  // so it always qualifies; otherwise the warranty's ceiling must cover the price.
  const sql = `
    SELECT warranty_id, name, warranty_days, price
    FROM warranties
    WHERE row_status = 1
      AND (under_price = 0 OR under_price >= ?)
    ORDER BY price ASC, warranty_days ASC
  `;

  const [rows] = await catalogPool.query<WarrantyRow[]>(sql, [price]);

  const eligible: Warranty[] = rows.map((r) => ({
    id: r.warranty_id,
    name: (r.name ?? `Warranty #${r.warranty_id}`).trim(),
    days: r.warranty_days ?? 0,
    price: r.price === null ? 0 : Number(r.price),
  }));

  return [
    { id: null, name: "No warranty", days: 0, price: 0 },
    ...eligible,
  ];
}

// ---------- Related products ----------

export interface RelatedProduct {
  id: number;
  name: string;
  brand: string | null;
  price: number;
  imageUrl: string | null;
}

interface RelatedRow extends RowDataPacket {
  product_id: number;
  name: string;
  brand_name: string | null;
  images: string | null;
  resolved_price: number | null;
}

async function fetchRelated(opts: {
  productId: number;
  brandId: number | null;
  categoryId: number | null;
  limit: number;
  scope: "brand+category" | "category";
}): Promise<RelatedProduct[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  const { productId, brandId, categoryId, limit, scope } = opts;

  const params: Array<string | number> = [PRICE_LIST_ID, STORE_ID];
  let scopeClause = "";
  if (scope === "brand+category" && brandId !== null && categoryId !== null) {
    scopeClause = "AND p.brand_id = ? AND p.category_id = ?";
    params.push(brandId, categoryId);
  } else if (scope === "category" && categoryId !== null) {
    scopeClause = "AND p.category_id = ?";
    params.push(categoryId);
  }
  params.push(productId, limit);

  const sql = `
    SELECT
      p.product_id,
      p.name,
      b.name AS brand_name,
      p.images,
      COALESCE(
        p.price,
        (
          SELECT MIN(pp.price)
          FROM product_pricing pp
          WHERE pp.product_id = p.product_id
            AND pp.price_list_id = ?
            AND pp.price IS NOT NULL
        )
      ) AS resolved_price
    FROM products p
    LEFT JOIN brands b ON b.brand_id = p.brand_id
    JOIN stock s
      ON s.product_id = p.product_id
     AND s.store_id = ?
    WHERE p.images IS NOT NULL
      AND p.images <> ''
      ${scopeClause}
      AND p.product_id <> ?
    GROUP BY p.product_id, p.name, b.name, p.images, p.price
    HAVING SUM(s.stock) > 0 AND resolved_price IS NOT NULL
    ORDER BY p.product_id DESC
    LIMIT ?
  `;

  const [rows] = await catalogPool.query<RelatedRow[]>(sql, params);
  return Promise.all(
    rows.map(async (r) => ({
      id: r.product_id,
      name: r.name.trim(),
      brand: r.brand_name ? r.brand_name.trim() : null,
      price: Number(r.resolved_price),
      imageUrl: await presignProductImage(firstImagePath(r.images)),
    })),
  );
}

export async function getRelatedProducts(
  productId: number,
  brandId: number | null,
  categoryId: number | null,
  limit = 12,
): Promise<RelatedProduct[]> {
  // Try same brand AND same category first; fall back to category-only if too few.
  const primary = await fetchRelated({
    productId,
    brandId,
    categoryId,
    limit,
    scope: "brand+category",
  });
  if (primary.length >= 4) return primary;
  if (categoryId === null) return primary;
  const fallback = await fetchRelated({
    productId,
    brandId,
    categoryId,
    limit,
    scope: "category",
  });
  return fallback;
}
