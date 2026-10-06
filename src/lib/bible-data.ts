import "server-only";
import { createClient } from "@/lib/supabase/server";
import { dayForDate, todayIsoBR } from "@/lib/bible-plan";

export interface BibleState {
  startIso: string;
  todayIso: string;
  currentDay: number | null;
  showPresence: boolean;
  message: string | null;
  counts: Record<number, number>;
  notes: Record<number, string>;
  myDays: number[];
}

/** Estado do plano para a página. Se o banco não responder, usa 1º de janeiro do ano atual como início. */
export async function getBibleState(viewerId: string | null): Promise<BibleState> {
  const supabase = await createClient();
  const todayIso = todayIsoBR();
  const [settings, counts, notes, mine] = await Promise.all([
    supabase.from("bible_plan_settings").select("start_date, show_presence, message").maybeSingle(),
    supabase.rpc("bible_plan_counts"),
    supabase.from("bible_plan_notes").select("day, note"),
    viewerId ? supabase.from("bible_plan_marks").select("day").eq("user_id", viewerId) : Promise.resolve({ data: [] as { day: number }[] }),
  ]);
  const startIso = (settings.data?.start_date as string | undefined) ?? `${todayIso.slice(0, 4)}-01-01`;
  return {
    startIso,
    todayIso,
    currentDay: dayForDate(startIso, todayIso),
    showPresence: (settings.data?.show_presence as boolean | undefined) ?? true,
    message: (settings.data?.message as string | null | undefined) ?? null,
    counts: Object.fromEntries(((counts.data ?? []) as { day: number; total: number }[]).map((c) => [c.day, c.total])),
    notes: Object.fromEntries(((notes.data ?? []) as { day: number; note: string }[]).map((n) => [n.day, n.note])),
    myDays: ((mine.data ?? []) as { day: number }[]).map((m) => m.day),
  };
}
