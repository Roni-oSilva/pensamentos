"use client";
/** Estado de instalação do app compartilhado entre o convite (banner) e a página /app. */

export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function captureInstallPrompt() {
  if (typeof window === "undefined" || (window as unknown as { __igrejaPwa?: boolean }).__igrejaPwa) return;
  (window as unknown as { __igrejaPwa?: boolean }).__igrejaPwa = true;
  const early = (window as unknown as { __bip?: InstallPromptEvent }).__bip; // capturado pelo script inicial, antes do React
  if (early) deferred = early;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e as InstallPromptEvent; notify(); });
  window.addEventListener("appinstalled", () => { deferred = null; notify(); });
}

export const canPromptInstall = () => deferred !== null;

export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferred) return "unavailable";
  const e = deferred;
  deferred = null;
  await e.prompt();
  const { outcome } = await e.userChoice;
  notify();
  return outcome;
}

export function onInstallChange(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

export type Platform = "ios-safari" | "ios-other" | "android" | "desktop";
export function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (ios) return /CriOS|FxiOS|EdgiOS|OPiOS|Instagram|FBAN|FBAV/i.test(ua) ? "ios-other" : "ios-safari";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}
