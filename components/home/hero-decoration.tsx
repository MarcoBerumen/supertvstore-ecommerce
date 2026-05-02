"use client";

import { ProductMedia } from "@/components/product-media";
import {
  Tv,
  Speaker,
  Headphones,
  Smartphone,
  Laptop,
  Tablet,
  Watch,
  Gamepad2,
  AudioLines,
  type LucideIcon,
} from "lucide-react";

const PANELS: { name: string; icon: LucideIcon }[] = [
  { name: "OLED 4K", icon: Tv },
  { name: "Soundbar", icon: AudioLines },
  { name: "Headphones", icon: Headphones },
  { name: "iPhone", icon: Smartphone },
  { name: "MacBook", icon: Laptop },
  { name: "iPad", icon: Tablet },
  { name: "Watch", icon: Watch },
  { name: "Console", icon: Gamepad2 },
  { name: "Speaker", icon: Speaker },
];

export function HeroDecoration() {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-3 gap-2 sm:gap-3"
    >
      {PANELS.map((p, i) => (
        <div
          key={p.name}
          className="animate-panel-pulse rounded-lg overflow-hidden border border-border/60"
          style={{ animationDelay: `${i * 150}ms` }}
        >
          <ProductMedia
            name={p.name}
            iconHint={p.icon}
            aspect="1:1"
            showLabel={false}
            sizes="120px"
          />
        </div>
      ))}
    </div>
  );
}

export function HeroDecorationMobile() {
  // Smaller 2x2 variant for mobile (above the headline).
  const four = PANELS.slice(0, 4);
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-4 gap-2 h-32"
    >
      {four.map((p, i) => (
        <div
          key={p.name}
          className="animate-panel-pulse rounded-md overflow-hidden border border-border/60 h-full"
          style={{ animationDelay: `${i * 150}ms` }}
        >
          <ProductMedia
            name={p.name}
            iconHint={p.icon}
            aspect="1:1"
            showLabel={false}
            sizes="80px"
            className="h-full"
          />
        </div>
      ))}
    </div>
  );
}
