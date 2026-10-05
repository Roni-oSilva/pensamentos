import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminTitle, StatCard, Table } from "@/components/admin/ui";

export const metadata = { title: "Estatísticas" };

interface Stats {
  users: number; active_users_30d: number; posts: number; posts_published: number; posts_pending: number; likes: number; comments: number; views: number; reports_pending: number;
  top_posts: { id: string; title: string; like_count: number; comment_count: number; view_count: number }[]; top_users: { username: string; posts: number }[];
}

export default async function Analytics() {
  await requireStaff("/admin/analytics");
  const { data } = await (await createClient()).rpc("admin_stats");
  const s = (data ?? {}) as Stats;
  return (
    <>
      <AdminTitle title="Estatísticas" />
      <div className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Usuários registrados" value={s.users ?? 0} /><StatCard label="Ativos (30 dias)" value={s.active_users_30d ?? 0} />
        <StatCard label="Publicações" value={s.posts ?? 0} /><StatCard label="Publicadas" value={s.posts_published ?? 0} />
        <StatCard label="Pendentes" value={s.posts_pending ?? 0} /><StatCard label="Curtidas" value={s.likes ?? 0} />
        <StatCard label="Comentários" value={s.comments ?? 0} /><StatCard label="Visualizações" value={s.views ?? 0} />
      </div>
      <div className="grid gap-8 xl:grid-cols-2">
        <section><h2 className="eyebrow mb-3">Conteúdos mais populares</h2>
          <Table head={["Conteúdo", "♥", "💬", "👁"]}>
            {(s.top_posts ?? []).map((p) => <tr key={p.id}><td className="px-4 py-3"><Link className="link-muted" href={`/frases/${p.id}`}>{p.title}</Link></td><td className="px-4 py-3">{p.like_count}</td><td className="px-4 py-3">{p.comment_count}</td><td className="px-4 py-3">{p.view_count}</td></tr>)}
          </Table></section>
        <section><h2 className="eyebrow mb-3">Usuários mais ativos (publicações aprovadas)</h2>
          <Table head={["Usuário", "Publicações"]}>
            {(s.top_users ?? []).map((u) => <tr key={u.username}><td className="px-4 py-3"><Link className="link-muted" href={`/perfil/${u.username}`}>@{u.username}</Link></td><td className="px-4 py-3">{u.posts}</td></tr>)}
          </Table></section>
      </div>
    </>
  );
}
