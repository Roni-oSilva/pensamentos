import "server-only";
import { createClient } from "@/lib/supabase/server";
import { levelFor, totalXp, type LevelInfo } from "./xp";

export interface StudyState {
  xp: number;
  info: LevelInfo;
  done: Map<string, Set<number>>; // trilha -> aulas concluídas
  trailsDone: Set<string>;
  planDays: Set<number>;
}

export async function getStudyState(userId: string): Promise<StudyState> {
  const supabase = await createClient();
  const [p, t, d] = await Promise.all([
    supabase.from("study_progress").select("track_slug, lesson_order, quiz_correct, quiz_total").eq("user_id", userId),
    supabase.from("study_trail_done").select("track_slug").eq("user_id", userId),
    supabase.from("study_plan_days").select("day").eq("user_id", userId),
  ]);
  const rows = (p.data ?? []) as { track_slug: string; lesson_order: number; quiz_correct: number; quiz_total: number }[];
  const done = new Map<string, Set<number>>();
  for (const r of rows) done.set(r.track_slug, (done.get(r.track_slug) ?? new Set()).add(r.lesson_order));
  const trailsDone = new Set((t.data ?? []).map((r) => r.track_slug as string));
  const planDays = new Set((d.data ?? []).map((r) => r.day as number));
  const xp = totalXp({ lessons: rows, trails: trailsDone.size, planDays: planDays.size });
  return { xp, info: levelFor(xp), done, trailsDone, planDays };
}
