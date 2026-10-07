import { requireUser } from "@/lib/auth";
import { isSettingOn, listCategories } from "@/lib/data";
import { COMMUNITY_KINDS } from "@/lib/constants";
import { PostForm } from "@/components/community/PostForm";
import { PageTitle } from "@/components/ui/Section";

export const metadata = { title: "Nova publicação", robots: { index: false } };

export default async function NewCommunityPost({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  await requireUser("/comunidade/nova");
  const sp = await searchParams;
  const tipo = COMMUNITY_KINDS.find((k) => k === sp.tipo);
  const [categories, autopublish] = await Promise.all([listCategories(), isSettingOn("community_autopublish")]);
  return (
    <>
      <PageTitle eyebrow="Comunidade" title="Nova publicação">Compartilhe um versículo, uma oração, um conselho ou um testemunho, com amor e respeito às <a className="link-muted" href="/diretrizes">diretrizes</a>. {autopublish ? "Ela aparece na hora para todos." : "Toda publicação passa por aprovação."}</PageTitle>
      <div className="container-narrow mt-10"><PostForm categories={categories} defaultKind={tipo} autopublish={autopublish} /></div>
    </>
  );
}
