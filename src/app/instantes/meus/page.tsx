import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getMyInstants } from "@/lib/instants";
import { PageTitle } from "@/components/ui/Section";
import { MyInstants } from "@/components/instants/MyInstants";

export const metadata: Metadata = { title: "Seus instantes", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function MeusInstantes() {
  const s = await requireUser("/instantes/meus");
  const items = await getMyInstants(s.user.id);
  return (
    <>
      <PageTitle eyebrow="Instantes" title="Seus instantes">Só você vê esta página. Ficam aqui por 30 dias, com quem viu e as reações.</PageTitle>
      <div className="container-narrow mt-8 space-y-6">
        <MyInstants items={items} />
        <Link href="/instantes/novo" className="btn-primary inline-flex">Tirar um instante</Link>
      </div>
    </>
  );
}
