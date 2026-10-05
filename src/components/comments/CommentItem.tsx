"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteComment } from "@/actions/social";
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

  const remove = (id: string) => {
    if (!window.confirm("Excluir este comentário? Esta ação não pode ser desfeita.")) return;
    start(async () => { await deleteComment(id); router.refresh(); });
  };

  const Row = ({ c, isReply }: { c: CommentRow; isReply: boolean }) => (
    <div className={isReply ? "ml-8 border-l border-ink-700 pl-4" : ""}>
      <div className="flex items-start gap-3">
        <Avatar src={c.author?.avatar_url} name={c.author?.username ?? "?"} size={28} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
            {c.author ? <Link href={`/perfil/${c.author.username}`} className="font-medium text-white hover:underline">@{c.author.username}</Link> : <span>anônimo</span>}
            <span className="text-xs text-ash-400">{timeAgo(c.created_at)}</span>
          </div>
          <p className="preline mt-1 text-[15px] text-ash-200">{c.body}</p>
          <div className="mt-1.5 flex gap-4 text-xs text-ash-400">
            {!isReply && signedIn && <button type="button" onClick={() => setReplying((v) => !v)} className="hover:text-white">Responder</button>}
            {(viewerId === c.author_id || canModerate) && <button type="button" disabled={pending} onClick={() => remove(c.id)} className="hover:text-red-300">Excluir</button>}
            {viewerId !== c.author_id && <ReportButton targetType="COMMENT" targetId={c.id} signedIn={signedIn} />}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <li className="space-y-4">
      <Row c={comment} isReply={false} />
      {replies.map((r) => <Row key={r.id} c={r} isReply />)}
      {replying ? (
        <div className="ml-8"><CommentForm postId={comment.post_id} parentId={comment.id} signedIn={signedIn} autoFocus onDone={() => setReplying(false)} /></div>
      ) : null}
    </li>
  );
}
