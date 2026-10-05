import Link from "next/link";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { listCategories, listPosts, searchUsers, type Sort } from "@/lib/data";
import { FeedList } from "@/components/posts/FeedList";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageTitle } from "@/components/ui/Section";
import { KIND_LABEL, POST_KINDS } from "@/lib/constants";

export const metadata: Metadata = { title: "Explorar", description: "Busque frases, títulos, categorias, tags e usuários." };

type SP = { q?: string; tipo?: string; categoria?: string; tag?: string; origem?: string; ordem?: string };

export default async function Explorar({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const kind = POST_KINDS.find((k) => k === sp.tipo);
  const origin = sp.origem === "OFFICIAL" || sp.origem === "COMMUNITY" ? sp.origem : undefined;
  const sort = (["recent", "trending", "likes", "comments"].includes(sp.ordem ?? "") ? sp.ordem : "recent") as Sort;
  const categorySlug = /^[a-z0-9-]{2,48}$/.test(sp.categoria ?? "") ? sp.categoria : undefined;
  const tagSlug = /^[a-z0-9-]{2,40}$/.test(sp.tag ?? "") ? sp.tag : undefined;

  const session = await getSession();
  const [categories, result, users] = await Promise.all([
    listCategories(),
    listPosts({ q: q || undefined, kind, origin, sort, categorySlug, tagSlug }, session?.user.id ?? null),
    q ? searchUsers(q) : Promise.resolve([]),
  ]);

  return (
    <>
      <PageTitle eyebrow="Busca" title="Explorar" />
      <div className="container-wide mt-8">
        <form action="/explorar" className="grid gap-3 md:grid-cols-[1fr_repeat(4,10rem)_auto]" role="search">
          <input name="q" defaultValue={q} maxLength={80} placeholder="Frases, títulos, usuários…" aria-label="Buscar" className="field" />
          <select name="tipo" defaultValue={kind ?? ""} aria-label="Tipo" className="field"><option value="">Todos os tipos</option>{POST_KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</select>
          <select name="categoria" defaultValue={categorySlug ?? ""} aria-label="Categoria" className="field"><option value="">Categorias</option>{categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}</select>
          <select name="origem" defaultValue={origin ?? ""} aria-label="Origem" className="field"><option value="">Oficial + comunidade</option><option value="OFFICIAL">Oficial</option><option value="COMMUNITY">Comunidade</option></select>
          <select name="ordem" defaultValue={sort} aria-label="Ordenar" className="field"><option value="recent">Recentes</option><option value="trending">Em alta</option><option value="likes">Mais curtidas</option><option value="comments">Mais comentadas</option></select>
          <button className="btn-primary">Buscar</button>
          {tagSlug && <input type="hidden" name="tag" value={tagSlug} />}
        </form>
        {tagSlug && <p className="mt-4 text-sm text-ash-400">Filtrando por <strong className="text-white">#{tagSlug}</strong> · <Link className="link-muted" href="/explorar">limpar</Link></p>}

        {users.length > 0 && (
          <section className="mt-10" aria-labelledby="usuarios-h">
            <h2 id="usuarios-h" className="eyebrow mb-4">Usuários</h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {users.map((u) => (
                <li key={u.username}><Link href={`/perfil/${u.username}`} className="card flex items-center gap-3 p-4 hover:border-ink-500">
                  <Avatar src={u.avatar_url} name={u.username} size={40} />
                  <div className="min-w-0"><p className="truncate text-white">{u.display_name ?? u.username}</p><p className="truncate text-sm text-ash-400">@{u.username}</p></div>
                </Link></li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10" aria-label="Resultados">
          {result.posts.length ? (
            <FeedList key={JSON.stringify(sp)} initial={result.posts} hasMore={result.hasMore} signedIn={!!session} params={{ origin, sort, kind, q: q || undefined, categorySlug, tagSlug }} />
          ) : <EmptyState title="Nada encontrado." hint="Tente outros termos ou remova filtros." />}
        </section>
      </div>
    </>
  );
}
