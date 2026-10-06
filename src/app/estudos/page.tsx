import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getStudyState } from "@/lib/study/data";
import { PLAN, TRACKS } from "@/lib/study/content";
import { PageTitle } from "@/components/ui/Section";
import { LevelCard } from "@/components/study/LevelCard";
import { ProgressBar } from "@/components/study/ProgressBar";
import { TrackCover } from "@/components/study/Art";
import { getBibleState } from "@/lib/bible-data";
import { dayLabel, planDay, PLAN_DAYS } from "@/lib/bible-plan";

export const metadata = { title: "Estudos", description: "Trilhas de estudo bíblico da Igreja de Cristo, com progresso e níveis." };
export const dynamic = "force-dynamic";

export default async function Estudos() {
  const session = await getSession();
  const [state, bible] = await Promise.all([session ? getStudyState(session.user.id) : null, getBibleState(session?.user.id ?? null)]);
  const today = bible.currentDay ? planDay(bible.currentDay) : null;
  // próxima aula: primeira não concluída da trilha mais avançada ainda em andamento (ou da primeira trilha)
  let next: { href: string; label: string } | null = null;
  if (state) {
    for (const t of TRACKS) {
      const done = state.done.get(t.slug) ?? new Set<number>();
      const a = t.aulas.find((x) => !done.has(x.ordem));
      if (a && (done.size > 0 || !next)) { next = { href: `/estudos/${t.slug}/${a.ordem}`, label: `${t.titulo} · Aula ${a.ordem}: ${a.titulo}` }; if (done.size > 0) break; }
    }
  }
  return (
    <>
      <PageTitle eyebrow="Aprender" title="Estudos">Aulas curtas para crescer na Palavra. A cada aula e trilha concluída você ganha XP e sobe de nível.</PageTitle>
      <div className="container-wide mt-10 space-y-10">
        {state ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <LevelCard info={state.info} />
            {next && (
              <Link href={next.href} className="card flex flex-col justify-between gap-6 p-5 transition hover:border-ash-400 sm:p-6">
                <div><p className="eyebrow mb-1">Continuar de onde parei</p><p className="text-lg leading-snug text-white">{next.label}</p></div>
                <span className="btn-primary self-start">Continuar →</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="card flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
            <p className="max-w-xl text-ash-200">Entre na sua conta para guardar o progresso, ganhar XP e subir de nível.</p>
            <Link href="/login?next=/estudos" className="btn-primary">Entrar</Link>
          </div>
        )}

        <section aria-labelledby="biblia-h">
          <Link href="/estudos/biblia" className="card relative block overflow-hidden p-5 transition hover:border-ash-400 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 id="biblia-h" className="eyebrow mb-1">Bíblia em um ano</h2>
                <p className="font-display text-3xl text-white">{today ? `Hoje: ${dayLabel(today)}` : "Leia a Bíblia inteira em 365 dias"}</p>
                <p className="mt-1 text-sm text-ash-300">
                  {bible.currentDay ? `Dia ${bible.currentDay} de ${PLAN_DAYS} · ${bible.counts[bible.currentDay] ?? 0} irmãos já leram hoje` : "Calendário com as cores de cada livro e lista de presença diária."}
                  {session ? ` · você leu ${bible.myDays.length} dias` : ""}
                </p>
              </div>
              <span className="btn-primary">Abrir o plano →</span>
            </div>
            {today && <div className="mt-4 flex h-1.5 overflow-hidden rounded-full" aria-hidden>{today.readings.map((r) => <span key={r.book.id} style={{ background: r.book.color, flex: r.to - r.from + 1 }} />)}</div>}
          </Link>
        </section>

        <section aria-labelledby="trilhas-h" className="space-y-4">
          <h2 id="trilhas-h" className="eyebrow">Trilhas</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {TRACKS.map((t) => {
              const n = state?.done.get(t.slug)?.size ?? 0;
              const pct = (n / t.aulas.length) * 100;
              const finished = !!state?.trailsDone.has(t.slug);
              return (
                <Link key={t.slug} href={`/estudos/${t.slug}`} className="card flex flex-col gap-4 p-5 transition hover:border-ash-400 active:scale-[0.995]">
                  <TrackCover slug={t.slug} symbol={t.aulas[0]!.simbolo} />
                  <div className="flex items-center justify-between gap-3 text-xs text-ash-400"><span>{t.aulas.length} aulas · {t.nivel}</span>{finished && <span className="rounded-full border border-ash-100 px-2 py-0.5 text-ash-100">Concluída</span>}</div>
                  <h3 className="font-display text-3xl leading-tight text-white">{t.titulo}</h3>
                  <p className="line-clamp-3 text-sm text-ash-300">{t.descricao}</p>
                  <div className="mt-auto space-y-2">
                    <ProgressBar pct={pct} label={`Progresso em ${t.titulo}`} />
                    <p className="text-xs text-ash-400">{state ? `${n} de ${t.aulas.length} aulas concluídas` : "Entre para acompanhar o progresso"}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="plano-h">
          <Link href="/estudos/plano" className="card flex flex-wrap items-center justify-between gap-4 p-5 transition hover:border-ash-400 sm:p-6">
            <div>
              <h2 id="plano-h" className="eyebrow mb-1">Plano de leitura</h2>
              <p className="font-display text-3xl text-white">{PLAN.titulo}</p>
              <p className="mt-1 text-sm text-ash-300">{PLAN.descricao}{state ? ` Você leu ${state.planDays.size} de 30 dias.` : ""}</p>
            </div>
            <span className="btn-ghost">Abrir plano →</span>
          </Link>
        </section>

        <section aria-labelledby="como-h" className="card space-y-3 p-5 sm:p-6">
          <h2 id="como-h" className="eyebrow">Como ganhar XP</h2>
          <ul className="grid gap-2 text-sm text-ash-200 sm:grid-cols-2">
            <li>Concluir uma aula: <strong className="text-white">+20 XP</strong></li>
            <li>Acertar todo o quiz da aula: <strong className="text-white">+10 XP</strong></li>
            <li>Concluir uma trilha: <strong className="text-white">+100 XP</strong></li>
            <li>Cada dia do plano de leitura: <strong className="text-white">+5 XP</strong></li>
            <li>Cada dia da Bíblia em um ano: <strong className="text-white">+5 XP</strong></li>
          </ul>
        </section>
      </div>
    </>
  );
}
