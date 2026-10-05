export const SITE_NAME = "Igreja de Cristo";
export const SITE_TAGLINE = "Uma comunidade para compartilhar a Palavra e engrandecer a Cristo.";

export const POST_KINDS = ["VERSICULO", "FRASE", "CONSELHO", "ORACAO", "PENSAMENTO", "REFLEXAO", "TEXTO", "POEMA", "IMAGEM", "NOTA"] as const;
export const COMMUNITY_KINDS = ["VERSICULO", "FRASE", "CONSELHO", "ORACAO", "PENSAMENTO", "REFLEXAO", "POEMA", "TEXTO", "IMAGEM"] as const;
export const POST_STATUSES = ["DRAFT", "PENDING", "PUBLISHED", "REJECTED", "HIDDEN", "DELETED"] as const;
export const ROLES = ["USER", "MODERATOR", "ADMIN", "CREATOR"] as const;
/** Funções que o painel pode atribuir. CRIADOR só existe por SQL (é o dono do site). */
export const ASSIGNABLE_ROLES = ["USER", "MODERATOR", "ADMIN"] as const;
export const REPORT_REASONS = ["SPAM", "INAPPROPRIATE", "HARASSMENT", "FRAUD", "ILLEGAL", "OTHER"] as const;
export const REPORT_TARGETS = ["POST", "COMMENT", "PROFILE"] as const;

export type PostKind = (typeof POST_KINDS)[number];
export type PostStatus = (typeof POST_STATUSES)[number];
export type Role = (typeof ROLES)[number];
export const isAdminRole = (r: Role | string | undefined | null) => r === "ADMIN" || r === "CREATOR";
export const isStaffRole = (r: Role | string | undefined | null) => r === "MODERATOR" || isAdminRole(r);
export type ReportReason = (typeof REPORT_REASONS)[number];
export type ReportTarget = (typeof REPORT_TARGETS)[number];

export const KIND_LABEL: Record<PostKind, string> = {
  VERSICULO: "Versículo", FRASE: "Frase", CONSELHO: "Conselho", ORACAO: "Oração", PENSAMENTO: "Pensamento", REFLEXAO: "Reflexão",
  TEXTO: "Texto", POEMA: "Poema", IMAGEM: "Imagem", NOTA: "Nota",
};
export const STATUS_LABEL: Record<PostStatus, string> = {
  DRAFT: "Rascunho", PENDING: "Pendente", PUBLISHED: "Publicado", REJECTED: "Rejeitado", HIDDEN: "Oculto", DELETED: "Excluído",
};
export const ROLE_LABEL: Record<Role, string> = { USER: "Membro", MODERATOR: "Moderador", ADMIN: "Administrador", CREATOR: "Criador" };
export const REASON_LABEL: Record<ReportReason, string> = {
  SPAM: "Spam", INAPPROPRIATE: "Conteúdo inadequado", HARASSMENT: "Assédio", FRAUD: "Fraude", ILLEGAL: "Conteúdo ilegal", OTHER: "Outro",
};

export const PAGE_SIZE = 12;
export const MAX_TAGS = 5;

export const IMAGE_RULES = {
  avatars: { maxBytes: 2 * 1024 * 1024 },
  community: { maxBytes: 50 * 1024 * 1024 },
  admin: { maxBytes: 50 * 1024 * 1024 },
} as const;
export type Bucket = keyof typeof IMAGE_RULES;
