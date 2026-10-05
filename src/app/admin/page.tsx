import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminTitle, StatCard } from "@/components/admin/ui";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  await requireStaff("/admin");
  const { data } = await (await createClient()).rpc("admin_stats");
  const s = (data ?? {}) as Record<string, number>;
  return (
    <>
      <AdminTitle title="Dashboard" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Usuários" value={s.users ?? 0} href="/admin/users" />
        <StatCard label="Publicações" value={s.posts ?? 0} href="/admin/posts" />
        <StatCard label="Pendentes" value={s.posts_pending ?? 0} href="/admin/moderation" alert={(s.posts_pending ?? 0) > 0} />
        <StatCard label="Curtidas" value={s.likes ?? 0} />
        <StatCard label="Comentários" value={s.comments ?? 0} href="/admin/comments" />
        <StatCard label="Visualizações" value={s.views ?? 0} />
        <StatCard label="Denúncias pendentes" value={s.reports_pending ?? 0} href="/admin/reports" alert={(s.reports_pending ?? 0) > 0} />
      </div>
    </>
  );
}
