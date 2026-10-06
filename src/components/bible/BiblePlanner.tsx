"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, CalendarDays, Check, ChevronLeft, ChevronRight, Flag, Flame, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/Avatar";
import { dateForDay, dayForDate, PLAN_DAYS, planDay, readingLabel } from "@/lib/bible-plan";
import { getBiblePresence, saveBibleNote, toggleBibleMark, type PresenceRow } from "@/actions/bible";
import { cap, dateToIso, fmtBR, isoToDate } from "./dates";

interface Props {
  startIso: string;
  todayIso: string;
  currentDay: number | null;
  counts: Record<number, number>;
  notes: Record<number, string>;
  myDays: number[];
  signedIn: boolean;
  isCreator: boolean;
  /** Lista de presença do dia inicial, já carregada no servidor (evita piscar). */
  initialPresence?: { day: number; people: PresenceRow[]; hidden: boolean } | null;
}

const WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Calendário do plano “Bíblia em um ano” com lista de presença por dia. */
export function BiblePlanner({ startIso, todayIso, currentDay, counts: initialCounts, notes: initialNotes, myDays, signedIn, isCreator, initialPresence }: Props) {
  const firstSelected = currentDay ?? (todayIso < startIso ? 1 : PLAN_DAYS);
  const [selected, setSelected] = useState(firstSelected);
  const [month, setMonth] = useState(() => startOfMonth(isoToDate(dateForDay(startIso, firstSelected))));
  const [mine, setMine] = useState(() => new Set(myDays));
  const [counts, setCounts] = useState(initialCounts);
  const [notes, setNotes] = useState(initialNotes);

  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month)), end: endOfWeek(endOfMonth(month)) });
  const done = mine.size;
  const behind = currentDay ? Math.max(0, currentDay - [...mine].filter((d) => d <= currentDay).length) : 0;
  const streak = useMemo(() => {
    if (!currentDay) return 0;
    let n = 0, d = mine.has(currentDay) ? currentDay : currentDay - 1;
    while (d >= 1 && mine.has(d)) { n++; d--; }
    return n;
  }, [mine, currentDay]);

  function pick(day: number) {
    setSelected(day);
    setMonth(startOfMonth(isoToDate(dateForDay(startIso, day))));
  }
  function onToggled(day: number, marked: boolean) {
    setMine((s) => { const n = new Set(s); if (marked) n.add(day); else n.delete(day); return n; });
    setCounts((c) => ({ ...c, [day]: Math.max(0, (c[day] ?? 0) + (marked ? 1 : -1)) }));
  }

  return (
    <div className="space-y-8">
      {/* Resumo pessoal */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={<BookOpen className="h-5 w-5" />} label="Dias lidos" value={signedIn ? `${done} de ${PLAN_DAYS}` : "Entre para marcar"} bar={signedIn ? (done / PLAN_DAYS) * 100 : 0} />
        <Stat icon={<Flame className="h-5 w-5" />} label="Sequência" value={signedIn ? `${streak} ${streak === 1 ? "dia" : "dias"} seguidos` : "—"} />
        <Stat icon={<Flag className="h-5 w-5" />} label="Hoje no plano" value={currentDay ? `Dia ${currentDay} de ${PLAN_DAYS}` : todayIso < startIso ? `Começa em ${fmtBR(startIso, "d 'de' MMM")}` : "Plano concluído"}
          hint={signedIn && behind > 0 ? `${behind} ${behind === 1 ? "dia pendente" : "dias pendentes"} até hoje` : undefined} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* Calendário */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Button type="button" variant="ghost" size="icon" onClick={() => setMonth((m) => subMonths(m, 1))} aria-label="Mês anterior"><ChevronLeft className="h-5 w-5" /></Button>
            <AnimatePresence mode="wait">
              <motion.h2 key={dateToIso(month)} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }}
                className="text-lg font-medium text-foreground">{cap(fmtBR(month, "MMMM 'de' yyyy"))}</motion.h2>
            </AnimatePresence>
            <Button type="button" variant="ghost" size="icon" onClick={() => setMonth((m) => addMonths(m, 1))} aria-label="Próximo mês"><ChevronRight className="h-5 w-5" /></Button>
          </CardHeader>
          <CardContent className="px-3 pb-4 sm:px-6">
            <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">{WEEK.map((w) => <div key={w} className="py-2">{w}</div>)}</div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((date) => {
                const iso = dateToIso(date);
                const day = dayForDate(startIso, iso);
                const pd = day ? planDay(day) : null;
                const isToday = iso === todayIso;
                const isSel = day === selected;
                const read = day !== null && mine.has(day);
                return (
                  <motion.button type="button" key={iso} disabled={!day} onClick={() => day && setSelected(day)}
                    whileHover={day ? { scale: 1.05 } : undefined} whileTap={day ? { scale: 0.95 } : undefined}
                    aria-pressed={isSel} aria-label={`${fmtBR(date, "d 'de' MMMM")}${pd ? `: ${pd.readings.map(readingLabel).join(", ")}` : ""}${read ? ", lido" : ""}`}
                    className={cn("relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-colors",
                      !isSameMonth(date, month) && "opacity-35",
                      !day && "cursor-default text-muted-foreground/40",
                      day && "hover:bg-accent",
                      read && "bg-primary/10",
                      isSel && "bg-primary text-primary-foreground hover:bg-primary",
                      isToday && !isSel && "ring-2 ring-primary")}>
                    <span className={cn("leading-none", isToday && "font-bold")}>{fmtBR(date, "d")}</span>
                    {pd && (
                      <span className="mt-1 flex h-1.5 w-7 overflow-hidden rounded-full" aria-hidden>
                        {pd.readings.map((r) => <span key={r.book.id} className="h-full" style={{ background: r.book.color, flex: r.to - r.from + 1 }} />)}
                      </span>
                    )}
                    {read && <Check className={cn("absolute right-1 top-1 h-3 w-3", isSel ? "text-primary-foreground" : "text-primary")} aria-hidden />}
                    {day && (counts[day] ?? 0) > 0 && !isSel && <span className="absolute left-1.5 top-1 text-[9px] leading-none tabular-nums text-muted-foreground" aria-hidden>{counts[day]}</span>}
                  </motion.button>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full ring-2 ring-primary" /> Hoje</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3 w-3" /> Você leu</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-5 rounded-full bg-gradient-to-r from-sky-400 via-amber-400 to-rose-400" /> Cor do livro</span>
              <span className="inline-flex items-center gap-1.5"><span className="text-[10px] tabular-nums">12</span> no canto: irmãos que leram</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {currentDay && <Button type="button" variant="outline" size="sm" onClick={() => pick(currentDay)}><CalendarDays className="mr-1.5 h-4 w-4" />Ir para hoje</Button>}
              <Button type="button" variant="outline" size="sm" onClick={() => pick(1)}>Início do plano</Button>
            </div>
          </CardContent>
        </Card>

        <DayPanel key={selected} day={selected} startIso={startIso} todayIso={todayIso} currentDay={currentDay} count={counts[selected] ?? 0}
          note={notes[selected] ?? ""} marked={mine.has(selected)} signedIn={signedIn} isCreator={isCreator}
          onToggled={onToggled} onNote={(n) => setNotes((x) => ({ ...x, [selected]: n }))}
          initial={initialPresence?.day === selected ? initialPresence : null}
          onPrev={() => selected > 1 && pick(selected - 1)} onNext={() => selected < PLAN_DAYS && pick(selected + 1)} />
      </div>
    </div>
  );
}

