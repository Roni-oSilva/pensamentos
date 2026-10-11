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
  // getClaims confere a assinatura do token: com as chaves assimétricas do Supabase isso é feito aqui mesmo
  // (chaves públicas em cache), sem ida ao Auth server a cada página; com a chave antiga (HS256) ele
  // consulta o Auth server, como antes. Também renova a sessão quando o token vence.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const user = claims?.sub ? { id: claims.sub, email: typeof claims.email === "string" ? claims.email : undefined } : null;
  if (user) {
    // Já validado: repassa ao servidor para ele não validar de novo (1 ida a menos por página).
    requestHeaders.set("x-auth-uid", user.id);
    requestHeaders.set("x-auth-email", user.email ?? "");
    response = NextResponse.next({ request: { headers: requestHeaders } });
    cookiesSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  }
  return { response, user };
}
