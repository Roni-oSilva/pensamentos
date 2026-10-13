"use client";
import { useEffect, useState } from "react";
import { BellRing, X } from "lucide-react";
import { pushSupport } from "@/lib/push-client";
import { PushSettings } from "./PushSettings";

const KEY = "igreja:push-prompt";

/** Convite discreto no início do app para ativar as notificações (some se ativar ou fechar). */
export function PushPrompt() {
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(KEY)) return;
      if (pushSupport() !== "ok" || Notification.permission !== "default") return;
      setShow(true);
    } catch { /* sem storage */ }
  }, []);
  const close = () => { setShow(false); try { localStorage.setItem(KEY, "1"); } catch { /* ignora */ } };
  if (!show) return null;
  if (open) return <div className="mb-6"><PushSettings compact /></div>;
  return (
    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-300/25 bg-amber-400/10 p-3 pl-4">
      <BellRing className="h-5 w-5 shrink-0 text-amber-300" />
      <p className="min-w-0 flex-1 text-sm text-ash-200">Quer um aviso quando alguém postar?</p>
      <button type="button" onClick={() => setOpen(true)} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">Ativar</button>
      <button type="button" onClick={close} aria-label="Agora não" className="grid h-9 w-9 place-items-center rounded-full text-ash-400"><X className="h-4 w-4" /></button>
    </div>
  );
}
