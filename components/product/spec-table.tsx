"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SpecRow } from "@/lib/mariadb/queries/product";

export interface SpecTableProps {
  specs: SpecRow[];
}

const COLLAPSED_COUNT = 8;

export function SpecTable({ specs }: SpecTableProps) {
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDListElement | null>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-spec-row]"));
    if (typeof IntersectionObserver === "undefined") {
      items.forEach((el) => el.classList.add("opacity-100"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const idx = items.indexOf(el);
            el.style.animationDelay = `${Math.min(idx, 12) * 30}ms`;
            el.classList.add("animate-tile-rise", "opacity-100");
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.1 },
    );
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [expanded]);

  if (specs.length === 0) return null;

  const collapsed = !expanded && specs.length > 12;
  const visible = collapsed ? specs.slice(0, COLLAPSED_COUNT) : specs;

  return (
    <section
      aria-labelledby="specs-heading"
      className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
    >
      <h2 id="specs-heading" className="mb-4 text-xl font-semibold">
        Specifications
      </h2>
      <dl
        ref={containerRef}
        className="grid grid-cols-1 gap-x-8 md:grid-cols-2"
      >
        {visible.map((s) => (
          <div
            key={s.slug}
            data-spec-row
            className={cn(
              "flex items-baseline justify-between border-b border-border py-3 opacity-0",
            )}
          >
            <dt className="text-sm text-muted-foreground">{s.label}</dt>
            <dd className="font-medium tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>
      {specs.length > 12 ? (
        <div className="mt-6">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Show fewer specifications" : "Show all specifications"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
