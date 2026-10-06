import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, CalendarDays, CheckCircle2, ChevronDown, Clock, Crown, Flag, Trophy } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getPublicLevel, getRanking, type RankPeriod, type RankRow } from "@/lib/study/ranking";
import { XP } from "@/lib/study/xp";
import { PageTitle } from "@/components/ui/Section";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Ranking dos estudos", description: "Quem mais aprendeu na Igreja de Cristo: XP das aulas, trilhas e leitura da Bíblia." };
export const dynamic = "force-dynamic";

const MEDAL = ["#f2c14e", "#c9d1d9", "#d08a4e"]; // ouro, prata, bronze
// uma cor por nível: Semente → Árvore
const LEVEL_COLOR = ["#a8a29e", "#86efac", "#bef264", "#fde047", "#fdba74", "#4ade80", "#f9a8d4", "#fb7185", "#f2c14e"];

export default async function Ranking({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const { periodo } = await searchParams;
  const period: RankPeriod = periodo === "mes" ? "month" : "all";
  const session = await getSession();
  const [rows, mine] = await Promise.all([getRanking(period, 100), session ? getPublicLevel(session.user.id) : null]);
  const meId = session?.user.id;
  const myRow = rows.find((r) => r.userId === meId) ?? null;
  const ahead = myRow ? [...rows].reverse().find((r) => r.xp > myRow.xp) ?? null : null;
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <>
      <PageTitle eyebrow="Estudos" title="Ranking">Quem mais aprendeu. O XP vem das aulas, dos quizzes, das trilhas concluídas e da leitura da Bíblia.</PageTitle>
      <div className="container-wide mt-8 space-y-8">
        <div role="tablist" aria-label="Período" className="inline-flex rounded-full border border-ink-600 bg-ink-900 p-1">
          {([["all", "Geral", "/estudos/ranking"], ["month", "Este mês", "/estudos/ranking?periodo=mes"]] as const).map(([k, label, href]) => (
            <Link key={k} role="tab" aria-selected={period === k} href={href} prefetch
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${period === k ? "bg-ash-100 text-ink-950" : "text-ash-300 hover:text-white"}`}>{label}</Link>
          ))}
        </div>

        {session && (
          <div className="podium-rise rounded-2xl border border-amber-300/25 bg-gradient-to-r from-amber-400/10 to-transparent px-4 py-3">
            <div className="flex items-center gap-3">
              <Avatar src={session.profile.avatar_url} name={session.profile.username} size={40} />
              <div className="min-w-0 flex-1 text-sm">
                {mine && !mine.inRanking ? (
                  <><p className="font-semibold text-white">Você faz parte da equipe · {mine.info.xp} XP · {mine.info.name}</p><p className="text-ash-400">Moderadores, administradores e o Criador não entram no ranking.</p></>
                ) : myRow ? (
                  <>
                    <p className="font-semibold text-white">Você está em {myRow.pos}º · {myRow.xp} XP</p>
                    <p className="truncate text-ash-400">{ahead ? `Faltam ${ahead.xp - myRow.xp + 1} XP para passar @${ahead.username}` : "Você está no topo. Glória a Deus!"}</p>
                  </>
                ) : period === "month" ? (
                  <><p className="font-semibold text-white">Você ainda não pontuou este mês</p><p className="text-ash-400">Conclua uma aula para entrar no ranking.</p></>
                ) : mine?.pos ? (
                  <><p className="font-semibold text-white">Você está em {mine.pos}º · {mine.info.xp} XP</p><p className="text-ash-400">Continue estudando para subir.</p></>
                ) : (
                  <><p className="font-semibold text-white">Você ainda não está no ranking</p><p className="text-ash-400">Conclua sua primeira aula e ganhe {XP.lesson} XP.</p></>
                )}
              </div>
              <Link href="/estudos" className="btn-primary shrink-0 px-4 py-2 text-sm">Estudar</Link>
            </div>
          </div>
        )}

        {rows.length === 0 ? (
          <EmptyState title={period === "month" ? "Ninguém pontuou este mês ainda." : "O ranking ainda está vazio."} hint="Conclua uma aula para aparecer aqui." />
        ) : (
          <>
            <section aria-label="Pódio" className="grid grid-cols-3 items-end gap-2 pt-10 sm:gap-4">
              {[1, 0, 2].map((i) => podium[i] ? <Podium key={i} r={podium[i]!} place={i} me={podium[i]!.userId === meId} /> : <div key={i} />)}
            </section>

            {rest.length > 0 && (
              <ol className="space-y-3" aria-label="Classificação">
                {rest.map((r, i) => <Row key={r.userId} r={r} me={r.userId === meId} delay={i} month={period === "month"} />)}
              </ol>
            )}
          </>
        )}

        <section aria-labelledby="como-xp" className="card p-5 sm:p-6">
          <h2 id="como-xp" className="eyebrow mb-3">Como ganhar XP</h2>
          <ul className="grid gap-2 text-sm text-ash-200 sm:grid-cols-2">
            <li>Aula concluída: <strong className="text-white">+{XP.lesson} XP</strong></li>
            <li>Quiz sem errar: <strong className="text-white">+{XP.perfectQuiz} XP</strong></li>
            <li>Trilha concluída: <strong className="text-white">+{XP.trail} XP</strong></li>
            <li>Dia lido na Bíblia em um ano: <strong className="text-white">+{XP.bibleDay} XP</strong></li>
          </ul>
          <Link href="/estudos" className="btn-primary mt-5 inline-flex">Estudar agora →</Link>
        </section>
      </div>

    </>
  );
}

function Podium({ r, place, me }: { r: RankRow; place: number; me: boolean }) {
  const h = ["h-36 sm:h-44", "h-24 sm:h-32", "h-16 sm:h-24"][place];
  const size = place === 0 ? 84 : 64;
  return (
    <Link href={`/perfil/${r.username}`} className="podium-rise group flex min-w-0 flex-col items-center text-center" style={{ animationDelay: `${[0.15, 0, 0.3][place]}s` }}>
      <div className="relative">
        {place === 0 && <Crown aria-hidden className="crown-bob absolute -top-8 left-1/2 h-8 w-8 -translate-x-1/2" style={{ color: MEDAL[0] }} />}
        <span className="block rounded-full p-1" style={{ background: `conic-gradient(${MEDAL[place]}, #fff7, ${MEDAL[place]})` }}>
          <Avatar src={r.avatarUrl} name={r.username} size={size} />
        </span>
        <span className="absolute -bottom-2 left-1/2 grid h-7 w-7 -translate-x-1/2 place-items-center rounded-full text-xs font-bold text-ink-950" style={{ background: MEDAL[place] }}>{r.pos}</span>
      </div>
      <p className={`mt-4 w-full truncate text-sm font-semibold ${me ? "text-amber-300" : "text-white"} group-hover:underline`}>{me ? "Você" : r.name}</p>
      <p className="text-xs" style={{ color: LEVEL_COLOR[r.level.level - 1] }}>Nível {r.level.level} · {r.level.name}</p>
      <p className="mt-0.5 text-[11px] text-ash-400">{r.lessons} {r.lessons === 1 ? "aula" : "aulas"} · {r.trails} {r.trails === 1 ? "trilha" : "trilhas"}</p>
      <div className={`mt-3 flex w-full flex-col items-center justify-start rounded-t-2xl border border-b-0 border-ink-600 bg-gradient-to-b from-ink-800 to-ink-900 pt-3 ${h}`}>
        <Trophy aria-hidden className="h-5 w-5" style={{ color: MEDAL[place] }} />
        <p className="mt-1 font-display text-2xl tabular-nums text-white sm:text-3xl">{r.xp}</p>
        <p className="text-[11px] uppercase tracking-widest text-ash-400">XP</p>
      </div>
    </Link>
  );
}

function Row({ r, me, delay, month }: { r: RankRow; me: boolean; delay: number; month: boolean }) {
  const c = LEVEL_COLOR[r.level.level - 1];
  const parts: [string, number, string][] = [
    ["Aulas", r.lessons * XP.lesson, "#f59e0b"],
    ["Quizzes sem errar", r.perfect * XP.perfectQuiz, "#fb7185"],
    ["Trilhas", r.trails * XP.trail, "#a78bfa"],
    ["Leitura bíblica", r.bibleDays * XP.bibleDay + r.planDays * XP.planDay, "#34d399"],
  ];
  return (
    <li className="rank-row" style={{ animationDelay: `${Math.min(delay, 12) * 0.04 + 0.35}s` }}>
      <details className={`group rounded-2xl border transition ${me ? "border-amber-300/40 bg-amber-400/5" : "border-ink-700 bg-ink-900"} open:border-ink-500`}>
        <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
          <span className="w-7 shrink-0 text-center font-display text-2xl tabular-nums text-ash-300">{r.pos}</span>
          <span className="relative shrink-0">
            <span className="block rounded-full p-[3px]" style={{ background: `conic-gradient(${c} ${r.level.pct * 3.6}deg, #ffffff1f 0)` }}>
              <span className="block rounded-full bg-ink-950 p-[2px]"><Avatar src={r.avatarUrl} name={r.username} size={46} /></span>
            </span>
            <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold text-ink-950" style={{ background: c }}>{r.level.level}</span>
          </span>
          <div className="min-w-0 flex-1">
            <p className={`truncate font-semibold ${me ? "text-amber-300" : "text-white"}`}>{r.name}{me && <span className="ml-1 text-xs font-normal text-amber-300/80">(você)</span>}</p>
            <p className="truncate text-xs text-ash-400">@{r.username} · <span style={{ color: c }}>{r.level.name}</span></p>
            <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ash-300">
              <li className="flex items-center gap-1" title="Aulas concluídas"><BookOpen aria-hidden className="h-3.5 w-3.5 text-amber-300" />{r.lessons}</li>
              <li className="flex items-center gap-1" title="Quizzes sem errar"><CheckCircle2 aria-hidden className="h-3.5 w-3.5 text-rose-400" />{r.perfect}</li>
              <li className="flex items-center gap-1" title="Trilhas concluídas"><Flag aria-hidden className="h-3.5 w-3.5 text-violet-400" />{r.trails}</li>
              <li className="flex items-center gap-1" title="Dias de leitura da Bíblia"><CalendarDays aria-hidden className="h-3.5 w-3.5 text-emerald-400" />{r.bibleDays}</li>
            </ul>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-2xl leading-none tabular-nums text-white">{r.xp}</p>
            <p className="text-[10px] uppercase tracking-widest text-ash-400">XP</p>
            <ChevronDown aria-hidden className="ml-auto mt-1 h-4 w-4 text-ash-400 transition group-open:rotate-180" />
          </div>
        </summary>
        <div className="space-y-4 border-t border-ink-700 px-4 pb-4 pt-4">
          {r.bio && <p className="font-display text-lg italic leading-snug text-ash-100">“{r.bio}”</p>}
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-[11px] uppercase tracking-widest text-ash-400">Nível</dt><dd className="text-white">{r.level.level} · {r.level.name}</dd></div>
            <div><dt className="text-[11px] uppercase tracking-widest text-ash-400">Próximo</dt><dd className="text-white">{r.level.next ? `${r.level.nextName}, faltam ${r.level.remaining} XP` : "Nível máximo"}</dd></div>
            {r.memberSince && <div><dt className="text-[11px] uppercase tracking-widest text-ash-400">Membro desde</dt><dd className="text-white">{formatDate(r.memberSince)}</dd></div>}
            {r.lastAt && <div><dt className="text-[11px] uppercase tracking-widest text-ash-400">Último estudo</dt><dd className="flex items-center gap-1 text-white"><Clock aria-hidden className="h-3.5 w-3.5 text-ash-400" />{timeAgo(r.lastAt)}</dd></div>}
          </dl>
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-widest text-ash-400">De onde vem o XP{month ? " (este mês)" : ""}</p>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-ink-700">
              {parts.map(([k, v, col]) => v > 0 && <span key={k} style={{ width: `${(v / Math.max(1, r.xp)) * 100}%`, background: col }} />)}
            </div>
            <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-ash-300">
              {parts.map(([k, v, col]) => <li key={k} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: col }} />{k}: <strong className="text-white">{v}</strong></li>)}
            </ul>
          </div>
          <Link href={`/perfil/${r.username}`} className="btn-ghost inline-flex text-sm">Ver perfil →</Link>
        </div>
      </details>
    </li>
  );
}
