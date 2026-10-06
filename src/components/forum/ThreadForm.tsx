"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createThread, editThread } from "@/actions/forum";

export function ThreadForm({ initial }: { initial?: { id: string; title: string; body: string } }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      let id = initial?.id ?? "";
      if (initial) {
        const r = await editThread({ id, title, body });
        if (!r.ok) { setError(r.error); return; }
      } else {
        const r = await createThread({ title, body });
        if (!r.ok) { setError(r.error); return; }
        id = r.id;
      }
      router.push(`/forum/${id}`);
      router.refresh();
    });
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="t-title" className="mb-1.5 block text-sm text-ash-200">Pergunta ou tema</label>
        <input id="t-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} required className="field" placeholder="Ex.: Vocês acreditam que as pessoas realmente mudam?" />
      </div>
      <div>
        <label htmlFor="t-body" className="mb-1.5 block text-sm text-ash-200">Conte mais</label>
        <textarea id="t-body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={4000} rows={8} required className="field" placeholder="Explique o que você pensa e convide os irmãos a participar." />
        <p className="mt-1 text-right text-xs text-ash-400">{body.length}/4000</p>
      </div>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <button className="btn-primary" disabled={pending || title.trim().length < 5 || !body.trim()}>{pending ? "Salvando…" : initial ? "Salvar alterações" : "Abrir discussão"}</button>
    </form>
  );
}
