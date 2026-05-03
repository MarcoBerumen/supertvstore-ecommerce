import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Admin (service-role) client for the local Supabase stack. Used by
 * integration tests to delete the anonymous users they create — without this
 * cleanup, every test run leaves orphan rows in `auth.users`.
 *
 * Returns null if the env vars are missing, so callers can `it.skip(...)`
 * gracefully instead of crashing the entire suite.
 */
export function getAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * True when the local Supabase stack is reachable + the service-role key is
 * configured. Tests gate themselves on this so missing infra produces clear
 * skips instead of red failures with cryptic messages.
 */
export async function isSupabaseAvailable(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return false;
  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Best-effort cleanup. Logs but never throws so afterAll doesn't leak. */
export async function deleteAnonUser(userId: string): Promise<void> {
  const admin = getAdminClient();
  if (!admin) return;
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    // eslint-disable-next-line no-console
    console.warn(`[tests] failed to delete anon user ${userId}: ${error.message}`);
  }
}
