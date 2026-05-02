import { Suspense } from "react";
import { AuthButton } from "@/components/auth-button";
import { TopNav } from "@/components/home/top-nav";
import { Hero } from "@/components/home/hero";
import {
  CategoryGrid,
  CategoryGridSkeleton,
} from "@/components/home/category-grid";
import { BrandRow, BrandRowSkeleton } from "@/components/home/brand-row";
import {
  NewArrivalsRail,
  FeaturedTvsRail,
  ProductRailSkeleton,
} from "@/components/home/product-rail";
import {
  PriceTiles,
  PriceTilesSkeleton,
} from "@/components/home/price-tiles";
import { SiteFooter } from "@/components/home/site-footer";
import { getCatalogCounts } from "@/lib/mariadb/queries/home";

async function HeroSection() {
  const counts = await getCatalogCounts();
  return <Hero totalInStock={counts.totalInStock} tvInStock={counts.tvInStock} />;
}

async function NavWithCounts() {
  const counts = await getCatalogCounts();
  return (
    <TopNav
      totalProducts={counts.totalInStock}
      authButton={
        <Suspense fallback={null}>
          <AuthButton />
        </Suspense>
      }
    />
  );
}

function NavFallback() {
  return (
    <TopNav
      totalProducts={0}
      authButton={
        <Suspense fallback={null}>
          <AuthButton />
        </Suspense>
      }
    />
  );
}

function HeroFallback() {
  return <Hero totalInStock={0} tvInStock={0} />;
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<NavFallback />}>
        <NavWithCounts />
      </Suspense>

      <main id="main" className="flex-1">
        <Suspense fallback={<HeroFallback />}>
          <HeroSection />
        </Suspense>

        <Suspense fallback={<CategoryGridSkeleton />}>
          <CategoryGrid />
        </Suspense>

        <Suspense fallback={<BrandRowSkeleton />}>
          <BrandRow />
        </Suspense>

        <Suspense fallback={<ProductRailSkeleton title="New arrivals" />}>
          <NewArrivalsRail />
        </Suspense>

        <Suspense
          fallback={
            <ProductRailSkeleton title="Featured TVs" accentBackground />
          }
        >
          <FeaturedTvsRail />
        </Suspense>

        <Suspense fallback={<PriceTilesSkeleton />}>
          <PriceTiles />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}
