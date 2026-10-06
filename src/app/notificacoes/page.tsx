import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { markNotificationsRead } from "@/actions/profile";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageTitle } from "@/components/ui/Section";
import { SubmitButton } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { NotifIcon } from "@/components/ui/NotifIcon";
import { NOTIF_TEXT, isSystemNotif, notifHref, type NotifItem } from "@/lib/notifications";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Notificações", robots: { index: false } };
export const dynamic = "force-dynamic";

type Row = Omit<NotifItem, "read"> & { read_at: string | null };

function List({ rows }: { rows: NotifItem[] }) {
  return (
    <ul className="divide-y divide-ink-700 overflow-hidden rounded-xl border border-ink-700">
      {rows.map((n) => {
        const system = isSystemNotif(n.type);
        return (
          <li key={n.id}>
            <Link href={notifHref(n)} className={`flex min-h-[64px] items-center gap-3 p-4 transition hover:bg-ink-800 active:bg-ink-800 ${n.read ? "" : "bg-ink-800/60"}`}>
              <span className="relative shrink-0">
                {n.actor && !system ? <Avatar src={n.actor.avatar_url} name={n.actor.username} size={44} /> : <NotifIcon type={n.type} size={44} />}
                {n.actor && !system && <span className="absolute -bottom-1 -right-1 rounded-full ring-2 ring-ink-950"><NotifIcon type={n.type} size={20} /></span>}
              </span>
              <span className="min-w-0 flex-1 text-sm leading-snug text-ash-200">
                {n.actor && !system && <strong className="text-white">@{n.actor.username} </strong>}{NOTIF_TEXT[n.type]}
                <span className="mt-0.5 block text-xs text-ash-400">{timeAgo(n.created_at)}</span>
              </span>
              {!n.read && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blood-soft" aria-label="Não lida" />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default async function Notificacoes() {
  const s = await requireUser("/notificacoes");
  const supabase = await createClient();
  const { data } = await supabase.from("notifications")
    .select("id, type, post_id, read_at, created_at, actor:profiles!notifications_actor_id_fkey(username, avatar_url)")
    .eq("user_id", s.user.id).order("created_at", { ascending: false }).limit(60);
  const rows = ((data ?? []) as unknown as Row[]).map(({ read_at, ...n }) => ({ ...n, read: !!read_at }));
  const fresh = rows.filter((r) => !r.read);
  const old = rows.filter((r) => r.read);
  return (
    <>
      <PageTitle eyebrow="Atividade" title="Notificações" />
      <div className="container-narrow mt-10 space-y-8">
        {rows.length === 0 ? <EmptyState title="Tudo calmo." hint="Curtidas, comentários e novos seguidores aparecem aqui." /> : (
          <>
            {fresh.length > 0 && (
              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="eyebrow">Novas · {fresh.length}</h2>
                  <form action={markNotificationsRead}><SubmitButton className="btn-ghost">Marcar todas como lidas</SubmitButton></form>
                </div>
                <List rows={fresh} />
              </section>
            )}
            {old.length > 0 && (
              <section>
                <h2 className="eyebrow mb-3">{fresh.length > 0 ? "Anteriores" : "Todas"}</h2>
                <List rows={old} />
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
