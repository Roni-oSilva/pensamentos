import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/env";

export type PushKind = "instants" | "posts";
export interface PushPayload { title: string; body: string; url: string; tag?: string }

const PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
/** As notificações só funcionam com as chaves VAPID configuradas na Vercel; sem elas, nada é enviado (sem erro). */
export const pushEnabled = () => PUBLIC.length > 0 && PRIVATE.length > 0;

let configured = false;
function configure() {
  if (configured) return;
  // "subject": contato do dono do app para os serviços de push (o endereço do próprio site)
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || (SITE_URL.startsWith("https://") ? SITE_URL : "https://igrejadecristo.app"), PUBLIC, PRIVATE);
  configured = true;
}

/**
 * Avisa todos os membros inscritos (menos quem postou). Celulares que saíram (endereço vencido) são removidos.
 * Chamado depois da resposta (after), então nunca atrasa quem está postando.
 */
export async function notifyMembers(kind: PushKind, exceptUserId: string, payload: PushPayload) {
  if (!pushEnabled()) return;
  configure();
  const admin = createAdminClient();
  const { data } = await admin.from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq(kind === "instants" ? "notify_instants" : "notify_posts", true)
    .neq("user_id", exceptUserId)
    .limit(5000);
  if (!data?.length) return;
  const body = JSON.stringify(payload);
  const gone: string[] = [];
  await Promise.allSettled(data.map((s) =>
    webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, { TTL: 6 * 3600, urgency: "high" })
      .catch((e: { statusCode?: number }) => { if (e.statusCode === 404 || e.statusCode === 410) gone.push(s.endpoint); })));
  if (gone.length) await admin.from("push_subscriptions").delete().in("endpoint", gone);
}
