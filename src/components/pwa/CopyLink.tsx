"use client";
import { useState } from "react";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button" className="btn-ghost" onClick={async () => {
      try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* sem permissão */ }
    }}>{copied ? "Copiado ✓" : "Copiar link"}</button>
  );
}
