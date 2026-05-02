// Returns null for now so every product/category falls through to the
// deterministic gradient placeholder. Once a CDN base URL is configured,
// prefix it here in this single spot.
export function productImageUrl(
  rawPath: string | null | undefined,
): string | null {
  if (!rawPath) return null;
  return null;
}

export function firstImagePath(images: string | null | undefined): string | null {
  if (!images) return null;
  const first = images.split(",")[0]?.trim();
  return first && first.length > 0 ? first : null;
}
