"use client";
/** Notificações push no aparelho: suporte, permissão e inscrição (lado do navegador). */

export const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export type PushSupport = "ok" | "needs-install" | "unsupported" | "off";

export function pushSupport(): PushSupport {
  if (!VAPID_PUBLIC) return "off"; // chaves ainda não configuradas na Vercel
  if (typeof window === "undefined") return "unsupported";
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return ios && !standalone ? "needs-install" : "unsupported";
  if (ios && !standalone) return "needs-install"; // no iPhone, só com o app na tela inicial
  return "ok";
}

function keyBytes(base64: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function registration() {
  const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js", { scope: "/" }));
  return navigator.serviceWorker.ready.then(() => reg);
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (pushSupport() !== "ok") return null;
  try { return await (await registration()).pushManager.getSubscription(); } catch { return null; }
}

/** Pede permissão (precisa vir de um toque) e inscreve o aparelho. */
export async function subscribe(): Promise<PushSubscription | "denied" | null> {
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return perm === "denied" ? "denied" : null;
  const reg = await registration();
  return (await reg.pushManager.getSubscription()) ?? reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC) });
}
