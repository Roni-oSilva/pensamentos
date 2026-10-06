"use client";
import { useEffect, useState } from "react";

/** Mostra os avisos de `toast()` na parte de baixo da tela, acima da barra de abas do app. */
export function Toaster() {
  const [msg, setMsg] = useState<{ text: string; key: number } | null>(null);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const on = (e: Event) => {
      setMsg({ text: String((e as CustomEvent).detail), key: Date.now() });
      clearTimeout(t); t = setTimeout(() => setMsg(null), 2600);
    };
    window.addEventListener("igreja:toast", on);
    return () => { window.removeEventListener("igreja:toast", on); clearTimeout(t); };
  }, []);
  return (
    <div aria-live="polite" role="status" className="toaster no-print pointer-events-none fixed inset-x-0 z-[90] flex justify-center px-4">
      {msg && <p key={msg.key} className="toast-pill max-w-md rounded-full bg-ash-100 px-5 py-2.5 text-center text-sm font-semibold text-ink-950 shadow-2xl">{msg.text}</p>}
    </div>
  );
}
