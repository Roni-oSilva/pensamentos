import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, requireServerEnv } from "@/lib/env";

/**
 * Cliente com service role — IGNORA RLS. Usar somente em código de servidor,
 * depois de autenticar/autorizar o chamador, e apenas para o que RLS não cobre
 * (rate limit, bloqueio/remoção de contas, contadores).
 */
export function createAdminClient() {
  return createClient(SUPABASE_URL, requireServerEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
