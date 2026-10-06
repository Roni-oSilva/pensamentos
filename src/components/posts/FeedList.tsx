"use client";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { loadMorePosts } from "@/actions/feed";
import type { PostWithViewer } from "@/lib/types";
import { withPatch } from "@/lib/post-patches";
import { PostCard } from "./PostCard";

type Params = Parameters<typeof loadMorePosts>[0];

/** Lista paginada: scroll infinito (IntersectionObserver) com botão de fallback. */
export function FeedList({ initial, hasMore: initialHasMore, signedIn, params }: { initial: PostWithViewer[]; hasMore: boolean; signedIn: boolean; params: Omit<Params, "page"> }) {
  const [posts, setPosts] = useState(() => initial.map(withPatch));
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(0);
  const [pending, start] = useTransition();
  const sentinel = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const storeKey = `heresias:feed:${JSON.stringify(params)}`;

  // Volta para a lista: restaura o que já foi carregado e a posição de rolagem (em vez de recarregar do zero)
  useEffect(() => {
    try {
      if (Date.now() - Number(sessionStorage.getItem("heresias:popped") ?? 0) > 4000) return; // só ao voltar
      const raw = sessionStorage.getItem(storeKey);
      if (!raw) return;
      const s = JSON.parse(raw) as { posts: PostWithViewer[]; hasMore: boolean; page: number; y: number; at: number };
      if (Date.now() - s.at > 30 * 60_000 || !s.posts.length) return;
      setPosts(s.posts); setHasMore(s.hasMore); setPage(s.page);
      requestAnimationFrame(() => window.scrollTo(0, s.y));
    } catch { /* sem storage: segue com a lista inicial */ }
  }, [storeKey]);
  const snap = useRef({ posts, hasMore, page });
  snap.current = { posts, hasMore, page };
  const yRef = useRef(0);
  useEffect(() => {
    const onScroll = () => { yRef.current = window.scrollY; };
    const save = () => { try { sessionStorage.setItem(storeKey, JSON.stringify({ ...snap.current, y: yRef.current, at: Date.now() })); } catch { /* ignora */ } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", save);
    return () => { save(); window.removeEventListener("scroll", onScroll); window.removeEventListener("pagehide", save); };
  }, [storeKey]);
  // curtidas/favoritos feitos nos cartões entram no que será restaurado
  useEffect(() => {
    const on = (e: Event) => {
      const { id, patch } = (e as CustomEvent<{ id: string; patch: Partial<PostWithViewer> }>).detail;
      setPosts((cur) => cur.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    };
    window.addEventListener("heresias:post", on);
    return () => window.removeEventListener("heresias:post", on);
  }, []);

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
