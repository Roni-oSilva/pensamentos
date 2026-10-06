"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { actionSession } from "@/lib/auth";
import { allow, rateLimitMessage } from "@/lib/rate-limit";
import { firstError } from "@/lib/validation";
import { cleanText } from "@/lib/sanitize";
import type { Result } from "@/lib/types";
import { getLesson, getTrack } from "@/lib/study/content";
import { levelFor, totalXp } from "@/lib/study/xp";
import { GENERIC_ERROR } from "./_shared";

const NEED_LOGIN = "Entre para guardar o seu progresso.";

export interface Gain { gained: number; xp: number; levelUp: { level: number; name: string } | null; trailDone: boolean; correct: number; total: number; review: { correta: number; explicacao: string }[] }

async function currentXp(userId: string): Promise<number> {
  const admin = createAdminClient();
  const [p, t, d] = await Promise.all([
    admin.from("study_progress").select("quiz_correct, quiz_total").eq("user_id", userId),
    admin.from("study_trail_done").select("track_slug", { count: "exact", head: true }).eq("user_id", userId),
    admin.from("study_plan_days").select("day", { count: "exact", head: true }).eq("user_id", userId),
  ]);
  return totalXp({ lessons: (p.data ?? []) as { quiz_correct: number; quiz_total: number }[], trails: t.count ?? 0, planDays: d.count ?? 0 });
}

const completeSchema = z.object({ track: z.string().max(80), order: z.number().int().min(1).max(200), answers: z.array(z.number().int().min(0).max(5)).max(20) });

/** Conclui a aula: o servidor corrige o quiz, calcula o XP e registra (uma vez por aula). */
export async function completeLesson(input: { track: string; order: number; answers: number[] }): Promise<Result<{ gain: Gain }>> {
  const s = await actionSession();
  if (!s) return { ok: false, error: NEED_LOGIN };
  const parsed = completeSchema.safeParse(input);
  const track = parsed.success ? getTrack(parsed.data.track) : null;
  const lesson = track && parsed.success ? getLesson(track, parsed.data.order) : null;
  if (!parsed.success || !track || !lesson) return { ok: false, error: parsed.success ? GENERIC_ERROR : firstError(parsed.error) };
  if (!(await allow("study", s.user.id))) return { ok: false, error: rateLimitMessage() };

  const { answers } = parsed.data;
  const correct = lesson.quiz.reduce((n, q, i) => n + (answers[i] === q.correta ? 1 : 0), 0);
  const review = lesson.quiz.map((q) => ({ correta: q.correta, explicacao: q.explicacao }));
  const admin = createAdminClient();
  const before = await currentXp(s.user.id);

  const { error } = await admin.from("study_progress").upsert(
    { user_id: s.user.id, track_slug: track.slug, lesson_order: lesson.ordem, quiz_correct: correct, quiz_total: lesson.quiz.length },
    { onConflict: "user_id,track_slug,lesson_order", ignoreDuplicates: true });
  if (error) { console.error(`[study] ${error.code ?? ""} ${error.message}`); return { ok: false, error: GENERIC_ERROR }; }

  // trilha concluída? (bônus único)
  const { count } = await admin.from("study_progress").select("lesson_order", { count: "exact", head: true }).eq("user_id", s.user.id).eq("track_slug", track.slug);
  let trailDone = false;
  if ((count ?? 0) >= track.aulas.length) {
    const { data } = await admin.from("study_trail_done").upsert({ user_id: s.user.id, track_slug: track.slug }, { onConflict: "user_id,track_slug", ignoreDuplicates: true }).select("track_slug");
    trailDone = !!data?.length;
  }

  const after = await currentXp(s.user.id);
  const lb = levelFor(before), la = levelFor(after);
  revalidatePath("/estudos", "layout");
  return { ok: true, gain: { gained: after - before, xp: after, levelUp: la.level > lb.level ? { level: la.level, name: la.name } : null, trailDone, correct, total: lesson.quiz.length, review } };
}

const noteSchema = z.object({ track: z.string().max(80), order: z.number().int().min(1).max(200), body: z.string().transform(cleanText).pipe(z.string().max(2000)) });

export async function saveNote(input: { track: string; order: number; body: string }): Promise<Result> {
  const s = await actionSession();
  if (!s) return { ok: false, error: NEED_LOGIN };
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const track = getTrack(parsed.data.track);
  if (!track || !getLesson(track, parsed.data.order)) return { ok: false, error: GENERIC_ERROR };
  if (!(await allow("study", s.user.id))) return { ok: false, error: rateLimitMessage() };
  const supabase = await createClient();
  const key = { user_id: s.user.id, track_slug: track.slug, lesson_order: parsed.data.order };
  if (!parsed.data.body) { await supabase.from("study_notes").delete().match(key); return { ok: true }; }
  const { error } = await supabase.from("study_notes").upsert({ ...key, body: parsed.data.body, updated_at: new Date().toISOString() }, { onConflict: "user_id,track_slug,lesson_order" });
  return error ? { ok: false, error: GENERIC_ERROR } : { ok: true };
}

/** Marca (ou desmarca) um dia do plano de leitura. Cada dia lido vale XP. */
export async function togglePlanDay(day: number): Promise<Result<{ read: boolean; xp: number }>> {
  const s = await actionSession();
  if (!s) return { ok: false, error: NEED_LOGIN };
  if (!Number.isInteger(day) || day < 1 || day > 30) return { ok: false, error: GENERIC_ERROR };
  if (!(await allow("study", s.user.id))) return { ok: false, error: rateLimitMessage() };
  const admin = createAdminClient();
  const { data: cur } = await admin.from("study_plan_days").select("day").eq("user_id", s.user.id).eq("day", day).maybeSingle();
  const { error } = cur
    ? await admin.from("study_plan_days").delete().eq("user_id", s.user.id).eq("day", day)
    : await admin.from("study_plan_days").insert({ user_id: s.user.id, day });
  if (error) return { ok: false, error: GENERIC_ERROR };
  revalidatePath("/estudos", "layout");
  return { ok: true, read: !cur, xp: await currentXp(s.user.id) };
}

