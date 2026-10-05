import { createBrowserClient } from "@supabase/ssr";
import { COOKIE_OPTIONS, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, { cookieOptions: COOKIE_OPTIONS });
}
