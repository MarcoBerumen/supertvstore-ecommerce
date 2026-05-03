import Link from "next/link";
import { Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductMedia } from "@/components/product-media";

export default function ProductNotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
      <div className="w-48">
        <ProductMedia
          src={null}
          name="Not found"
          iconHint={Tv}
          aspect="1:1"
          showLabel={false}
          className="rounded-xl"
        />
      </div>
      <h1 className="mt-8 text-2xl font-semibold tracking-tight md:text-3xl">
        We can&apos;t find that product.
      </h1>
      <p className="mt-2 text-muted-foreground">
        It may have sold out or moved.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/">Browse televisions</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </main>
  );
}
