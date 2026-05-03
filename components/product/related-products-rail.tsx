import { HorizontalRail } from "@/components/home/horizontal-rail";
import { ProductCard } from "@/components/home/product-card";
import {
  getRelatedProducts,
  type RelatedProduct,
} from "@/lib/mariadb/queries/product";

export interface RelatedProductsRailProps {
  productId: number;
  brandId: number | null;
  brandName: string | null;
  categoryId: number | null;
}

export async function RelatedProductsRail({
  productId,
  brandId,
  brandName,
  categoryId,
}: RelatedProductsRailProps) {
  const related: RelatedProduct[] = await getRelatedProducts(
    productId,
    brandId,
    categoryId,
    12,
  );
  if (related.length < 4) return null;

  const title = brandName ? `More from ${brandName}` : "You may also like";
  const viewAllHref = categoryId !== null ? `/category/${categoryId}` : "#";

  return (
    <HorizontalRail title={title} viewAllHref={viewAllHref}>
      {related.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </HorizontalRail>
  );
}
