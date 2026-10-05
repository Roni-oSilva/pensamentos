import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { listPosts } from "@/lib/data";
import { FeedList } from "@/components/posts/FeedList";
import { PageTitle } from "@/components/ui/Section";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Frases", description: "Publicações oficiais: frases, pensamentos, reflexões e poemas." };

export default async function FrasesPage() {
  const session = await getSession();
  const { posts, hasMore } = await listPosts({ origin: "OFFICIAL", sort: "recent" }, session?.user.id ?? null);
  return (
    <>
      <PageTitle eyebrow="Oficial" title="Frases">Pensamentos, reflexões e poemas publicados pelo autor do projeto.</PageTitle>
      <div className="container-wide mt-10">
        {posts.length ? <FeedList initial={posts} hasMore={hasMore} signedIn={!!session} params={{ origin: "OFFICIAL", sort: "recent" }} />
          : <EmptyState title="Nada publicado ainda." hint="Volte em breve." />}
      </div>
    </>
  );
}
