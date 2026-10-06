"use client";

/** Link de texto que abre a janela de ajuda (usado no rodapé). */
export function HelpLink() {
  return <button type="button" className="link-muted" onClick={() => window.dispatchEvent(new Event("igreja:help"))}>Ajuda e sugestões</button>;
}
