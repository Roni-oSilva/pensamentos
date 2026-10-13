"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Camera, ChevronRight, Images } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { InstantViewer } from "./InstantViewer";
import { timeAgo } from "@/lib/utils";
import type { InboxFriend } from "@/lib/instants";

export function InstantsHome({ inbox, mine, openUser }: { inbox: InboxFriend[]; mine: number; openUser?: string }) {
  const router = useRouter();
  const [list, setList] = useState(inbox);
  const startAt = openUser ? list.findIndex((f) => f.username === openUser) : -1;
  const [open, setOpen] = useState<number | null>(startAt >= 0 ? startAt : null);

  function close(seen: string[]) {
    setOpen(null);
    // o que foi visto some da lista (não dá para ver de novo)
    setList((l) => l.map((f) => ({ ...f, items: f.items.filter((i) => !seen.includes(i.id)) })).filter((f) => f.items.length));
    router.replace("/momentos", { scroll: false });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <Link href="/momentos/novo" className="instant-cta group relative flex items-center gap-4 overflow-hidden rounded-3xl p-5 text-white">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white text-black transition group-active:scale-90"><Camera className="h-7 w-7" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-xl font-bold">Postar um momento</span>
          <span className="block text-sm text-white/80">Uma foto agora, do jeito que está. Vai para toda a comunidade e some depois de visto.</span>
        </span>
        <ChevronRight className="h-6 w-6 shrink-0 opacity-70" />
      </Link>

      <section aria-labelledby="rec-h" className="space-y-3">
        <h2 id="rec-h" className="eyebrow">Recebidos</h2>
        {list.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-white">Nenhum momento novo agora.</p>
            <p className="mt-1 text-sm text-ash-400">Quando alguém da comunidade postar, aparece aqui. Ative as notificações para ser avisado.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-3 gap-4 sm:grid-cols-4">
            {list.map((f, i) => (
              <li key={f.authorId}>
                <button type="button" onClick={() => setOpen(i)} className="group flex w-full flex-col items-center gap-2 text-center">
                  <span className="instant-ring relative rounded-full p-[3px] transition group-active:scale-95">
                    <span className="block rounded-full bg-ink-950 p-[3px]"><Avatar src={f.avatarUrl} name={f.username} size={72} /></span>
                    {f.items.length > 1 && <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-white px-1.5 text-xs font-bold text-black">{f.items.length}</span>}
                  </span>
                  <span className="w-full truncate text-sm font-medium text-white">{f.name}</span>
                  <span className="-mt-1.5 text-[11px] text-ash-400">{timeAgo(f.items.at(-1)!.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href="/momentos/meus" className="card flex items-center gap-4 p-5 transition hover:border-ash-400">
        <Images className="h-6 w-6 text-ash-300" />
        <span className="flex-1"><span className="block font-semibold text-white">Seus momentos</span><span className="block text-sm text-ash-400">{mine ? `${mine} nos últimos 30 dias · quem viu e as reações` : "Os que você enviar ficam guardados aqui por 30 dias (só você vê)."}</span></span>
        <ChevronRight className="h-5 w-5 text-ash-400" />
      </Link>

      {open !== null && <InstantViewer friends={list} start={open} onClose={close} />}
    </div>
  );
}
