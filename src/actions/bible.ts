"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { actionSession } from "@/lib/auth";
import { allow, rateLimitMessage } from "@/lib/rate-limit";
import { firstError } from "@/lib/validation";
import { cleanText } from "@/lib/sanitize";
import { dateForDay, PLAN_DAYS } from "@/lib/bible-plan";
import type { Result } from "@/lib/types";
import { FORBIDDEN, GENERIC_ERROR } from "./_shared";

const daySchema = z.number().int().min(1).max(PLAN_DAYS);

/** Marca/desmarca “li hoje” (presença) em um dia do plano. O banco só aceita dias que já chegaram. */
export async function toggleBibleMark(day: number): Promise<Result<{ marked: boolean }>> {
  const s = await actionSession();
  if (!s) return { ok: false, error: "Entre para marcar a sua leitura." };
  if (!daySchema.safeParse(day).success) return { ok: false, error: GENERIC_ERROR };
  if (!(await allow("study", s.user.id))) return { ok: false, error: rateLimitMessage() };
  const supabase = await createClient();
  const { data: cur } = await supabase.from("bible_plan_marks").select("day").eq("user_id", s.user.id).eq("day", day).maybeSingle();
  const { error } = cur
    ? await supabase.from("bible_plan_marks").delete().eq("user_id", s.user.id).eq("day", day)
    : await supabase.from("bible_plan_marks").insert({ user_id: s.user.id, day });
  if (error) return { ok: false, error: cur ? GENERIC_ERROR : "Este dia ainda não chegou. Volte na data marcada." };
  revalidatePath("/estudos", "layout");
  return { ok: true, marked: !cur };
}

export interface PresenceRow { username: string; avatar_url: string | null; marked_at: string; onTime: boolean }

/** Lista de presença de um dia (quem marcou que leu). Respeita a regra de visibilidade do banco. */
export async function getBiblePresence(day: number): Promise<Result<{ people: PresenceRow[]; hidden: boolean }>> {
  if (!daySchema.safeParse(day).success) return { ok: false, error: GENERIC_ERROR };
  const s = await actionSession();
  if (!s) return { ok: true, people: [], hidden: false };
  const supabase = await createClient();
  const [{ data: settings }, { data, error }] = await Promise.all([
    supabase.from("bible_plan_settings").select("start_date, show_presence").maybeSingle(),
    supabase.from("bible_plan_marks").select("marked_at, profile:profiles!bible_plan_marks_user_id_fkey(username, avatar_url)")
      .eq("day", day).order("marked_at", { ascending: true }).limit(200),
  ]);
  if (error) return { ok: false, error: GENERIC_ERROR };
  const dayIso = settings?.start_date ? dateForDay(settings.start_date as string, day) : null;
  const sp = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
  const people = ((data ?? []) as unknown as { marked_at: string; profile: { username: string; avatar_url: string | null } | null }[])
    .filter((r) => r.profile)
    .map((r) => ({ username: r.profile!.username, avatar_url: r.profile!.avatar_url, marked_at: r.marked_at, onTime: dayIso !== null && sp(r.marked_at) === dayIso }));
  const isStaff = s.profile.role !== "USER";
  return { ok: true, people, hidden: !(settings?.show_presence ?? true) && !isStaff };
}

// ---------- Somente o Criador ----------
async function creator() {
  const s = await actionSession();
  return s && s.profile.role === "CREATOR" ? s : null;
}

const settingsSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  showPresence: z.boolean(),
  message: z.string().transform(cleanText).pipe(z.string().max(500, "A mensagem pode ter até 500 caracteres")),
});

export async function saveBibleSettings(input: { startDate: string; showPresence: boolean; message: string }): Promise<Result> {
  const s = await creator();
  if (!s) return { ok: false, error: FORBIDDEN };
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const supabase = await createClient();
  const { data, error } = await supabase.from("bible_plan_settings")
    .update({ start_date: parsed.data.startDate, show_presence: parsed.data.showPresence, message: parsed.data.message || null, updated_at: new Date().toISOString() })
    .eq("id", true).select("id");
  if (error || !data?.length) return { ok: false, error: GENERIC_ERROR };
  revalidatePath("/estudos", "layout");
  revalidatePath("/");
  return { ok: true };
}

const noteSchema = z.object({ day: daySchema, note: z.string().transform(cleanText).pipe(z.string().max(500, "A nota pode ter até 500 caracteres")) });

export async function saveBibleNote(input: { day: number; note: string }): Promise<Result> {
  const s = await creator();
  if (!s) return { ok: false, error: FORBIDDEN };
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const supabase = await createClient();
  const { error } = parsed.data.note
    ? await supabase.from("bible_plan_notes").upsert({ day: parsed.data.day, note: parsed.data.note, updated_at: new Date().toISOString() })
    : await supabase.from("bible_plan_notes").delete().eq("day", parsed.data.day);
  if (error) return { ok: false, error: GENERIC_ERROR };
  revalidatePath("/estudos", "layout");
  return { ok: true };
}
