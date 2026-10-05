"use server";

import { getSession } from "@/lib/auth";
import { listPosts, type Sort } from "@/lib/data";
import type { PostWithViewer } from "@/lib/types";

const SORTS: Sort[] = ["recent", "trending", "likes", "comments"];

/** Paginação do feed (carregar mais). Somente leitura; RLS aplicada pelo cliente do usuário. */
export async function loadMorePosts(params: {
  origin?: "OFFICIAL" | "COMMUNITY"; sort: string; page: number; categorySlug?: string; tagSlug?: string; kind?: string; q?: string; authorId?: string;
}): Promise<{ posts: PostWithViewer[]; hasMore: boolean }> {
  const s = await getSession();
  const sort = SORTS.includes(params.sort as Sort) ? (params.sort as Sort) : "recent";
  const page = Math.min(Math.max(0, Math.floor(params.page)), 200);
  return listPosts({ ...params, sort, page, origin: params.origin === "OFFICIAL" || params.origin === "COMMUNITY" ? params.origin : undefined }, s?.user.id ?? null);
}
