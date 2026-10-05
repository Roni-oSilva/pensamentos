import { requireAdmin } from "@/lib/auth";
import { listTags } from "@/lib/data";
import { deleteTag, saveTag } from "@/actions/admin";
import { AdminTitle } from "@/components/admin/ui";
import { NameForm } from "@/components/admin/NameForm";
import { ConfirmButton } from "@/components/ui/ConfirmButton";

export const metadata = { title: "Tags" };

export default async function AdminTags() {
  await requireAdmin("/admin/tags");
  const tags = await listTags(500);
  return (
    <>
      <AdminTitle title="Tags" />
      <NameForm action={saveTag} label="Nova tag" />
      <ul className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <li key={t.id} className="badge gap-2 py-1.5 normal-case tracking-normal">#{t.name}
            <form action={deleteTag}><input type="hidden" name="id" value={t.id} /><ConfirmButton className="text-ash-400 hover:text-red-300" title="Excluir tag?" message={`Remover #${t.name} de todas as publicações?`}>×</ConfirmButton></form></li>
        ))}
        {tags.length === 0 && <li className="text-ash-400">Nenhuma tag.</li>}
      </ul>
    </>
  );
}
