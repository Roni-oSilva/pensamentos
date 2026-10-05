import Image from "next/image";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminTitle } from "@/components/admin/ui";
import { PostModerationActions } from "@/components/moderation/PostModerationActions";
import { EmptyState } from "@/components/ui/EmptyState";
import { PostBody } from "@/components/posts/PostBody";
import { KIND_LABEL, type PostKind } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Moderação" };

interface Row { id: string; title: string | null; content: string; kind: PostKind; image_url: string | null; created_at: string; author: { username: string } | null }

export default async function Moderation() {
  const s = await requireStaff("/admin/moderation");
  const { data } = await (await createClient()).from("posts")
    .select("id, title, content, kind, image_url, created_at, author:profiles!posts_author_id_fkey(username)")
    .eq("origin", "COMMUNITY").eq("status", "PENDING").order("created_at").limit(30);
  const rows = (data ?? []) as unknown as Row[];
  return (
    <>
      <AdminTitle title="Fila de moderação" />
      {rows.length === 0 ? <EmptyState title="Fila vazia." hint="Nenhuma publicação aguardando aprovação." /> : (
        <ul className="space-y-5">
          {rows.map((p) => (
            <li key={p.id} className="card space-y-4 p-6">
              <div className="flex flex-wrap items-center gap-3 text-xs text-ash-400">
                <span className="badge">{KIND_LABEL[p.kind]}</span>
                {p.author && <Link className="link-muted" href={`/perfil/${p.author.username}`}>@{p.author.username}</Link>}
                <span>{timeAgo(p.created_at)}</span>
              </div>
              {p.title && <h2 className="font-display text-2xl text-white">{p.title}</h2>}
              {p.image_url && <Image src={p.image_url} alt="Imagem enviada pelo autor" width={640} height={400} className="h-auto max-h-64 w-auto rounded-md border border-ink-700" />}
              <PostBody content={p.content} origin="COMMUNITY" />
              <PostModerationActions id={p.id} status="PENDING" origin="COMMUNITY" viewerRole={s.profile.role} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
