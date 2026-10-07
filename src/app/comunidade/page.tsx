import { ComposeFab } from "@/components/community/ComposeFab";
import Link from "next/link";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { listPosts, type Sort } from "@/lib/data";
import { FeedList } from "@/components/posts/FeedList";
import { PageTitle } from "@/components/ui/Section";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Comunidade", description: "Versículos, frases, pensamentos e conselhos de irmãos que compartilham a Palavra e engrandecem a Cristo." };

const TABS: { key: Sort; label: string }[] = [
  { key: "recent", label: "Recentes" }, { key: "trending", label: "Em alta" }, { key: "likes", label: "Mais curtidas" }, { key: "comments", label: "Mais comentadas" },
];

export default async function Comunidade({ searchParams }: { searchParams: Promise<{ ordem?: string }> }) {
  const { ordem } = await searchParams;
  const sort = (TABS.find((t) => t.key === ordem)?.key ?? "recent") as Sort;
  const session = await getSession();
  const { posts, hasMore } = await listPosts({ origin: "COMMUNITY", sort }, session?.user.id ?? null);
  return (
    <>
      <PageTitle eyebrow="Comunidade" title="Irmãos em Cristo">
        <span>Compartilhe versículos, frases, pensamentos e conselhos, e engrandeça a Cristo junto com a comunidade. O que você publica aparece na hora.</span>
        <span className="mt-5 block"><Link href="/comunidade/nova" className="btn-primary">Compartilhar com a comunidade</Link></span>
      </PageTitle>
      <div className="container-wide mt-10">
        <div role="tablist" aria-label="Ordenação" className="mb-8 flex gap-1 overflow-x-auto border-b border-ink-700 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => (
            <Link key={t.key} role="tab" aria-selected={t.key === sort} href={t.key === "recent" ? "/comunidade" : `/comunidade?ordem=${t.key}`}
              className={`flex min-h-[48px] flex-1 items-center justify-center whitespace-nowrap border-b-2 px-4 text-sm transition active:bg-ink-800 sm:flex-none ${t.key === sort ? "border-white text-white" : "border-transparent text-ash-400 hover:text-ash-100"}`}>{t.label}</Link>
          ))}
        </div>
        {posts.length ? <FeedList key={sort} initial={posts} hasMore={hasMore} signedIn={!!session} params={{ origin: "COMMUNITY", sort }} />
          : <EmptyState title="Ainda não há palavras por aqui." hint={sort === "trending" ? "Nada em alta nos últimos 14 dias." : "Seja o primeiro a compartilhar uma palavra de fé."} />}
      </div>
      <ComposeFab />
    </>
  );
}
