import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AuthorLite } from "@/lib/types";

export interface Thread {
  id: string; author_id: string; title: string; body: string; up_count: number; down_count: number; reply_count: number;
  created_at: string; edited_at: string | null; author: AuthorLite | null;
}
export interface Reply { id: string; thread_id: string; author_id: string; body: string; created_at: string; edited_at: string | null; author: AuthorLite | null }
export interface PollOption { id: string; label: string; vote_count: number }
export interface Poll { id: string; question: string; status: "OPEN" | "CLOSED"; created_at: string; options: PollOption[]; mine: string | null }

const AUTHOR = "author:profiles!forum_threads_author_id_fkey(username, display_name, avatar_url, role)";

export async function listThreads(sort: "novas" | "populares" | "respondidas"): Promise<Thread[]> {
  const supabase = await createClient();
  let q = supabase.from("forum_threads").select(`id, author_id, title, body, up_count, down_count, reply_count, created_at, edited_at, ${AUTHOR}`).eq("status", "VISIBLE");
  q = sort === "populares" ? q.order("up_count", { ascending: false }) : sort === "respondidas" ? q.order("reply_count", { ascending: false }) : q;
  const { data } = await q.order("created_at", { ascending: false }).limit(60);
  return (data ?? []) as unknown as Thread[];
}

export async function getThread(id: string): Promise<{ thread: Thread; mine: 0 | 1 | -1 } | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("forum_threads")
    .select(`id, author_id, title, body, up_count, down_count, reply_count, created_at, edited_at, ${AUTHOR}`).eq("id", id).eq("status", "VISIBLE").maybeSingle();
  if (!data) return null;
  const { data: { user } } = await supabase.auth.getUser();
  let mine: 0 | 1 | -1 = 0;
  if (user) {
    const { data: v } = await supabase.from("forum_votes").select("value").eq("thread_id", id).eq("user_id", user.id).maybeSingle();
    if (v?.value === 1 || v?.value === -1) mine = v.value;
  }
  return { thread: data as unknown as Thread, mine };
}

export async function listReplies(threadId: string): Promise<Reply[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("forum_replies")
    .select("id, thread_id, author_id, body, created_at, edited_at, author:profiles!forum_replies_author_id_fkey(username, display_name, avatar_url, role)")
    .eq("thread_id", threadId).eq("status", "VISIBLE").order("created_at", { ascending: true }).limit(300);
  return (data ?? []) as unknown as Reply[];
}

export async function listPolls(viewerId: string | null): Promise<Poll[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("polls")
    .select("id, question, status, created_at, options:poll_options(id, label, vote_count, position)").order("created_at", { ascending: false }).limit(6);
  const polls = (data ?? []) as unknown as (Omit<Poll, "mine"> & { options: (PollOption & { position: number })[] })[];
  let mineBy = new Map<string, string>();
  if (viewerId && polls.length) {
    const { data: votes } = await supabase.from("poll_votes").select("poll_id, option_id").eq("user_id", viewerId).in("poll_id", polls.map((p) => p.id));
    mineBy = new Map((votes ?? []).map((v) => [v.poll_id as string, v.option_id as string]));
  }
  return polls.map((p) => ({ ...p, options: [...p.options].sort((a, b) => a.position - b.position), mine: mineBy.get(p.id) ?? null }));
}
