import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminTitle, Table } from "@/components/admin/ui";
import { Pager } from "@/components/ui/Pager";

export const metadata = { title: "Logs de auditoria" };
const SIZE = 30;

interface Row { id: number; action: string; resource_type: string; resource_id: string | null; metadata: Record<string, unknown>; created_at: string; admin: { username: string } | null }

export default async function AuditLogs({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin("/admin/audit-logs");
  const page = Math.max(0, Number((await searchParams).page) || 0);
  const { data } = await (await createClient()).from("audit_logs")
    .select("id, action, resource_type, resource_id, metadata, created_at, admin:profiles!audit_logs_admin_id_fkey(username)")
    .order("created_at", { ascending: false }).range(page * SIZE, page * SIZE + SIZE);
  const rows = (data ?? []) as unknown as Row[];
  return (
    <>
      <AdminTitle title="Logs de auditoria" />
      <Table head={["Quando", "Quem", "Ação", "Recurso", "Detalhes"]}>
        {rows.slice(0, SIZE).map((r) => (
          <tr key={r.id} className="align-top">
            <td className="whitespace-nowrap px-4 py-3 text-xs text-ash-400">{new Date(r.created_at).toLocaleString("pt-BR")}</td>
            <td className="px-4 py-3">@{r.admin?.username ?? "removido"}</td>
            <td className="px-4 py-3 font-mono text-xs text-white">{r.action}</td>
            <td className="px-4 py-3 text-xs text-ash-300">{r.resource_type}{r.resource_id ? ` · ${r.resource_id.slice(0, 8)}…` : ""}</td>
            <td className="max-w-xs break-words px-4 py-3 font-mono text-[11px] text-ash-400">{Object.keys(r.metadata).length ? JSON.stringify(r.metadata) : "—"}</td>
          </tr>
        ))}
        {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-ash-400">Sem registros.</td></tr>}
      </Table>
      <Pager basePath="/admin/audit-logs" page={page} hasMore={rows.length > SIZE} />
    </>
  );
}
