"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addReply, deleteReply, editReply } from "@/actions/forum";
import { Avatar } from "@/components/ui/Avatar";
import type { Reply } from "@/lib/forum";
import { timeAgo } from "@/lib/utils";

function Item({ r, viewerId, canModerate }: { r: Reply; viewerId: string | null; canModerate: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(r.body);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const mine = viewerId === r.author_id;

  const save = () => start(async () => {
    setError(null);
    const res = await editReply({ id: r.id, body: text });
    if (!res.ok) { setError(res.error); return; }
    setEditing(false); router.refresh();
  });
  const remove = () => {
    if (!window.confirm("Excluir esta resposta? Esta ação não pode ser desfeita.")) return;
    start(async () => { await deleteReply(r.id); router.refresh(); });
  };
  return (
    <li className="flex items-start gap-3">
      <Avatar src={r.author?.avatar_url} name={r.author?.username ?? "?"} size={32} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
          {r.author ? <Link href={`/perfil/${r.author.username}`} className="font-medium text-white hover:underline">@{r.author.username}</Link> : <span>anônimo</span>}
          <span className="text-xs text-ash-400">{timeAgo(r.created_at)}{r.edited_at ? " · editado" : ""}</span>
        </div>
        {editing ? (
          <div className="mt-2 space-y-2">
            <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={1500} rows={4} className="field" aria-label="Editar resposta" autoFocus />
            {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
            <div className="flex gap-2">
              <button type="button" className="btn-primary" disabled={pending || !text.trim()} onClick={save}>{pending ? "Salvando…" : "Salvar"}</button>
              <button type="button" className="btn-ghost" onClick={() => { setEditing(false); setText(r.body); setError(null); }}>Cancelar</button>
            </div>
          </div>
        ) : <p className="preline mt-1 text-[15px] text-ash-200">{r.body}</p>}
        {!editing && (mine || canModerate) && (
          <div className="mt-1.5 flex gap-4 text-xs text-ash-400">
            {mine && <button type="button" onClick={() => setEditing(true)} className="hover:text-white">Editar</button>}
            <button type="button" disabled={pending} onClick={remove} className="hover:text-red-300">Excluir</button>
          </div>
        )}
      </div>
    </li>
  );
}

export function ReplyList({ threadId, replies, viewerId, canModerate }: { threadId: string; replies: Reply[]; viewerId: string | null; canModerate: boolean }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await addReply({ threadId, body });
      if (!r.ok) { setError(r.error); return; }
      setBody(""); router.refresh();
    });
  }
  return (
    <section aria-labelledby="respostas-h" className="space-y-6">
      <h2 id="respostas-h" className="font-poster uppercase tracking-wide text-3xl text-white">{replies.length} {replies.length === 1 ? "resposta" : "respostas"}</h2>
      {viewerId ? (
        <form onSubmit={submit} className="space-y-2">
          <label className="sr-only" htmlFor="reply-body">Sua resposta</label>
          <textarea id="reply-body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={1500} rows={3} required className="field" placeholder="Compartilhe o que você pensa…" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-ash-400">{body.length}/1500</span>
            <button className="btn-primary" disabled={pending || !body.trim()}>{pending ? "Enviando…" : "Responder"}</button>
          </div>
          {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        </form>
      ) : <p className="text-sm text-ash-400"><Link className="link-muted" href={`/login?next=/forum/${threadId}`}>Entre</Link> para participar da conversa.</p>}
      {replies.length === 0 ? <p className="text-sm text-ash-400">Ninguém respondeu ainda. Seja o primeiro.</p> : (
        <ul className="space-y-6">{replies.map((r) => <Item key={r.id} r={r} viewerId={viewerId} canModerate={canModerate} />)}</ul>
      )}
    </section>
  );
}
