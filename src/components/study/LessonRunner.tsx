"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { completeLesson, saveNote, type Gain } from "@/actions/study";

interface Q { pergunta: string; opcoes: string[] }
interface Props { track: string; order: number; quiz: Q[]; initialNote: string; signedIn: boolean; alreadyDone: boolean; nextHref: string; nextLabel: string }

/** Anotação privada, quiz e botão de concluir. O servidor corrige o quiz e calcula o XP. */
export function LessonRunner({ track, order, quiz, initialNote, signedIn, alreadyDone, nextHref, nextLabel }: Props) {
  const router = useRouter();
  const [note, setNote] = useState(initialNote);
  const [noteState, setNoteState] = useState<string>(initialNote ? "Salva" : "");
  const [answers, setAnswers] = useState<(number | null)[]>(() => quiz.map(() => null));
  const [gain, setGain] = useState<Gain | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const finished = !!gain;
  const allAnswered = answers.every((a) => a !== null);
  const login = `/login?next=${encodeURIComponent(`/estudos/${track}/${order}`)}`;

  function persistNote() {
    setNoteState("Salvando…");
    start(async () => { const r = await saveNote({ track, order, body: note }); setNoteState(r.ok ? (note.trim() ? "Salva" : "") : r.error); });
  }
  function finish() {
    setError(null);
    start(async () => {
      const r = await completeLesson({ track, order, answers: answers.map((a) => a ?? -1).map((a) => Math.max(a, 0)) });
      if (!r.ok) { setError(r.error); return; }
      setGain(r.gain); router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <section className="space-y-2" aria-labelledby="nota-h">
        <h2 id="nota-h" className="eyebrow">Minha anotação <span className="normal-case tracking-normal text-ash-400">(só você vê)</span></h2>
        {signedIn ? (
          <>
            <textarea value={note} onChange={(e) => { setNote(e.target.value); setNoteState("Não salva"); }} maxLength={2000} rows={4} className="field" placeholder="O que Deus falou ao seu coração nesta aula?" aria-label="Minha anotação" />
            <div className="flex items-center justify-between text-xs text-ash-400"><span role="status">{noteState}</span><button type="button" className="btn-ghost" disabled={pending} onClick={persistNote}>Salvar anotação</button></div>
          </>
        ) : <p className="text-sm text-ash-400"><Link className="link-muted" href={login}>Entre</Link> para fazer anotações.</p>}
      </section>

      {quiz.length > 0 && (
        <section className="space-y-5" aria-labelledby="quiz-h">
          <h2 id="quiz-h" className="eyebrow">Quiz rápido</h2>
          {quiz.map((q, qi) => (
            <fieldset key={qi} className="space-y-2" disabled={finished}>
              <legend className="mb-1 text-white">{qi + 1}. {q.pergunta}</legend>
              {q.opcoes.map((o, oi) => {
                const chosen = answers[qi] === oi;
                const right = gain && gain.review[qi]!.correta === oi;
                const wrong = gain && chosen && !right;
                return (
                  <label key={oi} className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-2 text-sm transition ${right ? "border-emerald-500 bg-emerald-500/10 text-white" : wrong ? "border-blood-soft bg-blood/20 text-white" : chosen ? "border-ash-100 text-white" : "border-ink-600 text-ash-200 hover:border-ash-400"}`}>
                    <input type="radio" name={`q${qi}`} className="accent-current" checked={chosen} onChange={() => setAnswers((a) => a.map((x, i) => (i === qi ? oi : x)))} />
                    <span>{o}</span>
                  </label>
                );
              })}
              {gain && <p className="text-sm text-ash-300">{gain.review[qi]!.explicacao}</p>}
            </fieldset>
          ))}
        </section>
      )}

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

      {!signedIn ? (
        <p className="card p-5 text-sm text-ash-300"><Link className="link-muted" href={login}>Entre</Link> para concluir a aula, ganhar XP e subir de nível.</p>
      ) : finished ? (
        <div className="card space-y-4 p-5 text-center sm:p-6" role="status">
          {gain.levelUp && <p className="font-display text-3xl text-white">Você subiu para o nível {gain.levelUp.level}: {gain.levelUp.name}!</p>}
          {gain.trailDone && <p className="font-display text-2xl text-white">Trilha concluída! +100 XP</p>}
          <p className="text-ash-200">{gain.gained > 0 ? <>Aula concluída: <strong className="text-white">+{gain.gained} XP</strong>.</> : "Aula já concluída antes. Nenhum XP novo."} Você acertou {gain.correct} de {gain.total}. Total: {gain.xp} XP.</p>
          <Link href={nextHref} className="btn-primary">{nextLabel} →</Link>
        </div>
      ) : (
        <div className="space-y-2">
          <button type="button" className="btn-primary w-full sm:w-auto" disabled={pending || !allAnswered} onClick={finish}>{pending ? "Salvando…" : alreadyDone ? "Refazer quiz" : "Concluir aula"}</button>
          {!allAnswered && <p className="text-xs text-ash-400">Responda o quiz para concluir a aula.</p>}
        </div>
      )}
    </div>
  );
}
