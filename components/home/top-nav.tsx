"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { NavLogo } from "./nav-logo";
import { NavLinks } from "./nav-links";
import { NavSearch } from "./nav-search";
import { NavCart } from "./nav-cart";
import { MobileMenu } from "./mobile-menu";

export function TopNav({
  totalProducts,
  authButton,
}: {
  totalProducts: number;
  authButton: React.ReactNode;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header role="banner" className="sticky top-0 z-40">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-foreground"
      >
        Skip to main content
      </a>
      <div
        className={cn(
          "transition-[background-color,backdrop-filter,border-color] duration-200 ease-out",
          scrolled
            ? "border-b border-border bg-background/80 backdrop-blur-md"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <nav
          aria-label="Primary"
          className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8"
        >
          <div className="flex items-center gap-2 lg:hidden">
            <MobileMenu totalProducts={totalProducts} authButton={authButton} />
          </div>

          <NavLogo />

          <div className="hidden lg:block">
            <NavLinks />
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <NavSearch totalProducts={totalProducts} />
            <NavCart count={0} />
            <div className="hidden lg:block">{authButton}</div>
          </div>
        </nav>
      </div>
    </header>
  );
}
