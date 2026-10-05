"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { actionSession } from "@/lib/auth";
import { SITE_URL } from "@/lib/env";
import { allow, clientIp, rateLimitMessage } from "@/lib/rate-limit";
import { emailSchema, firstError, loginSchema, passwordSchema, signupSchema } from "@/lib/validation";
import { safeRedirect } from "@/lib/utils";
import { isSettingOn } from "@/lib/data";
import { GENERIC_ERROR, str, type FormState } from "./_shared";

export async function signIn(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ email: str(fd, "email"), password: str(fd, "password") });
  if (!parsed.success) return { error: "E-mail ou senha incorretos." };
  const ip = await clientIp();
  if (!(await allow("login", ip)) || !(await allow("login", parsed.data.email))) return { error: rateLimitMessage() };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") return { error: "Confirme seu e-mail antes de entrar." };
    return { error: "E-mail ou senha incorretos." };
  }
  redirect(safeRedirect(str(fd, "next")));
}

export async function signUp(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse({
    email: str(fd, "email"), password: str(fd, "password"), username: str(fd, "username"), accept: str(fd, "accept"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  if (!(await allow("signup", await clientIp()))) return { error: rateLimitMessage() };
  if (!(await isSettingOn("registrations_open"))) return { error: "Os cadastros estão temporariamente fechados." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { username: parsed.data.username }, emailRedirectTo: `${SITE_URL}/auth/callback?next=/` },
  });
  if (error && error.code !== "user_already_exists") {
    if (error.code === "weak_password") return { error: "Senha fraca demais. Escolha outra." };
    return { error: GENERIC_ERROR };
  }
  // Resposta idêntica para e-mail novo ou existente (evita enumeração de contas)
  return { success: "Enviamos um link de confirmação para o seu e-mail. Abra-o para ativar a conta." };
}

export async function requestPasswordReset(_: FormState, fd: FormData): Promise<FormState> {
  const email = emailSchema.safeParse(str(fd, "email"));
  const ok: FormState = { success: "Se o e-mail estiver cadastrado, você receberá as instruções em instantes." };
  if (!email.success) return ok;
  if (!(await allow("reset", await clientIp())) || !(await allow("reset", email.data))) return { error: rateLimitMessage() };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${SITE_URL}/auth/callback?next=/configuracoes/senha` });
  return ok;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

async function freshEmailSession(supabase: Awaited<ReturnType<typeof createClient>>): Promise<boolean> {
  const { data } = await supabase.auth.getClaims();
  const amr = (data?.claims?.amr ?? []) as { method: string; timestamp: number }[];
  const now = Math.floor(Date.now() / 1000);
  return amr.some((a) => ["otp", "recovery", "magiclink"].includes(a.method) && now - a.timestamp < 15 * 60);
}

/** Troca de senha: reconfirma a senha atual (sessão roubada não basta). */
export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const s = await actionSession();
  if (!s) return { error: "Sessão expirada. Entre novamente." };
  if (!(await allow("password", s.user.id))) return { error: rateLimitMessage() };
  const next = passwordSchema.safeParse(str(fd, "password"));
  if (!next.success) return { error: firstError(next.error) };
  if (next.data !== str(fd, "confirm")) return { error: "As senhas não coincidem." };

  const supabase = await createClient();
  // Dispensa a senha atual SOMENTE se a sessão nasceu de um link de e-mail (OTP/recovery) há < 15 min.
  // O campo do formulário é só um pedido; a decisão vem das claims assinadas do JWT.
  const recovery = str(fd, "recovery") === "1" && (await freshEmailSession(supabase));
  if (!recovery) {
    const { error } = await supabase.auth.signInWithPassword({ email: s.user.email ?? "", password: str(fd, "current") });
    if (error) return { error: "Senha atual incorreta." };
  }
  const { error } = await supabase.auth.updateUser({ password: next.data });
  if (error) return { error: error.code === "same_password" ? "Escolha uma senha diferente da atual." : GENERIC_ERROR };
  return { success: "Senha alterada com sucesso." };
}

/** LGPD: exclusão definitiva da conta e de todos os dados vinculados (cascade). */
export async function deleteAccount(_: FormState, fd: FormData): Promise<FormState> {
  const s = await actionSession();
  if (!s) return { error: "Sessão expirada. Entre novamente." };
  if (s.profile.role === "ADMIN") return { error: "Contas administrativas não podem ser excluídas por aqui." };
  if (str(fd, "confirm") !== s.profile.username) return { error: "Digite seu nome de usuário para confirmar." };
  if (!(await allow("password", s.user.id))) return { error: rateLimitMessage() };

  const supabase = await createClient();
  const { error: authErr } = await supabase.auth.signInWithPassword({ email: s.user.email ?? "", password: str(fd, "password") });
  if (authErr) return { error: "Senha incorreta." };

  const { error } = await createAdminClient().auth.admin.deleteUser(s.user.id);
  if (error) return { error: GENERIC_ERROR };
  await supabase.auth.signOut();
  redirect("/?conta=excluida");
}
