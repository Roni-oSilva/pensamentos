import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { isAdminRole, isStaffRole } from "@/lib/constants";

export interface Session { user: Pick<User, "id" | "email">; profile: Profile }

// Perfil em memória por 30 s (por instância do servidor): evita uma consulta ao banco a cada troca de aba.
// É esquecido na hora quando a pessoa edita o perfil ou um admin muda papel/bloqueio (forgetProfile);
// o bloqueio também é conferido pelo banco em toda escrita (can_write), então nada passa por causa do cache.
const PROFILE_TTL = 30_000;
const profileCache = new Map<string, { profile: Profile; at: number }>();
export function forgetProfile(id: string) { profileCache.delete(id); }

/** Usuário autenticado (validado no Auth server) + perfil. Cacheado por requisição. */
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();
  // O middleware já validou o token no Auth server e repassou o usuário (cabeçalho que o cliente não consegue forjar).
  const h = await headers();
  const uid = h.get("x-auth-uid");
  let user: Session["user"] | null = uid ? { id: uid, email: h.get("x-auth-email") || undefined } : null;
  if (!user) {
    const { data } = await supabase.auth.getUser();
    user = data.user ? { id: data.user.id, email: data.user.email } : null;
  }
  if (!user) return null;
  const hit = profileCache.get(user.id);
  let profile = hit && Date.now() - hit.at < PROFILE_TTL ? hit.profile : null;
  if (!profile) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    profile = (data as Profile | null) ?? null;
    if (profile) {
      if (profileCache.size > 2000) profileCache.clear();
      profileCache.set(user.id, { profile, at: Date.now() });
    }
  }
  if (!profile || profile.is_blocked) return null;
  return { user, profile };
});

export async function requireUser(next = "/"): Promise<Session> {
  const s = await getSession();
  if (!s) redirect(`/login?next=${encodeURIComponent(next)}`);
  return s;
}

const mfaRequired = () => process.env.REQUIRE_ADMIN_MFA !== "false";

/** AAL2 exigido para staff quando há fator cadastrado (ou quando REQUIRE_ADMIN_MFA). */
export async function staffAssurance(): Promise<"ok" | "challenge" | "enroll"> {
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (data?.currentLevel === "aal2") return "ok";
  if (data?.nextLevel === "aal2") return "challenge";
  return mfaRequired() ? "enroll" : "ok";
}

/** Gate de páginas do /admin. Usuários comuns recebem 404 (não revela a existência da área). */
export async function requireStaff(next = "/admin", opts: { adminOnly?: boolean } = {}): Promise<Session> {
  const s = await requireUser(next);
  const allowed = opts.adminOnly ? isAdminRole(s.profile.role) : isStaffRole(s.profile.role);
  if (!allowed) notFound();
  const a = await staffAssurance();
  if (a === "challenge") redirect(`/mfa?next=${encodeURIComponent(next)}`);
  if (a === "enroll") redirect("/configuracoes/seguranca?required=1");
  return s;
}

export const requireAdmin = (next = "/admin") => requireStaff(next, { adminOnly: true });

/** Versão para Server Actions: não redireciona, retorna null se não autorizado. */
export async function actionSession(level: "user" | "staff" | "admin" = "user"): Promise<Session | null> {
  const s = await getSession();
  if (!s) return null;
  if (level === "user") return s;
  if (level === "admin" && !isAdminRole(s.profile.role)) return null;
  if (s.profile.role === "USER") return null;
  return (await staffAssurance()) === "ok" ? s : null;
}
