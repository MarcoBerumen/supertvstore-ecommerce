import { getCategoriesWithCounts } from "@/lib/mariadb/queries/home";
import { CategoryTile } from "./category-tile";
import { Skeleton } from "@/components/ui/skeleton";

export function CategoryGridSkeleton() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20">
      <div className="mb-6 flex items-end justify-between">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 xl:gap-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] w-full rounded-xl" />
        ))}
      </div>
    </section>
  );
}

export async function CategoryGrid() {
  const categories = await getCategoriesWithCounts();

  return (
    <section
      aria-labelledby="categories-heading"
      className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20"
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2
          id="categories-heading"
          className="text-2xl font-bold tracking-tight md:text-3xl"
        >
          Shop by category
        </h2>
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {categories.length} categories
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 xl:gap-5">
        {categories.map((c, i) => (
          <CategoryTile key={c.id} category={c} index={i} />
        ))}
      </div>
    </section>
  );
}
