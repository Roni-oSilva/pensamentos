"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { actionSession } from "@/lib/auth";
import { allow, rateLimitMessage } from "@/lib/rate-limit";
import type { Result } from "@/lib/types";

const subSchema = z.object({
  endpoint: z.string().url().startsWith("https://").max(1000),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(5).max(100) }),
});
const prefsSchema = z.object({ instants: z.boolean(), posts: z.boolean() });
export type PushPrefs = z.infer<typeof prefsSchema>;

/** Inscreve este celular/navegador para receber notificações (a pessoa já deu permissão no aparelho). */
export async function savePushSubscription(sub: unknown, prefs: PushPrefs = { instants: true, posts: true }): Promise<Result> {
  const s = await actionSession();
  if (!s) return { ok: false, error: "Entre na sua conta para ativar as notificações." };
  if (!(await allow("edit", s.user.id))) return { ok: false, error: rateLimitMessage() };
  const parsed = subSchema.safeParse(sub), p = prefsSchema.safeParse(prefs);
  if (!parsed.success || !p.success) return { ok: false, error: "Não foi possível ativar neste aparelho." };
  // gravado pelo servidor: o mesmo aparelho pode trocar de conta (o registro passa para quem está logado)
  const { error } = await createAdminClient().from("push_subscriptions").upsert({
    endpoint: parsed.data.endpoint, user_id: s.user.id, p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth,
    notify_instants: p.data.instants, notify_posts: p.data.posts,
  });
  if (error) return { ok: false, error: "Não foi possível ativar agora. Tente de novo." };
  return { ok: true };
}

/** Muda o que este aparelho recebe. */
export async function updatePushPrefs(endpoint: string, prefs: PushPrefs): Promise<Result> {
  const s = await actionSession();
  const p = prefsSchema.safeParse(prefs);
  if (!s || !p.success || typeof endpoint !== "string") return { ok: false, error: "Não foi possível salvar." };
  const { data, error } = await createAdminClient().from("push_subscriptions")
    .update({ notify_instants: p.data.instants, notify_posts: p.data.posts })
    .eq("endpoint", endpoint).eq("user_id", s.user.id).select("endpoint");
  if (error || !data?.length) return { ok: false, error: "Não foi possível salvar." };
  return { ok: true };
}

/** Desativa as notificações neste aparelho. */
export async function removePushSubscription(endpoint: string): Promise<Result> {
  const s = await actionSession();
  if (!s || typeof endpoint !== "string") return { ok: false, error: "Não foi possível desativar." };
  await (await createClient()).from("push_subscriptions").delete().eq("endpoint", endpoint).eq("user_id", s.user.id);
  return { ok: true };
}

/** Preferências salvas para este aparelho (null = não inscrito). */
export async function getPushPrefs(endpoint: string): Promise<PushPrefs | null> {
  const s = await actionSession();
  if (!s || typeof endpoint !== "string") return null;
  const { data } = await (await createClient()).from("push_subscriptions").select("notify_instants, notify_posts").eq("endpoint", endpoint).maybeSingle();
  return data ? { instants: data.notify_instants, posts: data.notify_posts } : null;
}
