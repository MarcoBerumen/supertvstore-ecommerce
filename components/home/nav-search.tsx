import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function NavSearch({ totalProducts }: { totalProducts: number }) {
  return (
    <div className="relative hidden md:block w-full max-w-xs">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        placeholder={`Search ${totalProducts} products...`}
        aria-label="Search products"
        className="h-9 pl-9 focus-visible:ring-2 focus-visible:ring-accent"
      />
    </div>
  );
}
