import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { countFriends, getInbox } from "@/lib/instants";
import { createClient } from "@/lib/supabase/server";
import { PageTitle } from "@/components/ui/Section";
import { InstantsHome } from "@/components/instants/InstantsHome";

export const metadata: Metadata = { title: "Instantes", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Instantes({ searchParams }: { searchParams: Promise<{ de?: string }> }) {
  const s = await requireUser("/instantes");
  const { de } = await searchParams;
  const since = new Date(Date.now() - 30 * 86400e3).toISOString();
  const [inbox, friends, mine] = await Promise.all([
    getInbox(), countFriends(s.user.id),
    (await createClient()).from("instants").select("id", { count: "exact", head: true }).eq("author_id", s.user.id).gte("created_at", since),
  ]);
  return (
    <>
      <PageTitle eyebrow="Comunidade" title="Instantes">Fotos do momento, sem filtro e sem edição, para os seus amigos. Cada instante some depois de visto.</PageTitle>
      <div className="container-narrow mt-8"><InstantsHome inbox={inbox} friends={friends} mine={mine.count ?? 0} openUser={de} /></div>
    </>
  );
}
