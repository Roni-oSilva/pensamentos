import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const INSTANT_BUCKET = "instants";
export const INSTANT_ARCHIVE_DAYS = 30;
export const INSTANT_REACTIONS = ["❤️", "🙏", "🔥", "😂", "😮"] as const;
export type InstantReaction = (typeof INSTANT_REACTIONS)[number];

export interface InboxItem { id: string; createdAt: string; expiresAt: string }
export interface InboxFriend { authorId: string; username: string; name: string; avatarUrl: string | null; items: InboxItem[] }

/** Instantes de amigos ainda não abertos, agrupados por pessoa (mais recente primeiro). Sem a migração 0014, vazio. */
export async function getInbox(): Promise<InboxFriend[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("instants_inbox");
  if (error || !data) return [];
  const by = new Map<string, InboxFriend>();
  for (const r of data as { id: string; author_id: string; username: string; display_name: string | null; avatar_url: string | null; created_at: string; expires_at: string }[]) {
    const f = by.get(r.author_id) ?? { authorId: r.author_id, username: r.username, name: r.display_name || r.username, avatarUrl: r.avatar_url, items: [] };
    f.items.push({ id: r.id, createdAt: r.created_at, expiresAt: r.expires_at });
    by.set(r.author_id, f);
  }
  return [...by.values()].sort((a, b) => b.items.at(-1)!.createdAt.localeCompare(a.items.at(-1)!.createdAt));
}

/** Quantos amigos (seguem nos dois sentidos) a pessoa tem: é para eles que o instante vai. */
export async function countFriends(userId: string): Promise<number> {
  const supabase = await createClient();
  const [a, b] = await Promise.all([
    supabase.from("follows").select("following_id").eq("follower_id", userId),
    supabase.from("follows").select("follower_id").eq("following_id", userId),
  ]);
  const followers = new Set((b.data ?? []).map((r) => r.follower_id as string));
  return (a.data ?? []).filter((r) => followers.has(r.following_id as string)).length;
}

export interface MyInstant {
  id: string; caption: string | null; createdAt: string; expiresAt: string; url: string | null;
  views: { username: string; avatarUrl: string | null; reaction: string | null; viewedAt: string }[];
}

/** Arquivo do autor (últimos 30 dias), com links temporários para as fotos e quem viu. */
export async function getMyInstants(userId: string): Promise<MyInstant[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - INSTANT_ARCHIVE_DAYS * 86400e3).toISOString();
  const { data, error } = await supabase.from("instants")
    .select("id, path, caption, created_at, expires_at, instant_views(reaction, viewed_at, viewer:profiles!instant_views_viewer_id_fkey(username, avatar_url))")
    .eq("author_id", userId).gte("created_at", since).order("created_at", { ascending: false }).limit(60);
  if (error || !data) return [];
  type Row = { id: string; path: string; caption: string | null; created_at: string; expires_at: string; instant_views: { reaction: string | null; viewed_at: string; viewer: { username: string; avatar_url: string | null } | null }[] };
  const rows = data as unknown as Row[];
  const signed = rows.length ? await createAdminClient().storage.from(INSTANT_BUCKET).createSignedUrls(rows.map((r) => r.path), 600) : { data: [] };
  const urls = new Map((signed.data ?? []).map((s) => [s.path, s.signedUrl]));
  return rows.map((r) => ({
    id: r.id, caption: r.caption, createdAt: r.created_at, expiresAt: r.expires_at, url: urls.get(r.path) ?? null,
    views: r.instant_views.filter((v) => v.viewer).map((v) => ({ username: v.viewer!.username, avatarUrl: v.viewer!.avatar_url, reaction: v.reaction, viewedAt: v.viewed_at }))
      .sort((a, b) => b.viewedAt.localeCompare(a.viewedAt)),
  }));
}
