import Link from "next/link";
import { getTopBrands } from "@/lib/mariadb/queries/home";
import { BrandChip } from "./brand-chip";
import { Skeleton } from "@/components/ui/skeleton";

export function BrandRowSkeleton() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20">
      <div className="mb-6 flex items-end justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex gap-3 overflow-x-auto">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-20 min-w-[180px] rounded-xl" />
        ))}
      </div>
    </section>
  );
}

export async function BrandRow() {
  const brands = await getTopBrands();

  if (brands.length === 0) return null;

  return (
    <section
      aria-labelledby="brands-heading"
      className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20"
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2
          id="brands-heading"
          className="text-2xl font-bold tracking-tight md:text-3xl"
        >
          Top brands
        </h2>
        <Link
          href="#"
          className="text-sm font-medium text-accent hover:underline"
        >
          Shop all &rarr;
        </Link>
      </div>

      <div
        role="list"
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-x-visible scrollbar-thin"
      >
        {brands.map((b, i) => (
          <BrandChip key={b.id} brand={b} index={i} />
        ))}
      </div>
    </section>
  );
}
