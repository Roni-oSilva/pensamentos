import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { removeUser, setUserBlocked, setUserRole } from "@/actions/admin";
import { AdminTitle, Table } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Pager } from "@/components/ui/Pager";
import { ASSIGNABLE_ROLES, ROLE_LABEL, type Role } from "@/lib/constants";
import { escapeLike, formatDate } from "@/lib/utils";

export const metadata = { title: "Usuários" };
const SIZE = 20;

interface Row { id: string; username: string; display_name: string | null; role: Role; is_blocked: boolean; created_at: string }

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const me = await requireAdmin("/admin/users");
  const sp = await searchParams;
  const term = escapeLike(sp.q ?? "");
  const page = Math.max(0, Number(sp.page) || 0);
  const supabase = await createClient();
  let q = supabase.from("profiles").select("id, username, display_name, role, is_blocked, created_at").order("created_at", { ascending: false }).range(page * SIZE, page * SIZE + SIZE);
  if (term) q = q.or(`username.ilike.%${term}%,display_name.ilike.%${term}%`);
  const rows = (((await q).data ?? []) as Row[]);
  const view = rows.slice(0, SIZE);
  const ids = view.map((r) => r.id);

  // contagens em lote + e-mail (somente aqui, só para ADMIN, via service role)
  const admin = createAdminClient();
  const [posts, reports, emails] = await Promise.all([
    ids.length ? supabase.from("posts").select("author_id").in("author_id", ids).neq("status", "DELETED") : { data: [] },
    ids.length ? supabase.from("reports").select("profile_id").in("profile_id", ids).eq("status", "PENDING") : { data: [] },
    Promise.all(ids.map(async (id) => [id, (await admin.auth.admin.getUserById(id)).data.user?.email ?? "—"] as const)),
  ]);
  const count = (list: { [k: string]: unknown }[] | null, key: string) => {
    const m = new Map<string, number>();
    (list ?? []).forEach((r) => m.set(r[key] as string, (m.get(r[key] as string) ?? 0) + 1));
    return m;
  };
  const postCount = count(posts.data as never, "author_id");
  const reportCount = count(reports.data as never, "profile_id");
  const emailOf = new Map(emails);

  return (
    <>
      <AdminTitle title="Usuários">
        <form role="search" className="flex gap-2"><input name="q" defaultValue={sp.q ?? ""} placeholder="Buscar usuário…" aria-label="Buscar usuário" className="field w-56" maxLength={80} /><button className="btn-ghost">Buscar</button></form>
      </AdminTitle>
      <Table head={["Usuário", "E-mail (privado)", "Função", "Posts", "Denúncias", "Ações"]}>
        {view.map((u) => {
          const self = u.id === me.user.id;
          return (
            <tr key={u.id} className="align-top">
              <td className="px-4 py-3"><Link href={`/perfil/${u.username}`} className="text-white hover:underline">@{u.username}</Link><p className="text-xs text-ash-400">{formatDate(u.created_at)}{u.is_blocked && " · bloqueado"}</p></td>
              <td className="px-4 py-3 text-xs text-ash-300">{emailOf.get(u.id)}</td>
              <td className="px-4 py-3">
                {self || u.role === "CREATOR" ? ROLE_LABEL[u.role] : (
                  <form action={setUserRole} className="flex gap-1">
                    <input type="hidden" name="id" value={u.id} />
                    <select name="role" defaultValue={u.role} aria-label="Função" className="field w-32 px-2 py-1 text-xs">{ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select>
                    <ConfirmButton className="btn-ghost px-2 py-1 text-xs" title="Alterar função?" message={`Alterar a função de @${u.username}. Isso muda os privilégios dessa conta.`} confirmLabel="Alterar">OK</ConfirmButton>
                  </form>
                )}
              </td>
              <td className="px-4 py-3">{postCount.get(u.id) ?? 0}</td>
              <td className="px-4 py-3">{reportCount.get(u.id) ? <span className="badge border-blood text-red-300">{reportCount.get(u.id)}</span> : "—"}</td>
              <td className="px-4 py-3">
                {self || u.role === "CREATOR" || (u.role === "ADMIN" && me.profile.role !== "CREATOR") ? <span className="text-xs text-ash-400">protegido</span> : (
                  <div className="flex flex-wrap gap-2">
                    <form action={setUserBlocked}>
                      <input type="hidden" name="id" value={u.id} /><input type="hidden" name="block" value={u.is_blocked ? "0" : "1"} />
                      {u.is_blocked ? <button className="btn-ghost px-3 py-1.5 text-xs">Desbloquear</button>
                        : <ConfirmButton className="btn-ghost px-3 py-1.5 text-xs" title="Bloquear usuário?" message={`@${u.username} não conseguirá entrar nem publicar.`} confirmLabel="Bloquear">Bloquear</ConfirmButton>}
                    </form>
                    <form action={removeUser}>
                      <input type="hidden" name="id" value={u.id} />
                      <ConfirmButton className="btn-danger px-3 py-1.5 text-xs" title="Remover usuário?" message={`A conta @${u.username} e todo o conteúdo dela serão apagados definitivamente.`} confirmLabel="Remover">Remover</ConfirmButton>
                    </form>
                  </div>
                )}
              </td>
            </tr>
          );
        })}
        {view.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-ash-400">Nenhum usuário.</td></tr>}
      </Table>
      <Pager basePath="/admin/users" params={{ q: sp.q }} page={page} hasMore={rows.length > SIZE} />
    </>
  );
}
