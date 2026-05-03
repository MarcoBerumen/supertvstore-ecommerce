"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/cart-context";

export function NavCart() {
  const { count } = useCart();
  const prev = useRef(count);
  const [animateKey, setAnimateKey] = useState(0);

  useEffect(() => {
    if (count > prev.current) {
      setAnimateKey((k) => k + 1);
    }
    prev.current = count;
  }, [count]);

  return (
    <Link
      href="/cart"
      aria-label={`Cart, ${count} items`}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-md text-foreground/80 transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <ShoppingCart className="h-5 w-5" aria-hidden="true" />
      {count > 0 ? (
        <span
          key={animateKey}
          className={cn(
            "absolute right-1.5 top-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-semibold leading-none text-accent-foreground",
            animateKey > 0 && "animate-cart-bump",
          )}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}
