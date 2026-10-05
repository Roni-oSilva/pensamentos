import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { POST_SELECT, withViewer } from "@/lib/data";
import { PostGrid } from "@/components/posts/PostGrid";
import { Pager } from "@/components/ui/Pager";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageTitle } from "@/components/ui/Section";
import { PAGE_SIZE } from "@/lib/constants";
import type { Post } from "@/lib/types";

export const metadata = { title: "Favoritos", robots: { index: false } };

export default async function Favoritos({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const s = await requireUser("/favoritos");
  const page = Math.max(0, Number((await searchParams).page) || 0);
  const supabase = await createClient();
  const { data: favs } = await supabase.from("favorites").select("post_id").eq("user_id", s.user.id).order("created_at", { ascending: false }).range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const ids = (favs ?? []).map((f) => f.post_id as string);
  const pageIds = ids.slice(0, PAGE_SIZE);
  const { data } = pageIds.length ? await supabase.from("posts").select(POST_SELECT).in("id", pageIds) : { data: [] };
  const byId = new Map(((data ?? []) as unknown as Post[]).map((p) => [p.id, p]));
  const posts = await withViewer(pageIds.map((id) => byId.get(id)).filter((p): p is Post => !!p), s.user.id);
  return (
    <>
      <PageTitle eyebrow="Só você vê" title="Favoritos" />
      <div className="container-wide mt-10">
        {posts.length ? <PostGrid posts={posts} signedIn /> : <EmptyState title="Nenhum favorito ainda." hint="Toque no marcador de uma publicação para guardá-la aqui." />}
        <Pager basePath="/favoritos" page={page} hasMore={ids.length > PAGE_SIZE} />
      </div>
    </>
  );
}
