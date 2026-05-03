"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuantityStepperProps {
  value: number;
  min?: number;
  max: number;
  onChange(value: number): void;
  /** Helper note shown under the stepper when the + button is disabled. */
  maxReachedHint?: string;
}

export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  maxReachedHint,
}: QuantityStepperProps) {
  const minusDisabled = value <= min;
  const plusDisabled = value >= max;

  return (
    <div role="group" aria-labelledby="qty-label">
      <div
        id="qty-label"
        className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
      >
        Quantity
      </div>
      <div className="inline-flex items-center rounded-lg border border-border">
        <button
          type="button"
          aria-label="Decrease quantity"
          disabled={minusDisabled}
          onClick={() => onChange(Math.max(min, value - 1))}
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-l-lg transition-opacity duration-150 hover:bg-secondary",
            minusDisabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
          )}
        >
          <Minus className="h-4 w-4" />
        </button>
        <div
          aria-live="polite"
          className="min-w-[3ch] px-2 text-center font-medium tabular-nums"
        >
          {value}
        </div>
        <button
          type="button"
          aria-label="Increase quantity"
          disabled={plusDisabled}
          onClick={() => onChange(Math.min(max, value + 1))}
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-r-lg transition-opacity duration-150 hover:bg-secondary",
            plusDisabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
          )}
        >
          <Plus className="h-4 w-4" />
        </button>
        <input type="hidden" name="quantity" value={value} readOnly />
      </div>
      {plusDisabled && maxReachedHint ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{maxReachedHint}</p>
      ) : null}
    </div>
  );
}
