import { Skeleton } from "@/components/ui/skeleton";
import { HorizontalRail } from "./horizontal-rail";
import { ProductCard } from "./product-card";
import {
  getNewArrivals,
  getFeaturedTvs,
  type HomeProduct,
} from "@/lib/mariadb/queries/home";

function CardSkeleton() {
  return (
    <div className="w-[70vw] max-w-[280px] shrink-0 sm:w-[45vw] sm:max-w-[260px] md:w-[280px] lg:w-[260px]">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Skeleton className="aspect-square w-full rounded-none" />
        <div className="space-y-2 p-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    </div>
  );
}

export function ProductRailSkeleton({
  title,
  accentBackground = false,
}: {
  title: string;
  accentBackground?: boolean;
}) {
  return (
    <section
      aria-busy="true"
      className={`py-12 md:py-16 lg:py-20 ${accentBackground ? "bg-accent-soft/40" : ""}`}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function renderRail(opts: {
  title: string;
  viewAllHref: string;
  products: HomeProduct[];
  showNewBadge?: boolean;
  accentBackground?: boolean;
}) {
  const { title, viewAllHref, products, showNewBadge, accentBackground } = opts;

  if (products.length === 0) {
    if (typeof window === "undefined") {
      console.warn(`[home] rail "${title}" has no products; hiding.`);
    }
    return null;
  }

  return (
    <HorizontalRail
      title={title}
      viewAllHref={viewAllHref}
      accentBackground={accentBackground}
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} showNewBadge={showNewBadge} />
      ))}
    </HorizontalRail>
  );
}

export async function NewArrivalsRail() {
  const products = await getNewArrivals();
  return renderRail({
    title: "New arrivals",
    viewAllHref: "#",
    products,
    showNewBadge: true,
  });
}

export async function FeaturedTvsRail() {
  const products = await getFeaturedTvs();
  return renderRail({
    title: "Featured TVs",
    viewAllHref: "#",
    products,
    accentBackground: true,
  });
}
