"use client";

import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeSwitcher } from "@/components/theme-switcher";

const LINKS = [
  { label: "Shop", href: "#" },
  { label: "Categories", href: "#" },
  { label: "Brands", href: "#" },
  { label: "Deals", href: "#" },
];

export function MobileMenu({
  totalProducts,
  authButton,
}: {
  totalProducts: number;
  authButton: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b p-4 text-left">
          <SheetTitle className="text-base">Menu</SheetTitle>
        </SheetHeader>

        <div className="p-4 space-y-6">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder={`Search ${totalProducts} products...`}
              aria-label="Search products"
              className="pl-9"
            />
          </div>

          <nav aria-label="Primary mobile">
            <ul className="space-y-1">
              {LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-2 text-base font-medium text-foreground/90 hover:bg-accent/10 hover:text-accent"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Separator />

          <div className="space-y-3">{authButton}</div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Theme</span>
            <ThemeSwitcher />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
