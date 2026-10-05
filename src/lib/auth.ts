import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export interface Session { user: User; profile: Profile }

/** Usuário autenticado (validado no Auth server) + perfil. Cacheado por requisição. */
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
  if (!profile || profile.is_blocked) return null;
  return { user: data.user, profile: profile as Profile };
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
  const allowed = opts.adminOnly ? s.profile.role === "ADMIN" : s.profile.role === "ADMIN" || s.profile.role === "MODERATOR";
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
  if (level === "admin" && s.profile.role !== "ADMIN") return null;
  if (s.profile.role === "USER") return null;
  return (await staffAssurance()) === "ok" ? s : null;
}
