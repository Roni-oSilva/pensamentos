import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getStudyState } from "@/lib/study/data";
import { getTrack } from "@/lib/study/content";
import { PageTitle } from "@/components/ui/Section";
import { LevelCard } from "@/components/study/LevelCard";
import { ProgressBar } from "@/components/study/ProgressBar";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ trilha: string }> }) {
  const t = getTrack((await params).trilha);
  return t ? { title: t.titulo, description: t.descricao } : { title: "Trilha" };
}

export default async function Trilha({ params }: { params: Promise<{ trilha: string }> }) {
  const track = getTrack((await params).trilha);
  if (!track) notFound();
  const session = await getSession();
  const state = session ? await getStudyState(session.user.id) : null;
  const done = state?.done.get(track.slug) ?? new Set<number>();
  const pct = (done.size / track.aulas.length) * 100;
  const nextOrder = track.aulas.find((a) => !done.has(a.ordem))?.ordem;
  return (
    <>
      <PageTitle eyebrow={`Trilha · ${track.nivel}`} title={track.titulo}>{track.descricao}</PageTitle>
      <div className="container-narrow mt-10 space-y-8">
        <Link href="/estudos" className="link-muted text-sm">← Estudos</Link>
        <div className="card space-y-3 p-5">
          <div className="flex items-center justify-between text-sm"><span className="text-ash-200">{state ? `${done.size} de ${track.aulas.length} aulas` : `${track.aulas.length} aulas`}</span><span className="tabular-nums text-ash-400">{Math.round(pct)}%</span></div>
          <ProgressBar pct={pct} label="Progresso da trilha" />
          {state?.trailsDone.has(track.slug) && <p className="text-sm text-ash-200">Trilha concluída. +100 XP conquistados.</p>}
        </div>
        <ol className="space-y-2">
          {track.aulas.map((a) => {
            const ok = done.has(a.ordem);
            return (
              <li key={a.ordem}>
                <Link href={`/estudos/${track.slug}/${a.ordem}`} className={`flex min-h-[64px] items-center gap-4 rounded-xl border p-4 transition hover:border-ash-400 active:scale-[0.995] ${a.ordem === nextOrder ? "border-ash-100" : "border-ink-700"}`}>
                  <span aria-hidden className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm ${ok ? "border-ash-100 bg-ash-100 text-ink-950" : "border-ink-600 text-ash-300"}`}>{ok ? "✓" : a.ordem}</span>
                  <span className="min-w-0 flex-1"><span className="block text-white">{a.titulo}</span><span className="block text-xs text-ash-400">{a.versiculo.ref}</span></span>
                  {a.ordem === nextOrder && <span className="text-xs text-ash-100">Próxima</span>}
                  <span className="sr-only">{ok ? "Concluída" : "Não concluída"}</span>
                </Link>
              </li>
            );
          })}
        </ol>
        {state && <LevelCard info={state.info} compact />}
      </div>
    </>
  );
}
