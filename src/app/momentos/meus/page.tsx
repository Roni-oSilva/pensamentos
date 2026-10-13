import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getMyInstants } from "@/lib/instants";
import { PageTitle } from "@/components/ui/Section";
import { MyInstants } from "@/components/instants/MyInstants";

export const metadata: Metadata = { title: "Seus momentos", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function MeusMomentos() {
  const s = await requireUser("/momentos/meus");
  const items = await getMyInstants(s.user.id);
  return (
    <>
      <PageTitle eyebrow="Momentos" title="Seus momentos">Só você vê esta página. Ficam aqui por 30 dias, com quem viu e as reações.</PageTitle>
      <div className="container-narrow mt-8 space-y-6">
        <MyInstants items={items} />
        <Link href="/momentos/novo" className="btn-primary inline-flex">Postar um momento</Link>
      </div>
    </>
  );
}
