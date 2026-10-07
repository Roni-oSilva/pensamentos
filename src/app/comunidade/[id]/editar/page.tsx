import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getPost, isSettingOn, listCategories } from "@/lib/data";
import { idSchema } from "@/lib/validation";
import { PostForm } from "@/components/community/PostForm";
import { PageTitle } from "@/components/ui/Section";

export const metadata = { title: "Editar publicação", robots: { index: false } };

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await requireUser(`/comunidade/${id}/editar`);
  if (!idSchema.safeParse(id).success) notFound();
  const [post, categories, autopublish] = await Promise.all([getPost(id, s.user.id), listCategories(), isSettingOn("community_autopublish")]);
  // Autorização: somente o autor (RLS também impede alteração por outros)
  if (!post || post.author_id !== s.user.id || post.origin !== "COMMUNITY" || post.status === "HIDDEN") notFound();
  return (
    <>
      <PageTitle eyebrow="Comunidade" title="Editar publicação">{autopublish ? "As alterações aparecem na hora para todos." : "Editar uma publicação já aprovada a envia novamente para aprovação."}</PageTitle>
      <div className="container-narrow mt-10"><PostForm post={post} categories={categories} autopublish={autopublish} /></div>
    </>
  );
}
