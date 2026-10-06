"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const I = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  study: <><path d="M4 5.5C6.5 4 9.5 4 12 5.5v13C9.5 17 6.5 17 4 18.5z" /><path d="M12 5.5C14.5 4 17.5 4 20 5.5v13C17.5 17 14.5 17 12 18.5" /></>,
  community: <><circle cx="9" cy="8" r="3.2" /><path d="M3 20a6 6 0 0 1 12 0" /><circle cx="17.5" cy="9" r="2.5" /><path d="M16 14.2A5 5 0 0 1 21.5 19" /></>,
  forum: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />,
  me: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
};

/**
 * Barra de abas inferior, como em um app nativo. Só aparece quando o site está instalado (modo app)
 * — controlado por CSS em html[data-app] — e em telas pequenas.
 * Para a troca ser instantânea: as abas são carregadas por inteiro antes do toque (prefetch) e a aba tocada
 * acende na hora, sem esperar a próxima tela chegar.
 */
export function AppTabBar({ meHref }: { meHref: string }) {
  const path = usePathname();
  const [tapped, setTapped] = useState<string | null>(null);
  useEffect(() => setTapped(null), [path]);
  const tabs = [
    { href: "/", label: "Início", icon: I.home, active: path === "/" },
    { href: "/estudos", label: "Estudos", icon: I.study, active: path.startsWith("/estudos") },
    { href: "/comunidade", label: "Comunidade", icon: I.community, active: path.startsWith("/comunidade") || path.startsWith("/comunhao") },
    { href: "/forum", label: "Fórum", icon: I.forum, active: path.startsWith("/forum") },
    { href: meHref, label: "Você", icon: I.me, active: path.startsWith("/perfil") || path.startsWith("/configuracoes") || path.startsWith("/login") },
  ];
  return (
    <nav aria-label="Navegação do app" className="app-tabbar fixed inset-x-0 bottom-0 z-[58] border-t border-ink-700 bg-ink-950/95 backdrop-blur-md">
      <ul className="mx-auto flex max-w-xl items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {tabs.map(({ active: onPath, ...t }) => {
          const active = tapped ? tapped === t.href : onPath;
          return (
          <li key={t.label} className="flex-1">
            <Link href={t.href} prefetch aria-current={onPath ? "page" : undefined} onClick={() => setTapped(t.href)}
              className={`flex h-[58px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition active:scale-90 ${active ? "text-white" : "text-ash-400"}`}>
              <span className={`grid h-7 w-12 place-items-center rounded-full transition ${active ? "bg-ash-100/15" : ""}`}>
                <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.7} strokeLinecap="round" strokeLinejoin="round">{t.icon}</svg>
              </span>
              {t.label}
            </Link>
          </li>
          );
        })}
      </ul>
    </nav>
  );
}
