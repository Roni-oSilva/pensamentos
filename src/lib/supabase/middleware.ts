import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_OPTIONS, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

/** Renova a sessão (cookies) e devolve o usuário validado pelo Auth server. */
export async function updateSession(request: NextRequest, requestHeaders: Headers) {
  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: COOKIE_OPTIONS,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: requestHeaders } });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  // Visitante anônimo (sem cookie de sessão): evita a ida ao Auth server em cada página pública.
  if (!request.cookies.getAll().some((c) => c.name.includes("-auth-token"))) return { response, user: null };
  const { data } = await supabase.auth.getUser();
  return { response, user: data.user };
}
