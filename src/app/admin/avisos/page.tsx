import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ANNOUNCEMENT_LINKS, getAnnouncement } from "@/lib/announcement";
import { clearAnnouncement } from "@/actions/admin";
import { pushEnabled } from "@/lib/push";
import { AdminTitle } from "@/components/admin/ui";
import { AnnouncementForm } from "@/components/admin/AnnouncementForm";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Enviar aviso" };
export const dynamic = "force-dynamic";

export default async function AdminAvisos() {
  await requireAdmin("/admin/avisos");
  const [current, subs] = await Promise.all([
    getAnnouncement(),
    createAdminClient().from("push_subscriptions").select("endpoint", { count: "exact", head: true }),
  ]);
  const devices = subs.error ? null : subs.count ?? 0;
  return (
    <>
      <AdminTitle title="Enviar aviso" />
      <p className="mb-8 max-w-2xl text-sm text-ash-300">
        {!pushEnabled() ? "As notificações no celular ainda estão desligadas (faltam as chaves VAPID na Vercel). O aviso aparece mesmo assim no início do app."
          : devices === null ? "Rode o arquivo RODAR_7_INSTANTES_E_NOTIFICACOES.sql no Supabase para as notificações funcionarem."
          : `${devices} aparelho${devices === 1 ? "" : "s"} com notificações ativadas.`}
      </p>
      {current && (
        <div className="mb-8 flex max-w-3xl flex-wrap items-center gap-3 rounded-xl border border-ink-600 bg-ink-900 p-4">
          <div className="min-w-0 flex-1 text-sm">
            <p className="text-ash-400">Aviso no ar · enviado {timeAgo(current.at)}</p>
            <p className="font-semibold text-white">{current.title}</p>
          </div>
          <form action={clearAnnouncement}><SubmitButton className="btn-ghost">Tirar do início</SubmitButton></form>
        </div>
      )}
      <AnnouncementForm links={ANNOUNCEMENT_LINKS.map((l) => ({ ...l }))} />
    </>
  );
}
