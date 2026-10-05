import Link from "next/link";

/** Paginação por querystring (páginas do painel e buscas). */
export function Pager({ basePath, params, page, hasMore }: { basePath: string; params?: Record<string, string | undefined>; page: number; hasMore: boolean }) {
  const href = (p: number) => {
    const q = new URLSearchParams();
    Object.entries(params ?? {}).forEach(([k, v]) => v && q.set(k, v));
    if (p > 0) q.set("page", String(p));
    const s = q.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  if (page === 0 && !hasMore) return null;
  return (
    <nav aria-label="Paginação" className="mt-6 flex items-center justify-between text-sm">
      {page > 0 ? <Link className="btn-ghost" href={href(page - 1)}>← Anterior</Link> : <span />}
      <span className="text-ash-400">Página {page + 1}</span>
      {hasMore ? <Link className="btn-ghost" href={href(page + 1)}>Próxima →</Link> : <span />}
    </nav>
  );
}
