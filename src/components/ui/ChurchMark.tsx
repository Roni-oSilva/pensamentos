import { MARK_RATIO, MARK_URL } from "@/lib/church-mark";

/**
 * A cruz (logo oficial). Desenhada por máscara: assume a cor do texto (`currentColor`), então funciona nos temas
 * claro e escuro, e o arquivo vetorial é baixado uma única vez (cache) em vez de repetido em cada página.
 * Use uma altura na classe (ex.: "h-10"); a largura acompanha a proporção da cruz.
 */
export function ChurchMark({ className = "" }: { className?: string; light?: boolean }) {
  const mask = `url(${MARK_URL}) center / contain no-repeat`;
  return <span aria-hidden className={`inline-block shrink-0 bg-current ${className}`} style={{ aspectRatio: String(MARK_RATIO), WebkitMask: mask, mask }} />;
}
