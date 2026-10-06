import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { SUPABASE_URL } from "@/lib/env";

const PROTECTED = ["/admin", "/configuracoes", "/favoritos", "/notificacoes", "/comunidade/nova"];

function buildCsp(nonce: string): string {
  const supabase = SUPABASE_URL;
  const dev = process.env.NODE_ENV !== "production";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'", // estilos inline (não executam código); scripts usam nonce
    `img-src 'self' data: blob: ${supabase}`,
    "font-src 'self' data:",
    `connect-src 'self' ${supabase} ${supabase.replace("https://", "wss://")}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export async function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(request.headers);
  // Cabeçalhos de identidade só podem vir do próprio middleware: descarta qualquer valor enviado pelo cliente.
  requestHeaders.delete("x-auth-uid"); requestHeaders.delete("x-auth-email");
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const { response, user } = await updateSession(request, requestHeaders);

  const path = request.nextUrl.pathname;
  if (!user && PROTECTED.some((p) => path === p || path.startsWith(`${p}/`))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path)}`;
    const redirect = NextResponse.redirect(url);
    redirect.headers.set("Content-Security-Policy", csp);
    return redirect;
  }
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|offline.html|.*\\.(?:svg|png|jpg|jpeg|webp|ico|mp4|webm)$).*)"],
};
