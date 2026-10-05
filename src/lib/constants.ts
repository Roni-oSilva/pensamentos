export const POST_KINDS = ["FRASE", "PENSAMENTO", "REFLEXAO", "TEXTO", "POEMA", "IMAGEM", "NOTA"] as const;
export const COMMUNITY_KINDS = ["FRASE", "PENSAMENTO", "REFLEXAO", "POEMA", "TEXTO", "IMAGEM"] as const;
export const POST_STATUSES = ["DRAFT", "PENDING", "PUBLISHED", "REJECTED", "HIDDEN", "DELETED"] as const;
export const ROLES = ["USER", "MODERATOR", "ADMIN"] as const;
export const REPORT_REASONS = ["SPAM", "INAPPROPRIATE", "HARASSMENT", "FRAUD", "ILLEGAL", "OTHER"] as const;
export const REPORT_TARGETS = ["POST", "COMMENT", "PROFILE"] as const;

export type PostKind = (typeof POST_KINDS)[number];
export type PostStatus = (typeof POST_STATUSES)[number];
export type Role = (typeof ROLES)[number];
export type ReportReason = (typeof REPORT_REASONS)[number];
export type ReportTarget = (typeof REPORT_TARGETS)[number];

export const KIND_LABEL: Record<PostKind, string> = {
  FRASE: "Frase", PENSAMENTO: "Pensamento", REFLEXAO: "Reflexão", TEXTO: "Texto", POEMA: "Poema", IMAGEM: "Imagem", NOTA: "Nota",
};
export const STATUS_LABEL: Record<PostStatus, string> = {
  DRAFT: "Rascunho", PENDING: "Pendente", PUBLISHED: "Publicado", REJECTED: "Rejeitado", HIDDEN: "Oculto", DELETED: "Excluído",
};
export const ROLE_LABEL: Record<Role, string> = { USER: "Usuário", MODERATOR: "Moderador", ADMIN: "Administrador" };
export const REASON_LABEL: Record<ReportReason, string> = {
  SPAM: "Spam", INAPPROPRIATE: "Conteúdo inadequado", HARASSMENT: "Assédio", FRAUD: "Fraude", ILLEGAL: "Conteúdo ilegal", OTHER: "Outro",
};

export const PAGE_SIZE = 12;
export const MAX_TAGS = 5;

export const IMAGE_RULES = {
  avatars: { maxBytes: 2 * 1024 * 1024 },
  community: { maxBytes: 5 * 1024 * 1024 },
  admin: { maxBytes: 8 * 1024 * 1024 },
} as const;
export type Bucket = keyof typeof IMAGE_RULES;
