import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getStudyState } from "@/lib/study/data";
import { getLesson, getTrack } from "@/lib/study/content";
import { LessonRunner } from "@/components/study/LessonRunner";
import { LevelCard } from "@/components/study/LevelCard";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ trilha: string; aula: string }> };

export async function generateMetadata({ params }: Props) {
  const { trilha, aula } = await params;
  const t = getTrack(trilha), a = t && getLesson(t, Number(aula));
  return a ? { title: `${a.titulo} · ${t!.titulo}`, description: a.resumo } : { title: "Aula" };
}

export default async function Aula({ params }: Props) {
  const { trilha, aula } = await params;
  const track = getTrack(trilha);
  const lesson = track && /^\d{1,3}$/.test(aula) ? getLesson(track, Number(aula)) : null;
  if (!track || !lesson) notFound();
  const session = await getSession();
  const state = session ? await getStudyState(session.user.id) : null;
  let note = "";
  if (session) {
    const supabase = await createClient();
    const { data } = await supabase.from("study_notes").select("body").eq("user_id", session.user.id).eq("track_slug", track.slug).eq("lesson_order", lesson.ordem).maybeSingle();
    note = (data?.body as string | undefined) ?? "";
  }
  const done = state?.done.get(track.slug)?.has(lesson.ordem) ?? false;
  const prev = track.aulas.find((a) => a.ordem === lesson.ordem - 1);
  const next = track.aulas.find((a) => a.ordem === lesson.ordem + 1);
  const quiz = lesson.quiz.map(({ pergunta, opcoes }) => ({ pergunta, opcoes })); // as respostas corretas ficam no servidor
  return (
    <article className="container-narrow space-y-10 py-10">
      <div className="space-y-4">
        <nav aria-label="Trilha" className="flex flex-wrap items-center gap-2 text-sm text-ash-400"><Link href="/estudos" className="link-muted">Estudos</Link><span>›</span><Link href={`/estudos/${track.slug}`} className="link-muted">{track.titulo}</Link><span>›</span><span>Aula {lesson.ordem} de {track.aulas.length}</span></nav>
        <h1 className="font-display text-4xl leading-tight text-white sm:text-5xl">{lesson.titulo}</h1>
        <p className="text-ash-300">{lesson.resumo} <span className="text-ash-400">· {lesson.minutos} min</span></p>
      </div>
      <blockquote className="border-l-2 border-ash-100 pl-5">
        <p className="font-display text-2xl leading-snug text-white sm:text-3xl">“{lesson.versiculo.texto}”</p>
        <footer className="mt-2 text-sm text-ash-400">{lesson.versiculo.ref}</footer>
      </blockquote>
      <div className="space-y-5 text-[17px] leading-relaxed text-ash-200">{lesson.texto.map((p, i) => <p key={i}>{p}</p>)}</div>
      <section className="space-y-3" aria-labelledby="contexto-h"><h2 id="contexto-h" className="eyebrow">Contexto</h2><p className="text-[17px] leading-relaxed text-ash-300">{lesson.contexto}</p></section>
      <section className="space-y-5" aria-labelledby="aprof-h"><h2 id="aprof-h" className="eyebrow">Aprofundamento</h2>{lesson.aprofundamento.map((p, i) => <p key={i} className="text-[17px] leading-relaxed text-ash-200">{p}</p>)}</section>
      <section className="card space-y-3 p-5" aria-labelledby="termos-h"><h2 id="termos-h" className="eyebrow">Palavras-chave</h2>
        <dl className="space-y-3">{lesson.termos.map((t) => <div key={t.termo}><dt className="font-medium text-white">{t.termo}</dt><dd className="text-sm text-ash-300">{t.definicao}</dd></div>)}</dl>
      </section>
      <section className="rounded-xl border border-ash-100/40 p-5 sm:p-6" aria-labelledby="heroi-h">
        <p id="heroi-h" className="eyebrow mb-2">Herói da fé</p>
        <h2 className="font-display text-3xl leading-tight text-white">{lesson.heroi.nome}</h2>
        <p className="mt-1 text-sm text-ash-400">{lesson.heroi.periodo} · {lesson.heroi.titulo}</p>
        <div className="mt-4 space-y-4 text-ash-200">{lesson.heroi.historia.map((p, i) => <p key={i}>{p}</p>)}</div>
        <p className="mt-4 border-t border-ink-700 pt-4 text-white"><span className="text-ash-400">O que aprendemos: </span>{lesson.heroi.licao}</p>
      </section>
      <p className="text-sm text-ash-400"><span className="text-ash-200">Para ler também:</span> {lesson.apoio.join(" · ")}</p>
      <section className="card space-y-2 p-5"><h2 className="eyebrow">Reflexão</h2><p className="text-lg text-white">{lesson.reflexao}</p></section>
      <section className="card space-y-2 p-5"><h2 className="eyebrow">Para praticar esta semana</h2><ul className="list-disc space-y-1 pl-5 text-ash-200">{lesson.pratica.map((p, i) => <li key={i}>{p}</li>)}</ul></section>
      <section className="card space-y-2 p-5"><h2 className="eyebrow">Oração</h2><p className="font-display text-xl italic text-ash-200">{lesson.oracao}</p></section>

      <LessonRunner track={track.slug} order={lesson.ordem} quiz={quiz} initialNote={note} signedIn={!!session} alreadyDone={done}
        nextHref={next ? `/estudos/${track.slug}/${next.ordem}` : `/estudos/${track.slug}`} nextLabel={next ? `Próxima aula: ${next.titulo}` : "Voltar à trilha"} />

      <div className="flex flex-wrap justify-between gap-3 border-t border-ink-700 pt-6 text-sm">
        {prev ? <Link href={`/estudos/${track.slug}/${prev.ordem}`} className="link-muted">← {prev.titulo}</Link> : <span />}
        {next && <Link href={`/estudos/${track.slug}/${next.ordem}`} className="link-muted">{next.titulo} →</Link>}
      </div>
      {state && <LevelCard info={state.info} compact />}
    </article>
  );
}
