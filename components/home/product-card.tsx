import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProductMedia } from "@/components/product-media";
import type { HomeProduct } from "@/lib/mariadb/queries/home";
import { slugify } from "@/lib/mariadb/queries/product";

function formatPrice(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

export function ProductCard({
  product,
  showNewBadge = false,
}: {
  product: HomeProduct;
  showNewBadge?: boolean;
}) {
  const src = product.imageUrl;
  const accessibleName = `${product.brand ? product.brand + " " : ""}${product.name}, ${formatPrice(product.price)}`;
  const href = `/product/${product.id}/${slugify(product.name) || "p"}`;

  return (
    <Link
      href={href}
      aria-label={accessibleName}
      className="group block w-[70vw] max-w-[280px] shrink-0 snap-start sm:w-[45vw] sm:max-w-[260px] md:w-[280px] lg:w-[260px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
    >
      <div className="relative overflow-hidden rounded-xl border border-border bg-card transition-[transform,box-shadow] duration-200 ease-out group-hover:-translate-y-1 group-hover:shadow-lg">
        <div className="relative">
          <ProductMedia
            src={src}
            name={product.name}
            category={product.brand ?? ""}
            aspect="1:1"
            showLabel={false}
            className="transition-[filter] duration-200 group-hover:brightness-105"
          />
          {showNewBadge ? (
            <Badge className="absolute left-2 top-2 z-20 bg-accent text-accent-foreground hover:bg-accent">
              NEW
            </Badge>
          ) : null}
          <div
            aria-hidden="true"
            className="absolute right-2 top-2 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/90 opacity-0 shadow transition-opacity duration-150 group-hover:opacity-100"
          >
            <Plus className="h-4 w-4" />
          </div>
        </div>

        <div className="space-y-1 p-3">
          {product.brand ? (
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {product.brand}
            </div>
          ) : null}
          <div className="font-medium leading-snug line-clamp-2 min-h-[2.5em]">
            {product.name}
          </div>
          <div className="text-lg font-semibold">{formatPrice(product.price)}</div>
        </div>
      </div>
    </Link>
  );
}
