// Stand-in for `next/headers` during integration tests. The cart helpers reach
// for `cookies()` to drive the Supabase server client. In a Node test runner
// the real module throws because there's no request context, so we expose an
// in-memory cookie jar instead.
//
// The jar is a module-level singleton: every helper call inside a single test
// file shares the same cookies, which is what we want — that's exactly the
// behavior the production helper has within a single request. Tests that need
// a fresh "session" call `__resetCookies()` themselves.

type CookieRecord = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

const jar = new Map<string, CookieRecord>();

const cookieStore = {
  getAll() {
    return Array.from(jar.values()).map(({ name, value }) => ({ name, value }));
  },
  get(name: string) {
    return jar.get(name);
  },
  set(name: string, value: string, options?: Record<string, unknown>) {
    jar.set(name, { name, value, options });
  },
  delete(name: string) {
    jar.delete(name);
  },
};

export async function cookies() {
  return cookieStore;
}

export async function headers() {
  return new Headers();
}

/** Test-only: wipe the cookie jar between describe blocks to drop sessions. */
export function __resetCookies(): void {
  jar.clear();
}
