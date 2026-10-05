import Link from "next/link";
import { deletePost, setPostStatus } from "@/actions/admin";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import type { PostStatus, Role } from "@/lib/constants";

/** Ações de moderação (formulários server-side). Destrutivas exigem confirmação. */
export function PostModerationActions({ id, status, origin, viewerRole }: { id: string; status: PostStatus; origin: "OFFICIAL" | "COMMUNITY"; viewerRole: Role }) {
  const set = (to: PostStatus, label: string, cls = "btn-ghost") => (
    <form action={setPostStatus} key={to}>
      <input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={to} />
      <button className={`${cls} px-3 py-1.5 text-xs`}>{label}</button>
    </form>
  );
  const canEditOfficial = (viewerRole === "ADMIN" || viewerRole === "CREATOR") && origin === "OFFICIAL";
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "PUBLISHED" && set("PUBLISHED", origin === "OFFICIAL" ? "Publicar" : "Aprovar", "btn-primary")}
      {status === "PUBLISHED" && origin === "OFFICIAL" && set("DRAFT", "Despublicar")}
      {status === "PUBLISHED" && origin === "COMMUNITY" && set("HIDDEN", "Ocultar")}
      {origin === "COMMUNITY" && status !== "REJECTED" && (
        <form action={setPostStatus} className="flex items-center gap-1">
          <input type="hidden" name="id" value={id} /><input type="hidden" name="status" value="REJECTED" />
          <input name="reason" maxLength={300} placeholder="Motivo da rejeição" aria-label="Motivo da rejeição" className="field w-40 px-2 py-1 text-xs" />
          <button className="btn-ghost px-3 py-1.5 text-xs">Rejeitar</button>
        </form>
      )}
      {canEditOfficial && <Link href={`/admin/posts/${id}/edit`} className="btn-ghost px-3 py-1.5 text-xs">Editar</Link>}
      {origin === "COMMUNITY" && <Link href={`/comunidade/${id}`} className="btn-ghost px-3 py-1.5 text-xs">Ver</Link>}
      {(viewerRole === "ADMIN" || viewerRole === "CREATOR") && (
        <form action={deletePost}>
          <input type="hidden" name="id" value={id} />
          <ConfirmButton className="btn-danger px-3 py-1.5 text-xs" title="Excluir definitivamente?" message="A publicação, comentários, curtidas e favoritos serão apagados. Não há como desfazer.">Excluir</ConfirmButton>
        </form>
      )}
    </div>
  );
}
