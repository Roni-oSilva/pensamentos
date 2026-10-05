import "server-only";
import { createClient } from "@/lib/supabase/server";

const SENSITIVE = /pass|token|secret|key|authorization|cookie|email/i;

function scrub(value: unknown, depth = 0): unknown {
  if (depth > 3 || value === null || typeof value !== "object") return typeof value === "string" ? value.slice(0, 200) : value;
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => scrub(v, depth + 1));
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, SENSITIVE.test(k) ? "[redacted]" : scrub(v, depth + 1)]),
  );
}

/** Registra ação administrativa via RPC (admin_id = auth.uid() definido no banco). */
export async function audit(action: string, resourceType: string, resourceId?: string, metadata: Record<string, unknown> = {}) {
  const supabase = await createClient();
  await supabase.rpc("log_audit", { p_action: action, p_resource_type: resourceType, p_resource_id: resourceId ?? null, p_metadata: scrub(metadata) });
}
export { scrub as scrubMetadata };
