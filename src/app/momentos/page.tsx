import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getInbox } from "@/lib/instants";
import { PushSettings } from "@/components/push/PushSettings";
import { createClient } from "@/lib/supabase/server";
import { PageTitle } from "@/components/ui/Section";
import { InstantsHome } from "@/components/instants/InstantsHome";

export const metadata: Metadata = { title: "Momentos", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Momentos({ searchParams }: { searchParams: Promise<{ de?: string }> }) {
  const s = await requireUser("/momentos");
  const { de } = await searchParams;
  const since = new Date(Date.now() - 30 * 86400e3).toISOString();
  const [inbox, mine] = await Promise.all([
    getInbox(),
    (await createClient()).from("instants").select("id", { count: "exact", head: true }).eq("author_id", s.user.id).gte("created_at", since),
  ]);
  return (
    <>
      <PageTitle eyebrow="Comunidade" title="Momentos">Fotos do momento, sem filtro e sem edição, para toda a comunidade. Cada momento some depois de visto.</PageTitle>
      <div className="container-narrow mt-8 space-y-6"><PushSettings /><InstantsHome inbox={inbox} mine={mine.count ?? 0} openUser={de} /></div>
    </>
  );
}
