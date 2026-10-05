import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getPost, listCategories } from "@/lib/data";
import { idSchema } from "@/lib/validation";
import { OfficialPostForm } from "@/components/admin/OfficialPostForm";
import { AdminTitle, StatusBadge } from "@/components/admin/ui";

export const metadata = { title: "Editar publicação" };

export default async function EditOfficialPost({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const s = await requireAdmin(`/admin/posts/${id}/edit`);
  if (!idSchema.safeParse(id).success) notFound();
  const [post, categories] = await Promise.all([getPost(id, s.user.id), listCategories()]);
  if (!post || post.origin !== "OFFICIAL") notFound();
  const saved = (await searchParams).saved === "1";
  return (
    <>
      <AdminTitle title="Editar publicação"><StatusBadge status={post.status} /></AdminTitle>
      {saved && <p role="status" className="mb-6 rounded-md border border-ink-500 bg-ink-800 px-3 py-2 text-sm">Salvo.</p>}
      <OfficialPostForm post={post} categories={categories} />
    </>
  );
}
