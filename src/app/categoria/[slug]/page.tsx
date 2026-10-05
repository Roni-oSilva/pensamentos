import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listPosts } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { FeedList } from "@/components/posts/FeedList";
import { PageTitle } from "@/components/ui/Section";
import { EmptyState } from "@/components/ui/EmptyState";

type Props = { params: Promise<{ slug: string }> };

async function category(slug: string) {
  if (!/^[a-z0-9-]{2,48}$/.test(slug)) return null;
  const { data } = await (await createClient()).from("categories").select("name, slug, description").eq("slug", slug).maybeSingle();
  return data as { name: string; slug: string; description: string | null } | null;
}

export async function generateMetadata({ params }: Props) {
  const c = await category((await params).slug);
  return { title: c?.name ?? "Categoria", description: c?.description ?? undefined };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const c = await category(slug);
  if (!c) notFound();
  const session = await getSession();
  const { posts, hasMore } = await listPosts({ categorySlug: slug, sort: "recent" }, session?.user.id ?? null);
  return (
    <>
      <PageTitle eyebrow="Categoria" title={c.name}>{c.description}</PageTitle>
      <div className="container-wide mt-10">
        {posts.length ? <FeedList initial={posts} hasMore={hasMore} signedIn={!!session} params={{ sort: "recent", categorySlug: slug }} />
          : <EmptyState title="Nada nesta categoria ainda." />}
      </div>
    </>
  );
}
