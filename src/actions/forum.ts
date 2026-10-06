"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { actionSession } from "@/lib/auth";
import { allow, rateLimitMessage } from "@/lib/rate-limit";
import { firstError, idSchema, pollSchema, replySchema, threadSchema } from "@/lib/validation";
import type { Result } from "@/lib/types";
import { FORBIDDEN, GENERIC_ERROR } from "./_shared";

const NEED_LOGIN = "Entre para continuar.";

export async function createThread(input: { title: string; body: string }): Promise<Result<{ id: string }>> {
  const s = await actionSession();
  if (!s) return { ok: false, error: NEED_LOGIN };
  const parsed = threadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  if (!(await allow("thread", s.user.id))) return { ok: false, error: rateLimitMessage() };
  const supabase = await createClient();
  const { data, error } = await supabase.from("forum_threads").insert({ ...parsed.data, author_id: s.user.id }).select("id").single();
  if (error || !data) return { ok: false, error: GENERIC_ERROR };
  revalidatePath("/forum");
  return { ok: true, id: data.id as string };
}

export async function editThread(input: { id: string; title: string; body: string }): Promise<Result> {
  const s = await actionSession();
  if (!s) return { ok: false, error: NEED_LOGIN };
  const parsed = threadSchema.safeParse(input);
  if (!parsed.success || !idSchema.safeParse(input.id).success) return { ok: false, error: parsed.success ? GENERIC_ERROR : firstError(parsed.error) };
  if (!(await allow("edit", s.user.id))) return { ok: false, error: rateLimitMessage() };
  const supabase = await createClient();
  const { data, error } = await supabase.from("forum_threads").update(parsed.data).eq("id", input.id).eq("author_id", s.user.id).select("id");
  if (error || !data?.length) return { ok: false, error: GENERIC_ERROR };
  revalidatePath(`/forum/${input.id}`);
  return { ok: true };
}

export async function deleteThread(id: string): Promise<Result> {
  const s = await actionSession();
  if (!s || !idSchema.safeParse(id).success) return { ok: false, error: FORBIDDEN };
  const supabase = await createClient();
  const { error } = await supabase.from("forum_threads").delete().eq("id", id); // RLS: autor ou equipe
  if (error) return { ok: false, error: GENERIC_ERROR };
  revalidatePath("/forum");
  return { ok: true };
}

export async function addReply(input: { threadId: string; body: string }): Promise<Result> {
  const s = await actionSession();
  if (!s) return { ok: false, error: "Entre para responder." };
  const parsed = replySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  if (!(await allow("reply", s.user.id))) return { ok: false, error: rateLimitMessage() };
  const supabase = await createClient();
  const { error } = await supabase.from("forum_replies").insert({ thread_id: parsed.data.threadId, body: parsed.data.body, author_id: s.user.id });
  return error ? { ok: false, error: GENERIC_ERROR } : { ok: true };
}

export async function editReply(input: { id: string; body: string }): Promise<Result> {
  const s = await actionSession();
  if (!s) return { ok: false, error: NEED_LOGIN };
  const parsed = replySchema.omit({ threadId: true }).safeParse(input);
  if (!parsed.success || !idSchema.safeParse(input.id).success) return { ok: false, error: parsed.success ? GENERIC_ERROR : firstError(parsed.error) };
  if (!(await allow("edit", s.user.id))) return { ok: false, error: rateLimitMessage() };
  const supabase = await createClient();
  const { data, error } = await supabase.from("forum_replies").update({ body: parsed.data.body }).eq("id", input.id).eq("author_id", s.user.id).select("id");
  return error || !data?.length ? { ok: false, error: GENERIC_ERROR } : { ok: true };
}

export async function deleteReply(id: string): Promise<Result> {
  const s = await actionSession();
  if (!s || !idSchema.safeParse(id).success) return { ok: false, error: FORBIDDEN };
  const supabase = await createClient();
  const { error } = await supabase.from("forum_replies").delete().eq("id", id); // RLS: autor ou equipe
  return error ? { ok: false, error: GENERIC_ERROR } : { ok: true };
}

