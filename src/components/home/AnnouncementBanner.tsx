"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";

const KEY = "igreja:aviso-fechado";

/** Aviso da igreja no início do app; cada pessoa pode fechar (e só volta quando houver um aviso novo). */
export function AnnouncementBanner({ id, title, body, url }: { id: string; title: string; body: string; url: string }) {
  const [hidden, setHidden] = useState(true);
  useEffect(() => { try { setHidden(localStorage.getItem(KEY) === id); } catch { setHidden(false); } }, [id]);
  if (hidden) return null;
  const close = () => { setHidden(true); try { localStorage.setItem(KEY, id); } catch { /* ignora */ } };
  return (
    <div className="force-dark relative mb-6 overflow-hidden rounded-2xl p-4 pr-12 text-white" style={{ background: "linear-gradient(160deg,#e1251b,#8f140e)" }}>
      <Link href={url} onClick={close} className="flex items-start gap-3">
        <Megaphone className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <span className="min-w-0">
          <span className="block font-semibold">{title}</span>
          <span className="mt-1 block text-sm leading-snug text-white/90">{body}</span>
        </span>
      </Link>
      <button type="button" onClick={close} aria-label="Fechar aviso" className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full text-white/80"><X className="h-4 w-4" /></button>
    </div>
  );
}
