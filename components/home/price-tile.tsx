import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PriceTier } from "@/lib/mariadb/queries/home";

const TIER_BG: Record<PriceTier, string> = {
  1: "bg-accent/5",
  2: "bg-accent/10",
  3: "bg-accent/15",
  4: "bg-accent/20",
};

export function PriceTile({
  label,
  href,
  productCount,
  tier,
  index,
}: {
  label: string;
  href: string;
  productCount: number;
  tier: PriceTier;
  index: number;
}) {
  const empty = productCount === 0;
  const stagger = index * 80;

  const accessibleName = empty
    ? `${label}, coming soon`
    : `${label}, ${productCount} products`;

  if (empty) {
    return (
      <div
        aria-disabled="true"
        aria-label={accessibleName}
        className={cn(
          "relative flex aspect-[5/3] flex-col justify-between rounded-xl border border-border p-5 opacity-50 pointer-events-none animate-tile-rise",
          TIER_BG[tier],
        )}
        style={{ animationDelay: `${stagger}ms` }}
      >
        <div className="text-xl font-bold tracking-tight md:text-2xl">
          {label}
        </div>
        <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Coming soon
        </div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      aria-label={accessibleName}
      className={cn(
        "group relative flex aspect-[5/3] flex-col justify-between rounded-xl border border-border p-5 animate-tile-rise transition-[transform,box-shadow,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        TIER_BG[tier],
      )}
      style={{ animationDelay: `${stagger}ms` }}
    >
      <div className="text-xl font-bold tracking-tight md:text-2xl">
        {label}
      </div>
      <div className="flex items-end justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {productCount} {productCount === 1 ? "product" : "products"}
        </span>
        <ArrowRight
          className="h-5 w-5 text-accent transition-transform duration-200 ease-out group-hover:translate-x-1"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
