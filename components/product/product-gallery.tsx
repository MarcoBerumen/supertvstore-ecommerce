"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ZoomIn } from "lucide-react";
import { ProductMedia } from "@/components/product-media";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { iconForCategory } from "@/components/home/category-icons";
import { cn } from "@/lib/utils";

export interface GalleryImage {
  src?: string | null;
  alt: string;
}

export interface ProductGalleryProps {
  images: GalleryImage[];
  name: string;
  category: string | null;
}

export function ProductGallery({ images, name, category }: ProductGalleryProps) {
  const slides: GalleryImage[] =
    images.length > 0 ? images : [{ src: null, alt: name }];
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  // Bumped on each activeIndex change so the new hero re-mounts and re-runs the
  // screen-flicker keyframe (the easter egg).
  const [flickerKey, setFlickerKey] = useState(0);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const Icon = iconForCategory(category ?? "");

  const total = slides.length;

  const setIndex = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(total - 1, next));
      setActiveIndex(clamped);
      setFlickerKey((k) => k + 1);
    },
    [total],
  );

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setIndex(activeIndex + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setIndex(activeIndex - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      setIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setIndex(total - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setZoomOpen(true);
    }
  };

  // Track which slide the mobile carousel is on by its scrollLeft.
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const i = Math.round(el.scrollLeft / el.clientWidth);
        if (i !== activeIndex) {
          setActiveIndex(i);
          setFlickerKey((k) => k + 1);
        }
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [activeIndex]);

  const active = slides[activeIndex];

  return (
    <div>
      {/* Desktop / tablet hero + thumb strip */}
      <div className="hidden md:block">
        <div
          ref={heroRef}
          tabIndex={0}
          role="img"
          aria-label={`${name}, image ${activeIndex + 1} of ${total}`}
          onKeyDown={onKey}
          onClick={() => setZoomOpen(true)}
          className="group relative cursor-zoom-in overflow-hidden rounded-xl border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <div
            key={flickerKey}
            className="animate-screen-flicker transition-opacity duration-150 ease-out"
          >
            <ProductMedia
              src={active?.src ?? null}
              name={name}
              category={category ?? ""}
              iconHint={Icon}
              aspect="1:1"
              showLabel={false}
              priority
            />
          </div>
          <div className="pointer-events-none absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/90 opacity-0 shadow transition-opacity duration-150 group-hover:opacity-100">
            <ZoomIn className="h-4 w-4" />
          </div>
        </div>

        <div role="status" aria-live="polite" className="sr-only">
          Image {activeIndex + 1} of {total}
        </div>

        {total > 1 ? (
          <div
            role="tablist"
            aria-label="Product images"
            className="mt-4 flex gap-2 overflow-x-auto snap-x scroll-smooth pb-1"
          >
            {slides.map((img, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === activeIndex}
                aria-label={`Show image ${i + 1} of ${total}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-16 w-16 shrink-0 snap-start overflow-hidden rounded-md border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  i === activeIndex
                    ? "border-accent"
                    : "border-transparent hover:border-border",
                )}
              >
                <ProductMedia
                  src={img.src ?? null}
                  name={name}
                  category={category ?? ""}
                  iconHint={Icon}
                  aspect="1:1"
                  showLabel={false}
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Mobile snap carousel */}
      <div className="md:hidden">
        <div
          ref={carouselRef}
          className="-mx-4 flex snap-x snap-mandatory overflow-x-auto"
          aria-roledescription="carousel"
          aria-label={`${name} images`}
        >
          {slides.map((img, i) => (
            <div
              key={i}
              className="aspect-square w-screen shrink-0 snap-center"
              aria-label={`Image ${i + 1} of ${total}`}
            >
              <ProductMedia
                src={img.src ?? null}
                name={name}
                category={category ?? ""}
                iconHint={Icon}
                aspect="1:1"
                showLabel={false}
                priority={i === 0}
              />
            </div>
          ))}
        </div>
        {total > 1 ? (
          <div className="mt-3 flex justify-center gap-1.5">
            {slides.map((_, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  i === activeIndex ? "bg-foreground" : "bg-foreground/30",
                )}
              />
            ))}
          </div>
        ) : null}
      </div>

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-4xl">
          <DialogTitle className="sr-only">{name}</DialogTitle>
          <div className="relative">
            <ProductMedia
              src={active?.src ?? null}
              name={name}
              category={category ?? ""}
              iconHint={Icon}
              aspect="1:1"
              showLabel={false}
            />
          </div>
          {total > 1 ? (
            <div className="flex justify-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Show image ${i + 1} of ${total}`}
                  onClick={() => setIndex(i)}
                  className={cn(
                    "h-2 w-2 rounded-full transition-colors",
                    i === activeIndex ? "bg-foreground" : "bg-foreground/40",
                  )}
                />
              ))}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
