"use client";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { toggleFavorite, toggleLike } from "@/actions/social";
import { ReportButton } from "@/components/moderation/ReportButton";
import { ShareButton } from "./ShareButton";

interface Props {
  postId: string; path: string; title: string; signedIn: boolean;
  liked: boolean; favorited: boolean; likes: number; comments: number; favorites: number; shares: number;
}

export function ActionBar(p: Props) {
  const [like, setLike] = useOptimistic({ on: p.liked, n: p.likes }, (s, on: boolean) => ({ on, n: s.n + (on ? 1 : -1) }));
  const [fav, setFav] = useOptimistic({ on: p.favorited, n: p.favorites }, (s, on: boolean) => ({ on, n: s.n + (on ? 1 : -1) }));
  const [, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function guard(fn: () => void) {
    if (!p.signedIn) { window.location.href = `/login?next=${encodeURIComponent(p.path)}`; return; }
    setError(null);
    fn();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 text-ash-300">
        <button type="button" className="action" aria-pressed={like.on} aria-label={like.on ? "Descurtir" : "Curtir"}
          onClick={() => guard(() => start(async () => { setLike(!like.on); const r = await toggleLike(p.postId); if (!r.ok) setError(r.error); }))}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={like.on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" className={like.on ? "text-blood-soft" : ""}><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" /></svg>
          <span>{like.n}</span>
        </button>
        <Link href={`${p.path}#comentarios`} className="action" aria-label="Comentários">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z" /></svg>
          <span>{p.comments}</span>
        </Link>
        <button type="button" className="action" aria-pressed={fav.on} aria-label={fav.on ? "Remover dos favoritos" : "Favoritar"}
          onClick={() => guard(() => start(async () => { setFav(!fav.on); const r = await toggleFavorite(p.postId); if (!r.ok) setError(r.error); }))}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={fav.on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6"><path d="M6 3h12v18l-6-4-6 4z" /></svg>
          <span>{fav.n}</span>
        </button>
        <ShareButton postId={p.postId} path={p.path} title={p.title} count={p.shares} />
        <span className="ml-auto"><ReportButton targetType="POST" targetId={p.postId} signedIn={p.signedIn} /></span>
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}
