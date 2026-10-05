"use client";
import Link from "next/link";
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
  return (
    <nav aria-label="Administração" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {ITEMS.filter((i) => !i.adminOnly || role === "ADMIN").map((i) => {
        const active = i.href === "/admin" ? path === i.href : path === i.href || (path.startsWith(i.href + "/") && !ITEMS.some((o) => o.href !== i.href && o.href.startsWith(i.href + "/") && path.startsWith(o.href)));
        return <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined}
          className={`whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors ${active ? "bg-ash-100 text-ink-950" : "text-ash-300 hover:bg-ink-800 hover:text-white"}`}>{i.label}</Link>;
      })}
    </nav>
  );
}
