"use client";
import { useEffect, useState } from "react";

const KEY = "igreja:theme";
type Theme = "dark" | "light";

/** Botão sol/lua: alterna entre o tema escuro (fundo preto) e o claro (fundo branco). A escolha fica guardada no navegador. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => { setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark"); }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(KEY, next); } catch { /* sem storage: vale só nesta visita */ }
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next === "dark" ? "#050505" : "#fcfbf8");
  }

  const toLight = theme === "dark";
  return (
    <button type="button" onClick={toggle} aria-label={toLight ? "Mudar para o tema claro" : "Mudar para o tema escuro"} title={toLight ? "Tema claro" : "Tema escuro"}
      className={`relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-ink-600 text-ash-100 transition hover:border-ash-400 hover:bg-ink-800 active:scale-90 md:h-10 md:w-10 ${className}`}>
      {/* sol (aparece no tema escuro: toque para clarear) */}
      <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
        className={`absolute transition duration-300 ${toLight ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"}`}>
        <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      {/* lua (aparece no tema claro: toque para escurecer) */}
      <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        className={`absolute transition duration-300 ${toLight ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"}`}>
        <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8z" />
      </svg>
    </button>
  );
}
