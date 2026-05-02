import type { RowDataPacket } from "mysql2";
import { cacheLife } from "next/cache";
import { catalogPool } from "@/lib/mariadb/client";
import { firstImagePath } from "@/lib/mariadb/images";

const STORE_ID = 1;
const PRICE_LIST_ID = 1;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------- Categories with counts ----------

export interface CategoryWithCount {
  id: number;
  name: string;
  slug: string;
  productCount: number;
  sampleImagePath: string | null;
}

interface CategoryRow extends RowDataPacket {
  category_id: number;
  name: string;
  product_count: number;
  sample_images: string | null;
}

export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  const sql = `
    SELECT
      c.category_id,
      c.name,
      COUNT(DISTINCT p.product_id) AS product_count,
      (
        SELECT p2.images
        FROM products p2
        JOIN stock s2
          ON s2.product_id = p2.product_id
         AND s2.store_id = ?
        WHERE p2.category_id = c.category_id
          AND p2.images IS NOT NULL
          AND p2.images <> ''
        GROUP BY p2.product_id, p2.images
        HAVING SUM(s2.stock) > 0
        ORDER BY p2.product_id DESC
        LIMIT 1
      ) AS sample_images
    FROM categories c
    JOIN products p ON p.category_id = c.category_id
    JOIN stock s
      ON s.product_id = p.product_id
     AND s.store_id = ?
    WHERE c.row_status = 1
    GROUP BY c.category_id, c.name
    HAVING SUM(s.stock) > 0
    ORDER BY product_count DESC, c.name ASC
  `;

  const [rows] = await catalogPool.query<CategoryRow[]>(sql, [
    STORE_ID,
    STORE_ID,
  ]);

  return rows.map((r) => ({
    id: r.category_id,
    name: r.name.trim().replace(/\s+/g, " "),
    slug: slugify(r.name),
    productCount: Number(r.product_count),
    sampleImagePath: firstImagePath(r.sample_images),
  }));
}

// ---------- Top brands ----------

export interface TopBrand {
  id: number;
  name: string;
  slug: string;
}

interface BrandRow extends RowDataPacket {
  brand_id: number;
  name: string;
}

export async function getTopBrands(limit = 12): Promise<TopBrand[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  const sql = `
    SELECT b.brand_id, b.name
    FROM brands b
    JOIN products p ON p.brand_id = b.brand_id
    JOIN stock s
      ON s.product_id = p.product_id
     AND s.store_id = ?
    WHERE b.row_status = 1
    GROUP BY b.brand_id, b.name
    HAVING SUM(s.stock) > 0
    ORDER BY COUNT(DISTINCT p.product_id) DESC, b.name ASC
    LIMIT ?
  `;

  const [rows] = await catalogPool.query<BrandRow[]>(sql, [STORE_ID, limit]);

  return rows.map((r) => ({
    id: r.brand_id,
    name: r.name.trim(),
    slug: slugify(r.name),
  }));
}

// ---------- Product list (new arrivals / featured TVs) ----------

export interface HomeProduct {
  id: number;
  name: string;
  brand: string | null;
  price: number;
  imagePath: string | null;
}

interface HomeProductRow extends RowDataPacket {
  product_id: number;
  name: string;
  brand_name: string | null;
  images: string | null;
  resolved_price: number | null;
}

