"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { openInstant, reactInstant } from "@/actions/instants";
import { Avatar } from "@/components/ui/Avatar";
import { ReportButton } from "@/components/moderation/ReportButton";
import { timeAgo } from "@/lib/utils";
import type { InboxFriend } from "@/lib/instants";
import { Overlay } from "./Overlay";

const REACTIONS = ["❤️", "🙏", "🔥", "😂", "😮"];
type Opened = { id: string; url: string; caption: string | null; createdAt: string } | { id: string; error: string };

/**
 * Mostra os momentos de um amigo em sequência. Cada foto é aberta no servidor só quando aparece na tela
 * (é aí que conta como vista) — depois de fechar, ela não volta.
 */
export function InstantViewer({ friends, start, onClose }: { friends: InboxFriend[]; start: number; onClose: (seen: string[]) => void }) {
  const [fi, setFi] = useState(start);
  const [ii, setIi] = useState(0);
  const [cur, setCur] = useState<Opened | null>(null);
  const [reacted, setReacted] = useState<string | null>(null);
  const [burst, setBurst] = useState(0);
  const seen = useRef<string[]>([]);
  const friend = friends[fi];
  const item = friend?.items[ii];

  useEffect(() => {
    if (!item) return;
    let alive = true;
    setCur(null); setReacted(null);
    openInstant(item.id).then((r) => {
      if (!alive) return;
      seen.current.push(item.id);
      setCur(r.ok ? { id: item.id, url: r.url, caption: r.caption, createdAt: r.createdAt } : { id: item.id, error: r.error });
    });
    return () => { alive = false; };
  }, [item]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(seen.current); if (e.key === "ArrowRight" || e.key === " ") next(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  function next() {
    if (!friend) return onClose(seen.current);
    if (ii + 1 < friend.items.length) setIi(ii + 1);
    else if (fi + 1 < friends.length) { setFi(fi + 1); setIi(0); }
    else onClose(seen.current);
  }

  async function react(e: string) {
    if (!cur || "error" in cur) return;
    setReacted(e); setBurst((n) => n + 1);
    navigator.vibrate?.(12);
    await reactInstant(cur.id, e);
  }

  if (!friend) return null;
  return (
    <Overlay>
    <div className="instant-stage force-dark fixed inset-0 z-[70] flex flex-col bg-black text-white" role="dialog" aria-modal aria-label={`Momentos de ${friend.name}`}>
      <div className="flex gap-1 px-3 pt-[max(0.6rem,env(safe-area-inset-top))]">
        {friend.items.map((it, i) => <span key={it.id} className={`h-[3px] flex-1 rounded-full ${i <= ii ? "bg-white" : "bg-white/30"}`} />)}
      </div>
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar src={friend.avatarUrl} name={friend.username} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{friend.name}</p>
          <p className="text-xs text-white/60">{cur && !("error" in cur) ? timeAgo(cur.createdAt) : "…"}</p>
        </div>
        <button type="button" onClick={() => onClose(seen.current)} aria-label="Fechar" className="grid h-10 w-10 place-items-center rounded-full bg-white/10"><X className="h-5 w-5" /></button>
      </div>

      <button type="button" onClick={next} aria-label="Próximo" className="relative mx-auto flex w-full max-w-md flex-1 items-center px-3">
        <span className="relative block aspect-[3/4] w-full overflow-hidden rounded-[2rem] bg-neutral-900">
          {!cur && <span className="absolute inset-0 grid place-items-center text-sm text-white/60">Abrindo…</span>}
          {cur && "error" in cur && <span className="absolute inset-0 grid place-items-center p-8 text-center text-sm text-white/70">{cur.error}</span>}
          {cur && !("error" in cur) && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cur.url} alt={cur.caption ?? `Momento de ${friend.name}`} className="instant-pop absolute inset-0 h-full w-full object-cover" draggable={false} />
              {cur.caption && <span className="absolute inset-x-4 bottom-4 rounded-full bg-black/55 px-5 py-3 text-center text-[15px] backdrop-blur">{cur.caption}</span>}
            </>
          )}
          {reacted && <span key={burst} className="instant-burst pointer-events-none absolute inset-0 grid place-items-center text-8xl">{reacted}</span>}
        </span>
      </button>

      <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        <div className="mx-auto flex max-w-md items-center justify-center gap-2">
          {REACTIONS.map((e) => (
            <button key={e} type="button" onClick={() => react(e)} disabled={!cur || "error" in cur} aria-label={`Reagir com ${e}`}
              className={`grid h-12 w-12 place-items-center rounded-full text-2xl transition active:scale-90 ${reacted === e ? "bg-white/25 ring-2 ring-white" : "bg-white/10"}`}>{e}</button>
          ))}
        </div>
        <div className="mx-auto mt-3 flex max-w-md items-center justify-between text-xs text-white/55">
          <span>Este momento some quando você fechar.</span>
          <ReportButton targetType="PROFILE" targetId={friend.authorId} signedIn label="Denunciar" />
        </div>
      </div>
    </div>
    </Overlay>
  );
}
