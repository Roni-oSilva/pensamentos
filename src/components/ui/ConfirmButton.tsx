"use client";
import { useRef } from "react";

/**
 * Botão de submit com confirmação (<dialog> nativo). Use dentro de um <form action={serverAction}>.
 * Obrigatório antes de qualquer ação destrutiva.
 */
export function ConfirmButton({
  children, title = "Tem certeza?", message, confirmLabel = "Confirmar", className = "btn-danger",
}: { children: React.ReactNode; title?: string; message: string; confirmLabel?: string; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className={className} onClick={() => ref.current?.showModal()}>{children}</button>
      <dialog ref={ref} className="w-[min(92vw,26rem)] rounded-lg border border-ink-600 bg-ink-900 p-0 text-ash-200 backdrop:bg-black/70 backdrop:backdrop-blur-sm">
        <div className="space-y-4 p-6">
          <h3 className="font-display text-2xl text-white">{title}</h3>
          <p className="text-sm text-ash-300">{message}</p>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => ref.current?.close()}>Cancelar</button>
            <button type="submit" className="btn-danger" onClick={() => ref.current?.close()}>{confirmLabel}</button>
          </div>
        </div>
      </dialog>
    </>
  );
}