function Stat({ icon, label, value, bar, hint }: { icon: React.ReactNode; label: string; value: string; bar?: number; hint?: string }) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <span className="rounded-full bg-primary/10 p-2.5 text-primary">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
          <p className="mt-0.5 font-semibold text-foreground">{value}</p>
          {bar !== undefined && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${bar}%` }} /></div>}
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

interface PanelProps {
  day: number; startIso: string; todayIso: string; currentDay: number | null; count: number; note: string; marked: boolean; signedIn: boolean; isCreator: boolean;
  onToggled: (day: number, marked: boolean) => void; onNote: (n: string) => void; onPrev: () => void; onNext: () => void;
  initial: { people: PresenceRow[]; hidden: boolean } | null;
}

/** Painel do dia: leitura com as cores dos livros, nota do Criador, botão de presença e lista de quem leu. */
function DayPanel({ day, startIso, todayIso, currentDay, count, note, marked, signedIn, isCreator, onToggled, onNote, onPrev, onNext, initial }: PanelProps) {
  const pd = planDay(day)!;
  const iso = dateForDay(startIso, day);
  const arrived = iso <= todayIso; // dias futuros ainda não podem ser marcados
  const isToday = currentDay === day;
  const [people, setPeople] = useState<PresenceRow[] | null>(initial?.people ?? null);
  const [hidden, setHidden] = useState(initial?.hidden ?? false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState(note);
  const [noteMsg, setNoteMsg] = useState<string | null>(null);

  const load = () => start(async () => {
    const r = await getBiblePresence(day);
    if (r.ok) { setPeople(r.people); setHidden(r.hidden); }
  });
  useEffect(() => { if (signedIn && !initial) load(); }, [day, signedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle() {
    setError(null);
    start(async () => {
      const r = await toggleBibleMark(day);
      if (!r.ok) { setError(r.error); return; }
      onToggled(day, r.marked);
      const p = await getBiblePresence(day);
      if (p.ok) { setPeople(p.people); setHidden(p.hidden); }
    });
  }
  function saveNote() {
    setNoteMsg(null);
    start(async () => {
      const r = await saveBibleNote({ day, note: draft });
      setNoteMsg(r.ok ? "Nota salva." : r.error);
      if (r.ok) onNote(draft.trim());
    });
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" size="icon" onClick={onPrev} disabled={day <= 1} aria-label="Dia anterior"><ChevronLeft className="h-5 w-5" /></Button>
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{isToday ? "Hoje · " : ""}Dia {day} de {PLAN_DAYS}</p>
            <CardTitle className="mt-1 font-display text-2xl font-normal sm:text-3xl">{cap(fmtBR(iso, "EEEE, d 'de' MMMM"))}</CardTitle>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onNext} disabled={day >= PLAN_DAYS} aria-label="Próximo dia"><ChevronRight className="h-5 w-5" /></Button>
        </div>
        <CardDescription className="text-center">{pd.chapters} capítulos para ler</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-5">
        <ul className="space-y-2">
          {pd.readings.map((r) => (
            <li key={r.book.id} className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: `color-mix(in srgb, ${r.book.color} 45%, transparent)` }}>
              <span className="h-10 w-1.5 shrink-0 rounded-full" style={{ background: r.book.color }} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{readingLabel(r)}</p>
                <p className="text-xs text-muted-foreground">{r.to - r.from + 1} {r.to === r.from ? "capítulo" : "capítulos"} · {r.book.group}</p>
              </div>
              {r.from === 1 && <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-black" style={{ background: r.book.color }}>Começa hoje</span>}
              {r.from !== 1 && r.to === r.book.chapters && <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">Termina hoje</span>}
            </li>
          ))}
        </ul>

        {note && !isCreator && <p className="rounded-xl bg-muted p-3 text-sm text-foreground"><span className="font-semibold">Palavra do Criador: </span>{note}</p>}
        {isCreator && (
          <div className="space-y-2 rounded-xl border border-dashed p-3">
            <label htmlFor={`note-${day}`} className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Nota do Criador para este dia</label>
            <textarea id={`note-${day}`} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={500} rows={2} className="field text-sm" placeholder="Ex.: Hoje começamos os Salmos. Leia em voz alta!" />
            <div className="flex items-center justify-between gap-2"><span className="text-xs text-muted-foreground" role="status">{noteMsg}</span><Button type="button" size="sm" variant="secondary" onClick={saveNote} disabled={pending}>Salvar nota</Button></div>
          </div>
        )}

        {/* Presença */}
        <div className="space-y-3">
          {!signedIn ? (
            <Button asChild className="w-full"><Link href={`/login?next=${encodeURIComponent("/estudos/biblia")}`}>Entre para marcar a sua leitura</Link></Button>
          ) : !arrived ? (
            <Button type="button" className="w-full" disabled>Disponível em {fmtBR(iso, "d 'de' MMMM")}</Button>
          ) : (
            <Button type="button" onClick={toggle} disabled={pending} variant={marked ? "outline" : "default"} className="h-12 w-full text-base">
              {marked ? <><Check className="mr-2 h-5 w-5" />Você leu este dia · desmarcar</> : isToday ? "Li hoje · estou junto!" : "Marcar como lido"}
            </Button>
          )}
          {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4" /><span><strong className="text-foreground">{count}</strong> {count === 1 ? "irmão leu" : "irmãos leram"} este dia</span></div>
          {signedIn && !hidden && people && people.length > 0 && (
            <ul className="flex max-h-56 flex-col gap-2 overflow-y-auto pr-1">
              {people.map((p) => (
                <li key={p.username} className="flex items-center gap-3 text-sm">
                  <Avatar src={p.avatar_url} name={p.username} size={28} />
                  <Link href={`/perfil/${p.username}`} className="min-w-0 flex-1 truncate text-foreground hover:underline">@{p.username}</Link>
                  {p.onTime ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">no dia</span> : <span className="text-[11px] text-muted-foreground">depois</span>}
                </li>
              ))}
            </ul>
          )}
          {signedIn && hidden && <p className="text-xs text-muted-foreground">A lista de nomes está fechada pelo Criador; só o total aparece.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
