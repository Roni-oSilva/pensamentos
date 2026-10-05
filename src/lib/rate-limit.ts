import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireServerEnv } from "@/lib/env";

/** limit = requisições permitidas por janela (segundos). */
export const RATE_RULES = {
  login: { limit: 8, window: 300 },
  signup: { limit: 4, window: 3600 },
  reset: { limit: 4, window: 3600 },
  password: { limit: 6, window: 900 },
  post: { limit: 6, window: 3600 },
  comment: { limit: 20, window: 600 },
  like: { limit: 80, window: 60 },
  favorite: { limit: 80, window: 60 },
  follow: { limit: 30, window: 60 },
  report: { limit: 10, window: 3600 },
  upload: { limit: 12, window: 600 },
  share: { limit: 30, window: 60 },
  view: { limit: 1, window: 3600 },
  admin: { limit: 300, window: 60 },
} as const;
export type RateAction = keyof typeof RATE_RULES;

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}

function digest(value: string): string {
  const salt = process.env.NODE_ENV === "production" ? requireServerEnv("RATE_LIMIT_SALT") : (process.env.RATE_LIMIT_SALT ?? "dev");
  return createHash("sha256").update(`${salt}:${value}`).digest("hex").slice(0, 32);
}

let lastFailure: string | null = null;

function classify(message: string): string {
  if (/api key|jwt|apikey|unauthor|invalid/i.test(message)) return "chave do servidor inválida";
  if (/permission|denied|not found|function|schema cache/i.test(message)) return "função ou permissão ausente no banco";
  if (/fetch|network|timeout|econn/i.test(message)) return "sem conexão com o banco";
  return "falha desconhecida";
}

/** Retorna true se a ação é permitida. Falha FECHADA em caso de erro no banco. */
export async function allow(action: RateAction, ...identity: string[]): Promise<boolean> {
  lastFailure = null;
  try {
    const rule = RATE_RULES[action];
    const key = `${action}:${identity.map(digest).join(":")}`;
    const { data, error } = await createAdminClient().rpc("rate_limit_hit", { p_key: key, p_limit: rule.limit, p_window_seconds: rule.window });
    if (error) {
      // Falha de infraestrutura: registra o motivo (sem dados do usuário) e guarda a categoria para a mensagem.
      console.error(`[rate-limit] RPC falhou: ${error.code ?? ""} ${error.message}`);
      lastFailure = classify(error.message);
      return false;
    }
    return data === true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "desconhecida";
    console.error(`[rate-limit] exceção: ${msg}`);
    lastFailure = /RATE_LIMIT_SALT|SERVICE_ROLE/.test(msg) ? "variável de ambiente ausente na Vercel" : classify(msg);
    return false;
  }
}

/** Mensagem para quando allow() devolve false: limite real ou falha do limitador (nesse caso, a categoria). */
export function rateLimitMessage(): string {
  return lastFailure
    ? `Não foi possível verificar o limite de tentativas agora (${lastFailure}). Avise o administrador do site.`
    : "Muitas tentativas. Aguarde um pouco e tente novamente.";
}
