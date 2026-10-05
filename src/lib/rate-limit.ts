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

/** Retorna true se a ação é permitida. Falha FECHADA em caso de erro no banco. */
export async function allow(action: RateAction, ...identity: string[]): Promise<boolean> {
  const rule = RATE_RULES[action];
  const key = `${action}:${identity.map(digest).join(":")}`;
  try {
    const { data, error } = await createAdminClient().rpc("rate_limit_hit", { p_key: key, p_limit: rule.limit, p_window_seconds: rule.window });
    if (error) {
      // Falha de infraestrutura (ex.: função ausente, chave inválida). Registra o MOTIVO (sem dados do usuário) para diagnóstico.
      console.error(`[rate-limit] RPC rate_limit_hit falhou: ${error.code ?? ""} ${error.message}`);
      return false;
    }
    return data === true;
  } catch (e) {
    console.error(`[rate-limit] exceção: ${e instanceof Error ? e.message : "desconhecida"}`);
    return false;
  }
}

export const RATE_LIMIT_MESSAGE = "Muitas tentativas. Aguarde um pouco e tente novamente.";