async function fetchHomeProducts(opts: {
  limit: number;
  categoryId?: number;
}): Promise<HomeProduct[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  const { limit, categoryId } = opts;
  const params: Array<string | number> = [STORE_ID, PRICE_LIST_ID];
  let categoryClause = "";
  if (categoryId !== undefined) {
    categoryClause = "AND p.category_id = ?";
    params.push(categoryId);
  }
  params.push(limit);

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
      ${categoryClause}
    GROUP BY p.product_id, p.name, b.name, p.images, p.price
    HAVING SUM(s.stock) > 0
       AND resolved_price IS NOT NULL
    ORDER BY p.product_id DESC
    LIMIT ?
  `;

  // The query above orders the `params` as: [PRICE_LIST_ID, STORE_ID, (catId?), LIMIT]
  // but we built `params` as [STORE_ID, PRICE_LIST_ID, ...]. Reorder.
  const orderedParams: Array<string | number> = [PRICE_LIST_ID, STORE_ID];
  if (categoryId !== undefined) orderedParams.push(categoryId);
  orderedParams.push(limit);

  const [rows] = await catalogPool.query<HomeProductRow[]>(sql, orderedParams);

  return rows.map((r) => ({
    id: r.product_id,
    name: r.name.trim(),
    brand: r.brand_name ? r.brand_name.trim() : null,
    price: Number(r.resolved_price),
    imagePath: firstImagePath(r.images),
  }));
}

export function getNewArrivals(limit = 12): Promise<HomeProduct[]> {
  return fetchHomeProducts({ limit });
}

export function getFeaturedTvs(limit = 12): Promise<HomeProduct[]> {
  return fetchHomeProducts({ limit, categoryId: 8 });
}

// ---------- Price buckets ----------

export type PriceTier = 1 | 2 | 3 | 4;

export interface PriceBucket {
  tier: PriceTier;
  label: string;
  productCount: number;
}

interface PriceBucketRow extends RowDataPacket {
  tier: number;
  product_count: number;
}

export async function getProductCountsByPriceBucket(): Promise<PriceBucket[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  const sql = `
    SELECT tier, COUNT(*) AS product_count
    FROM (
      SELECT
        p.product_id,
        CASE
          WHEN COALESCE(
            p.price,
            (SELECT MIN(pp.price) FROM product_pricing pp
              WHERE pp.product_id = p.product_id
                AND pp.price_list_id = ?
                AND pp.price IS NOT NULL)
          ) < 500 THEN 1
          WHEN COALESCE(
            p.price,
            (SELECT MIN(pp.price) FROM product_pricing pp
              WHERE pp.product_id = p.product_id
                AND pp.price_list_id = ?
                AND pp.price IS NOT NULL)
          ) < 1000 THEN 2
          WHEN COALESCE(
            p.price,
            (SELECT MIN(pp.price) FROM product_pricing pp
              WHERE pp.product_id = p.product_id
                AND pp.price_list_id = ?
                AND pp.price IS NOT NULL)
          ) < 2000 THEN 3
          ELSE 4
        END AS tier
      FROM products p
      JOIN stock s
        ON s.product_id = p.product_id
       AND s.store_id = ?
      GROUP BY p.product_id, p.price
      HAVING SUM(s.stock) > 0
         AND COALESCE(
           p.price,
           (SELECT MIN(pp.price) FROM product_pricing pp
             WHERE pp.product_id = p.product_id
               AND pp.price_list_id = ?
               AND pp.price IS NOT NULL)
         ) IS NOT NULL
    ) t
    GROUP BY tier
  `;

  const [rows] = await catalogPool.query<PriceBucketRow[]>(sql, [
    PRICE_LIST_ID,
    PRICE_LIST_ID,
    PRICE_LIST_ID,
    STORE_ID,
    PRICE_LIST_ID,
  ]);

  const labels: Record<PriceTier, string> = {
    1: "Under $500",
    2: "$500 – $1,000",
    3: "$1,000 – $2,000",
    4: "$2,000+",
  };

  const counts = new Map<number, number>();
  for (const row of rows) counts.set(Number(row.tier), Number(row.product_count));

  return ([1, 2, 3, 4] as PriceTier[]).map((tier) => ({
    tier,
    label: labels[tier],
    productCount: counts.get(tier) ?? 0,
  }));
}

// ---------- Aggregate counts for hero subhead ----------

export interface CatalogCounts {
  totalInStock: number;
  tvInStock: number;
  totalCategories: number;
}

interface CountsRow extends RowDataPacket {
  total_in_stock: number;
  tv_in_stock: number;
  total_categories: number;
}

export async function getCatalogCounts(): Promise<CatalogCounts> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM (
        SELECT p.product_id
        FROM products p
        JOIN stock s ON s.product_id = p.product_id AND s.store_id = ?
        GROUP BY p.product_id
        HAVING SUM(s.stock) > 0
      ) x) AS total_in_stock,
      (SELECT COUNT(*) FROM (
        SELECT p.product_id
        FROM products p
        JOIN stock s ON s.product_id = p.product_id AND s.store_id = ?
        WHERE p.category_id = 8
        GROUP BY p.product_id
        HAVING SUM(s.stock) > 0
      ) y) AS tv_in_stock,
      (SELECT COUNT(*) FROM (
        SELECT c.category_id
        FROM categories c
        JOIN products p ON p.category_id = c.category_id
        JOIN stock s ON s.product_id = p.product_id AND s.store_id = ?
        WHERE c.row_status = 1
        GROUP BY c.category_id
        HAVING SUM(s.stock) > 0
      ) z) AS total_categories
  `;

  const [rows] = await catalogPool.query<CountsRow[]>(sql, [
    STORE_ID,
    STORE_ID,
    STORE_ID,
  ]);
  const r = rows[0];
  return {
    totalInStock: Number(r.total_in_stock),
    tvInStock: Number(r.tv_in_stock),
    totalCategories: Number(r.total_categories),
  };
}
