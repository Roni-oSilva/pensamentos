import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { moderateComment } from "@/actions/admin";
import { AdminTitle, FilterTabs, Table } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Pager } from "@/components/ui/Pager";
import { excerpt, timeAgo } from "@/lib/utils";

export const metadata = { title: "Comentários" };
const SIZE = 25;

interface Row { id: string; body: string; status: "VISIBLE" | "HIDDEN"; created_at: string; post_id: string; author: { username: string } | null; post: { origin: string } | null }

export default async function AdminComments({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  await requireStaff("/admin/comments");
  const sp = await searchParams;
  const status = sp.status === "HIDDEN" || sp.status === "VISIBLE" ? sp.status : undefined;
  const page = Math.max(0, Number(sp.page) || 0);
  let q = (await createClient()).from("comments")
    .select("id, body, status, created_at, post_id, author:profiles!comments_author_id_fkey(username), post:posts(origin)")
    .order("created_at", { ascending: false }).range(page * SIZE, page * SIZE + SIZE);
  if (status) q = q.eq("status", status);
  const rows = ((await q).data ?? []) as unknown as Row[];
  return (
    <>
      <AdminTitle title="Comentários" />
      <FilterTabs base="/admin/comments" current={status} items={[{ value: "", label: "Todos" }, { value: "VISIBLE", label: "Visíveis" }, { value: "HIDDEN", label: "Ocultos" }]} />
      <Table head={["Comentário", "Autor", "Quando", "Ações"]}>
        {rows.slice(0, SIZE).map((c) => (
          <tr key={c.id} className="align-top">
            <td className="max-w-md px-4 py-3"><p className="preline text-ash-100">{excerpt(c.body, 160)}</p>
              <Link className="link-muted text-xs" href={c.post?.origin === "OFFICIAL" ? `/frases/${c.post_id}` : `/comunidade/${c.post_id}`}>ver publicação</Link></td>
            <td className="px-4 py-3">@{c.author?.username ?? "?"}</td>
            <td className="px-4 py-3 text-xs text-ash-400">{timeAgo(c.created_at)}</td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <form action={moderateComment}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="op" value={c.status === "VISIBLE" ? "hide" : "show"} />
                  <button className="btn-ghost px-3 py-1.5 text-xs">{c.status === "VISIBLE" ? "Ocultar" : "Reexibir"}</button></form>
                <form action={moderateComment}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="op" value="delete" />
                  <ConfirmButton className="btn-danger px-3 py-1.5 text-xs" message="O comentário será apagado definitivamente.">Excluir</ConfirmButton></form>
              </div>
            </td>
          </tr>
        ))}
        {rows.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-ash-400">Nenhum comentário.</td></tr>}
      </Table>
      <Pager basePath="/admin/comments" params={{ status }} page={page} hasMore={rows.length > SIZE} />
    </>
  );
}
