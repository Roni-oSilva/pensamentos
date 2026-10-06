import { bookSchedule, dateForDay, PLAN_DAYS } from "@/lib/bible-plan";
import { fmtBR } from "./dates";

/** Faixa do ano (cada livro na sua cor) + cartões com início, fim, capítulos e duração de cada livro. */
export function BibleBooks({ startIso, currentDay }: { startIso: string; currentDay: number | null }) {
  const sched = bookSchedule();
  const groups = [...new Set(sched.map((s) => s.book.group))];
  return (
    <div className="space-y-10">
      <section aria-labelledby="faixa-h" className="space-y-3">
        <h2 id="faixa-h" className="eyebrow">O ano inteiro em cores</h2>
        <div className="relative">
          <div className="flex h-10 w-full overflow-hidden rounded-xl border border-ink-700" role="img" aria-label="Faixa do ano: cada cor é um livro da Bíblia, de Gênesis a Apocalipse">
            {sched.map((s) => (
              <span key={s.book.id} title={`${s.book.name}: dias ${s.startDay}–${s.endDay}`} className="h-full" style={{ background: s.book.color, flex: s.days }} />
            ))}
          </div>
          {currentDay && (
            <span aria-hidden className="absolute -bottom-2 top-[-6px] w-0.5 rounded bg-white shadow-[0_0_0_2px_rgba(0,0,0,.6)]" style={{ left: `${((currentDay - 0.5) / PLAN_DAYS) * 100}%` }} />
          )}
        </div>
        <div className="flex justify-between text-xs text-ash-400">
          <span>Gênesis · {fmtBR(startIso, "d 'de' MMM")}</span>
          {currentDay && <span className="text-ash-200">Você está aqui · dia {currentDay}</span>}
          <span>Apocalipse · {fmtBR(dateForDay(startIso, PLAN_DAYS), "d 'de' MMM")}</span>
        </div>
      </section>

      <section aria-labelledby="livros-h" className="space-y-6">
        <h2 id="livros-h" className="eyebrow">Os 66 livros: início, capítulos e duração</h2>
        {groups.map((g) => (
          <div key={g} className="space-y-3">
            <h3 className="font-display text-2xl text-white">{g}</h3>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sched.filter((s) => s.book.group === g).map((s) => {
                const now = currentDay !== null && currentDay >= s.startDay && currentDay <= s.endDay;
                const past = currentDay !== null && currentDay > s.endDay;
                return (
                  <li key={s.book.id} className={`relative overflow-hidden rounded-xl border bg-ink-900 p-4 pl-5 ${now ? "border-ash-100" : "border-ink-700"}`}>
                    <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: s.book.color }} />
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-white">{s.book.name}</p>
                      {now ? <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-black" style={{ background: s.book.color }}>Lendo agora</span>
                        : past ? <span className="text-[11px] text-ash-400">Concluído</span> : null}
                    </div>
                    <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <div><dt className="text-ash-400">Começa</dt><dd className="text-ash-100">dia {s.startDay}<br /><span className="text-ash-300">{fmtBR(dateForDay(startIso, s.startDay), "d MMM")}</span></dd></div>
                      <div><dt className="text-ash-400">Capítulos</dt><dd className="text-ash-100">{s.book.chapters}<br /><span className="text-ash-300">≈{(s.book.chapters / s.days).toFixed(1)}/dia</span></dd></div>
                      <div><dt className="text-ash-400">Duração</dt><dd className="text-ash-100">{s.days} {s.days === 1 ? "dia" : "dias"}<br /><span className="text-ash-300">até {fmtBR(dateForDay(startIso, s.endDay), "d MMM")}</span></dd></div>
                    </dl>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
