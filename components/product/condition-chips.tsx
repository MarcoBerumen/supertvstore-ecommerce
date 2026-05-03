"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ProductVariant } from "@/lib/mariadb/queries/product";
import { cn } from "@/lib/utils";

export interface ConditionChipsProps {
  variants: ProductVariant[];
  selectedKey: string;
  inCartByVariant: Record<string, number>;
  onChange(key: string): void;
}

function chipLabel(v: ProductVariant): { status: string; grade: string | null } {
  const status = v.statusName;
  // For "New" the grade is just A — present without the letter.
  if (status.toLowerCase() === "new") return { status, grade: null };
  return { status, grade: v.gradeName };
}

export function ConditionChips({
  variants,
  selectedKey,
  inCartByVariant,
  onChange,
}: ConditionChipsProps) {
  if (variants.length <= 1) return null;

  return (
    <fieldset>
      <legend className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        Condition
      </legend>
      <div role="radiogroup" className="flex flex-wrap gap-2">
        {variants.map((v) => {
          const inCart = inCartByVariant[v.key] ?? 0;
          const remaining = v.stockQty - inCart;
          const disabled = remaining <= 0;
          const selected = v.key === selectedKey;
          const { status, grade } = chipLabel(v);
          const tipMessage = disabled
            ? inCart > 0 && inCart >= v.stockQty
              ? "Already in your cart"
              : "Out of stock"
            : `$${v.price.toFixed(0)} · ${v.stockQty} in stock`;

          return (
            <Tooltip key={v.key}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-disabled={disabled}
                  disabled={disabled}
                  onClick={() => {
                    if (!disabled) onChange(v.key);
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    selected
                      ? "border-accent bg-accent-soft text-foreground"
                      : "border-border hover:border-foreground/40",
                    disabled && "cursor-not-allowed line-through opacity-50",
                  )}
                >
                  <span>{status}</span>
                  {grade ? (
                    <span className="font-mono text-[11px] uppercase tracking-wider">
                      · {grade}
                    </span>
                  ) : null}
                </button>
              </TooltipTrigger>
              <TooltipContent>{tipMessage}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </fieldset>
  );
}
