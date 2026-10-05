import { requireAdmin } from "@/lib/auth";
import { listCategories } from "@/lib/data";
import { deleteCategory, saveCategory } from "@/actions/admin";
import { AdminTitle, Table } from "@/components/admin/ui";
import { NameForm } from "@/components/admin/NameForm";
import { ConfirmButton } from "@/components/ui/ConfirmButton";

export const metadata = { title: "Categorias" };

export default async function AdminCategories() {
  await requireAdmin("/admin/categories");
  const cats = await listCategories();
  return (
    <>
      <AdminTitle title="Categorias" />
      <NameForm action={saveCategory} label="Nova categoria" withDescription />
      <Table head={["Nome", "Slug", "Descrição", ""]}>
        {cats.map((c) => (
          <tr key={c.id}><td className="px-4 py-3 text-white">{c.name}</td><td className="px-4 py-3 text-ash-400">{c.slug}</td><td className="px-4 py-3 text-ash-300">{c.description}</td>
            <td className="px-4 py-3"><form action={deleteCategory}><input type="hidden" name="id" value={c.id} /><ConfirmButton className="btn-danger px-3 py-1.5 text-xs" message={`Excluir a categoria “${c.name}”? As publicações ficarão sem categoria.`}>Excluir</ConfirmButton></form></td></tr>
        ))}
      </Table>
    </>
  );
}
