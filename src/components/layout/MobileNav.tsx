"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export interface NavLink { href: string; label: string }

/**
 * Menu em tela cheia para celulares; fecha ao navegar, ao tocar fora ou com Esc.
 * Renderizado em um portal no <body>: o cabeçalho usa backdrop-filter, que prende elementos `fixed`
 * à altura do próprio cabeçalho e deixava o menu sem área visível.
 */
export function MobileNav({ links, children }: { links: NavLink[]; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const panel = (
    <div id="mobile-menu" className="fixed inset-x-0 bottom-0 top-16 z-[60] overflow-y-auto overscroll-contain bg-ink-950 px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-5 lg:hidden"
      onClick={(e) => { if ((e.target as HTMLElement).closest("a,button[type=submit]")) setOpen(false); }}>
      <form action="/explorar" role="search" className="mb-4">
        <input name="q" type="search" placeholder="Buscar versículos, frases, pessoas…" aria-label="Buscar" maxLength={80} className="field" />
      </form>
      <nav aria-label="Principal" className="flex flex-col">
        {links.map((l) => (
          <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? "page" : undefined}
            className={`flex min-h-[60px] items-center justify-between border-b border-ink-700 font-display text-3xl transition active:bg-ink-800 ${isActive(l.href) ? "text-poster" : "text-ash-100"}`}>
            {l.label}<span aria-hidden className="text-lg text-ash-400">→</span>
          </Link>
        ))}
      </nav>
      <div className="mt-6 grid gap-3">{children}</div>
    </div>
  );

  return (
    <div className="lg:hidden">
      <button type="button" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Fechar menu" : "Abrir menu"}
        onClick={() => setOpen((v) => !v)} className="relative z-[70] inline-flex h-11 w-11 items-center justify-center rounded-lg border border-ink-600 active:scale-95">
        <span className="relative block h-3 w-5">
          <span className={`absolute left-0 h-px w-5 bg-ash-100 transition ${open ? "top-1.5 rotate-45" : "top-0"}`} />
          <span className={`absolute left-0 top-1.5 h-px w-5 bg-ash-100 transition ${open ? "opacity-0" : ""}`} />
          <span className={`absolute left-0 h-px w-5 bg-ash-100 transition ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
        </span>
      </button>
      {open && mounted && createPortal(panel, document.body)}
    </div>
  );
}
