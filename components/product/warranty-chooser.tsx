"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { Warranty } from "@/lib/mariadb/queries/product";

export interface WarrantyChooserProps {
  warranties: Warranty[];
  selectedId: string; // sentinel "none" for "No warranty"; otherwise stringified warranty id
  onChange(id: string): void;
}

export const NONE_WARRANTY_ID = "none";

export function warrantyKey(w: Warranty): string {
  return w.id === null ? NONE_WARRANTY_ID : String(w.id);
}

export function WarrantyChooser({
  warranties,
  selectedId,
  onChange,
}: WarrantyChooserProps) {
  // If only the synthetic "No warranty" exists, hide the section entirely.
  if (warranties.length <= 1) return null;

  return (
    <fieldset>
      <legend className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        Protection
      </legend>
      <RadioGroup
        value={selectedId}
        onValueChange={onChange}
        className="gap-2"
      >
        {warranties.map((w) => {
          const id = warrantyKey(w);
          const selected = id === selectedId;
          return (
            <label
              key={id}
              htmlFor={`warranty-${id}`}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                selected
                  ? "border-accent bg-accent-soft/50"
                  : "border-border hover:border-foreground/30",
              )}
            >
              <RadioGroupItem id={`warranty-${id}`} value={id} className="mt-0.5" />
              <div className="flex flex-1 items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium leading-tight">{w.name}</div>
                  {w.id !== null ? (
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {w.days} days · Manufacturer-backed
                    </div>
                  ) : (
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      Skip protection
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-sm font-medium tabular-nums">
                  {w.price === 0 ? "Free" : `+$${w.price.toFixed(0)}`}
                </div>
              </div>
            </label>
          );
        })}
      </RadioGroup>
    </fieldset>
  );
}
