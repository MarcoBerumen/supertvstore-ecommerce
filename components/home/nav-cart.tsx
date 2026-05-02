import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export function NavCart({ count = 0 }: { count?: number }) {
  return (
    <Link
      href="#"
      aria-label={`Cart, ${count} items`}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-md text-foreground/80 transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <ShoppingCart className="h-5 w-5" aria-hidden="true" />
      {count > 0 ? (
        <span className="absolute right-1.5 top-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-semibold leading-none text-accent-foreground">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
