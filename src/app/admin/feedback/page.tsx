import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteFeedback, setFeedbackStatus } from "@/actions/admin";
import { AdminTitle, FilterTabs, Table } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Pager } from "@/components/ui/Pager";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Mensagens" };
const SIZE = 25;
const KIND: Record<string, string> = { QUESTION: "Dúvida", HELP: "Ajuda", SUGGESTION: "Sugestão" };

interface Row { id: string; kind: string; message: string; contact: string | null; page: string | null; status: string; created_at: string; user: { username: string } | null }

export default async function AdminFeedback({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  await requireAdmin("/admin/feedback");
  const sp = await searchParams;
  const status = ["NEW", "READ", "DONE"].includes(sp.status ?? "") ? sp.status! : "NEW";
  const page = Math.max(0, Number(sp.page) || 0);
  const { data } = await (await createClient()).from("feedback")
    .select("id, kind, message, contact, page, status, created_at, user:profiles(username)")
    .eq("status", status).order("created_at", { ascending: false }).range(page * SIZE, page * SIZE + SIZE);
  const rows = (data ?? []) as unknown as Row[];
  return (
    <>
      <AdminTitle title="Mensagens" />
      <FilterTabs base="/admin/feedback" current={status} param="status" items={[{ value: "NEW", label: "Novas" }, { value: "READ", label: "Lidas" }, { value: "DONE", label: "Resolvidas" }]} />
      <Table head={["Tipo", "Mensagem", "Quem", "Ações"]}>
        {rows.slice(0, SIZE).map((m) => (
          <tr key={m.id} className="align-top">
            <td className="px-4 py-3"><span className="badge">{KIND[m.kind] ?? m.kind}</span><p className="mt-2 text-xs text-ash-400">{timeAgo(m.created_at)}</p></td>
            <td className="max-w-md px-4 py-3"><p className="preline text-sm text-white">{m.message}</p>{m.page && <p className="mt-1 text-xs text-ash-400">Enviado de {m.page}</p>}</td>
            <td className="px-4 py-3 text-xs text-ash-300">{m.user ? `@${m.user.username}` : "Visitante"}{m.contact && <p className="mt-1 break-all text-ash-100">{m.contact}</p>}</td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {m.status !== "READ" && <form action={setFeedbackStatus}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="status" value="READ" /><button className="btn-ghost px-3 py-1.5 text-xs">Marcar lida</button></form>}
                {m.status !== "DONE" && <form action={setFeedbackStatus}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="status" value="DONE" /><button className="btn-primary px-3 py-1.5 text-xs">Resolvida</button></form>}
                <form action={deleteFeedback}><input type="hidden" name="id" value={m.id} /><ConfirmButton className="btn-danger px-3 py-1.5 text-xs" message="A mensagem será apagada definitivamente.">Excluir</ConfirmButton></form>
              </div>
            </td>
          </tr>
        ))}
        {rows.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-ash-400">Nenhuma mensagem nesta aba.</td></tr>}
      </Table>
      <Pager basePath="/admin/feedback" params={{ status }} page={page} hasMore={rows.length > SIZE} />
    </>
  );
}
