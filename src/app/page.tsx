import Link from "next/link";
import { getSession } from "@/lib/auth";
import { listCategories, listPosts } from "@/lib/data";
import { PostGrid } from "@/components/posts/PostGrid";
import { Section } from "@/components/ui/Section";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function Home() {
  const session = await getSession();
  const uid = session?.user.id ?? null;
  const [latest, top, community, categories] = await Promise.all([
    listPosts({ origin: "OFFICIAL", sort: "recent" }, uid),
    listPosts({ origin: "OFFICIAL", sort: "likes" }, uid),
    listPosts({ origin: "COMMUNITY", sort: "recent" }, uid),
    listCategories(),
  ]);
  const featured = latest.posts.slice(0, 3);
  const mostLiked = top.posts.filter((p) => p.like_count > 0).slice(0, 3);

  return (
    <>
      <section className="container-wide flex min-h-[78vh] flex-col justify-center py-20">
        <p className="eyebrow mb-6 animate-rise">Um arquivo de pensamentos incômodos</p>
        <h1 className="animate-rise font-display text-6xl font-medium uppercase leading-[0.95] tracking-tight text-white sm:text-8xl lg:text-9xl" style={{ animationDelay: "80ms" }}>
          Heresias<br /><span className="text-ash-400">que passam</span><br />pela minha<br />cabeça
        </h1>
        <p className="mt-8 max-w-xl animate-rise text-lg text-ash-300" style={{ animationDelay: "160ms" }}>
          Frases, reflexões e poemas que chegam sem pedir licença. Leia, discorde, guarde — e deixe a sua própria heresia na comunidade.
        </p>
        <div className="mt-10 flex flex-wrap gap-3 animate-rise" style={{ animationDelay: "240ms" }}>
          <Link href="/heresia" prefetch={false} className="btn-primary px-6 py-3">Mostrar uma heresia</Link>
          <Link href="/comunidade" className="btn-ghost px-6 py-3">Explorar a comunidade</Link>
        </div>
      </section>

      {categories.length > 0 && (
        <nav aria-label="Categorias" className="container-wide flex flex-wrap gap-2 border-y border-ink-700 py-5">
          {categories.map((c) => <Link key={c.id} href={`/categoria/${c.slug}`} className="badge px-4 py-1.5 hover:border-ash-300 hover:text-white">{c.name}</Link>)}
        </nav>
      )}

      <Section eyebrow="Oficial" title="Últimas publicações" href="/frases">
        {featured.length ? <PostGrid posts={featured} signedIn={!!session} /> : <EmptyState title="Ainda é silêncio por aqui." hint="As primeiras heresias estão a caminho." />}
      </Section>

      {mostLiked.length > 0 && (
        <Section eyebrow="Em destaque" title="As mais curtidas" href="/frases">
          <PostGrid posts={mostLiked} signedIn={!!session} />
        </Section>
      )}

      <Section eyebrow="Vozes" title="Da comunidade" href="/comunidade" hrefLabel="Entrar na comunidade →">
        {community.posts.length ? <PostGrid posts={community.posts.slice(0, 6)} signedIn={!!session} />
          : <EmptyState title="A comunidade ainda não disse nada." hint="Seja a primeira voz."><Link className="btn-primary" href="/comunidade/nova">Publicar agora</Link></EmptyState>}
      </Section>
    </>
  );
}
