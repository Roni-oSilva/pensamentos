"use client";
import { useFormStatus } from "react-dom";

/** Botão de submit com estado de carregamento (desabilita para evitar duplo envio). */
export function SubmitButton({ children, className = "btn-primary", pendingText = "Aguarde…" }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} aria-busy={pending}>
      {pending ? pendingText : children}
    </button>
  );
}
