import Link from "next/link";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { listPosts, listRecentMembers } from "@/lib/data";
import { PostGrid } from "@/components/posts/PostGrid";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageTitle, Section } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Comunhão",
  description: "Pedidos de oração, testemunhos e conselhos: irmãos que carregam as cargas uns dos outros.",
};

export default async function Comunhao() {
  const session = await getSession();
  const uid = session?.user.id ?? null;
  const [oracoes, testemunhos, conselhos, membros] = await Promise.all([
    listPosts({ origin: "COMMUNITY", kind: "ORACAO", sort: "recent" }, uid),
    listPosts({ origin: "COMMUNITY", categorySlug: "testemunhos", sort: "recent" }, uid),
    listPosts({ origin: "COMMUNITY", kind: "CONSELHO", sort: "recent" }, uid),
    listRecentMembers(14),
  ]);
  const novo = (tipo: string) => (session ? `/comunidade/nova?tipo=${tipo}` : "/cadastro");

  return (
    <>
      <PageTitle eyebrow="Comunhão" title="Um só corpo">
        <p>Aqui os irmãos oram uns pelos outros, contam o que Deus tem feito e aconselham com amor.</p>
        <p className="mt-3 font-display text-lg italic text-ash-200">“Levai as cargas uns dos outros, e assim cumprireis a lei de Cristo.” <span className="not-italic text-ash-400">Gálatas 6:2</span></p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={novo("ORACAO")} className="btn-primary">Fazer um pedido de oração</Link>
          <Link href={novo("FRASE")} className="btn-ghost">Contar um testemunho</Link>
        </div>
      </PageTitle>

      <Section id="oracao" eyebrow="Oração" title="Pedidos de oração" href="/explorar?tipo=ORACAO&origem=COMMUNITY">
        {oracoes.posts.length ? <PostGrid posts={oracoes.posts.slice(0, 6)} signedIn={!!session} />
          : <EmptyState title="Nenhum pedido de oração ainda." hint="Compartilhe o seu: os irmãos vão orar por você."><Link className="btn-primary" href={novo("ORACAO")}>Pedir oração</Link></EmptyState>}
      </Section>

      <Section id="testemunhos" eyebrow="Gratidão" title="Testemunhos" href="/explorar?categoria=testemunhos&origem=COMMUNITY">
        {testemunhos.posts.length ? <PostGrid posts={testemunhos.posts.slice(0, 6)} signedIn={!!session} />
          : <EmptyState title="Ainda não há testemunhos." hint="Conte o que Deus fez na sua vida: escolha a categoria Testemunhos ao publicar."><Link className="btn-primary" href={novo("FRASE")}>Contar meu testemunho</Link></EmptyState>}
      </Section>

      <Section id="conselhos" eyebrow="Sabedoria" title="Conselhos" href="/explorar?tipo=CONSELHO&origem=COMMUNITY">
        {conselhos.posts.length ? <PostGrid posts={conselhos.posts.slice(0, 6)} signedIn={!!session} />
          : <EmptyState title="Ainda não há conselhos." hint="Uma palavra amiga pode mudar o dia de alguém."><Link className="btn-primary" href={novo("CONSELHO")}>Dar um conselho</Link></EmptyState>}
      </Section>

      {membros.length > 0 && (
        <Section eyebrow="Irmãos" title="Quem está na comunhão">
          <ul className="grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-7">
            {membros.map((m) => (
              <li key={m.username}>
                <Link href={`/perfil/${m.username}`} className="group flex flex-col items-center gap-2 rounded-xl p-2 text-center transition hover:bg-ink-800 active:scale-95">
                  <span className="rounded-full bg-gradient-to-tr from-poster via-[#f59e0b] to-poster p-[2px]"><span className="block rounded-full border-2 border-ink-950"><Avatar src={m.avatar_url} name={m.username} size={56} /></span></span>
                  <span className="w-full truncate text-xs text-ash-200 group-hover:text-white">{m.display_name || m.username}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
