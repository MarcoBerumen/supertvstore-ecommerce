import { Skeleton } from "@/components/ui/skeleton";
import { getProductCountsByPriceBucket } from "@/lib/mariadb/queries/home";
import { PriceTile } from "./price-tile";

export function PriceTilesSkeleton() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20">
      <div className="mb-6 flex items-end justify-between">
        <Skeleton className="h-8 w-44" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[5/3] w-full rounded-xl" />
        ))}
      </div>
    </section>
  );
}

export async function PriceTiles() {
  const buckets = await getProductCountsByPriceBucket();

  return (
    <section
      aria-labelledby="price-heading"
      className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20"
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2
          id="price-heading"
          className="text-2xl font-bold tracking-tight md:text-3xl"
        >
          Shop by price
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {buckets.map((b, i) => (
          <PriceTile
            key={b.tier}
            label={b.label}
            href="#"
            productCount={b.productCount}
            tier={b.tier}
            index={i}
          />
        ))}
      </div>
    </section>
  );
}
