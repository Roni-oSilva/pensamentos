import { requireUser } from "@/lib/auth";
import { PageTitle } from "@/components/ui/Section";
import { ThreadForm } from "@/components/forum/ThreadForm";

export const metadata = { title: "Abrir discussão", robots: { index: false } };

export default async function NovaDiscussao() {
  await requireUser("/forum/nova");
  return (
    <>
      <PageTitle eyebrow="Fórum" title="Abrir discussão">Faça uma pergunta ou proponha um tema para a comunidade. Siga as <a className="link-muted" href="/diretrizes">diretrizes</a>: respeito e amor ao próximo.</PageTitle>
      <div className="container-narrow mt-10"><ThreadForm /></div>
    </>
  );
}
