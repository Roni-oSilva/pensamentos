"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { togglePlanDay } from "@/actions/study";
import type { PlanDay } from "@/lib/study/content";
import { XP } from "@/lib/study/xp";
import { ProgressBar } from "./ProgressBar";

export function PlanGrid({ days, initial, signedIn }: { days: PlanDay[]; initial: number[]; signedIn: boolean }) {
  const router = useRouter();
  const [read, setRead] = useState(() => new Set(initial));
  const [sel, setSel] = useState(() => days.find((d) => !initial.includes(d.dia))?.dia ?? 1);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const cur = days.find((d) => d.dia === sel)!;

  function toggle(day: number) {
    if (!signedIn) { window.location.href = `/login?next=${encodeURIComponent("/estudos/plano")}`; return; }
    setError(null);
    start(async () => {
      const r = await togglePlanDay(day);
      if (!r.ok) { setError(r.error); return; }
      setRead((s) => { const n = new Set(s); if (r.read) n.add(day); else n.delete(day); return n; });
      router.refresh();
    });
  }
  return (
    <div className="space-y-6">
      <div className="card space-y-3 p-5">
        <div className="flex justify-between text-sm"><span className="text-ash-200">{read.size} de {days.length} dias lidos</span><span className="text-ash-400">+{XP.planDay} XP por dia</span></div>
        <ProgressBar pct={(read.size / days.length) * 100} label="Progresso do plano de leitura" />
      </div>
      <div className="card space-y-3 p-5">
        <p className="eyebrow">Dia {cur.dia}</p>
        <p className="font-display text-3xl text-white">{cur.leitura}</p>
        <p className="text-sm text-ash-300">{cur.tema}</p>
        <button type="button" className={read.has(cur.dia) ? "btn-ghost" : "btn-primary"} disabled={pending} onClick={() => toggle(cur.dia)}>{read.has(cur.dia) ? "Desmarcar leitura" : "Marcar como lido"}</button>
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      </div>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-10" role="group" aria-label="Dias do plano">
        {days.map((d) => (
          <button key={d.dia} type="button" onClick={() => setSel(d.dia)} aria-pressed={sel === d.dia} aria-label={`Dia ${d.dia}${read.has(d.dia) ? ", lido" : ""}`}
            className={`aspect-square min-h-[44px] rounded-lg border text-sm transition active:scale-90 ${read.has(d.dia) ? "border-ash-100 bg-ash-100 text-ink-950" : "border-ink-600 text-ash-200 hover:border-ash-400"} ${sel === d.dia ? "ring-2 ring-ash-100 ring-offset-2 ring-offset-ink-950" : ""}`}>{d.dia}</button>
        ))}
      </div>
    </div>
  );
}
