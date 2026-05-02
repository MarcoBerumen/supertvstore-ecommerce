import * as React from "react";
import Image from "next/image";
import { Package, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Aspect = "1:1" | "4:5" | "16:9";

const ASPECT_CLASS: Record<Aspect, string> = {
  "1:1": "aspect-square",
  "4:5": "aspect-[4/5]",
  "16:9": "aspect-video",
};

export interface ProductMediaProps {
  src?: string | null;
  name: string;
  category?: string;
  aspect?: Aspect;
  iconHint?: LucideIcon;
  className?: string;
  sizes?: string;
  priority?: boolean;
  showLabel?: boolean;
  shimmer?: boolean;
}

function hash(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function gradientStops(seed: string): { from: string; to: string } {
  const h = hash(seed);
  const hue1 = h % 360;
  const hue2 = (hue1 + 30 + ((h >> 8) % 60)) % 360;
  // Desaturated, mid-light range so it stays calm and never fights the accent.
  return {
    from: `hsl(${hue1} 18% 88%)`,
    to: `hsl(${hue2} 22% 78%)`,
  };
}

function gradientStopsDark(seed: string): { from: string; to: string } {
  const h = hash(seed);
  const hue1 = h % 360;
  const hue2 = (hue1 + 30 + ((h >> 8) % 60)) % 360;
  return {
    from: `hsl(${hue1} 14% 18%)`,
    to: `hsl(${hue2} 18% 12%)`,
  };
}

export function ProductMedia({
  src,
  name,
  category,
  aspect = "1:1",
  iconHint,
  className,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
  priority = false,
  showLabel = true,
  shimmer = false,
}: ProductMediaProps) {
  const seed = `${name}|${category ?? ""}`;
  const light = gradientStops(seed);
  const dark = gradientStopsDark(seed);
  const Icon: LucideIcon = iconHint ?? Package;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted",
        ASPECT_CLASS[aspect],
        className,
      )}
    >
      {/* Placeholder layer (always rendered behind the img). */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 dark:hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, ${light.from} 0%, ${light.to} 100%)`,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 hidden dark:block"
        style={{
          backgroundImage: `linear-gradient(135deg, ${dark.from} 0%, ${dark.to} 100%)`,
        }}
      />
      {shimmer ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[1] animate-shimmer bg-[linear-gradient(110deg,transparent_30%,hsl(var(--foreground)/0.06)_50%,transparent_70%)] bg-[length:200%_100%]"
        />
      ) : null}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[2] flex items-center justify-center"
      >
        <Icon
          className="h-[40%] w-[40%] text-foreground"
          style={{ opacity: 0.08 }}
          strokeWidth={1.25}
        />
      </div>
      {showLabel ? (
        <div
          aria-hidden="true"
          className="absolute bottom-2 left-2 right-2 z-[3] truncate font-mono text-[10px] uppercase tracking-wider text-foreground/70"
        >
          {name}
        </div>
      ) : null}

      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes={sizes}
          priority={priority}
          className="z-10 object-cover"
        />
      ) : null}
    </div>
  );
}
