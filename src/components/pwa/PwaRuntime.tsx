"use client";
import { useEffect } from "react";
import { captureInstallPrompt, isStandalone } from "@/lib/pwa";

/** Registra o service worker (só em produção), guarda o convite de instalação e marca o modo app no <html>. */
export function PwaRuntime() {
  useEffect(() => {
    captureInstallPrompt();
    if (isStandalone()) document.documentElement.dataset.app = "1";
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      const register = () => navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => { /* sem SW: o site segue funcionando */ });
      if (document.readyState === "complete") register(); else window.addEventListener("load", register, { once: true });
    }
  }, []);
  return null;
}
