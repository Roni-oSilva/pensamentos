import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getThread, listReplies } from "@/lib/forum";
import { idSchema } from "@/lib/validation";
import { removeThread } from "@/actions/forum";
import { Avatar } from "@/components/ui/Avatar";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { ThreadVotes } from "@/components/forum/ThreadVotes";
import { ReplyList } from "@/components/forum/ReplyList";
import { timeAgo } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const t = idSchema.safeParse(id).success ? await getThread(id) : null;
  return t ? { title: t.thread.title, description: t.thread.body.slice(0, 150) } : { title: "Discussão" };
}

export default async function ThreadPage({ params }: Props) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  const [session, found, replies] = await Promise.all([getSession(), getThread(id), listReplies(id)]);
  if (!found) notFound();
  const { thread: t, mine } = found;
  const own = session?.user.id === t.author_id;
  const staff = !!session && session.profile.role !== "USER";

  return (
    <article className="container-narrow space-y-10 py-10">
      <div className="space-y-4">
        <Link href="/forum" className="link-muted text-sm">← Fórum</Link>
        <h1 className="font-display text-4xl leading-tight text-white sm:text-5xl">{t.title}</h1>
        <div className="flex items-center gap-3 text-sm text-ash-300">
          <Avatar src={t.author?.avatar_url} name={t.author?.username ?? "?"} size={32} />
          {t.author ? <Link href={`/perfil/${t.author.username}`} className="font-medium text-white hover:underline">@{t.author.username}</Link> : "anônimo"}
          <span className="text-ash-400">{timeAgo(t.created_at)}{t.edited_at ? " · editado" : ""}</span>
        </div>
        <p className="preline text-lg leading-relaxed text-ash-200">{t.body}</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-2">
          <ThreadVotes threadId={t.id} up={t.up_count} down={t.down_count} mine={mine} signedIn={!!session} />
          <span className="text-sm text-ash-400">{t.reply_count} {t.reply_count === 1 ? "resposta" : "respostas"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-ash-400">
          {own && <Link href={`/forum/${t.id}/editar`} className="hover:text-white">Editar</Link>}
          {(own || staff) && (
            <form action={removeThread}>
              <input type="hidden" name="id" value={t.id} />
              <ConfirmButton message="Excluir esta discussão e todas as respostas?" className="hover:text-red-300">Excluir</ConfirmButton>
            </form>
          )}
        </div>
      </div>
      <ReplyList threadId={t.id} replies={replies} viewerId={session?.user.id ?? null} canModerate={staff} />
    </article>
  );
}
