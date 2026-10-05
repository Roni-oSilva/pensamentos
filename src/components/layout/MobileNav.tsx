"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export interface NavLink { href: string; label: string }

/** Menu em tela cheia para celulares; fecha ao navegar. */
export function MobileNav({ links, children }: { links: NavLink[]; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className="md:hidden">
      <button type="button" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Fechar menu" : "Abrir menu"}
        onClick={() => setOpen((v) => !v)} className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-ink-600">
        <span className="relative block h-3 w-5">
          <span className={`absolute left-0 h-px w-5 bg-ash-100 transition ${open ? "top-1.5 rotate-45" : "top-0"}`} />
          <span className={`absolute left-0 top-1.5 h-px w-5 bg-ash-100 transition ${open ? "opacity-0" : ""}`} />
          <span className={`absolute left-0 h-px w-5 bg-ash-100 transition ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
        </span>
      </button>
      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 top-16 bottom-0 z-40 animate-rise overflow-y-auto bg-ink-950/98 px-6 py-8 backdrop-blur">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="border-b border-ink-700 py-4 font-display text-3xl text-ash-100">{l.label}</Link>
            ))}
          </nav>
          <div className="mt-8 flex flex-col gap-3">{children}</div>
        </div>
      )}
    </div>
  );
}
