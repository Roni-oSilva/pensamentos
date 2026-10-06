"use client";

/** Abre o diálogo de impressão do navegador; escolha “Salvar como PDF” para baixar a aula. */
export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-ghost no-print">
      Salvar esta aula em PDF
    </button>
  );
}
