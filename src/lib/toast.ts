"use client";
/** Aviso rápido na tela (“toast”). Qualquer componente cliente pode chamar `toast("Mensagem")`. */
export function toast(message: string) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("igreja:toast", { detail: message }));
}
