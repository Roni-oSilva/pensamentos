"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addComment } from "@/actions/social";

export function CommentForm({ postId, parentId = null, signedIn, onDone, autoFocus = false }: { postId: string; parentId?: string | null; signedIn: boolean; onDone?: () => void; autoFocus?: boolean }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!signedIn) {
    return <p className="text-sm text-ash-400"><a className="link-muted" href={`/login?next=${encodeURIComponent(typeof window === "undefined" ? "/" : window.location.pathname)}`}>Entre</a> para comentar.</p>;
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await addComment({ postId, parentId, body });
      if (!r.ok) { setError(r.error); return; }
      setBody(""); onDone?.(); router.refresh();
    });
  }
  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="sr-only" htmlFor={`c-${parentId ?? "root"}`}>Comentário</label>
      <textarea id={`c-${parentId ?? "root"}`} value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} rows={parentId ? 2 : 3}
        required autoFocus={autoFocus} placeholder={parentId ? "Escreva uma resposta…" : "Diga o que pensa…"} className="field" />
      <div className="flex items-center justify-between">
        <span className="text-xs text-ash-400">{body.length}/1000</span>
        <button className="btn-primary" disabled={pending || !body.trim()}>{pending ? "Enviando…" : parentId ? "Responder" : "Comentar"}</button>
      </div>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    </form>
  );
}
