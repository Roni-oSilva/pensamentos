"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MeetingScheduler } from "@/components/ui/meeting-scheduler";
import { Label } from "@/components/ui/label";
import { saveBibleSettings } from "@/actions/bible";
import { dateForDay, PLAN_DAYS } from "@/lib/bible-plan";
import { dateToIso, fmtBR, isoToDate } from "./dates";

/** Painel exclusivo do Criador: início do plano, lista de presença aberta/fechada e mensagem para todos. */
export function CreatorPanel({ startIso, showPresence, message }: { startIso: string; showPresence: boolean; message: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState(message ?? "");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-ink-500 p-4">
        <p className="text-sm text-ash-300"><strong className="text-white">Painel do Criador.</strong> Só você pode alterar o plano: data de início, lista de presença e mensagem.</p>
        <button type="button" className="btn-primary" onClick={() => setOpen(true)}>Editar plano</button>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <MeetingScheduler
        mode="single"
        title="Início do plano"
        description="Escolha o dia 1 (Gênesis 1). As 365 leituras se ajustam sozinhas a partir dele."
        startLabel="Dia 1 do plano*"
        initialStartDate={isoToDate(startIso)}
        switchLabel="Mostrar a lista de presença (nomes de quem leu) para os membros"
        initialSwitch={showPresence}
        scheduleButtonText={pending ? "Salvando…" : "Salvar plano"}
        cancelButtonText="Fechar"
        busy={pending}
        summary={(s) => s ? `Do dia 1 (${fmtBR(s, "d 'de' MMM 'de' yyyy")}) ao dia ${PLAN_DAYS} (${fmtBR(dateForDay(dateToIso(s), PLAN_DAYS), "d 'de' MMM 'de' yyyy")}).` : "Escolha o dia de início."}
        onCancel={() => setOpen(false)}
        onSchedule={({ startDate, aiNotes }) => {
          if (!startDate) return;
          setStatus(null);
          start(async () => {
            const r = await saveBibleSettings({ startDate: dateToIso(startDate), showPresence: aiNotes, message: msg });
            setStatus(r.ok ? { ok: true, text: "Plano salvo. Todos já veem as novas datas." } : { ok: false, text: r.error });
            if (r.ok) router.refresh();
          });
        }}
      />
      <div className="rounded-2xl border border-ink-700 bg-ink-900 p-4">
        <Label htmlFor="bible-msg" className="text-ash-200">Mensagem do Criador para todos (aparece no topo do plano)</Label>
        <textarea id="bible-msg" value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={500} rows={3} className="field mt-2" placeholder="Ex.: Vamos ler a Bíblia inteira juntos em 2026! Marque a sua leitura todos os dias." />
        <p className="mt-1 text-xs text-ash-400">A mensagem é salva junto com o botão “Salvar plano”.</p>
      </div>
      {status && <p role="status" className={status.ok ? "text-sm text-emerald-400" : "text-sm text-red-300"}>{status.text}</p>}
    </div>
  );
}
