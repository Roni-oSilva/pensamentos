"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { deleteComment, editComment } from "@/actions/social";
import { Avatar } from "@/components/ui/Avatar";
import { ReportButton } from "@/components/moderation/ReportButton";
import { CommentForm } from "./CommentForm";
import type { CommentRow } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

export function CommentItem({ comment, replies, viewerId, canModerate, signedIn }: {
  comment: CommentRow; replies: CommentRow[]; viewerId: string | null; canModerate: boolean; signedIn: boolean;
}) {
  const router = useRouter();
  const [replying, setReplying] = useState(false);
  const [pending, start] = useTransition();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);
  // ao abrir a edição, o cursor vai para o fim do texto (não para o começo)
  useEffect(() => {
    const el = editRef.current;
    if (!editingId || !el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [editingId]);

  const saveEdit = (id: string) => start(async () => {
    setEditError(null);
    const r = await editComment({ id, body: draft });
    if (!r.ok) { setEditError(r.error); return; }
    setEditingId(null); router.refresh();
  });

  const remove = (id: string) => {
    if (!window.confirm("Excluir este comentário? Esta ação não pode ser desfeita.")) return;
    start(async () => { await deleteComment(id); router.refresh(); });
  };

  // Função de renderização (não um componente): assim o campo de edição não é recriado a cada tecla
  // e o cursor fica onde a pessoa tocou.
  const row = (c: CommentRow, isReply: boolean) => (
    <div key={c.id} className={isReply ? "ml-8 border-l border-ink-700 pl-4" : ""}>
      <div className="flex items-start gap-3">
        <Avatar src={c.author?.avatar_url} name={c.author?.username ?? "?"} size={28} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
            {c.author ? <Link href={`/perfil/${c.author.username}`} className="font-medium text-white hover:underline">@{c.author.username}</Link> : <span>anônimo</span>}
            <span className="text-xs text-ash-400">{timeAgo(c.created_at)}{c.edited_at ? " · editado" : ""}</span>
          </div>
          {editingId === c.id ? (
            <div className="mt-2 space-y-2">
              <textarea ref={editRef} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={1000} rows={3} className="field" aria-label="Editar comentário" />
              {editError && <p role="alert" className="text-sm text-red-300">{editError}</p>}
              <div className="flex gap-2">
                <button type="button" className="btn-primary" disabled={pending || !draft.trim()} onClick={() => saveEdit(c.id)}>{pending ? "Salvando…" : "Salvar"}</button>
                <button type="button" className="btn-ghost" onClick={() => setEditingId(null)}>Cancelar</button>
              </div>
            </div>
          ) : <p className="preline mt-1 text-[15px] text-ash-200">{c.body}</p>}
          <div className="mt-1.5 flex gap-4 text-xs text-ash-400">
            {!isReply && signedIn && <button type="button" onClick={() => setReplying((v) => !v)} className="hover:text-white">Responder</button>}
            {viewerId === c.author_id && editingId !== c.id && <button type="button" onClick={() => { setEditingId(c.id); setDraft(c.body); setEditError(null); }} className="hover:text-white">Editar</button>}
            {(viewerId === c.author_id || canModerate) && <button type="button" disabled={pending} onClick={() => remove(c.id)} className="hover:text-red-300">Excluir</button>}
            {viewerId !== c.author_id && <ReportButton targetType="COMMENT" targetId={c.id} signedIn={signedIn} />}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <li className="space-y-4">
      {row(comment, false)}
      {replies.map((r) => row(r, true))}
      {replying ? (
        <div className="ml-8"><CommentForm postId={comment.post_id} parentId={comment.id} signedIn={signedIn} autoFocus onDone={() => setReplying(false)} /></div>
      ) : null}
    </li>
  );
}
