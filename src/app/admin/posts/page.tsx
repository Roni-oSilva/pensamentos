import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminTitle, FilterTabs, StatusBadge, Table } from "@/components/admin/ui";
import { PostModerationActions } from "@/components/moderation/PostModerationActions";
import { Pager } from "@/components/ui/Pager";
import { KIND_LABEL, POST_STATUSES, STATUS_LABEL, type PostKind, type PostStatus } from "@/lib/constants";
import { excerpt, formatDate } from "@/lib/utils";

export const metadata = { title: "Publicações" };
const SIZE = 20;

export default async function AdminPosts({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const s = await requireAdmin("/admin/posts");
  const sp = await searchParams;
  const status = POST_STATUSES.find((x) => x === sp.status);
  const page = Math.max(0, Number(sp.page) || 0);
  let q = (await createClient()).from("posts").select("id, title, content, kind, status, created_at, like_count, comment_count, view_count").eq("origin", "OFFICIAL")
    .order("created_at", { ascending: false }).range(page * SIZE, page * SIZE + SIZE);
  if (status) q = q.eq("status", status);
  const { data } = await q;
  const rows = (data ?? []) as { id: string; title: string | null; content: string; kind: PostKind; status: PostStatus; created_at: string; like_count: number; comment_count: number; view_count: number }[];
  return (
    <>
      <AdminTitle title="Publicações oficiais"><Link href="/admin/posts/new" className="btn-primary">Nova publicação</Link></AdminTitle>
      <FilterTabs base="/admin/posts" current={status} items={[{ value: "", label: "Todas" }, ...POST_STATUSES.map((x) => ({ value: x, label: STATUS_LABEL[x] }))]} />
      <Table head={["Conteúdo", "Tipo", "Status", "Métricas", "Ações"]}>
        {rows.slice(0, SIZE).map((p) => (
          <tr key={p.id} className="align-top">
            <td className="max-w-xs px-4 py-3"><p className="truncate text-white">{p.title ?? excerpt(p.content, 70)}</p><p className="text-xs text-ash-400">{formatDate(p.created_at)}</p></td>
            <td className="px-4 py-3">{KIND_LABEL[p.kind]}</td>
            <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
            <td className="px-4 py-3 text-xs text-ash-400">♥ {p.like_count} · 💬 {p.comment_count} · 👁 {p.view_count}</td>
            <td className="px-4 py-3"><PostModerationActions id={p.id} status={p.status} origin="OFFICIAL" viewerRole={s.profile.role} /></td>
          </tr>
        ))}
        {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-ash-400">Nenhuma publicação.</td></tr>}
      </Table>
      <Pager basePath="/admin/posts" params={{ status }} page={page} hasMore={rows.length > SIZE} />
    </>
  );
}
