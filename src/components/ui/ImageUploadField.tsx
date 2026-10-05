"use client";
import Image from "next/image";
import { useId, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { finishUpload, requestUpload } from "@/actions/upload";

/** Envia a imagem direto ao Storage (até 50 MB) e guarda a URL no campo oculto `name`. */
export async function uploadDirect(bucket: "community" | "admin", file: File): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const req = await requestUpload({ bucket, type: file.type, size: file.size });
  if (!req.ok) return req;
  const { error } = await createClient().storage.from(bucket).uploadToSignedUrl(req.path, req.token, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) return { ok: false, error: "Falha no envio. Verifique sua conexão e tente de novo." };
  return finishUpload({ bucket, path: req.path });
}

export function ImageUploadField({ bucket, name = "imageUrl", initialUrl, label, hint }: {
  bucket: "community" | "admin"; name?: string; initialUrl?: string | null; label: string; hint?: string;
}) {
  const id = useId();
  const [url, setUrl] = useState(initialUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [local, setLocal] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setError(null); setBusy(true);
    const preview = URL.createObjectURL(file);
    const r = await uploadDirect(bucket, file);
    setBusy(false);
    if (!r.ok) { URL.revokeObjectURL(preview); setError(r.error); if (input.current) input.current.value = ""; return; }
    setLocal(preview); setUrl(r.url);
  }

  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <input type="hidden" name={name} value={url} />
      <input ref={input} id={id} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy}
        className="field file:mr-3 file:rounded file:border-0 file:bg-ink-700 file:px-3 file:py-1 file:text-ash-100" onChange={(e) => void pick(e.target.files?.[0])} />
      {hint && <p className="mt-1 text-xs text-ash-400">{hint}</p>}
      {busy && <p role="status" className="mt-2 text-sm text-ash-300">Enviando imagem… não feche a página.</p>}
      {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
      {url && !busy && (
        <div className="mt-3 flex items-start gap-3">
          <Image src={local ?? url} alt="Prévia da imagem" width={240} height={150} unoptimized className="h-auto max-w-[min(100%,15rem)] rounded-md border border-ink-600" />
          <button type="button" className="btn-ghost" onClick={() => { setUrl(""); setLocal(null); if (input.current) input.current.value = ""; }}>Remover</button>
        </div>
      )}
    </div>
  );
}
