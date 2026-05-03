import Link from "next/link";
import { ProductMedia } from "@/components/product-media";
import { iconForCategory } from "./category-icons";
import type { CategoryWithCount } from "@/lib/mariadb/queries/home";

export function CategoryTile({
  category,
  index,
}: {
  category: CategoryWithCount;
  index: number;
}) {
  const Icon = iconForCategory(category.name);
  const src = category.sampleImageUrl;
  const stagger = Math.min(index, 12) * 40;

  return (
    <Link
      href={`#category-${category.slug}`}
      aria-label={`${category.name}, ${category.productCount} products`}
      className="group relative block animate-tile-rise overflow-hidden rounded-xl border border-border bg-card transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={{ animationDelay: `${stagger}ms` }}
    >
      <div className="aspect-[4/5] flex flex-col">
        <div className="relative flex-[7] overflow-hidden">
          <ProductMedia
            src={src}
            name={category.name}
            iconHint={Icon}
            aspect="1:1"
            showLabel={false}
            className="h-full w-full transition-[filter] duration-200 group-hover:brightness-105"
          />
        </div>
        <div className="flex flex-[3] flex-col justify-center gap-1 px-3 py-2">
          <div className="text-sm font-semibold sm:text-base line-clamp-1">
            {category.name}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-accent">
            {category.productCount}{" "}
            {category.productCount === 1 ? "product" : "products"}
          </div>
        </div>
      </div>
    </Link>
  );
}
