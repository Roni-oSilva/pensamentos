"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, Trash2 } from "lucide-react";
import { deleteInstant } from "@/actions/instants";
import { Avatar } from "@/components/ui/Avatar";
import { toast } from "@/lib/toast";
import { timeAgo } from "@/lib/utils";
import type { MyInstant } from "@/lib/instants";
import { Overlay } from "./Overlay";

export function MyInstants({ items }: { items: MyInstant[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const open = items.find((i) => i.id === openId) ?? null;

  function remove(id: string) {
    if (!window.confirm("Apagar este instante? Quem ainda não viu não vai mais ver.")) return;
    start(async () => {
      const r = await deleteInstant(id);
      if (!r.ok) { toast(r.error); return; }
      setOpenId(null); toast("Instante apagado."); router.refresh();
    });
  }

  if (!items.length) return <div className="card p-6 text-center text-ash-300">Você ainda não enviou instantes nos últimos 30 dias.</div>;
  return (
    <>
      <ul className="grid grid-cols-3 gap-2 sm:gap-3">
        {items.map((it) => {
          const live = new Date(it.expiresAt).getTime() > Date.now();
          return (
            <li key={it.id}>
              <button type="button" onClick={() => setOpenId(it.id)} className="relative block aspect-[3/4] w-full overflow-hidden rounded-2xl bg-ink-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {it.url && <img src={it.url} alt={it.caption ?? "Seu instante"} className="h-full w-full object-cover" loading="lazy" />}
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-2 pb-1.5 pt-6 text-[11px] text-white">
                  <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{it.views.length}</span>
                  <span>{it.views.filter((v) => v.reaction).slice(0, 3).map((v) => v.reaction).join("")}</span>
                </span>
                {live && <span className="absolute left-1.5 top-1.5 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-black">no ar</span>}
              </button>
            </li>
          );
        })}
      </ul>

      {open && (
        <Overlay>
        <div className="instant-stage force-dark fixed inset-0 z-[70] flex flex-col bg-black/95 text-white" role="dialog" aria-modal aria-label="Seu instante" onClick={() => setOpenId(null)}>
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between text-sm">
              <span>{timeAgo(open.createdAt)} · {new Date(open.expiresAt).getTime() > Date.now() ? "no ar" : "encerrado"}</span>
              <button type="button" onClick={() => setOpenId(null)} className="rounded-full bg-white/10 px-4 py-2">Fechar</button>
            </div>
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[2rem] bg-neutral-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {open.url && <img src={open.url} alt={open.caption ?? "Seu instante"} className="h-full w-full object-cover" />}
              {open.caption && <span className="absolute inset-x-4 bottom-4 rounded-full bg-black/55 px-5 py-3 text-center text-[15px] backdrop-blur">{open.caption}</span>}
            </div>
            <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
              <p className="mb-2 text-xs uppercase tracking-widest text-white/60">Visto por {open.views.length}</p>
              <ul className="space-y-2">
                {open.views.map((v) => (
                  <li key={v.username} className="flex items-center gap-3">
                    <Avatar src={v.avatarUrl} name={v.username} size={32} />
                    <span className="flex-1 truncate text-sm">@{v.username} <span className="text-white/50">· {timeAgo(v.viewedAt)}</span></span>
                    {v.reaction && <span className="text-xl">{v.reaction}</span>}
                  </li>
                ))}
              </ul>
            </div>
            <button type="button" disabled={pending} onClick={() => remove(open.id)} className="mt-4 flex items-center justify-center gap-2 rounded-full border border-red-400/50 py-3 text-sm font-semibold text-red-300"><Trash2 className="h-4 w-4" /> Apagar instante</button>
          </div>
        </div>
        </Overlay>
      )}
    </>
  );
}
