import { requireUser } from "@/lib/auth";
import { listCategories } from "@/lib/data";
import { PostForm } from "@/components/community/PostForm";
import { PageTitle } from "@/components/ui/Section";

export const metadata = { title: "Nova publicação", robots: { index: false } };

export default async function NewCommunityPost() {
  await requireUser("/comunidade/nova");
  const categories = await listCategories();
  return (
    <>
      <PageTitle eyebrow="Comunidade" title="Nova publicação">Escreva com liberdade e respeito às <a className="link-muted" href="/diretrizes">diretrizes</a>. Toda publicação passa por moderação.</PageTitle>
      <div className="container-narrow mt-10"><PostForm categories={categories} /></div>
    </>
  );
}
