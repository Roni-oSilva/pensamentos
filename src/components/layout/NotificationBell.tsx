"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { NotifIcon } from "@/components/ui/NotifIcon";
import { NOTIF_TEXT, isSystemNotif, notifHref, type AdminPending, type NotifItem } from "@/lib/notifications";
import { timeAgo } from "@/lib/utils";

interface Props { unread: number; items: NotifItem[]; admin: AdminPending | null }

/** Sino do cabeçalho: abre um painel com as últimas notificações e, para a equipe, as pendências do painel. */
export function NotificationBell({ unread, items, admin }: Props) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const box = useRef<HTMLDivElement>(null);
  const pending = admin ? admin.posts + admin.reports + admin.feedback : 0;
  const total = unread + pending;

  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onDown); };
  }, [open]);

  const adminRows = admin ? [
    { href: "/admin/moderation", label: "Publicações para aprovar", n: admin.posts },
    { href: "/admin/reports", label: "Denúncias abertas", n: admin.reports },
    { href: "/admin/feedback", label: "Mensagens novas", n: admin.feedback },
  ].filter((r) => r.n > 0) : [];

  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="true"
        aria-label={total > 0 ? `Notificações: ${total} novas` : "Notificações"} title="Notificações"
        className="relative grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-ink-600 text-ash-100 transition hover:border-ash-400 hover:bg-ink-800 active:scale-90 md:h-10 md:w-10">
        <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={total > 0 ? "origin-top animate-bell" : ""}>
          <path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9Z" /><path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
        {total > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid min-w-[1.25rem] place-items-center rounded-full bg-blood-soft px-1 text-[11px] font-bold leading-5 text-white ring-2 ring-ink-950">{total > 9 ? "9+" : total}</span>
        )}
      </button>
      {open && (
        <div role="menu" className="notif-panel fixed inset-x-3 top-[4.25rem] z-50 max-h-[75vh] overflow-y-auto rounded-xl border border-ink-600 bg-ink-900 shadow-2xl md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-2 md:w-96">
          {adminRows.length > 0 && (
            <div className="border-b border-ink-700 p-2">
              <p className="eyebrow px-2 pb-1 pt-1">Painel</p>
              {adminRows.map((r) => (
                <Link key={r.href} href={r.href} className="flex min-h-[44px] items-center justify-between rounded-lg px-2 text-sm text-ash-100 hover:bg-ink-800">
                  <span>{r.label}</span><span className="rounded-full bg-blood-soft px-2 text-xs font-bold leading-5 text-white">{r.n}</span>
                </Link>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between px-4 pb-1 pt-3">
            <p className="eyebrow">Notificações{unread > 0 ? ` · ${unread} nova${unread > 1 ? "s" : ""}` : ""}</p>
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ash-400">Tudo calmo por aqui.</p>
          ) : (
            <ul className="p-2">
              {items.map((n) => (
                <li key={n.id}>
                  <Link href={notifHref(n)} className={`flex items-center gap-3 rounded-lg p-2 hover:bg-ink-800 ${n.read ? "" : "bg-ink-800/60"}`}>
                    {n.actor && !isSystemNotif(n.type) ? <Avatar src={n.actor.avatar_url} name={n.actor.username} size={36} /> : <NotifIcon type={n.type} />}
                    <span className="min-w-0 flex-1 text-sm leading-snug text-ash-200">
                      {n.actor && !isSystemNotif(n.type) && <strong className="text-white">@{n.actor.username} </strong>}{NOTIF_TEXT[n.type]}
                      <span className="block text-xs text-ash-400">{timeAgo(n.created_at)}</span>
                    </span>
                    {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-blood-soft" aria-label="Não lida" />}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/notificacoes" className="block border-t border-ink-700 px-4 py-3 text-center text-sm text-ash-100 hover:bg-ink-800">Ver todas as notificações</Link>
        </div>
      )}
    </div>
  );
}
