import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getProfileByUsername, getProfileStats, listPosts } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { FeedList } from "@/components/posts/FeedList";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { FollowButton } from "@/components/profile/FollowButton";
import { ReportButton } from "@/components/moderation/ReportButton";
import { ROLE_LABEL, STATUS_LABEL, type PostStatus } from "@/lib/constants";
import { compact, excerpt, formatDate } from "@/lib/utils";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props) {
  const p = await getProfileByUsername((await params).username);
  return p ? { title: `@${p.username}`, description: p.bio ?? `Perfil de @${p.username}` } : { title: "Perfil" };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) notFound();
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const session = await getSession();
  const isMe = session?.user.id === profile.id;
  const supabase = await createClient();
  const [stats, feed, following, mine] = await Promise.all([
    getProfileStats(profile.id),
    listPosts({ authorId: profile.id, sort: "recent" }, session?.user.id ?? null),
    session && !isMe ? supabase.from("follows").select("following_id").eq("follower_id", session.user.id).eq("following_id", profile.id).maybeSingle() : Promise.resolve({ data: null }),
    isMe ? supabase.from("posts").select("id, title, content, status, origin").eq("author_id", profile.id).neq("status", "PUBLISHED").order("created_at", { ascending: false }).limit(30) : Promise.resolve({ data: [] }),
  ]);

  return (
    <div className="container-wide pt-14">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <Avatar src={profile.avatar_url} name={profile.username} size={96} />
        <div className="flex-1 space-y-3">
          <div>
            <h1 className="font-poster uppercase tracking-wide text-5xl text-white">{profile.display_name ?? profile.username}</h1>
            <p className="text-ash-400">@{profile.username}{profile.role !== "USER" && <span className="badge ml-3">{ROLE_LABEL[profile.role]}</span>}</p>
          </div>
          {profile.bio && <p className="preline max-w-xl text-ash-300">{profile.bio}</p>}
          <p className="text-sm text-ash-400">Na comunidade desde {formatDate(profile.created_at)}</p>
          <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            {[["Publicações", stats.posts], ["Curtidas recebidas", stats.likesReceived], ["Seguidores", stats.followers], ["Seguindo", stats.following]].map(([k, v]) => (
              <div key={k as string}><dt className="eyebrow">{k}</dt><dd className="font-display text-3xl text-white">{compact(v as number)}</dd></div>
            ))}
          </dl>
        </div>
        <div className="flex items-center gap-3">
          {isMe ? <Link href="/configuracoes" className="btn-ghost">Editar perfil</Link> : (
            <>
              <FollowButton targetId={profile.id} initial={!!following.data} signedIn={!!session} />
              <ReportButton targetType="PROFILE" targetId={profile.id} signedIn={!!session} label="Denunciar perfil" />
            </>
          )}
        </div>
      </header>

      {isMe && (mine.data?.length ?? 0) > 0 && (
        <section className="mt-12" aria-labelledby="pend-h">
          <h2 id="pend-h" className="eyebrow mb-4">Suas publicações em andamento (só você vê)</h2>
          <ul className="divide-y divide-ink-700 rounded-lg border border-ink-700">
            {(mine.data as { id: string; title: string | null; content: string; status: PostStatus; origin: string }[]).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 p-4">
                <Link href={p.origin === "OFFICIAL" ? `/admin/posts/${p.id}/edit` : `/comunidade/${p.id}`} className="min-w-0 truncate text-ash-200 hover:text-white">{p.title ?? excerpt(p.content, 90)}</Link>
                <span className="badge shrink-0">{STATUS_LABEL[p.status]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12" aria-labelledby="pubs-h">
        <h2 id="pubs-h" className="mb-6 font-poster uppercase tracking-wide text-4xl text-white">Publicações</h2>
        {feed.posts.length ? <FeedList initial={feed.posts} hasMore={feed.hasMore} signedIn={!!session} params={{ sort: "recent", authorId: profile.id }} />
          : <EmptyState title="Nada publicado ainda." />}
      </section>
    </div>
  );
}
