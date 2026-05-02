import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroDecoration, HeroDecorationMobile } from "./hero-decoration";

export function Hero({
  totalInStock,
  tvInStock,
}: {
  totalInStock: number;
  tvInStock: number;
}) {
  const otherCount = Math.max(totalInStock - tvInStock, 0);

  return (
    <section
      aria-labelledby="hero-headline"
      className="relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_85%_15%,hsl(var(--accent)/0.18),transparent_70%)]"
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-20 min-h-[440px] lg:min-h-[520px]">
        <div className="lg:hidden">
          <HeroDecorationMobile />
        </div>

        <div className="lg:col-span-7">
          <h1
            id="hero-headline"
            className="text-4xl font-bold leading-[0.95] tracking-tight md:text-6xl lg:text-7xl"
          >
            <span className="block">HOUSTON&rsquo;S TV STORE,</span>
            <span className="block bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">
              NOW SHIPPING SCREENS.
            </span>
          </h1>

          <p className="mt-6 max-w-prose text-lg text-muted-foreground md:text-xl">
            <span className="font-mono font-semibold text-foreground">
              {tvInStock}
            </span>{" "}
            TVs,{" "}
            <span className="font-mono font-semibold text-foreground">
              {otherCount}
            </span>{" "}
            more electronics. Pickup in-store or delivered.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="group bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Link href="#">
                Shop TVs
                <ArrowRight className="transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#">Browse all categories</Link>
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground sm:text-sm">
            <li className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-accent" aria-hidden="true" />
              In-store pickup
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-accent" aria-hidden="true" />
              Houston, TX
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-accent" aria-hidden="true" />
              Tv Super Store
            </li>
          </ul>
        </div>

        <div className="hidden lg:col-span-5 lg:block">
          <HeroDecoration />
        </div>
      </div>
    </section>
  );
}
