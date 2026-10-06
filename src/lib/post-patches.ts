import type { PostWithViewer } from "@/lib/types";

/**
 * Curtidas/favoritos feitos nesta aba do navegador. As telas já abertas ficam guardadas pelo roteador
 * por alguns segundos (troca de aba instantânea); ao voltar para elas, estes ajustes são aplicados por cima,
 * para a curtida não “sumir”. Valem por 2 minutos — depois disso o servidor já traz o valor novo.
 */
type Patch = Partial<Pick<PostWithViewer, "liked" | "like_count" | "favorited" | "favorite_count">>;
const TTL = 2 * 60_000;
const store = new Map<string, { patch: Patch; at: number }>();

export function rememberPatch(id: string, patch: Patch) {
  const cur = store.get(id);
  store.set(id, { patch: { ...(cur && Date.now() - cur.at < TTL ? cur.patch : {}), ...patch }, at: Date.now() });
}

export function getPatch(id: string): Patch | undefined {
  const e = store.get(id);
  if (!e) return undefined;
  if (Date.now() - e.at > TTL) { store.delete(id); return undefined; }
  return e.patch;
}

export const withPatch = <T extends { id: string }>(p: T): T => ({ ...p, ...getPatch(p.id) });
