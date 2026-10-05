import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

export type FormState = { error?: string; success?: string };
export const GENERIC_ERROR = "Não foi possível concluir a ação. Tente novamente.";
export const FORBIDDEN = "Você não tem permissão para esta ação.";

export const str = (fd: FormData, key: string): string => {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
};

/** "a, b, #c" → ["a","b","c"] */
export const parseTags = (raw: string): string[] => raw.split(/[,\n]/).map((t) => t.trim()).filter(Boolean).slice(0, 20);

/**
 * Cria tags inexistentes (já validadas pelo zod) e devolve seus ids.
 * Usa service role porque usuários comuns não têm INSERT em `tags`; entrada é saneada antes.
 */
export async function ensureTags(names: string[]): Promise<string[]> {
  const rows = names.map((n) => ({ name: n.slice(0, 30), slug: slugify(n) })).filter((r) => r.slug.length >= 2);
  if (!rows.length) return [];
  const admin = createAdminClient();
  await admin.from("tags").upsert(rows, { onConflict: "slug", ignoreDuplicates: true });
  const { data } = await admin.from("tags").select("id").in("slug", rows.map((r) => r.slug));
  return (data ?? []).map((t) => t.id as string);
}

/** Substitui as tags do post usando o cliente do usuário (RLS decide se pode). */
export async function setPostTags(supabase: SupabaseClient, postId: string, tagIds: string[]) {
  await supabase.from("post_tags").delete().eq("post_id", postId);
  if (tagIds.length) await supabase.from("post_tags").insert(tagIds.map((tag_id) => ({ post_id: postId, tag_id })));
}
