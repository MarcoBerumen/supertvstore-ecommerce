import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ProductDetail, ProductVariant } from "@/lib/mariadb/queries/product";

const CURRENT_YEAR = new Date().getFullYear();

export interface ProductHeaderProps {
  product: ProductDetail;
  variants: ProductVariant[];
}

function findScreenSize(product: ProductDetail): string | null {
  if (product.screenSize !== null) {
    const s = Number(product.screenSize);
    if (Number.isFinite(s) && s > 0) {
      return `${Number.isInteger(s) ? s : s.toFixed(1)}"`;
    }
  }
  const fromSpecs = product.specs.find((s) => s.slug === "screen-size");
  if (fromSpecs) {
    const n = parseFloat(fromSpecs.value);
    if (Number.isFinite(n) && n > 0) return `${Number.isInteger(n) ? n : n.toFixed(1)}"`;
  }
  return null;
}

export function ProductHeader({ product, variants }: ProductHeaderProps) {
  const isTv = product.categoryId === 8;
  const screenSize = isTv ? findScreenSize(product) : null;
  const isNewYear = product.year !== null && product.year === CURRENT_YEAR;
  const maxStock = variants.reduce((m, v) => Math.max(m, v.stockQty), 0);
  const isLowStock = variants.length > 0 && maxStock > 0 && maxStock <= 3;
  const openBoxVariants = variants.filter((v) => v.statusName.toLowerCase() !== "new");
  const openBoxFromPrice =
    openBoxVariants.length > 0
      ? Math.min(...openBoxVariants.map((v) => v.price))
      : null;

  return (
    <header className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {product.brandName ? <span>{product.brandName}</span> : null}
        {product.brandName && product.model ? <span aria-hidden="true">·</span> : null}
        {product.model ? <span>{product.model}</span> : null}
        {(product.brandName || product.model) && product.sku ? (
          <span aria-hidden="true">·</span>
        ) : null}
        {product.sku ? (
          <span className="select-text">SKU {product.sku}</span>
        ) : null}
      </div>

      <div className="flex items-start gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <h1 className="line-clamp-3 text-balance text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
              {product.name}
            </h1>
          </TooltipTrigger>
          <TooltipContent className="max-w-md">{product.name}</TooltipContent>
        </Tooltip>
        {screenSize ? (
          <span className="hidden shrink-0 rounded-full bg-secondary px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-secondary-foreground md:inline-block">
            {screenSize}
          </span>
        ) : null}
      </div>

      {(isNewYear || isLowStock || openBoxFromPrice !== null) ? (
        <div className="flex flex-wrap items-center gap-2">
          {isNewYear ? (
            <Badge className="bg-accent text-accent-foreground hover:bg-accent">
              NEW
            </Badge>
          ) : null}
          {isLowStock ? (
            <Badge variant="destructive">LOW STOCK</Badge>
          ) : null}
          {openBoxFromPrice !== null ? (
            <Badge variant="secondary">
              OPEN BOX FROM ${openBoxFromPrice.toFixed(0)}
            </Badge>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
