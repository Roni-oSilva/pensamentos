import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPost } from "@/lib/data";
import { idSchema } from "@/lib/validation";
import { deleteOwnPost } from "@/actions/posts";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { PostDetail, postMetadata } from "@/components/posts/PostDetail";

type Props = { params: Promise<{ id: string }> };

async function load(id: string) {
  if (!idSchema.safeParse(id).success) return null;
  const s = await getSession();
  const post = await getPost(id, s?.user.id ?? null);
  if (post?.origin === "OFFICIAL") redirect(`/frases/${post.id}`); // links de notificação
  return post ? { post, session: s } : null;
}

export async function generateMetadata({ params }: Props) {
  return postMetadata((await load((await params).id))?.post ?? null);
}

export default async function CommunityPostPage({ params }: Props) {
  const data = await load((await params).id);
  if (!data) notFound();
  const { post, session } = data;
  const mine = session?.user.id === post.author_id;
  return (
    <>
      <PostDetail post={post} signedIn={!!session} />
      {mine && (
        <div className="container-narrow mt-10 flex gap-3 border-t border-ink-700 pt-6">
          <Link href={`/comunidade/${post.id}/editar`} className="btn-ghost">Editar</Link>
          <form action={deleteOwnPost}>
            <input type="hidden" name="id" value={post.id} />
            <ConfirmButton title="Excluir publicação?" message="A publicação, seus comentários e curtidas serão apagados definitivamente." confirmLabel="Excluir">Excluir</ConfirmButton>
          </form>
        </div>
      )}
    </>
  );
}
