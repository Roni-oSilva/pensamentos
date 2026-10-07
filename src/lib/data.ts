import "server-only";
import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE } from "@/lib/constants";
import { escapeLike } from "@/lib/utils";
import type { Category, CommentRow, Post, PostWithViewer, Profile, Tag } from "@/lib/types";

export const POST_SELECT =
  "*, author:profiles!posts_author_id_fkey(username, display_name, avatar_url, role), category:categories(name, slug), post_tags(tag:tags(name, slug))";

export type Sort = "recent" | "trending" | "likes" | "comments";
export interface PostQuery {
  origin?: "OFFICIAL" | "COMMUNITY";
  sort?: Sort;
  page?: number;
  categorySlug?: string;
  tagSlug?: string;
  authorId?: string;
  kind?: string;
  q?: string;
}

/** Marca curtidas/favoritos do viewer com 2 queries em lote (sem N+1). */
export async function withViewer(posts: Post[], viewerId: string | null): Promise<PostWithViewer[]> {
  if (!posts.length) return [];
  if (!viewerId) return posts.map((p) => ({ ...p, liked: false, favorited: false }));
  const supabase = await createClient();
  const ids = posts.map((p) => p.id);
  const [likes, favs] = await Promise.all([
    supabase.from("likes").select("post_id").eq("user_id", viewerId).in("post_id", ids),
    supabase.from("favorites").select("post_id").eq("user_id", viewerId).in("post_id", ids),
  ]);
  const liked = new Set((likes.data ?? []).map((r) => r.post_id as string));
  const faved = new Set((favs.data ?? []).map((r) => r.post_id as string));
  return posts.map((p) => ({ ...p, liked: liked.has(p.id), favorited: faved.has(p.id) }));
}

export async function listPosts(q: PostQuery, viewerId: string | null): Promise<{ posts: PostWithViewer[]; hasMore: boolean }> {
  const supabase = await createClient();
  const page = Math.max(0, q.page ?? 0);
  const from = page * PAGE_SIZE;
  let sort = q.sort ?? "recent";
  // "Em alta" é calculado no banco sobre todo o conjunto; com filtros extras, ordena por curtidas.
  if (sort === "trending" && (q.categorySlug || q.tagSlug || q.kind || q.q || q.authorId)) sort = "likes";

  // Em alta: ordenação calculada no banco (RPC) → busca os registros por id
  if (sort === "trending") {
    const { data: ids } = await supabase.rpc("trending_post_ids", { p_origin: q.origin ?? null, p_limit: PAGE_SIZE + 1, p_offset: from });
    const list = ((ids ?? []) as { id: string }[]).map((r) => r.id);
    const hasMore = list.length > PAGE_SIZE;
    const pageIds = list.slice(0, PAGE_SIZE);
    if (!pageIds.length) return { posts: [], hasMore: false };
    const { data } = await supabase.from("posts").select(POST_SELECT).in("id", pageIds);
    const byId = new Map(((data ?? []) as unknown as Post[]).map((p) => [p.id, p]));
    const ordered = pageIds.map((id) => byId.get(id)).filter((p): p is Post => !!p);
    return { posts: await withViewer(ordered, viewerId), hasMore };
  }

  let postIds: string[] | null = null;
  if (q.tagSlug) {
    const { data: tag } = await supabase.from("tags").select("id").eq("slug", q.tagSlug).maybeSingle();
    if (!tag) return { posts: [], hasMore: false };
    const { data } = await supabase.from("post_tags").select("post_id").eq("tag_id", tag.id).limit(1000);
    postIds = (data ?? []).map((r) => r.post_id as string);
    if (!postIds.length) return { posts: [], hasMore: false };
  }

  let query = supabase.from("posts").select(q.categorySlug ? POST_SELECT.replace("category:categories(", "category:categories!inner(") : POST_SELECT).eq("status", "PUBLISHED");
  if (q.origin) query = query.eq("origin", q.origin);
  if (q.authorId) query = query.eq("author_id", q.authorId);
  if (q.kind) query = query.eq("kind", q.kind);
  if (q.categorySlug) query = query.eq("category.slug", q.categorySlug);
  if (postIds) query = query.in("id", postIds);
  if (q.q) {
    const t = escapeLike(q.q);
    if (t) query = query.or(`title.ilike.%${t}%,content.ilike.%${t}%`);
  }
  if (sort === "likes") query = query.order("like_count", { ascending: false });
  else if (sort === "comments") query = query.order("comment_count", { ascending: false });
  query = query.order("published_at", { ascending: false }).range(from, from + PAGE_SIZE);

  const { data } = await query;
  const rows = (data ?? []) as unknown as Post[];
  return { posts: await withViewer(rows.slice(0, PAGE_SIZE), viewerId), hasMore: rows.length > PAGE_SIZE };
}

export async function getPost(id: string, viewerId: string | null): Promise<PostWithViewer | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("posts").select(POST_SELECT).eq("id", id).maybeSingle();
  if (!data) return null;
  const [p] = await withViewer([data as unknown as Post], viewerId);
  return p ?? null;
}

export async function listComments(postId: string): Promise<CommentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comments")
    .select("id, post_id, parent_id, body, status, created_at, edited_at, author_id, author:profiles!comments_author_id_fkey(username, display_name, avatar_url, role)")
    .eq("post_id", postId).eq("status", "VISIBLE").order("created_at", { ascending: true }).limit(200);
  return (data ?? []) as unknown as CommentRow[];
}

export async function listCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("id, name, slug, description").order("name");
  return (data ?? []) as Category[];
}

export async function listTags(limit = 200): Promise<Tag[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("tags").select("id, name, slug").order("name").limit(limit);
  return (data ?? []) as Tag[];
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles").select("id, username, display_name, avatar_url, bio, role, is_blocked, created_at")
    .eq("username", username.toLowerCase()).maybeSingle();
  return (data as Profile | null) ?? null;
}

export async function getProfileStats(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("profile_stats", { p_user: userId });
  const s = (data ?? {}) as Record<string, number>;
  return { posts: s.posts ?? 0, likesReceived: s.likes_received ?? 0, followers: s.followers ?? 0, following: s.following ?? 0 };
}

export async function searchUsers(term: string, limit = 12) {
  const t = escapeLike(term);
  if (!t) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("username, display_name, avatar_url, bio")
    .or(`username.ilike.%${t}%,display_name.ilike.%${t}%`).limit(limit);
  return (data ?? []) as { username: string; display_name: string | null; avatar_url: string | null; bio: string | null }[];
}

/** Membros mais recentes (perfis públicos), para a página Comunhão. */
export async function listRecentMembers(limit = 14) {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("username, display_name, avatar_url").order("created_at", { ascending: false }).limit(limit);
  return (data ?? []) as { username: string; display_name: string | null; avatar_url: string | null }[];
}

/** Configuração pública do site (site_settings é legível por todos; só ADMIN escreve). Padrão: aberto. */
export async function isSettingOn(key: "registrations_open" | "community_open" | "community_autopublish"): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
  return data?.value !== false;
}
