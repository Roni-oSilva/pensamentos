import { getSession } from "@/lib/auth";
import { listComments } from "@/lib/data";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";

export async function CommentSection({ postId }: { postId: string }) {
  const [session, comments] = await Promise.all([getSession(), listComments(postId)]);
  const roots = comments.filter((c) => !c.parent_id);
  const byParent = new Map<string, typeof comments>();
  comments.filter((c) => c.parent_id).forEach((c) => byParent.set(c.parent_id!, [...(byParent.get(c.parent_id!) ?? []), c]));
  const canModerate = !!session && session.profile.role !== "USER";

  return (
    <section id="comentarios" aria-labelledby="comentarios-h" className="space-y-6">
      <h2 id="comentarios-h" className="font-poster uppercase tracking-wide text-3xl text-white">Comentários <span className="text-ash-400">({comments.length})</span></h2>
      <CommentForm postId={postId} signedIn={!!session} />
      {roots.length === 0 ? <p className="text-sm text-ash-400">Ainda não há comentários. Deixe uma palavra de ânimo ou de gratidão.</p> : (
        <ul className="space-y-8">
          {roots.map((c) => (
            <CommentItem key={c.id} comment={c} replies={byParent.get(c.id) ?? []} viewerId={session?.user.id ?? null} canModerate={canModerate} signedIn={!!session} />
          ))}
        </ul>
      )}
    </section>
  );
}
