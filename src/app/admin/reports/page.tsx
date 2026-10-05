import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolveReport } from "@/actions/admin";
import { AdminTitle, FilterTabs, Table } from "@/components/admin/ui";
import { Pager } from "@/components/ui/Pager";
import { REASON_LABEL, type ReportReason } from "@/lib/constants";
import { excerpt, timeAgo } from "@/lib/utils";

export const metadata = { title: "Denúncias" };
const SIZE = 25;

interface Row {
  id: string; target_type: "POST" | "COMMENT" | "PROFILE"; reason: ReportReason; details: string | null; status: string; created_at: string;
  reporter: { username: string } | null; post: { id: string; origin: string; title: string | null; content: string } | null;
  comment: { body: string; post_id: string } | null; profile: { username: string } | null;
}

export default async function AdminReports({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  await requireStaff("/admin/reports");
  const sp = await searchParams;
  const status = ["PENDING", "RESOLVED", "DISMISSED"].includes(sp.status ?? "") ? sp.status! : "PENDING";
  const page = Math.max(0, Number(sp.page) || 0);
  const { data } = await (await createClient()).from("reports")
    .select(`id, target_type, reason, details, status, created_at,
      reporter:profiles!reports_reporter_id_fkey(username), post:posts(id, origin, title, content),
      comment:comments(body, post_id), profile:profiles!reports_profile_id_fkey(username)`)
    .eq("status", status).order("created_at", { ascending: false }).range(page * SIZE, page * SIZE + SIZE);
  const rows = (data ?? []) as unknown as Row[];
  return (
    <>
      <AdminTitle title="Denúncias" />
      <FilterTabs base="/admin/reports" current={status} items={[{ value: "PENDING", label: "Pendentes" }, { value: "RESOLVED", label: "Resolvidas" }, { value: "DISMISSED", label: "Descartadas" }]} />
      <Table head={["Alvo", "Motivo", "Denunciante", "Quando", "Ações"]}>
        {rows.slice(0, SIZE).map((r) => (
          <tr key={r.id} className="align-top">
            <td className="max-w-sm px-4 py-3">
              <span className="badge mb-1">{r.target_type === "POST" ? "Publicação" : r.target_type === "COMMENT" ? "Comentário" : "Perfil"}</span>
              {r.post && <p><Link className="link-muted" href={r.post.origin === "OFFICIAL" ? `/frases/${r.post.id}` : `/comunidade/${r.post.id}`}>{r.post.title ?? excerpt(r.post.content, 80)}</Link></p>}
              {r.comment && <p><Link className="link-muted" href={`/comunidade/${r.comment.post_id}`}>{excerpt(r.comment.body, 100)}</Link></p>}
              {r.profile && <p><Link className="link-muted" href={`/perfil/${r.profile.username}`}>@{r.profile.username}</Link></p>}
            </td>
            <td className="px-4 py-3">{REASON_LABEL[r.reason]}{r.details && <p className="preline mt-1 text-xs text-ash-400">{r.details}</p>}</td>
            <td className="px-4 py-3">@{r.reporter?.username ?? "?"}</td>
            <td className="px-4 py-3 text-xs text-ash-400">{timeAgo(r.created_at)}</td>
            <td className="px-4 py-3">
              {r.status === "PENDING" ? (
                <div className="flex gap-2">
                  <form action={resolveReport}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="RESOLVED" /><button className="btn-primary px-3 py-1.5 text-xs">Resolver</button></form>
                  <form action={resolveReport}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="DISMISSED" /><button className="btn-ghost px-3 py-1.5 text-xs">Descartar</button></form>
                </div>
              ) : <span className="text-xs text-ash-400">—</span>}
            </td>
          </tr>
        ))}
        {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-ash-400">Nenhuma denúncia.</td></tr>}
      </Table>
      <Pager basePath="/admin/reports" params={{ status }} page={page} hasMore={rows.length > SIZE} />
    </>
  );
}
