export interface ProductDescriptionProps {
  description: string | null;
}

export function ProductDescription({ description }: ProductDescriptionProps) {
  if (!description || description.trim().length === 0) return null;

  return (
    <section
      aria-labelledby="desc-heading"
      className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
    >
      <h2 id="desc-heading" className="mb-4 text-xl font-semibold">
        About this product
      </h2>
      <p className="max-w-prose whitespace-pre-line text-base leading-relaxed text-foreground/90">
        {description}
      </p>
    </section>
  );
}
