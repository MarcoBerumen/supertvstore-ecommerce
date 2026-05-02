import Link from "next/link";

const LINKS = [
  { label: "Shop", href: "#" },
  { label: "Categories", href: "#" },
  { label: "Brands", href: "#" },
  { label: "Deals", href: "#" },
];

export function NavLinks() {
  return (
    <ul className="hidden lg:flex items-center gap-8 text-sm">
      {LINKS.map((l) => (
        <li key={l.label}>
          <Link
            href={l.href}
            className="group relative inline-flex items-center py-1 text-foreground/80 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {l.label}
            <span
              aria-hidden="true"
              className="absolute -bottom-0.5 left-0 h-0.5 w-full origin-left scale-x-0 bg-accent transition-transform duration-[180ms] ease-out group-hover:scale-x-100"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