/** 👍 (1) / 👎 (-1): tocar de novo no mesmo voto remove; tocar no outro troca. Devolve o voto atual (0 = nenhum). */
export async function voteThread(threadId: string, value: 1 | -1): Promise<Result<{ mine: 0 | 1 | -1 }>> {
  const s = await actionSession();
  if (!s) return { ok: false, error: NEED_LOGIN };
  if (!idSchema.safeParse(threadId).success || (value !== 1 && value !== -1)) return { ok: false, error: GENERIC_ERROR };
  if (!(await allow("forumVote", s.user.id))) return { ok: false, error: rateLimitMessage() };
  const supabase = await createClient();
  const { data: cur } = await supabase.from("forum_votes").select("value").eq("thread_id", threadId).eq("user_id", s.user.id).maybeSingle();
  if (cur?.value === value) {
    const { error } = await supabase.from("forum_votes").delete().eq("thread_id", threadId).eq("user_id", s.user.id);
    return error ? { ok: false, error: GENERIC_ERROR } : { ok: true, mine: 0 };
  }
  const { error } = cur
    ? await supabase.from("forum_votes").update({ value }).eq("thread_id", threadId).eq("user_id", s.user.id)
    : await supabase.from("forum_votes").insert({ thread_id: threadId, user_id: s.user.id, value });
  return error ? { ok: false, error: GENERIC_ERROR } : { ok: true, mine: value };
}

// ---------- Votações: somente o Criador abre e gerencia ----------
async function creatorSession() {
  const s = await actionSession();
  return s && s.profile.role === "CREATOR" ? s : null;
}

export async function createPoll(input: { question: string; options: string[] }): Promise<Result<{ id: string }>> {
  const s = await creatorSession();
  if (!s) return { ok: false, error: FORBIDDEN };
  const parsed = pollSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  if (!(await allow("poll", s.user.id))) return { ok: false, error: rateLimitMessage() };
  const supabase = await createClient();
  const { data, error } = await supabase.from("polls").insert({ question: parsed.data.question, creator_id: s.user.id }).select("id").single();
  if (error || !data) return { ok: false, error: GENERIC_ERROR };
  const { error: oErr } = await supabase.from("poll_options").insert(parsed.data.options.map((label, position) => ({ poll_id: data.id, label, position })));
  if (oErr) { await supabase.from("polls").delete().eq("id", data.id); return { ok: false, error: GENERIC_ERROR }; }
  revalidatePath("/forum");
  return { ok: true, id: data.id as string };
}

export async function setPollStatus(id: string, status: "OPEN" | "CLOSED"): Promise<Result> {
  const s = await creatorSession();
  if (!s || !idSchema.safeParse(id).success) return { ok: false, error: FORBIDDEN };
  const supabase = await createClient();
  const { error } = await supabase.from("polls").update({ status }).eq("id", id);
  if (error) return { ok: false, error: GENERIC_ERROR };
  revalidatePath("/forum");
  return { ok: true };
}

export async function deletePoll(id: string): Promise<Result> {
  const s = await creatorSession();
  if (!s || !idSchema.safeParse(id).success) return { ok: false, error: FORBIDDEN };
  const supabase = await createClient();
  const { error } = await supabase.from("polls").delete().eq("id", id);
  if (error) return { ok: false, error: GENERIC_ERROR };
  revalidatePath("/forum");
  return { ok: true };
}

export async function votePoll(pollId: string, optionId: string): Promise<Result> {
  const s = await actionSession();
  if (!s) return { ok: false, error: "Entre para votar." };
  if (!idSchema.safeParse(pollId).success || !idSchema.safeParse(optionId).success) return { ok: false, error: GENERIC_ERROR };
  if (!(await allow("forumVote", s.user.id))) return { ok: false, error: rateLimitMessage() };
  const supabase = await createClient();
  const { data: cur } = await supabase.from("poll_votes").select("option_id").eq("poll_id", pollId).eq("user_id", s.user.id).maybeSingle();
  if (cur?.option_id === optionId) return { ok: true };
  const { error } = cur
    ? await supabase.from("poll_votes").update({ option_id: optionId }).eq("poll_id", pollId).eq("user_id", s.user.id)
    : await supabase.from("poll_votes").insert({ poll_id: pollId, user_id: s.user.id, option_id: optionId });
  if (error) return { ok: false, error: "Esta votação já foi encerrada ou não está disponível." };
  revalidatePath("/forum");
  return { ok: true };
}

/** Versão para <form action>: exclui a discussão e volta ao fórum. */
export async function removeThread(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id === "string") await deleteThread(id);
  redirect("/forum");
}
