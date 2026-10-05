/** Leitura centralizada de variáveis de ambiente. A service role só é lida no servidor. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function requireServerEnv(name: "SUPABASE_SERVICE_ROLE_KEY" | "RATE_LIMIT_SALT"): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente ausente: ${name}`);
  return v;
}

/**
 * Cookies de sessão: Secure em produção (HTTPS), SameSite=Lax (mitiga CSRF), path "/".
 * Obs.: precisam ser legíveis pelo JS do navegador porque o MFA (TOTP) usa o cliente do browser;
 * o risco de XSS é mitigado por CSP com nonce + sanitização (ver docs/SECURITY.md).
 */
export const COOKIE_OPTIONS = { path: "/", sameSite: "lax" as const, secure: process.env.NODE_ENV === "production" };
