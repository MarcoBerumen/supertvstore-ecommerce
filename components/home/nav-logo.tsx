"use client";

import Link from "next/link";
import { Tv } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function NavLogo() {
  const [flickered, setFlickered] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setFlickered(true), 350);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <Link
      href="/"
      aria-label="Super TV Store, home"
      className={cn(
        "inline-flex items-center gap-2 text-base font-semibold tracking-tight",
        !flickered && "animate-screen-flicker",
      )}
    >
      <Tv
        className="h-5 w-5 text-accent -rotate-[8deg]"
        strokeWidth={2.25}
        aria-hidden="true"
      />
      <span>
        <span className="text-foreground">Super TV </span>
        <span className="text-accent">Store</span>
      </span>
    </Link>
  );
}
