"use client";
import { useRef, useState, useTransition } from "react";
import { submitReport } from "@/actions/social";
import { REASON_LABEL, REPORT_REASONS, type ReportTarget } from "@/lib/constants";

export function ReportButton({ targetType, targetId, signedIn, label = "Denunciar" }: { targetType: ReportTarget; targetId: string; signedIn: boolean; label?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await submitReport({ targetType, targetId, reason: String(fd.get("reason")), details: String(fd.get("details") ?? "") });
      setMsg(r.ok ? { ok: true, text: "Denúncia enviada. Obrigado por cuidar da comunidade." } : { ok: false, text: r.error });
    });
  }

  return (
    <>
      <button type="button" className="text-xs text-ash-400 underline-offset-4 hover:text-ash-100 hover:underline"
        onClick={() => (signedIn ? ref.current?.showModal() : (window.location.href = "/login"))}>{label}</button>
      <dialog ref={ref} className="w-[min(92vw,28rem)] rounded-lg border border-ink-600 bg-ink-900 p-0 text-ash-200 backdrop:bg-black/70">
        <form onSubmit={onSubmit} className="space-y-4 p-6">
          <h3 className="font-display text-2xl text-white">Denunciar</h3>
          {msg?.ok ? <p role="status" className="text-sm text-ash-200">{msg.text}</p> : (
            <>
              <div>
                <label className="label" htmlFor={`reason-${targetId}`}>Motivo</label>
                <select id={`reason-${targetId}`} name="reason" required className="field">
                  {REPORT_REASONS.map((r) => <option key={r} value={r}>{REASON_LABEL[r]}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor={`details-${targetId}`}>Detalhes (opcional)</label>
                <textarea id={`details-${targetId}`} name="details" maxLength={500} rows={3} className="field" />
              </div>
              {msg && <p role="alert" className="text-sm text-red-300">{msg.text}</p>}
            </>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => { ref.current?.close(); setMsg(null); }}>{msg?.ok ? "Fechar" : "Cancelar"}</button>
            {!msg?.ok && <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Enviando…" : "Enviar denúncia"}</button>}
          </div>
        </form>
      </dialog>
    </>
  );
}
