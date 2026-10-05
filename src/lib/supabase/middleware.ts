import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_OPTIONS, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

/** Renova a sessão (cookies) e devolve o usuário validado pelo Auth server. */
export async function updateSession(request: NextRequest, requestHeaders: Headers) {
  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const cookiesSet: { name: string; value: string; options?: Parameters<typeof response.cookies.set>[2] }[] = [];
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: COOKIE_OPTIONS,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value, options }) => { request.cookies.set(name, value); cookiesSet.push({ name, value, options }); });
        response = NextResponse.next({ request: { headers: requestHeaders } });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  // Visitante anônimo (sem cookie de sessão): evita a ida ao Auth server em cada página pública.
  if (!request.cookies.getAll().some((c) => c.name.includes("-auth-token"))) return { response, user: null };
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    // Já validado no Auth server: repassa ao servidor para ele não validar de novo (1 ida a menos por página).
    requestHeaders.set("x-auth-uid", data.user.id);
    requestHeaders.set("x-auth-email", data.user.email ?? "");
    response = NextResponse.next({ request: { headers: requestHeaders } });
    cookiesSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  }
  return { response, user: data.user };
}
