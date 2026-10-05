import Link from "next/link";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { listPosts, type Sort } from "@/lib/data";
import { FeedList } from "@/components/posts/FeedList";
import { PageTitle } from "@/components/ui/Section";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Comunidade", description: "Frases, pensamentos e poemas de quem faz parte do Heresias." };

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
      <PageTitle eyebrow="Comunidade" title="Vozes">
        <span>Publicações de quem faz parte. Tudo passa por moderação antes de aparecer.</span>
        <span className="mt-5 block"><Link href="/comunidade/nova" className="btn-primary">Publicar na comunidade</Link></span>
      </PageTitle>
      <div className="container-wide mt-10">
        <div role="tablist" aria-label="Ordenação" className="mb-8 flex gap-1 overflow-x-auto border-b border-ink-700">
          {TABS.map((t) => (
            <Link key={t.key} role="tab" aria-selected={t.key === sort} href={t.key === "recent" ? "/comunidade" : `/comunidade?ordem=${t.key}`}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm transition-colors ${t.key === sort ? "border-white text-white" : "border-transparent text-ash-400 hover:text-ash-100"}`}>{t.label}</Link>
          ))}
        </div>
        {posts.length ? <FeedList key={sort} initial={posts} hasMore={hasMore} signedIn={!!session} params={{ origin: "COMMUNITY", sort }} />
          : <EmptyState title="Silêncio absoluto." hint={sort === "trending" ? "Nada em alta nos últimos 14 dias." : "Nenhuma publicação aprovada ainda."} />}
      </div>
    </>
  );
}
