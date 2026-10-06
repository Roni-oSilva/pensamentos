import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getStudyState } from "@/lib/study/data";
import { PLAN } from "@/lib/study/content";
import { PageTitle } from "@/components/ui/Section";
import { PlanGrid } from "@/components/study/PlanGrid";
import { LevelCard } from "@/components/study/LevelCard";

export const metadata = { title: "Plano de leitura" };
export const dynamic = "force-dynamic";

export default async function Plano() {
  const session = await getSession();
  const state = session ? await getStudyState(session.user.id) : null;
  return (
    <>
      <PageTitle eyebrow="Estudos" title={PLAN.titulo}>{PLAN.descricao}</PageTitle>
      <div className="container-narrow mt-10 space-y-8">
        <Link href="/estudos" className="link-muted text-sm">← Estudos</Link>
        <PlanGrid days={PLAN.dias} initial={[...(state?.planDays ?? [])]} signedIn={!!session} />
        {state && <LevelCard info={state.info} compact />}
      </div>
    </>
  );
}
