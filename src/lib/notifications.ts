/** Textos e ícones das notificações, compartilhados entre o sino do cabeçalho e a página /notificacoes. */
export type NotifType = "LIKE" | "COMMENT" | "REPLY" | "FOLLOW" | "POST_APPROVED" | "POST_REJECTED" | "REPORT_RESOLVED";

export const NOTIF_TEXT: Record<NotifType, string> = {
  LIKE: "curtiu sua publicação",
  COMMENT: "comentou na sua publicação",
  REPLY: "respondeu ao seu comentário",
  FOLLOW: "começou a seguir você",
  POST_APPROVED: "Sua publicação foi aprovada",
  POST_REJECTED: "Sua publicação não foi aprovada",
  REPORT_RESOLVED: "Uma denúncia sua foi analisada",
};

export const isSystemNotif = (t: string) => t.startsWith("POST_") || t === "REPORT_RESOLVED";

export interface NotifItem {
  id: string;
  type: NotifType;
  post_id: string | null;
  read: boolean;
  created_at: string;
  actor: { username: string; avatar_url: string | null } | null;
}

export function notifHref(n: Pick<NotifItem, "post_id" | "actor">): string {
  return n.post_id ? `/comunidade/${n.post_id}` : n.actor ? `/perfil/${n.actor.username}` : "/notificacoes";
}

export interface AdminPending { posts: number; reports: number; feedback: number }
