import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { markNotificationsRead } from "@/actions/profile";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageTitle } from "@/components/ui/Section";
import { SubmitButton } from "@/components/ui/Button";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Notificações", robots: { index: false } };

const TEXT: Record<string, string> = {
  LIKE: "curtiu sua publicação", COMMENT: "comentou na sua publicação", REPLY: "respondeu ao seu comentário", FOLLOW: "começou a seguir você",
  POST_APPROVED: "Sua publicação foi aprovada", POST_REJECTED: "Sua publicação foi rejeitada", REPORT_RESOLVED: "Uma denúncia sua foi analisada",
};

interface Row { id: string; type: string; post_id: string | null; read_at: string | null; created_at: string; actor: { username: string } | null }

export default async function Notificacoes() {
  const s = await requireUser("/notificacoes");
  const supabase = await createClient();
  const { data } = await supabase.from("notifications")
    .select("id, type, post_id, read_at, created_at, actor:profiles!notifications_actor_id_fkey(username)")
    .eq("user_id", s.user.id).order("created_at", { ascending: false }).limit(50);
  const rows = (data ?? []) as unknown as Row[];
  const hasUnread = rows.some((r) => !r.read_at);
  return (
    <>
      <PageTitle eyebrow="Atividade" title="Notificações" />
      <div className="container-narrow mt-10">
        {hasUnread && <form action={markNotificationsRead} className="mb-4 flex justify-end"><SubmitButton className="btn-ghost">Marcar todas como lidas</SubmitButton></form>}
        {rows.length === 0 ? <EmptyState title="Tudo calmo." hint="Curtidas, comentários e novos seguidores aparecem aqui." /> : (
          <ul className="divide-y divide-ink-700 rounded-lg border border-ink-700">
            {rows.map((n) => {
              const system = n.type.startsWith("POST_") || n.type === "REPORT_RESOLVED";
              const href = n.post_id ? `/comunidade/${n.post_id}` : n.actor ? `/perfil/${n.actor.username}` : "#";
              return (
                <li key={n.id} className={`flex items-center justify-between gap-4 p-4 ${n.read_at ? "" : "bg-ink-800/60"}`}>
                  <Link href={href} className="text-sm text-ash-200 hover:text-white">
                    {!system && n.actor && <strong className="text-white">@{n.actor.username} </strong>}{TEXT[n.type]}
                  </Link>
                  <span className="shrink-0 text-xs text-ash-400">{timeAgo(n.created_at)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
