import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getBibleState } from "@/lib/bible-data";
import { PageTitle } from "@/components/ui/Section";
import { BiblePlanner } from "@/components/bible/BiblePlanner";
import { BibleBooks } from "@/components/bible/BibleBooks";
import { CreatorPanel } from "@/components/bible/CreatorPanel";
import { getBiblePresence } from "@/actions/bible";

export const metadata = { title: "Bíblia em um ano", description: "Leia a Bíblia inteira em 365 dias, junto com a comunidade: calendário, cores por livro e lista de presença diária." };
export const dynamic = "force-dynamic";

export default async function BibliaEmUmAno() {
  const session = await getSession();
  const state = await getBibleState(session?.user.id ?? null);
  const isCreator = session?.profile.role === "CREATOR";
  const presence = session && state.currentDay ? await getBiblePresence(state.currentDay) : null;
  const initialPresence = presence?.ok && state.currentDay ? { day: state.currentDay, people: presence.people, hidden: presence.hidden } : null;
  return (
    <>
      <PageTitle eyebrow="Estudos · Plano anual" title="Bíblia em um ano">
        De Gênesis a Apocalipse em 365 dias, cerca de 3 capítulos por dia. Cada dia é um encontro: leia e marque “estou junto” para aparecer na lista de presença.
      </PageTitle>
      <div className="container-wide mt-8 space-y-10">
        <Link href="/estudos" className="link-muted text-sm">← Estudos</Link>
        {state.message && (
          <blockquote className="rounded-2xl border border-ink-600 bg-ink-900 p-5 text-ash-100"><p className="eyebrow mb-2">Palavra do Criador</p><p className="font-display text-xl italic">{state.message}</p></blockquote>
        )}
        {isCreator && <CreatorPanel startIso={state.startIso} showPresence={state.showPresence} message={state.message} />}
        <BiblePlanner startIso={state.startIso} todayIso={state.todayIso} currentDay={state.currentDay} counts={state.counts} notes={state.notes}
          myDays={state.myDays} signedIn={!!session} isCreator={isCreator} initialPresence={initialPresence} />
        <BibleBooks startIso={state.startIso} currentDay={state.currentDay} />
      </div>
    </>
  );
}
