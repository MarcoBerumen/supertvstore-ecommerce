"use client";

import { useEffect, useState } from "react";
import { AddToCartButton } from "./add-to-cart-button";
import { useCart } from "@/components/cart-context";
import { cn } from "@/lib/utils";
import type { ProductVariant } from "@/lib/mariadb/queries/product";

export interface MobileBuyBarProps {
  productId: number;
  productName: string;
  variants: ProductVariant[];
  initialInCartByVariant: Record<string, number>;
  /** id of the in-flow purchase panel container observed for visibility. */
  observeTargetId: string;
}

function formatPrice(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

function variantLabel(v: ProductVariant): string {
  if (v.statusName.toLowerCase() === "new") return "New";
  return `${v.statusName} · ${v.gradeName}`;
}

export function MobileBuyBar({
  productId,
  productName,
  variants,
  initialInCartByVariant,
  observeTargetId,
}: MobileBuyBarProps) {
  const [show, setShow] = useState(false);
  const { getProductInCart } = useCart();

  useEffect(() => {
    const el = document.getElementById(observeTargetId);
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (
            !entry.isIntersecting &&
            entry.boundingClientRect.bottom < 0
          ) {
            setShow(true);
          } else if (entry.isIntersecting) {
            setShow(false);
          }
        }
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [observeTargetId]);

  // Pick the first available variant for sticky-bar pricing — same heuristic
  // the in-flow panel uses for its initial selection.
  const inCart =
    Object.keys(getProductInCart(productId)).length > 0
      ? getProductInCart(productId)
      : initialInCartByVariant;

  const available =
    variants.find((v) => v.stockQty - (inCart[v.key] ?? 0) > 0) ?? variants[0];

  if (!available) return null;

  const allOutOfStock = variants.every(
    (v) => v.stockQty - (inCart[v.key] ?? 0) <= 0,
  );
  const remainingForVariant = Math.max(
    0,
    available.stockQty - (inCart[available.key] ?? 0),
  );
  const stockLine = allOutOfStock
    ? "Out of stock"
    : `In stock · ${variantLabel(available)}`;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-border bg-background/95 p-3 pb-[env(safe-area-inset-bottom)] backdrop-blur-md transition-transform duration-200 ease-out lg:hidden",
        show ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="text-lg font-bold tabular-nums">
          {formatPrice(available.price)}
        </div>
        <div className="truncate text-xs text-muted-foreground">{stockLine}</div>
      </div>
      <div className="ml-auto">
        <AddToCartButton
          productId={productId}
          productName={productName}
          variantLabel={variantLabel(available)}
          statusId={available.statusId}
          gradeId={available.gradeId}
          warrantyId={null}
          quantity={1}
          outOfStock={allOutOfStock}
          disabled={!allOutOfStock && remainingForVariant <= 0}
          ariaLabel="Add to cart, sticky"
          size="lg"
          className="h-12 w-auto px-6"
        />
      </div>
    </div>
  );
}
