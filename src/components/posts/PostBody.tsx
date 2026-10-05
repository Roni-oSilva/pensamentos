import { sanitizeRichHtml } from "@/lib/sanitize";

/**
 * Oficial: HTML do editor, sanitizado NOVAMENTE na renderização (defesa em profundidade).
 * Comunidade: texto puro — React escapa tudo; nenhuma injeção de HTML.
 */
export function PostBody({ content, origin }: { content: string; origin: "OFFICIAL" | "COMMUNITY" }) {
  if (origin === "OFFICIAL") {
    return <div className="rich" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(content) }} />;
  }
  return <p className="preline font-display text-xl leading-relaxed text-ash-100">{content}</p>;
}
