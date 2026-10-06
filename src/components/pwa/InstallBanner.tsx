"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { canPromptInstall, detectPlatform, isStandalone, onInstallChange, promptInstall, type Platform } from "@/lib/pwa";

const KEY = "igreja:install-dismissed";
const DAYS = 21;
const HIDE_ON = ["/app", "/admin", "/login", "/cadastro", "/mfa", "/recuperar-senha"];

/** Convite discreto para instalar o app no celular. Some por 21 dias ao tocar em “Agora não”. */
export function InstallBanner() {
  const path = usePathname();
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [canPrompt, setCanPrompt] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    const p = detectPlatform();
    setPlatform(p);
    if (p === "desktop") return;
    try {
      const last = Number(localStorage.getItem(KEY) ?? 0);
      if (Date.now() - last < DAYS * 864e5) return;
    } catch { /* sem storage: mostra normalmente */ }
    setCanPrompt(canPromptInstall());
    const off = onInstallChange(() => setCanPrompt(canPromptInstall()));
    const t = setTimeout(() => setShow(true), 6000);
    return () => { clearTimeout(t); off(); };
  }, []);

  const dismiss = () => {
    setShow(false);
    try { localStorage.setItem(KEY, String(Date.now())); } catch { /* ignora */ }
  };

  if (!show || HIDE_ON.some((h) => path === h || path.startsWith(h + "/"))) return null;
  return (
    <div role="dialog" aria-label="Instalar o app" className="no-print fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[65] animate-rise rounded-2xl border border-ink-600 bg-ink-900/95 p-4 shadow-2xl backdrop-blur md:hidden">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/pwa/icon-192.png" alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white">Instale o app Igreja de Cristo</p>
          <p className="mt-0.5 text-sm text-ash-300">
            {platform === "ios-safari" ? "Toque em Compartilhar e depois em “Adicionar à Tela de Início”." : platform === "ios-other" ? "Abra este site no Safari para instalar no iPhone." : "Abra direto da tela inicial, em tela cheia, como um app."}
          </p>
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={dismiss} className="btn-ghost">Agora não</button>
        {canPrompt ? (
          <button type="button" className="btn-primary" onClick={async () => { const r = await promptInstall(); if (r !== "unavailable") dismiss(); }}>Instalar</button>
        ) : (
          <Link href="/app" className="btn-primary" onClick={() => setShow(false)}>Ver como instalar</Link>
        )}
      </div>
    </div>
  );
}
