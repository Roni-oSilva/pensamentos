"use client";
import { useState } from "react";
import { registerShare } from "@/actions/social";

export function ShareButton({ postId, path, title, count }: { postId: string; path: string; title: string; count: number }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shares, setShares] = useState(count);
  const url = () => `${window.location.origin}${path}`;
  const bump = () => { setShares((n) => n + 1); void registerShare(postId); };

  async function share() {
    if (typeof navigator.share === "function") {
      try { await navigator.share({ title, url: url() }); bump(); return; } catch { /* cancelado */ }
    }
    setOpen((v) => !v);
  }
  async function copy() {
    try { await navigator.clipboard.writeText(url()); setCopied(true); bump(); setTimeout(() => setCopied(false), 1800); } catch { /* sem permissão */ }
  }
  const enc = (s: string) => encodeURIComponent(s);

  return (
    <span className="relative">
      <button type="button" onClick={share} className="action" aria-label="Compartilhar" aria-expanded={open}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" /></svg>
        <span>{shares}</span>
      </button>
      {open && (
        <div className="absolute bottom-full right-0 z-20 mb-2 w-48 animate-rise space-y-1 rounded-lg border border-ink-600 bg-ink-900 p-2 text-sm shadow-2xl">
          <button type="button" onClick={copy} className="block w-full rounded px-3 py-2 text-left hover:bg-ink-800">{copied ? "Link copiado ✓" : "Copiar link"}</button>
          <a onClick={bump} className="block rounded px-3 py-2 hover:bg-ink-800" target="_blank" rel="noopener noreferrer"
            href={`https://wa.me/?text=${enc(`${title} ${typeof window !== "undefined" ? window.location.origin : ""}${path}`)}`}>WhatsApp</a>
          <a onClick={bump} className="block rounded px-3 py-2 hover:bg-ink-800" target="_blank" rel="noopener noreferrer"
            href={`https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(typeof window !== "undefined" ? window.location.origin + path : path)}`}>X / Twitter</a>
          <a onClick={bump} className="block rounded px-3 py-2 hover:bg-ink-800" target="_blank" rel="noopener noreferrer"
            href={`https://www.facebook.com/sharer/sharer.php?u=${enc(typeof window !== "undefined" ? window.location.origin + path : path)}`}>Facebook</a>
        </div>
      )}
    </span>
  );
}
