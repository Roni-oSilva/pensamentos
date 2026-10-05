import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminTitle, FilterTabs, StatusBadge, Table } from "@/components/admin/ui";
import { PostModerationActions } from "@/components/moderation/PostModerationActions";
import { Pager } from "@/components/ui/Pager";
import { POST_STATUSES, STATUS_LABEL, type PostStatus } from "@/lib/constants";
import { excerpt, formatDate } from "@/lib/utils";

export const metadata = { title: "Comunidade" };
const SIZE = 20;

interface Row { id: string; title: string | null; content: string; status: PostStatus; created_at: string; author: { username: string; is_blocked: boolean } | null }

export default async function AdminCommunity({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const s = await requireStaff("/admin/community");
  const sp = await searchParams;
  const status = POST_STATUSES.find((x) => x === sp.status);
  const page = Math.max(0, Number(sp.page) || 0);
  const supabase = await createClient();
  let q = supabase.from("posts").select("id, title, content, status, created_at, author:profiles!posts_author_id_fkey(username, is_blocked)").eq("origin", "COMMUNITY")
    .order("created_at", { ascending: false }).range(page * SIZE, page * SIZE + SIZE);
  if (status) q = q.eq("status", status);
  const rows = ((await q).data ?? []) as unknown as Row[];
  const ids = rows.slice(0, SIZE).map((r) => r.id);
  // denúncias pendentes por post (1 query em lote)
  const { data: reps } = ids.length ? await supabase.from("reports").select("post_id").eq("status", "PENDING").in("post_id", ids) : { data: [] };
  const reportCount = new Map<string, number>();
  (reps ?? []).forEach((r) => reportCount.set(r.post_id as string, (reportCount.get(r.post_id as string) ?? 0) + 1));

  return (
    <>
      <AdminTitle title="Comunidade" />
      <FilterTabs base="/admin/community" current={status} items={[{ value: "", label: "Todas" }, ...POST_STATUSES.map((x) => ({ value: x, label: STATUS_LABEL[x] }))]} />
      <Table head={["Publicação", "Autor", "Status", "Denúncias", "Ações"]}>
        {rows.slice(0, SIZE).map((p) => (
          <tr key={p.id} className="align-top">
            <td className="max-w-xs px-4 py-3"><p className="truncate text-white">{p.title ?? excerpt(p.content, 70)}</p><p className="text-xs text-ash-400">{formatDate(p.created_at)}</p></td>
            <td className="px-4 py-3">{p.author ? <Link className="link-muted" href={`/perfil/${p.author.username}`}>@{p.author.username}</Link> : "—"}{p.author?.is_blocked && <span className="badge ml-2">bloqueado</span>}</td>
            <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
            <td className="px-4 py-3">{reportCount.get(p.id) ? <Link href="/admin/reports" className="badge border-blood text-red-300">{reportCount.get(p.id)}</Link> : "—"}</td>
            <td className="px-4 py-3"><PostModerationActions id={p.id} status={p.status} origin="COMMUNITY" viewerRole={s.profile.role} /></td>
          </tr>
        ))}
        {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-ash-400">Nada por aqui.</td></tr>}
      </Table>
      <Pager basePath="/admin/community" params={{ status }} page={page} hasMore={rows.length > SIZE} />
    </>
  );
}
