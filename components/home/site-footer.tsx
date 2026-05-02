import Link from "next/link";
import { Tv } from "lucide-react";
import { cacheLife } from "next/cache";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { FooterColumn } from "./footer-column";

async function CopyrightYear() {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 86400, expire: 86400 });
  return <>{new Date().getFullYear()}</>;
}

const ADDRESS_LINE = "6317 N Eldridge Pkwy, Ste #104, Houston, TX";
const PHONE = "346-237-7115";
const EMAIL = "Tvsuperstore@icloud.com";
const MAPS_HREF = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  ADDRESS_LINE,
)}`;

export function SiteFooter() {
  return (
    <footer
      role="contentinfo"
      className="border-t border-border bg-background"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="inline-flex items-center gap-2">
              <Tv
                className="h-5 w-5 text-accent -rotate-[8deg]"
                strokeWidth={2.25}
                aria-hidden="true"
              />
              <span
                className="bg-[linear-gradient(180deg,hsl(var(--foreground))_0%,hsl(var(--foreground))_45%,hsl(var(--foreground)/0.6)_50%,hsl(var(--foreground))_55%,hsl(var(--foreground))_100%)] bg-clip-text text-base font-semibold tracking-tight text-transparent"
              >
                Super TV
              </span>
              <span className="text-base font-semibold tracking-tight text-accent">
                Store
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              A Houston brick-and-mortar electronics store now shipping screens.
              In-store pickup or delivered.
            </p>
          </div>

          <FooterColumn heading="Shop">
            <Link href="#" className="block hover:text-accent">
              Categories
            </Link>
            <Link href="#" className="block hover:text-accent">
              Brands
            </Link>
            <Link href="#" className="block hover:text-accent">
              Deals
            </Link>
            <Link href="#" className="block hover:text-accent">
              New arrivals
            </Link>
          </FooterColumn>

          <FooterColumn heading="Visit us">
            <address className="not-italic space-y-2">
              <a
                href={MAPS_HREF}
                target="_blank"
                rel="noreferrer"
                className="block hover:text-accent"
              >
                {ADDRESS_LINE}
              </a>
              <a
                href={`tel:${PHONE.replace(/-/g, "")}`}
                className="block hover:text-accent"
              >
                {PHONE}
              </a>
              <a
                href={`mailto:${EMAIL}`}
                className="block hover:text-accent"
              >
                {EMAIL}
              </a>
            </address>
          </FooterColumn>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>
            &copy; <CopyrightYear /> Super TV Store. All rights reserved.
          </p>
          <ThemeSwitcher />
        </div>
      </div>
    </footer>
  );
}
