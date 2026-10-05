import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { listPosts } from "@/lib/data";
import { FeedList } from "@/components/posts/FeedList";
import { PageTitle } from "@/components/ui/Section";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Palavras", description: "Publicações oficiais: versículos, frases, conselhos, orações e reflexões." };

export default async function FrasesPage() {
  const session = await getSession();
  const { posts, hasMore } = await listPosts({ origin: "OFFICIAL", sort: "recent" }, session?.user.id ?? null);
  return (
    <>
      <PageTitle eyebrow="Oficial" title="Palavras">Versículos, conselhos, orações e reflexões publicados pela liderança, para edificar a sua fé.</PageTitle>
      <div className="container-wide mt-10">
        {posts.length ? <FeedList initial={posts} hasMore={hasMore} signedIn={!!session} params={{ origin: "OFFICIAL", sort: "recent" }} />
          : <EmptyState title="Ainda não há palavras publicadas." hint="Volte em breve: a primeira mensagem está a caminho." />}
      </div>
    </>
  );
}
