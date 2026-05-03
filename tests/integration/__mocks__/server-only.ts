// `server-only` throws on import outside the React Server Components bundler.
// In integration tests we deliberately call modules that depend on it, from
// plain Node — so we shim it to a no-op.
export {};
