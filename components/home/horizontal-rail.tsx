"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HorizontalRail({
  title,
  viewAllHref,
  accentBackground = false,
  children,
}: {
  title: string;
  viewAllHref: string;
  accentBackground?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  const headingId = `rail-${id}-heading`;
  const railRef = useRef<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdges = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth - 1;
    setAtStart(el.scrollLeft <= 0);
    setAtEnd(el.scrollLeft >= max);
  }, []);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    updateEdges();
    el.addEventListener("scroll", updateEdges, { passive: true });
    const ro = new ResizeObserver(updateEdges);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      ro.disconnect();
    };
  }, [updateEdges]);

  const cardWidth = useMemo(() => {
    return () => {
      const el = railRef.current;
      if (!el) return 280;
      const first = el.querySelector<HTMLElement>(":scope > *");
      if (!first) return 280;
      const style = window.getComputedStyle(first);
      const gap = parseFloat(style.marginRight || "0");
      return first.getBoundingClientRect().width + gap + 16;
    };
  }, []);

  const scrollBy = (delta: number) => {
    railRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const w = cardWidth();
    if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollBy(w);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollBy(-w);
    } else if (e.key === "Home") {
      e.preventDefault();
      railRef.current?.scrollTo({ left: 0, behavior: "smooth" });
    } else if (e.key === "End") {
      e.preventDefault();
      const el = railRef.current;
      if (el) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    } else if (e.key === "PageDown") {
      e.preventDefault();
      const el = railRef.current;
      if (el) scrollBy(el.clientWidth);
    } else if (e.key === "PageUp") {
      e.preventDefault();
      const el = railRef.current;
      if (el) scrollBy(-el.clientWidth);
    }
  };

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "py-12 md:py-16 lg:py-20",
        accentBackground && "bg-accent-soft/40",
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="group/header mb-6 flex items-end justify-between gap-4">
          <h2
            id={headingId}
            className="text-2xl font-bold tracking-tight md:text-3xl"
          >
            {title}
          </h2>
          <div className="flex items-center gap-3">
            <Link
              href={viewAllHref}
              className="text-sm font-medium text-accent hover:underline"
            >
              View all &rarr;
            </Link>
            <div className="hidden md:flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover/header:opacity-100 focus-within:opacity-100">
              <Button
                variant="outline"
                size="icon"
                aria-label="Scroll left"
                disabled={atStart}
                onClick={() => scrollBy(-cardWidth() * 2)}
                className="h-9 w-9"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Scroll right"
                disabled={atEnd}
                onClick={() => scrollBy(cardWidth() * 2)}
                className="h-9 w-9"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="sr-only" id={`rail-${id}-instructions`}>
          Use arrow keys to navigate.
        </div>
        <div
          ref={railRef}
          tabIndex={0}
          role="region"
          aria-label={`${title}, scrollable`}
          aria-roledescription="carousel"
          aria-describedby={`rail-${id}-instructions`}
          onKeyDown={onKey}
          className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:mx-0 sm:px-0"
        >
          {children}
        </div>
      </div>
    </section>
  );
}
