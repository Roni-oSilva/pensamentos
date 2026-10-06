"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "@/lib/toast";
import { getPatch, rememberPatch } from "@/lib/post-patches";
import { toggleFavorite, toggleLike } from "@/actions/social";
import { ReportButton } from "@/components/moderation/ReportButton";
import { ShareButton } from "./ShareButton";

interface Props {
  postId: string; path: string; title: string; text: string; signedIn: boolean;
  liked: boolean; favorited: boolean; likes: number; comments: number; favorites: number; shares: number;
}

export function ActionBar(p: Props) {
  // Estado local (não useOptimistic): a página não recarrega após a ação, então o valor precisa permanecer.
  // (com os ajustes feitos há pouco nesta aba, caso a tela tenha vindo da memória do roteador)
  const [like, setLike] = useState(() => { const x = getPatch(p.postId); return { on: x?.liked ?? p.liked, n: x?.like_count ?? p.likes }; });
  const [fav, setFav] = useState(() => { const x = getPatch(p.postId); return { on: x?.favorited ?? p.favorited, n: x?.favorite_count ?? p.favorites }; });
  const [busy, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [spark, setSpark] = useState(0); // reinicia a animação de faíscas a cada curtida
  const likeRef = useRef(like);
  likeRef.current = like;

  function guard(fn: () => void) {
    if (!p.signedIn) { window.location.href = `/login?next=${encodeURIComponent(p.path)}`; return; }
    if (busy) return;
    setError(null);
    fn();
  }
  type S = { on: boolean; n: number };
  const announce = (patch: Parameters<typeof rememberPatch>[1]) => {
    rememberPatch(p.postId, patch);
    window.dispatchEvent(new CustomEvent("heresias:post", { detail: { id: p.postId, patch } }));
  };
  function flip(cur: S, set: (s: S) => void, act: (id: string) => Promise<{ ok: true; active: boolean } | { ok: false; error: string }>) {
    const target = !cur.on;
    const at = (on: boolean): S => ({ on, n: Math.max(0, cur.n + (on === cur.on ? 0 : on ? 1 : -1)) });
    set(at(target));
    if (target && typeof navigator !== "undefined") navigator.vibrate?.(12); // retorno tátil no celular
    if (target && act === toggleLike) setSpark((n) => n + 1);
    start(async () => {
      try {
        const r = await act(p.postId);
        if (!r.ok) { set(cur); setError(r.error); } else { set(at(r.active)); if (act === toggleFavorite) toast(r.active ? "Guardado nos seus favoritos." : "Removido dos favoritos."); announce(act === toggleLike ? { liked: r.active, like_count: at(r.active).n } : { favorited: r.active, favorite_count: at(r.active).n }); }
      } catch { set(cur); setError("Não foi possível concluir a ação. Tente novamente."); }
    });
  }

  // duplo toque no texto da publicação (DoubleTapLike) curte, se ainda não estiver curtida
  useEffect(() => {
    const on = (e: Event) => {
      if ((e as CustomEvent).detail !== p.postId) return;
      if (!p.signedIn) { window.location.href = `/login?next=${encodeURIComponent(p.path)}`; return; }
      if (!likeRef.current.on) flip(likeRef.current, setLike, toggleLike);
    };
    window.addEventListener("igreja:like", on);
    return () => window.removeEventListener("igreja:like", on);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="action-bar text-ash-300">
        <button type="button" className="action" aria-pressed={like.on} aria-label={like.on ? "Descurtir" : "Curtir"}
          onClick={() => guard(() => flip(like, setLike, toggleLike))}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={like.on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" className={like.on ? "text-blood-soft" : ""}><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" /></svg>
          <span className="count">{like.n}</span>
          {spark > 0 && like.on && (
            <span key={spark} aria-hidden className="sparks pointer-events-none absolute inset-0">
              {Array.from({ length: 8 }, (_, i) => <i key={i} style={{ "--a": `${i * 45}deg` } as React.CSSProperties} />)}
            </span>
          )}
        </button>
        <Link href={`${p.path}#comentarios`} className="action" aria-label="Comentários">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z" /></svg>
          <span className="count">{p.comments}</span>
        </Link>
        <button type="button" className="action" aria-pressed={fav.on} aria-label={fav.on ? "Remover dos favoritos" : "Favoritar"}
          onClick={() => guard(() => flip(fav, setFav, toggleFavorite))}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={fav.on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6"><path d="M6 3h12v18l-6-4-6 4z" /></svg>
          <span className="count">{fav.n}</span>
        </button>
        <ShareButton postId={p.postId} path={p.path} title={p.title} text={p.text} count={p.shares} />
        <span className="col-span-4 flex justify-center border-t border-ink-700 pt-2 sm:ml-auto sm:col-span-1 sm:border-0 sm:pt-0"><ReportButton targetType="POST" targetId={p.postId} signedIn={p.signedIn} /></span>
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}
