import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Aviso da igreja enviado pelo admin: aparece no início do app para todos e apita em quem ativou as notificações. */
export interface Announcement { id: string; title: string; body: string; url: string; at: string }

export const ANNOUNCEMENT_LINKS = [
  { url: "/momentos", label: "Momentos" },
  { url: "/", label: "Início" },
  { url: "/comunidade", label: "Comunidade" },
  { url: "/estudos", label: "Estudos" },
  { url: "/estudos/biblia", label: "Bíblia em um ano" },
  { url: "/forum", label: "Fórum" },
] as const;

const DAYS = 7; // o aviso fica no início do app por uma semana

export async function getAnnouncement(): Promise<Announcement | null> {
  const { data } = await (await createClient()).from("site_settings").select("value").eq("key", "announcement").maybeSingle();
  const a = data?.value as Partial<Announcement> | null | undefined;
  if (!a?.id || !a.title || !a.body || !a.url || !a.at) return null;
  if (Date.now() - new Date(a.at).getTime() > DAYS * 86_400_000) return null;
  return a as Announcement;
}
