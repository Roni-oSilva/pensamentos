import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { COOKIE_OPTIONS, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

/** Cliente com a sessão do usuário (RLS aplicada). */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: COOKIE_OPTIONS,
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          /* chamado de Server Component: o middleware renova a sessão */
        }
      },
    },
  });
}
