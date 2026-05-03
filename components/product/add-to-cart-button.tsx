"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-context";
import { addToCartAction } from "@/app/product/actions";
import { cn } from "@/lib/utils";

export interface AddToCartButtonProps {
  productId: number;
  productName: string;
  variantLabel: string;
  statusId: number;
  gradeId: number;
  warrantyId: number | null;
  quantity: number;
  disabled?: boolean;
  outOfStock?: boolean;
  /** Distinct a11y label so the in-flow + sticky CTAs are disambiguated. */
  ariaLabel?: string;
  className?: string;
  size?: "default" | "lg";
  variant?: "default" | "secondary";
}

export function AddToCartButton({
  productId,
  productName,
  variantLabel,
  statusId,
  gradeId,
  warrantyId,
  quantity,
  disabled,
  outOfStock,
  ariaLabel,
  className,
  size = "lg",
  variant,
}: AddToCartButtonProps) {
  const [pending, startTransition] = useTransition();
  const { optimisticAdd } = useCart();

  if (outOfStock) {
    return (
      <Button
        size={size}
        variant="secondary"
        disabled
        aria-label={ariaLabel}
        className={cn("h-12 w-full text-base", className)}
      >
        Out of stock
      </Button>
    );
  }

  const handleClick = () => {
    if (disabled || pending) return;
    const variantKey = `${statusId}:${gradeId}`;
    const rollback = optimisticAdd({ productId, variantKey, quantity });

    startTransition(async () => {
      const res = await addToCartAction({
        productId,
        statusId,
        gradeId,
        warrantyId,
        quantity,
      });

      if (res.ok) {
        toast.success("Added to cart", {
          description: `${productName} · ${variantLabel} · Qty ${quantity}`,
          action: {
            label: "View cart",
            onClick: () => {
              window.location.href = "/cart";
            },
          },
          duration: 4000,
        });
      } else {
        rollback();
        toast.error("Couldn't add to cart", {
          description:
            "Please try again. If this keeps happening, contact support.",
          action: {
            label: "Retry",
            onClick: handleClick,
          },
          duration: 6000,
        });
      }
    });
  };

  return (
    <Button
      size={size}
      variant={variant ?? "default"}
      disabled={disabled || pending}
      aria-busy={pending}
      aria-label={ariaLabel}
      onClick={handleClick}
      className={cn("h-12 w-full text-base", className)}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Adding...
        </>
      ) : (
        "Add to cart"
      )}
    </Button>
  );
}

/** Tiny placeholder link used in the out-of-stock empty-state inside the panel. */
export function NotifyMeLink() {
  return (
    <Link
      href="#"
      className="mt-3 inline-flex items-center justify-center text-sm font-medium text-accent hover:underline"
    >
      Notify me when available
    </Link>
  );
}
