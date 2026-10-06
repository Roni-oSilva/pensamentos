import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getThread } from "@/lib/forum";
import { idSchema } from "@/lib/validation";
import { PageTitle } from "@/components/ui/Section";
import { ThreadForm } from "@/components/forum/ThreadForm";

export const metadata = { title: "Editar discussão", robots: { index: false } };

export default async function EditarDiscussao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  const s = await requireUser(`/forum/${id}/editar`);
  const found = await getThread(id);
  if (!found || found.thread.author_id !== s.user.id) notFound();
  return (
    <>
      <PageTitle eyebrow="Fórum" title="Editar discussão" />
      <div className="container-narrow mt-10"><ThreadForm initial={{ id, title: found.thread.title, body: found.thread.body }} /></div>
    </>
  );
}
