"use client";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { loadMorePosts } from "@/actions/feed";
import type { PostWithViewer } from "@/lib/types";
import { PostCard } from "./PostCard";

type Params = Parameters<typeof loadMorePosts>[0];

/** Lista paginada: scroll infinito (IntersectionObserver) com botão de fallback. */
export function FeedList({ initial, hasMore: initialHasMore, signedIn, params }: { initial: PostWithViewer[]; hasMore: boolean; signedIn: boolean; params: Omit<Params, "page"> }) {
  const [posts, setPosts] = useState(initial);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(0);
  const [pending, start] = useTransition();
  const sentinel = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  const more = useCallback(() => {
    if (busy.current || !hasMore) return;
    busy.current = true;
    start(async () => {
      const next = page + 1;
      const r = await loadMorePosts({ ...params, page: next });
      setPosts((cur) => { const seen = new Set(cur.map((p) => p.id)); return [...cur, ...r.posts.filter((p) => !seen.has(p.id))]; });
      setHasMore(r.hasMore);
      setPage(next);
      busy.current = false;
    });
  }, [hasMore, page, params]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver((e) => e[0]?.isIntersecting && more(), { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [more, hasMore]);

  return (
    <>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => <PostCard key={p.id} post={p} signedIn={signedIn} />)}
      </div>
      <div ref={sentinel} className="mt-8 flex justify-center">
        {hasMore ? <button type="button" className="btn-ghost" onClick={more} disabled={pending}>{pending ? "Carregando…" : "Carregar mais"}</button>
          : posts.length > 0 && <p className="text-xs uppercase tracking-[0.3em] text-ash-400">Fim</p>}
      </div>
    </>
  );
}
