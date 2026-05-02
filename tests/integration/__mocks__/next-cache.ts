// Stand-in for `next/cache` during integration tests. The real module only
// makes sense inside a Next.js render — in plain Node it throws. We don't
// care about cache semantics in these tests; we only care that the underlying
// SQL is correct.
export function cacheLife(): void {
  /* no-op */
}
export function cacheTag(): void {
  /* no-op */
}
export function revalidateTag(): void {
  /* no-op */
}
export function revalidatePath(): void {
  /* no-op */
}
export function unstable_cache<T extends (...args: unknown[]) => unknown>(
  fn: T,
): T {
  return fn;
}
