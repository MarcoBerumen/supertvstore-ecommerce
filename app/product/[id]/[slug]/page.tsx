import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { AuthButton } from "@/components/auth-button";
import { TopNav } from "@/components/home/top-nav";
import { SiteFooter } from "@/components/home/site-footer";
import { CartHydrator } from "@/components/cart-context";
import { ProductPageBreadcrumb } from "@/components/product/product-page-breadcrumb";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductHeader } from "@/components/product/product-header";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { ProductDescription } from "@/components/product/product-description";
import { SpecTable } from "@/components/product/spec-table";
import { RelatedProductsRail } from "@/components/product/related-products-rail";
import { MobileBuyBar } from "@/components/product/mobile-buy-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { productImageUrl } from "@/lib/mariadb/images";
import {
  getCatalogCounts,
  type CatalogCounts,
} from "@/lib/mariadb/queries/home";
import {
  getProductDetail,
  getProductVariants,
  getEligibleWarranties,
  slugify,
  type ProductDetail,
  type ProductVariant,
  type Warranty,
} from "@/lib/mariadb/queries/product";
import { getInCartQuantitiesForProduct } from "@/lib/supabase/cart";

interface RouteParams {
  params: Promise<{ id: string; slug: string }>;
}

const PURCHASE_PANEL_ID = "in-flow-purchase-panel";

async function NavWithCounts() {
  let counts: CatalogCounts;
  try {
    counts = await getCatalogCounts();
  } catch {
    counts = { totalInStock: 0, tvInStock: 0, totalCategories: 0 };
  }
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

function PageShellSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Skeleton className="aspect-square w-full rounded-xl" />
        </div>
        <div className="space-y-4 lg:col-span-5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function ProductPage({ params }: RouteParams) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<NavFallback />}>
        <NavWithCounts />
      </Suspense>

      <Suspense fallback={<PageShellSkeleton />}>
        <ProductPageBody params={params} />
      </Suspense>

      <SiteFooter />
    </div>
  );
}

async function ProductPageBody({ params }: RouteParams) {
  const { id, slug } = await params;
  const productId = Number(id);
  if (!Number.isFinite(productId) || productId <= 0) notFound();

  const product = await getProductDetail(productId);
  if (!product) notFound();

  const canonicalSlug = slugify(product.name) || "p";
  if (slug !== canonicalSlug) {
    redirect(`/product/${productId}/${canonicalSlug}`);
  }

  const variants = await getProductVariants(productId);

  const warrantyResults = await Promise.all(
    variants.map((v) => getEligibleWarranties(v.price)),
  );
  const warrantiesByVariantKey: Record<string, Warranty[]> = {};
  variants.forEach((v, i) => {
    warrantiesByVariantKey[v.key] = warrantyResults[i];
  });

  const galleryImages = product.imagePaths.map((p) => ({
    src: productImageUrl(p),
    alt: product.name,
  }));

  return (
    <main id="main" className="flex-1 pb-24 lg:pb-0">
      <ProductPageBreadcrumb
        categoryName={product.categoryName}
        brandName={product.brandName}
        productName={product.name}
      />

      <section className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <ProductGallery
              images={galleryImages}
              name={product.name}
              category={product.categoryName}
            />
          </div>
          <div className="lg:col-span-5" id={PURCHASE_PANEL_ID}>
            <div className="space-y-6 lg:sticky lg:top-20">
              <ProductHeader product={product} variants={variants} />
              <Suspense
                fallback={
                  <PurchaseSkeleton
                    product={product}
                    variants={variants}
                    warrantiesByVariantKey={warrantiesByVariantKey}
                  />
                }
              >
                <PurchaseSection
                  productId={productId}
                  productName={product.name}
                  variants={variants}
                  warrantiesByVariantKey={warrantiesByVariantKey}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      <ProductDescription description={product.description} />

      <SpecTable specs={product.specs} />

      <Suspense fallback={<RelatedRailSkeleton />}>
        <RelatedProductsRail
          productId={productId}
          brandId={product.brandId}
          brandName={product.brandName}
          categoryId={product.categoryId}
        />
      </Suspense>

      <Suspense fallback={null}>
        <MobileBuyBarSection
          productId={productId}
          productName={product.name}
          variants={variants}
        />
      </Suspense>
    </main>
  );
}

async function PurchaseSection({
  productId,
  productName,
  variants,
  warrantiesByVariantKey,
}: {
  productId: number;
  productName: string;
  variants: ProductVariant[];
  warrantiesByVariantKey: Record<string, Warranty[]>;
}) {
  const inCartByVariant = await getInCartQuantitiesForProduct(productId).catch(
    () => ({}),
  );
  return (
    <>
      <CartHydrator productId={productId} byVariant={inCartByVariant} />
      <PurchasePanel
        productId={productId}
        productName={productName}
        variants={variants}
        initialInCartByVariant={inCartByVariant}
        warrantiesByVariantKey={warrantiesByVariantKey}
      />
    </>
  );
}

function PurchaseSkeleton({
  product,
  variants,
  warrantiesByVariantKey,
}: {
  product: ProductDetail;
  variants: ProductVariant[];
  warrantiesByVariantKey: Record<string, Warranty[]>;
}) {
  return (
    <PurchasePanel
      productId={product.id}
      productName={product.name}
      variants={variants}
      initialInCartByVariant={{}}
      warrantiesByVariantKey={warrantiesByVariantKey}
    />
  );
}

async function MobileBuyBarSection({
  productId,
  productName,
  variants,
}: {
  productId: number;
  productName: string;
  variants: ProductVariant[];
}) {
  const inCartByVariant = await getInCartQuantitiesForProduct(productId).catch(
    () => ({}),
  );
  return (
    <MobileBuyBar
      productId={productId}
      productName={productName}
      variants={variants}
      initialInCartByVariant={inCartByVariant}
      observeTargetId={PURCHASE_PANEL_ID}
    />
  );
}

function RelatedRailSkeleton() {
  return (
    <section className="py-12 md:py-16 lg:py-20" aria-busy="true">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-[70vw] max-w-[280px] shrink-0 sm:w-[45vw] sm:max-w-[260px] md:w-[280px] lg:w-[260px]"
            >
              <Skeleton className="aspect-square w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
