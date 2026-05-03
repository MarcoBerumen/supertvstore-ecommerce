"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, MapPin, RotateCcw, Truck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ConditionChips } from "./condition-chips";
import { QuantityStepper } from "./quantity-stepper";
import {
  WarrantyChooser,
  warrantyKey,
  NONE_WARRANTY_ID,
} from "./warranty-chooser";
import { AddToCartButton, NotifyMeLink } from "./add-to-cart-button";
import { useCart } from "@/components/cart-context";
import { cn } from "@/lib/utils";
import type {
  ProductVariant,
  Warranty,
} from "@/lib/mariadb/queries/product";

export interface PurchasePanelProps {
  productId: number;
  productName: string;
  variants: ProductVariant[];
  /** Indexed by `${statusId}:${gradeId}`. */
  initialInCartByVariant: Record<string, number>;
  warrantiesByVariantKey: Record<string, Warranty[]>;
  /** When true, drops the desktop card chrome (used when rendered inline on mobile). */
  inline?: boolean;
}

function formatPrice(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

function pickInitialVariant(
  variants: ProductVariant[],
  inCart: Record<string, number>,
): ProductVariant | null {
  const available = variants.find((v) => v.stockQty - (inCart[v.key] ?? 0) > 0);
  return available ?? variants[0] ?? null;
}

function pickDefaultWarranty(warranties: Warranty[]): string {
  const standardFree = warranties.find(
    (w) => w.id !== null && w.price === 0,
  );
  return standardFree ? warrantyKey(standardFree) : NONE_WARRANTY_ID;
}

function variantLabel(v: ProductVariant): string {
  if (v.statusName.toLowerCase() === "new") return "New";
  return `${v.statusName} · ${v.gradeName}`;
}

export function PurchasePanel({
  productId,
  productName,
  variants,
  initialInCartByVariant,
  warrantiesByVariantKey,
  inline = false,
}: PurchasePanelProps) {
  const { getProductInCart } = useCart();

  const liveInCart = getProductInCart(productId);
  // The CartContext is the source of truth post-mount; initial map seeds it.
  const inCart = useMemo<Record<string, number>>(() => {
    return Object.keys(liveInCart).length > 0 ? liveInCart : initialInCartByVariant;
  }, [liveInCart, initialInCartByVariant]);

  const allOutOfStock =
    variants.length === 0 ||
    variants.every((v) => v.stockQty - (inCart[v.key] ?? 0) <= 0);

  const initial = pickInitialVariant(variants, initialInCartByVariant);
  const [selectedKey, setSelectedKey] = useState<string>(initial?.key ?? "");
  const selected = variants.find((v) => v.key === selectedKey) ?? initial;

  const eligibleWarranties = selected
    ? warrantiesByVariantKey[selected.key] ?? []
    : [];

  const [selectedWarrantyId, setSelectedWarrantyId] = useState<string>(() =>
    pickDefaultWarranty(eligibleWarranties),
  );
  const [quantity, setQuantity] = useState(1);

  // When variant changes, re-clamp quantity and re-select default warranty if
  // the previous warranty is no longer eligible at the new price.
  useEffect(() => {
    if (!selected) return;
    const remaining = selected.stockQty - (inCart[selected.key] ?? 0);
    setQuantity((q) => Math.max(1, Math.min(q, Math.max(1, remaining))));
    const stillValid = eligibleWarranties.some(
      (w) => warrantyKey(w) === selectedWarrantyId,
    );
    if (!stillValid) {
      setSelectedWarrantyId(pickDefaultWarranty(eligibleWarranties));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey]);

  if (!selected) {
    return (
      <PanelShell inline={inline}>
        <div className="text-sm text-muted-foreground">
          Pricing temporarily unavailable.
        </div>
      </PanelShell>
    );
  }

  const newVariant = variants.find((v) => v.statusName.toLowerCase() === "new");
  const isNonNewSelected =
    selected.statusName.toLowerCase() !== "new" && newVariant !== undefined;

  const inCartForSelected = inCart[selected.key] ?? 0;
  const remaining = Math.max(0, selected.stockQty - inCartForSelected);
  const allInCartForSelected = remaining === 0 && selected.stockQty > 0;
  const quantityMax = Math.max(1, remaining);

  const stockState: "in_stock" | "low_stock" | "out_of_stock" =
    remaining === 0
      ? "out_of_stock"
      : remaining <= 3
        ? "low_stock"
        : "in_stock";

  const stockDot = {
    in_stock: "bg-emerald-500",
    low_stock: "bg-amber-500",
    out_of_stock: "bg-muted-foreground",
  }[stockState];

  const stockLabel = {
    in_stock: `In stock · ${selected.stockQty} available`,
    low_stock: `Low stock · ${remaining} left`,
    out_of_stock: allOutOfStock ? "Out of stock" : "Already in cart",
  }[stockState];

  const selectedWarranty =
    eligibleWarranties.find((w) => warrantyKey(w) === selectedWarrantyId) ??
    eligibleWarranties[0];
  const warrantyPrice = selectedWarranty?.price ?? 0;
  const total = selected.price * quantity + warrantyPrice;

  const ctaDisabled = quantity <= 0 || quantity > quantityMax;

  return (
    <PanelShell inline={inline} ariaLabel="Purchase options">
      {/* Price block */}
      <div>
        <div className="flex items-baseline gap-3">
          <span
            key={selected.key}
            className="text-3xl font-bold tabular-nums"
          >
            {formatPrice(selected.price)}
          </span>
          {isNonNewSelected && newVariant ? (
            <span className="text-base text-muted-foreground line-through tabular-nums">
              {formatPrice(newVariant.price)}
            </span>
          ) : null}
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
          <span
            aria-hidden="true"
            className={cn("h-2 w-2 rounded-full", stockDot)}
          />
          <span>{stockLabel}</span>
        </div>
      </div>

      {variants.length > 1 ? (
        <ConditionChips
          variants={variants}
          selectedKey={selectedKey}
          inCartByVariant={inCart}
          onChange={setSelectedKey}
        />
      ) : null}

      {!allOutOfStock && !allInCartForSelected ? (
        <QuantityStepper
          value={quantity}
          min={1}
          max={quantityMax}
          onChange={setQuantity}
          maxReachedHint={
            inCartForSelected > 0
              ? `Max available reached (${inCartForSelected} in your cart)`
              : "Max available reached"
          }
        />
      ) : null}

      {!allOutOfStock && !allInCartForSelected && eligibleWarranties.length > 1 ? (
        <WarrantyChooser
          warranties={eligibleWarranties}
          selectedId={selectedWarrantyId}
          onChange={setSelectedWarrantyId}
        />
      ) : null}

      {allInCartForSelected && !allOutOfStock ? (
        <p className="text-sm text-muted-foreground">
          You have all {selected.stockQty} in your cart.
        </p>
      ) : null}

      <div>
        <Separator className="mb-4" />
        <div className="mb-4 flex items-baseline justify-between">
          <span className="text-sm font-medium">Total</span>
          <span
            aria-live="polite"
            className="text-2xl font-semibold tabular-nums"
          >
            {formatPrice(total)}
          </span>
        </div>
        {allOutOfStock ? (
          <>
            <AddToCartButton
              productId={productId}
              productName={productName}
              variantLabel={variantLabel(selected)}
              statusId={selected.statusId}
              gradeId={selected.gradeId}
              warrantyId={null}
              quantity={1}
              outOfStock
              ariaLabel="Out of stock"
            />
            <div className="mt-3 flex items-center justify-center gap-1.5 text-sm">
              <Bell className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <NotifyMeLink />
            </div>
          </>
        ) : allInCartForSelected ? (
          <AddToCartButton
            productId={productId}
            productName={productName}
            variantLabel={variantLabel(selected)}
            statusId={selected.statusId}
            gradeId={selected.gradeId}
            warrantyId={null}
            quantity={1}
            disabled
            ariaLabel="Already in cart"
          />
        ) : (
          <AddToCartButton
            productId={productId}
            productName={productName}
            variantLabel={variantLabel(selected)}
            statusId={selected.statusId}
            gradeId={selected.gradeId}
            warrantyId={
              selectedWarranty && selectedWarranty.id !== null
                ? selectedWarranty.id
                : null
            }
            quantity={quantity}
            disabled={ctaDisabled}
            ariaLabel="Add to cart"
          />
        )}
      </div>

      <ul className="space-y-2 text-sm text-muted-foreground">
        <li className="flex items-center gap-2">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          Free in-store pickup in Houston
        </li>
        <li className="flex items-center gap-2">
          <Truck className="h-4 w-4" aria-hidden="true" />
          Ships from Houston, TX
        </li>
        <li className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          30-day return policy
        </li>
      </ul>
    </PanelShell>
  );
}

function PanelShell({
  inline,
  ariaLabel,
  children,
}: {
  inline: boolean;
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  if (inline) {
    return (
      <aside aria-label={ariaLabel} className="space-y-5">
        {children}
      </aside>
    );
  }
  return (
    <aside
      aria-label={ariaLabel}
      className="space-y-5 lg:rounded-xl lg:border lg:border-border lg:bg-card lg:p-6"
    >
      {children}
    </aside>
  );
}
