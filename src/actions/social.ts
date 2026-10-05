"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { actionSession } from "@/lib/auth";
import { allow, clientIp } from "@/lib/rate-limit";
import { commentSchema, firstError, idSchema, reportSchema } from "@/lib/validation";
import { rateLimitMessage } from "@/lib/rate-limit";
import type { Result } from "@/lib/types";
import { FORBIDDEN, GENERIC_ERROR } from "./_shared";

type Toggle = Result<{ active: boolean }>;

async function toggle(table: "likes" | "favorites", action: "like" | "favorite", postId: string): Promise<Toggle> {
  const s = await actionSession();
  if (!s) return { ok: false, error: "Entre para continuar." };
  if (!idSchema.safeParse(postId).success) return { ok: false, error: GENERIC_ERROR };
  if (!(await allow(action, s.user.id))) return { ok: false, error: rateLimitMessage };
  const supabase = await createClient();
  const { data: existing } = await supabase.from(table).select("post_id").eq("user_id", s.user.id).eq("post_id", postId).maybeSingle();
  if (existing) {
    const { error } = await supabase.from(table).delete().eq("user_id", s.user.id).eq("post_id", postId);
    return error ? { ok: false, error: GENERIC_ERROR } : { ok: true, active: false };
  }
  const { error } = await supabase.from(table).insert({ user_id: s.user.id, post_id: postId });
  return error ? { ok: false, error: GENERIC_ERROR } : { ok: true, active: true };
}

export async function toggleLike(postId: string): Promise<Toggle> {
  return toggle("likes", "like", postId);
}
export async function toggleFavorite(postId: string): Promise<Toggle> {
  return toggle("favorites", "favorite", postId);
}

export async function toggleFollow(targetId: string): Promise<Toggle> {
  const s = await actionSession();
  if (!s) return { ok: false, error: "Entre para continuar." };
  if (!idSchema.safeParse(targetId).success || targetId === s.user.id) return { ok: false, error: GENERIC_ERROR };
  if (!(await allow("follow", s.user.id))) return { ok: false, error: rateLimitMessage };
  const supabase = await createClient();
  const { data: existing } = await supabase.from("follows").select("following_id").eq("follower_id", s.user.id).eq("following_id", targetId).maybeSingle();
  if (existing) {
    await supabase.from("follows").delete().eq("follower_id", s.user.id).eq("following_id", targetId);
    return { ok: true, active: false };
  }
  const { error } = await supabase.from("follows").insert({ follower_id: s.user.id, following_id: targetId });
  return error ? { ok: false, error: GENERIC_ERROR } : { ok: true, active: true };
}

export async function addComment(input: { postId: string; parentId?: string | null; body: string }): Promise<Result> {
  const s = await actionSession();
  if (!s) return { ok: false, error: "Entre para comentar." };
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  if (!(await allow("comment", s.user.id))) return { ok: false, error: rateLimitMessage };
  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({
    post_id: parsed.data.postId, parent_id: parsed.data.parentId, body: parsed.data.body, author_id: s.user.id,
  });
  return error ? { ok: false, error: GENERIC_ERROR } : { ok: true };
}

export async function deleteComment(commentId: string): Promise<Result> {
  const s = await actionSession();
  if (!s || !idSchema.safeParse(commentId).success) return { ok: false, error: FORBIDDEN };
  const supabase = await createClient();
  // RLS: só o autor ou staff conseguem apagar
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  return error ? { ok: false, error: GENERIC_ERROR } : { ok: true };
}

export async function submitReport(input: { targetType: string; targetId: string; reason: string; details?: string }): Promise<Result> {
  const s = await actionSession();
  if (!s) return { ok: false, error: "Entre para denunciar." };
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  if (!(await allow("report", s.user.id))) return { ok: false, error: rateLimitMessage };
  const d = parsed.data;
  if (d.targetType === "PROFILE" && d.targetId === s.user.id) return { ok: false, error: "Você não pode denunciar a si mesmo." };
  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_id: s.user.id, target_type: d.targetType, reason: d.reason, details: d.details,
    post_id: d.targetType === "POST" ? d.targetId : null,
    comment_id: d.targetType === "COMMENT" ? d.targetId : null,
    profile_id: d.targetType === "PROFILE" ? d.targetId : null,
  });
  if (error?.code === "23505") return { ok: true }; // já denunciado: resposta idempotente
  return error ? { ok: false, error: GENERIC_ERROR } : { ok: true };
}

/** Contadores públicos: limitados por IP+post, executados com service role via RPC restrita. */
export async function registerShare(postId: string): Promise<void> {
  if (!idSchema.safeParse(postId).success) return;
  const ip = await clientIp();
  if (!(await allow("share", ip))) return;
  await createAdminClient().rpc("register_share", { p_post: postId });
}

export async function registerView(postId: string): Promise<void> {
  if (!idSchema.safeParse(postId).success) return;
  const ip = await clientIp();
  if (!(await allow("view", ip, postId))) return; // 1 visualização por IP/post/hora
  await createAdminClient().rpc("register_view", { p_post: postId });
}
