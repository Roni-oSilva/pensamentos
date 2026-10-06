import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { PageTitle } from "@/components/ui/Section";
import { PollForm } from "@/components/forum/PollForm";

export const metadata = { title: "Nova votação", robots: { index: false } };

export default async function NovaVotacao() {
  const s = await requireUser("/forum/votacao/nova");
  if (s.profile.role !== "CREATOR") notFound(); // só o Criador abre votações (RLS também bloqueia)
  return (
    <>
      <PageTitle eyebrow="Fórum" title="Nova votação">Os membros escolhem uma opção e podem trocar o voto enquanto a votação estiver aberta.</PageTitle>
      <div className="container-narrow mt-10"><PollForm /></div>
    </>
  );
}
