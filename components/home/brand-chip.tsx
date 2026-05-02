import Link from "next/link";
import type { TopBrand } from "@/lib/mariadb/queries/home";

function hash(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function gradientFor(name: string): string {
  const h = hash(name);
  const hue1 = h % 360;
  const hue2 = (hue1 + 40 + ((h >> 8) % 60)) % 360;
  return `linear-gradient(135deg, hsl(${hue1} 22% 92%) 0%, hsl(${hue2} 26% 84%) 100%)`;
}

function gradientForDark(name: string): string {
  const h = hash(name);
  const hue1 = h % 360;
  const hue2 = (hue1 + 40 + ((h >> 8) % 60)) % 360;
  return `linear-gradient(135deg, hsl(${hue1} 18% 16%) 0%, hsl(${hue2} 20% 10%) 100%)`;
}

export function BrandChip({ brand, index }: { brand: TopBrand; index: number }) {
  const lightBg = gradientFor(brand.name);
  const darkBg = gradientForDark(brand.name);

  return (
    <Link
      href={`#brand-${brand.slug}`}
      role="listitem"
      aria-label={brand.name}
      className="group relative flex h-20 min-w-[180px] shrink-0 snap-start items-center justify-center overflow-hidden rounded-xl border border-border px-6 transition-[transform,box-shadow,border-color,filter] duration-200 ease-out hover:-translate-y-0.5 hover:border-accent hover:shadow-md hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 dark:hidden"
        style={{ backgroundImage: lightBg }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 hidden dark:block"
        style={{ backgroundImage: darkBg }}
      />
      <span className="relative text-base font-semibold tracking-tight text-foreground transition-transform duration-200 group-hover:scale-[1.02]">
        {brand.name}
      </span>
    </Link>
  );
}
