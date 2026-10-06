import Link from "next/link";
import { getSession } from "@/lib/auth";
import { listCategories, listPosts } from "@/lib/data";
import { HeroScroll } from "@/components/home/HeroScroll";
import { PostGrid } from "@/components/posts/PostGrid";
import { Section } from "@/components/ui/Section";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { TiltCard } from "@/components/ui/TiltCard";

const STEPS = [
  { n: "01", title: "Leia", text: "Versículos, frases, conselhos e reflexões para meditar. Sem pressa e sem algoritmo.", href: "/frases", cta: "Ver as palavras" },
  { n: "02", title: "Guarde", text: "Curta, favorite e volte depois. Cada palavra pode virar uma imagem bonita para compartilhar.", href: "/explorar", cta: "Explorar" },
  { n: "03", title: "Comungue", text: "Crie sua conta, peça oração, conte o seu testemunho e compartilhe a sua palavra com os irmãos.", href: "/comunhao", cta: "Entrar na comunhão" },
];

const COMUNHAO = [
  { title: "Pedidos de oração", text: "Compartilhe o que pesa no coração. Os irmãos oram por você.", href: "/comunhao#oracao" },
  { title: "Testemunhos", text: "Conte o que Deus tem feito e anime a fé de outras pessoas.", href: "/comunhao#testemunhos" },
  { title: "Conselhos", text: "Uma palavra de sabedoria e direção, dada com amor.", href: "/comunhao#conselhos" },
];

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
      <noscript><style>{".hero{height:auto!important}.hero-stage{position:relative!important;height:auto!important;min-height:100svh}.hero-manifesto{position:relative!important;opacity:1!important;transform:none!important;padding:3rem 1rem}.hero-canvas{display:none}"}</style></noscript>
      <HeroScroll />

      <div id="continuar" className="scroll-mt-20">
        <section className="container-wide pt-6" aria-label="Como funciona">
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

        <Section eyebrow="Oficial" title="Últimas palavras" href="/frases" hrefLabel="Ver todas →">
          {featured.length ? <PostGrid posts={featured} signedIn={!!session} /> : <EmptyState title="Ainda não há palavras publicadas." hint="A primeira mensagem está a caminho. Volte em breve." />}
        </Section>

        <Reveal className="container-wide mt-20">
          <figure className="relative overflow-hidden rounded-2xl border border-ink-600 bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950 px-6 py-14 text-center sm:px-12 sm:py-20">
            <span aria-hidden className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 font-serif text-[9rem] leading-none text-poster/10">✝</span>
            <blockquote className="relative mx-auto max-w-3xl font-display text-2xl italic leading-snug text-white sm:text-4xl">“Posso todas as coisas em Cristo que me fortalece.”</blockquote>
            <figcaption className="relative mt-5 text-xs font-medium uppercase tracking-[0.3em] text-verse">Filipenses 4:13</figcaption>
            <div className="relative mt-8"><Link href="/frases" className="btn-ghost px-7">Ler mais palavras</Link></div>
          </figure>
        </Reveal>

        <Section eyebrow="Comunhão" title="Um só corpo" href="/comunhao" hrefLabel="Entrar na comunhão →">
          <div className="grid gap-5 md:grid-cols-3">
            {COMUNHAO.map((c, i) => (
              <Reveal key={c.title} delay={i * 100}>
                <Link href={c.href} className="card group flex h-full flex-col gap-3 p-6 transition hover:-translate-y-1 hover:border-poster/60">
                  <span aria-hidden className="text-2xl text-poster">✝</span>
                  <h3 className="font-poster text-3xl uppercase tracking-wide text-white">{c.title}</h3>
                  <p className="text-sm leading-relaxed text-ash-300">{c.text}</p>
                  <span className="tick mt-auto pt-2 text-ash-200 transition group-hover:text-white">Abrir →</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </Section>

        {mostLiked.length > 0 && (
          <Section eyebrow="Em destaque" title="As mais curtidas" href="/frases">
            <PostGrid posts={mostLiked} signedIn={!!session} />
          </Section>
        )}

        <Section eyebrow="Irmãos" title="Da comunidade" href="/comunidade" hrefLabel="Ver a comunidade →">
          {community.posts.length ? <PostGrid posts={community.posts.slice(0, 6)} signedIn={!!session} />
            : <EmptyState title="A comunidade ainda não compartilhou nada." hint="Seja o primeiro a compartilhar uma palavra de fé."><Link className="btn-primary" href="/comunidade/nova">Compartilhar agora</Link></EmptyState>}
        </Section>

        {categories.length > 0 && (
          <Reveal className="container-wide mt-20">
            <p className="eyebrow mb-3">Temas</p>
            <nav aria-label="Categorias" className="flex flex-wrap gap-2 border-y border-ink-700 py-5">
              {categories.map((c) => <Link key={c.id} href={`/categoria/${c.slug}`} className="badge px-4 py-1.5 transition hover:-translate-y-0.5 hover:border-poster hover:text-white">{c.name}</Link>)}
            </nav>
          </Reveal>
        )}

        <Reveal className="container-wide mt-20">
          <div className="rounded-2xl border border-ink-600 bg-ink-900/70 px-6 py-12 text-center sm:py-16">
            <h2 className="font-poster text-4xl uppercase leading-none tracking-wide text-white sm:text-5xl">Engrandeça a <span className="text-poster">Cristo</span> com a gente</h2>
            <p className="mx-auto mt-4 max-w-xl text-ash-300">Crie a sua conta, compartilhe um versículo, faça um pedido de oração e caminhe junto com a comunidade.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {session ? <Link href="/comunidade/nova" className="btn-primary px-7">Compartilhar uma palavra</Link> : <Link href="/cadastro" className="btn-primary px-7">Criar minha conta</Link>}
              <Link href="/comunhao" className="btn-ghost px-7">Conhecer a comunhão</Link>
            </div>
          </div>
        </Reveal>
      </div>
    </>
  );
}
