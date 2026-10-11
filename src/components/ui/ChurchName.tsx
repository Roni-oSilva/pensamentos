/**
 * Nome "Igreja de Cristo" na tipografia oficial: serifada de alto contraste (Bodoni Moda) em caixa alta,
 * com o "C" de Cristo em letra cursiva (Great Vibes), como no pôster "Christ is Enough".
 * - "stack": IGREJA DE pequeno em cima e CRISTO grande embaixo (logo do topo, abertura do app)
 * - "line": tudo numa linha (rodapé, cartões)
 * O tamanho vem do font-size do elemento (classe text-*).
 */
export function ChurchName({ variant = "line", className = "" }: { variant?: "stack" | "line"; className?: string }) {
  return (
    <span className={`brand-name ${variant === "stack" ? "brand-stack" : ""} ${className}`}>
      <span className="sr-only">Igreja de Cristo</span>
      <span aria-hidden className="brand-de">Igreja de</span>
      {variant === "line" ? " " : null}
      <span aria-hidden className="brand-cristo"><span className="brand-c">C</span>risto</span>
    </span>
  );
}
