import Image from "next/image";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteMedia } from "@/actions/admin";
import { AdminTitle } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Pager } from "@/components/ui/Pager";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Mídia" };
const SIZE = 24;

export default async function AdminMedia({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin("/admin/media");
  const page = Math.max(0, Number((await searchParams).page) || 0);
  const supabase = await createClient();
  const { data } = await supabase.from("media").select("id, bucket, path, size_bytes, created_at").order("created_at", { ascending: false }).range(page * SIZE, page * SIZE + SIZE);
  const rows = (data ?? []) as { id: string; bucket: string; path: string; size_bytes: number; created_at: string }[];
  return (
    <>
      <AdminTitle title="Mídia" />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {rows.slice(0, SIZE).map((m) => (
          <li key={m.id} className="card overflow-hidden">
            <div className="relative aspect-square bg-ink-800"><Image src={supabase.storage.from(m.bucket).getPublicUrl(m.path).data.publicUrl} alt="" fill sizes="240px" className="object-cover" loading="lazy" /></div>
            <div className="space-y-2 p-3 text-xs text-ash-400">
              <p>{m.bucket} · {(m.size_bytes / 1024).toFixed(0)} KB · {formatDate(m.created_at)}</p>
              <form action={deleteMedia}><input type="hidden" name="id" value={m.id} /><ConfirmButton className="btn-danger px-3 py-1 text-xs" message="O arquivo será apagado do Storage. Publicações que o usam perderão a imagem.">Excluir</ConfirmButton></form>
            </div>
          </li>
        ))}
      </ul>
      {rows.length === 0 && <p className="text-ash-400">Nenhuma mídia enviada.</p>}
      <Pager basePath="/admin/media" page={page} hasMore={rows.length > SIZE} />
    </>
  );
}
