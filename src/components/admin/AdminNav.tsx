"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/constants";

const ITEMS: { href: string; label: string; adminOnly?: boolean }[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/posts", label: "Publicações", adminOnly: true },
  { href: "/admin/posts/new", label: "Nova publicação", adminOnly: true },
  { href: "/admin/community", label: "Comunidade" },
  { href: "/admin/moderation", label: "Moderação" },
  { href: "/admin/users", label: "Usuários", adminOnly: true },
  { href: "/admin/comments", label: "Comentários" },
  { href: "/admin/reports", label: "Denúncias" },
  { href: "/admin/categories", label: "Categorias", adminOnly: true },
  { href: "/admin/tags", label: "Tags", adminOnly: true },
  { href: "/admin/media", label: "Mídia", adminOnly: true },
  { href: "/admin/analytics", label: "Estatísticas" },
  { href: "/admin/settings", label: "Configurações", adminOnly: true },
  { href: "/admin/audit-logs", label: "Logs de auditoria", adminOnly: true },
];

/** O menu só esconde itens; a autorização real acontece em cada página/ação no servidor. */
export function AdminNav({ role }: { role: Role }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const items = ITEMS.filter((i) => !i.adminOnly || role === "ADMIN");
  const isActive = (i: { href: string }) =>
    i.href === "/admin" ? path === i.href : path === i.href || (path.startsWith(i.href + "/") && !ITEMS.some((o) => o.href !== i.href && o.href.startsWith(i.href + "/") && path.startsWith(o.href)));
  const current = items.find(isActive) ?? items[0]!;

  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const link = (i: (typeof ITEMS)[number], cls: string) => (
    <Link key={i.href} href={i.href} aria-current={isActive(i) ? "page" : undefined} className={`${cls} ${isActive(i) ? "bg-ash-100 text-ink-950" : "text-ash-300 hover:bg-ink-800 hover:text-white"}`}>{i.label}</Link>
  );

  return (
    <>
      {/* Celular/tablet: botão fixo com a seção atual + painel em grade, fácil de tocar */}
      <div className="sticky top-16 z-40 -mx-5 border-b border-ink-700 bg-ink-950/95 px-5 py-2 backdrop-blur lg:hidden">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="admin-menu"
          className="flex min-h-[48px] w-full items-center justify-between rounded-xl border border-ink-600 bg-ink-900 px-4 text-left text-sm text-white active:scale-[0.99]">
          <span><span className="eyebrow mr-2 hidden min-[380px]:inline">Painel</span>{current.label}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden><path d="m6 9 6 6 6-6" /></svg>
        </button>
        {open && (
          <>
            <button type="button" aria-label="Fechar menu" className="fixed inset-0 top-[7.5rem] -z-10 bg-black/60" onClick={() => setOpen(false)} />
            <nav id="admin-menu" aria-label="Administração" className="mt-2 grid max-h-[70vh] grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-ink-600 bg-ink-900 p-2 shadow-2xl">
              {items.map((i) => link(i, "flex min-h-[48px] items-center rounded-lg px-3 text-sm transition active:scale-95"))}
            </nav>
          </>
        )}
      </div>
      {/* Desktop: menu lateral */}
      <nav aria-label="Administração" className="hidden gap-1 lg:flex lg:flex-col">
        {items.map((i) => link(i, "whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors"))}
      </nav>
    </>
  );
}
