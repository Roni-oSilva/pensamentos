"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toggleFavorite, toggleLike } from "@/actions/social";
import { ReportButton } from "@/components/moderation/ReportButton";
import { ShareButton } from "./ShareButton";

interface Props {
  postId: string; path: string; title: string; text: string; signedIn: boolean;
  liked: boolean; favorited: boolean; likes: number; comments: number; favorites: number; shares: number;
}

export function ActionBar(p: Props) {
  // Estado local (não useOptimistic): a página não recarrega após a ação, então o valor precisa permanecer.
  const [like, setLike] = useState({ on: p.liked, n: p.likes });
  const [fav, setFav] = useState({ on: p.favorited, n: p.favorites });
  const [busy, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function guard(fn: () => void) {
    if (!p.signedIn) { window.location.href = `/login?next=${encodeURIComponent(p.path)}`; return; }
    if (busy) return;
    setError(null);
    fn();
  }
  type S = { on: boolean; n: number };
  function flip(cur: S, set: (s: S) => void, act: (id: string) => Promise<{ ok: true; active: boolean } | { ok: false; error: string }>) {
    const target = !cur.on;
    const at = (on: boolean): S => ({ on, n: Math.max(0, cur.n + (on === cur.on ? 0 : on ? 1 : -1)) });
    set(at(target));
    start(async () => {
      try {
        const r = await act(p.postId);
        if (!r.ok) { set(cur); setError(r.error); } else set(at(r.active));
      } catch { set(cur); setError("Não foi possível concluir a ação. Tente novamente."); }
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 text-ash-300">
        <button type="button" className="action" aria-pressed={like.on} aria-label={like.on ? "Descurtir" : "Curtir"}
          onClick={() => guard(() => flip(like, setLike, toggleLike))}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={like.on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" className={like.on ? "text-blood-soft" : ""}><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" /></svg>
          <span>{like.n}</span>
        </button>
        <Link href={`${p.path}#comentarios`} className="action" aria-label="Comentários">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z" /></svg>
          <span>{p.comments}</span>
        </Link>
        <button type="button" className="action" aria-pressed={fav.on} aria-label={fav.on ? "Remover dos favoritos" : "Favoritar"}
          onClick={() => guard(() => flip(fav, setFav, toggleFavorite))}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={fav.on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6"><path d="M6 3h12v18l-6-4-6 4z" /></svg>
          <span>{fav.n}</span>
        </button>
        <ShareButton postId={p.postId} path={p.path} title={p.title} text={p.text} count={p.shares} />
        <span className="ml-auto"><ReportButton targetType="POST" targetId={p.postId} signedIn={p.signedIn} /></span>
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}
