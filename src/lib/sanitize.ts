import sanitizeHtml from "sanitize-html";
import { SUPABASE_URL } from "@/lib/env";

/** Texto puro: remove caracteres de controle e normaliza quebras de linha. */
export function cleanText(input: string): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f‎‏‪-‮]/g, "").trim();
}

function allowedImageHost(src: string): boolean {
  try {
    const u = new URL(src);
    const base = SUPABASE_URL ? new URL(SUPABASE_URL) : null;
    return u.protocol === "https:" && !!base && u.hostname === base.hostname && u.pathname.startsWith("/storage/v1/object/public/");
  } catch {
    return false;
  }
}

/**
 * HTML do editor administrativo → lista branca estrita.
 * Sem scripts, estilos, handlers, iframes; links só http(s)/mailto; imagens só do nosso Storage.
 */
export function sanitizeRichHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "a", "blockquote", "hr", "ul", "ol", "li", "h2", "h3", "img"],
    allowedAttributes: { a: ["href", "title", "rel", "target"], img: ["src", "alt", "title"] },
    allowedSchemes: ["https", "http", "mailto"],
    allowedSchemesByTag: { img: ["https"] },
    allowProtocolRelative: false,
    transformTags: {
      a: (tag, attribs) => ({ tagName: "a", attribs: { ...attribs, rel: "noopener noreferrer nofollow ugc", target: "_blank" } }),
    },
    exclusiveFilter: (frame) => frame.tag === "img" && !allowedImageHost(frame.attribs.src ?? ""),
  }).trim();
}

/** Valida que a URL de imagem pertence ao Storage do projeto, bucket permitido e pasta do usuário. */
export function isOwnedImageUrl(url: string, userId: string, buckets: ("community" | "admin")[]): boolean {
  if (!allowedImageHost(url)) return false;
  const u = new URL(url);
  return buckets.some((b) => u.pathname.startsWith(`/storage/v1/object/public/${b}/${userId}/`)) && !u.search && !u.hash;
}

/** Imagem de qualquer pasta do bucket informado (uso: bucket `admin`, onde só staff escreve). */
export function isStorageUrl(url: string, bucket: "community" | "admin"): boolean {
  return allowedImageHost(url) && new URL(url).pathname.startsWith(`/storage/v1/object/public/${bucket}/`);
}
