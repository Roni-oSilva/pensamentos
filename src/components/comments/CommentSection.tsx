import "@fontsource/anton/latin-400.css"; // títulos dos comentários (estilo pôster)
import "@fontsource/permanent-marker/latin-400.css"; // pincelada amarela
import { getSession } from "@/lib/auth";
import { listComments } from "@/lib/data";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";
import type { CommentRow } from "@/lib/types";

export async function CommentSection({ postId }: { postId: string }) {
  const [session, comments] = await Promise.all([getSession(), listComments(postId)]);
  return <CommentsView postId={postId} comments={comments} viewerId={session?.user.id ?? null} canModerate={!!session && session.profile.role !== "USER"} />;
}

/** Parte visual dos comentários (separada da busca no banco). */
export function CommentsView({ postId, comments, viewerId, canModerate }: { postId: string; comments: CommentRow[]; viewerId: string | null; canModerate: boolean }) {
  const session = viewerId ? { user: { id: viewerId } } : null;
  const roots = comments.filter((c) => !c.parent_id);
  const byParent = new Map<string, typeof comments>();
  comments.filter((c) => c.parent_id).forEach((c) => byParent.set(c.parent_id!, [...(byParent.get(c.parent_id!) ?? []), c]));

  return (
    <section id="comentarios" aria-labelledby="comentarios-h" className="grace space-y-7">
      {/* cabeçalho no estilo do pôster "Saved by Grace": barras, bloco vermelho e pincelada amarela */}
      <header className="grace-head" aria-hidden>
        <p className="grace-line">Palavras <Bars /> de fé</p>
        <p className="grace-block"><span>Comentários</span></p>
        <p className="grace-line grace-line-b">Unidos <Bars /> em <span className="grace-brush">Cristo</span></p>
      </header>
      <h2 id="comentarios-h" className="sr-only">Comentários ({comments.length})</h2>
      <p className="grace-count"><span>{comments.length}</span> {comments.length === 1 ? "comentário" : "comentários"}</p>
      <CommentForm postId={postId} signedIn={!!session} />
      {roots.length === 0 ? <p className="text-sm text-ash-400">Ainda não há comentários. Deixe uma palavra de ânimo ou de gratidão.</p> : (
        <ul className="space-y-5">
          {roots.map((c) => (
            <CommentItem key={c.id} comment={c} replies={byParent.get(c.id) ?? []} viewerId={session?.user.id ?? null} canModerate={canModerate} signedIn={!!session} />
          ))}
        </ul>
      )}
    </section>
  );
}

/** As barras horizontais que atravessam as palavras no pôster ("SAV═D BY"). */
function Bars() {
  return <span className="grace-bars"><i /><i /><i /></span>;
}
