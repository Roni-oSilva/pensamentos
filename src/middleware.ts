import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { SUPABASE_URL } from "@/lib/env";
import { APP_COOKIE, APP_PARAM, showDownloadPage } from "@/lib/app-gate";

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

  // Fora do app instalado, o navegador mostra a página de download (no mesmo endereço).
  const fromAppLaunch = request.nextUrl.searchParams.get(APP_PARAM.name) === APP_PARAM.value;
  const path = request.nextUrl.pathname;
  requestHeaders.delete("x-landing"); requestHeaders.delete("x-landing-from");
  if (showDownloadPage({
    path,
    method: request.method,
    isAppCookie: request.cookies.get(APP_COOKIE)?.value === "1",
    fromAppLaunch,
    userAgent: request.headers.get("user-agent") ?? "",
    isRouterRequest: request.headers.has("rsc") || request.headers.has("next-action") || request.headers.has("next-router-prefetch"),
  })) {
    requestHeaders.set("x-landing", "1");
    requestHeaders.set("x-landing-from", path);
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    url.search = "";
    const landing = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    landing.headers.set("Content-Security-Policy", csp);
    landing.headers.set("Vary", "Cookie");
    return landing;
  }
  if (path === "/app" && request.cookies.get(APP_COOKIE)?.value !== "1") {
    requestHeaders.set("x-landing", "1"); // a própria /app no navegador: página de download sem o menu do site
    requestHeaders.set("x-landing-from", path);
  }

  const { response, user } = await updateSession(request, requestHeaders);
  if (fromAppLaunch) {
    response.cookies.set(APP_COOKIE, "1", { path: "/", maxAge: 60 * 60 * 24 * 400, sameSite: "lax", secure: request.nextUrl.protocol === "https:" });
  }

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
