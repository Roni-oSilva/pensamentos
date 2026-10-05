import Link from "next/link";
import { getSession } from "@/lib/auth";
import { listCategories, listPosts, listRecentVoices } from "@/lib/data";
import { VoicesBar } from "@/components/community/VoicesBar";
import { HeroScroll } from "@/components/home/HeroScroll";
import { PostGrid } from "@/components/posts/PostGrid";
import { Section } from "@/components/ui/Section";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { TiltCard } from "@/components/ui/TiltCard";

const STEPS = [
  { n: "01", title: "Leia", text: "Frases e reflexões que incomodam na medida certa. Sem pressa, sem algoritmo.", href: "/frases", cta: "Ver frases" },
  { n: "02", title: "Guarde", text: "Curta, favorite e volte depois. Cada heresia pode virar um cartão em PNG para compartilhar.", href: "/explorar", cta: "Explorar" },
  { n: "03", title: "Publique", text: "Crie sua conta e deixe a sua própria heresia na comunidade. Tudo passa por moderação.", href: "/comunidade/nova", cta: "Publicar" },
];

export default async function Home() {
  const session = await getSession();
  const uid = session?.user.id ?? null;
  const [latest, top, community, categories, voices] = await Promise.all([
    listPosts({ origin: "OFFICIAL", sort: "recent" }, uid),
    listPosts({ origin: "OFFICIAL", sort: "likes" }, uid),
    listPosts({ origin: "COMMUNITY", sort: "recent" }, uid),
    listCategories(),
    listRecentVoices(),
  ]);
  const featured = latest.posts.slice(0, 3);
  const mostLiked = top.posts.filter((p) => p.like_count > 0).slice(0, 3);

  return (
    <>
      <noscript><style>{".reveal{opacity:1!important;transform:none!important}.hero{height:auto!important}.hero-stage{position:relative!important;height:auto!important;min-height:100svh}.hero-manifesto{position:relative!important;opacity:1!important;transform:none!important;padding:3rem 1rem}"}</style></noscript>
      <HeroScroll />

      <section className="pb-6 pt-2" aria-label="Quem publicou recentemente"><VoicesBar voices={voices} signedIn={!!session} /></section>

      <section className="container-wide -mt-8 pb-4" aria-label="Como funciona">
        <div className="grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <TiltCard>
                <Link href={s.href} className="relative flex h-full min-h-56 flex-col justify-between gap-8 p-7">
                  <span className="font-poster text-7xl leading-none text-poster/90">{s.n}</span>
                  <div className="space-y-2">
                    <h2 className="font-poster text-4xl uppercase tracking-wide text-white">{s.title}</h2>
                    <p className="text-sm leading-relaxed text-ash-300">{s.text}</p>
                    <span className="tick inline-flex items-center gap-2 pt-2 text-ash-200">{s.cta} <span aria-hidden>→</span></span>
                  </div>
                </Link>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {categories.length > 0 && (
        <Reveal className="container-wide mt-14">
          <nav aria-label="Categorias" className="flex flex-wrap gap-2 border-y border-ink-700 py-5">
            {categories.map((c) => <Link key={c.id} href={`/categoria/${c.slug}`} className="badge px-4 py-1.5 transition hover:-translate-y-0.5 hover:border-poster hover:text-white">{c.name}</Link>)}
          </nav>
        </Reveal>
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
