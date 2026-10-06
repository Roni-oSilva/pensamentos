import { z } from "zod";
import { COMMUNITY_KINDS, POST_KINDS, POST_STATUSES, REPORT_REASONS, REPORT_TARGETS, ASSIGNABLE_ROLES, MAX_TAGS } from "./constants";
import { cleanText } from "./sanitize";
import { slugify } from "./utils";

const RESERVED = ["admin", "administrador", "moderador", "moderator", "heresias", "igreja", "igrejadecristo", "cristo", "criador", "creator", "suporte", "support", "root", "system", "sistema", "api"];

export const emailSchema = z.string().trim().toLowerCase().email("E-mail inválido").max(254);
export const passwordSchema = z
  .string()
  .min(10, "A senha precisa ter ao menos 10 caracteres")
  .max(72, "A senha pode ter no máximo 72 caracteres")
  .regex(/[A-Za-z]/, "Inclua ao menos uma letra")
  .regex(/[0-9]/, "Inclua ao menos um número");
export const usernameSchema = z
  .string().trim().toLowerCase()
  .regex(/^[a-z0-9_]{3,24}$/, "Use 3–24 caracteres: letras, números e _")
  .refine((u) => !RESERVED.includes(u), "Nome de usuário indisponível");

export const signupSchema = z.object({ email: emailSchema, password: passwordSchema, username: usernameSchema, accept: z.literal("on", { message: "Aceite os termos para continuar" }) });
export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(72) });

const uuidSchema = z.string().uuid();
export const idSchema = uuidSchema;

const tagList = z
  .array(z.string().trim().min(2).max(30))
  .max(MAX_TAGS, `No máximo ${MAX_TAGS} tags`)
  .transform((arr) => [...new Set(arr.map((t) => t.toLowerCase().replace(/^#/, "").trim()).filter((t) => slugify(t).length >= 2))]);

const text = (max: number) => z.string().transform(cleanText).pipe(z.string().min(1, "Campo obrigatório").max(max));

export const communityPostSchema = z.object({
  kind: z.enum(COMMUNITY_KINDS),
  title: z.string().transform(cleanText).pipe(z.string().max(140)).optional().transform((v) => v || null),
  content: text(5000),
  categoryId: uuidSchema.nullable().optional().transform((v) => v ?? null),
  imageUrl: z.string().url().max(600).nullable().optional().transform((v) => v ?? null),
  tags: tagList,
  submit: z.boolean(), // true = enviar para moderação, false = rascunho
});

export const officialPostSchema = z.object({
  kind: z.enum(POST_KINDS),
  title: z.string().transform(cleanText).pipe(z.string().max(140)).optional().transform((v) => v || null),
  content: z.string().min(1, "Escreva o conteúdo").max(60000),
  categoryId: uuidSchema.nullable().optional().transform((v) => v ?? null),
  imageUrl: z.string().url().max(600).nullable().optional().transform((v) => v ?? null),
  tags: tagList,
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

export const commentSchema = z.object({
  postId: uuidSchema,
  parentId: uuidSchema.nullable().optional().transform((v) => v ?? null),
  body: text(1000),
});

export const commentEditSchema = z.object({ id: uuidSchema, body: text(1000) });

export const threadSchema = z.object({
  title: z.string().transform(cleanText).pipe(z.string().min(5, "O título precisa de ao menos 5 caracteres").max(140)),
  body: text(4000),
});
export const replySchema = z.object({ threadId: uuidSchema, body: text(1500) });
export const pollSchema = z.object({
  question: z.string().transform(cleanText).pipe(z.string().min(5, "Escreva a pergunta").max(200)),
  options: z.array(z.string().transform(cleanText).pipe(z.string().max(80))).transform((a) => a.filter(Boolean))
    .pipe(z.array(z.string()).min(2, "Informe ao menos 2 opções").max(8, "No máximo 8 opções")),
});

export const reportSchema = z.object({
  targetType: z.enum(REPORT_TARGETS),
  targetId: uuidSchema,
  reason: z.enum(REPORT_REASONS),
  details: z.string().transform(cleanText).pipe(z.string().max(500)).optional().transform((v) => v || null),
});

export const profileSchema = z.object({
  username: usernameSchema,
  displayName: z.string().transform(cleanText).pipe(z.string().min(1, "Informe um nome").max(50)),
  bio: z.string().transform(cleanText).pipe(z.string().max(280)).transform((v) => v || null),
});

export const statusSchema = z.enum(POST_STATUSES);
export const roleSchema = z.enum(ASSIGNABLE_ROLES);
export const nameSchema = z.string().transform(cleanText).pipe(z.string().min(2).max(40));

export function firstError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Dados inválidos";
}

export const FEEDBACK_KINDS = ["QUESTION", "HELP", "SUGGESTION"] as const;
export const feedbackSchema = z.object({
  kind: z.enum(FEEDBACK_KINDS),
  message: z.string().transform(cleanText).pipe(z.string().min(5, "Escreva pelo menos 5 letras").max(2000, "Máximo de 2000 caracteres")),
  contact: z.string().transform(cleanText).pipe(z.string().max(120, "Contato muito longo")).optional().transform((v) => v || null),
  page: z.string().max(200).regex(/^\//).optional().catch(undefined),
});
