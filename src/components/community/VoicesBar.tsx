"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Voice } from "@/lib/data";
import { Avatar } from "@/components/ui/Avatar";
import { timeAgo } from "@/lib/utils";

const SEEN_KEY = "heresias:seen";
const STEP_MS = 7000;

function readSeen(): Set<string> { try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]") as string[]); } catch { return new Set(); } }
function writeSeen(s: Set<string>) { try { localStorage.setItem(SEEN_KEY, JSON.stringify([...s].slice(-400))); } catch { /* sem storage */ } }

/** Fileira de "bolinhas" (como os stories): foto e nome de quem publicou recentemente. Toque abre as frases da pessoa. */
export function VoicesBar({ voices, signedIn }: { voices: Voice[]; signedIn: boolean }) {
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<{ v: number; p: number } | null>(null);
  useEffect(() => setSeen(readSeen()), []);

  const markSeen = useCallback((id: string) => setSeen((cur) => { if (cur.has(id)) return cur; const n = new Set(cur); n.add(id); writeSeen(n); return n; }), []);
  const unseen = (v: Voice) => v.posts.some((p) => !seen.has(p.id));
  // não vistas primeiro, mantendo a ordem por recência dentro de cada grupo
  const ordered = [...voices].sort((a, b) => Number(unseen(b)) - Number(unseen(a)));

  function openVoice(v: Voice) {
    const idx = voices.indexOf(v);
    const first = Math.max(0, v.posts.findIndex((p) => !seen.has(p.id)));
    setOpen({ v: idx, p: first });
  }

  return (
    <>
      <div className="container-wide">
        <ul aria-label="Quem publicou recentemente" className="flex gap-4 overflow-x-auto pb-2 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <li className="shrink-0">
            <Link href={signedIn ? "/comunidade/nova" : "/cadastro"} className="group flex w-[72px] flex-col items-center gap-1.5 active:scale-95">
              <span className="grid h-[68px] w-[68px] place-items-center rounded-full border-2 border-dashed border-ink-500 text-3xl text-ash-300 transition group-hover:border-poster group-hover:text-white">+</span>
              <span className="w-full truncate text-center text-[11px] text-ash-400">Publicar</span>
            </Link>
          </li>
          {ordered.map((v) => (
            <li key={v.authorId} className="shrink-0">
              <button type="button" onClick={() => openVoice(v)} aria-label={`Ver frases de ${v.name}${unseen(v) ? " (novas)" : ""}`}
                className="group flex w-[72px] flex-col items-center gap-1.5 transition active:scale-95">
                <span className={`rounded-full p-[3px] transition ${unseen(v) ? "bg-gradient-to-tr from-poster via-[#f59e0b] to-[#e8453c] shadow-[0_0_18px_-4px_rgba(232,69,60,.8)]" : "bg-ink-600"}`}>
                  <span className="block rounded-full border-2 border-ink-950 bg-ink-950"><Avatar src={v.avatar} name={v.username} size={60} /></span>
                </span>
                <span className={`w-full truncate text-center text-[11px] ${unseen(v) ? "text-white" : "text-ash-400"}`}>{v.official ? "Heresias" : v.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {open && <Viewer voices={voices} start={open} onClose={() => setOpen(null)} onSeen={markSeen} />}
    </>
  );
}

function Viewer({ voices, start, onClose, onSeen }: { voices: Voice[]; start: { v: number; p: number }; onClose: () => void; onSeen: (id: string) => void }) {
  const [pos, setPos] = useState(start);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voice = voices[pos.v]!;
  const post = voice.posts[pos.p]!;

  const next = useCallback(() => setPos((c) => {
    const v = voices[c.v]!;
    if (c.p + 1 < v.posts.length) return { v: c.v, p: c.p + 1 };
    if (c.v + 1 < voices.length) return { v: c.v + 1, p: 0 };
    onClose(); return c;
  }), [voices, onClose]);
  const prev = useCallback(() => setPos((c) => {
    if (c.p > 0) return { v: c.v, p: c.p - 1 };
    if (c.v > 0) return { v: c.v - 1, p: 0 };
    return c;
  }), []);

  useEffect(() => { onSeen(post.id); }, [post.id, onSeen]);
  useEffect(() => {
    if (paused) return;
    timer.current = setTimeout(next, STEP_MS);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [pos, paused, next]);
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowRight") next(); if (e.key === "ArrowLeft") prev(); };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prevOverflow; document.removeEventListener("keydown", onKey); };
  }, [next, prev, onClose]);

  const big = post.text.length < 140;
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`Frases de ${voice.name}`} className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="relative flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-gradient-to-b from-[#1a0c0c] via-ink-950 to-ink-950 sm:h-[min(92dvh,52rem)] sm:rounded-2xl sm:border sm:border-ink-600"
        onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} onPointerLeave={() => setPaused(false)}>
        <div className="absolute inset-x-3 top-3 z-20 flex gap-1.5" aria-hidden>
          {voice.posts.map((p, i) => (
            <span key={p.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
              <span key={`${pos.v}-${pos.p}`} className="block h-full origin-left rounded-full bg-white"
                style={i < pos.p ? { transform: "scaleX(1)" } : i === pos.p ? { animation: `story ${STEP_MS}ms linear forwards`, animationPlayState: paused ? "paused" : "running" } : { transform: "scaleX(0)" }} />
            </span>
          ))}
        </div>
        <header className="relative z-20 mt-8 flex items-center gap-3 px-4">
          <Avatar src={voice.avatar} name={voice.username} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{voice.official ? "Heresias" : `@${voice.username}`}</p>
            <p className="text-xs text-ash-400">{timeAgo(post.at)}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="grid h-11 w-11 place-items-center rounded-full text-xl text-ash-200 hover:bg-white/10">✕</button>
        </header>
        <div className="relative flex flex-1 flex-col justify-center overflow-y-auto px-7 py-6">
          <span aria-hidden className="pointer-events-none absolute right-4 top-2 font-poster text-[9rem] leading-none text-poster opacity-[.1]">“</span>
          {post.title && <h2 className="mb-4 font-poster text-4xl uppercase leading-none tracking-wide text-white">{post.title}</h2>}
          <p className={`preline font-display leading-snug text-ash-100 ${big ? "text-3xl" : "text-xl"}`}>{post.text}</p>
        </div>
        {/* áreas de toque: esquerda volta, direita avança */}
        <button type="button" aria-label="Anterior" onClick={prev} className="absolute inset-y-24 left-0 z-10 w-1/3" />
        <button type="button" aria-label="Próxima" onClick={next} className="absolute inset-y-24 right-0 z-10 w-2/3" />
        <footer className="relative z-20 flex items-center justify-between gap-3 border-t border-white/10 p-4">
          <span className="text-xs text-ash-400">{pos.p + 1} de {voice.posts.length}</span>
          <Link href={post.path} onClick={onClose} className="btn-primary min-h-[44px]">Abrir publicação</Link>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
