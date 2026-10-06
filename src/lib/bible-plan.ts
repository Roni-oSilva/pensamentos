/**
 * Plano “Bíblia em um ano”: os 66 livros em ordem, 1.189 capítulos divididos em 365 dias.
 * Tudo aqui é cálculo puro (sem banco): o banco guarda só a data de início, as notas do Criador e as marcações.
 */
export type Testament = "AT" | "NT";
export interface Book { id: number; name: string; abbr: string; chapters: number; testament: Testament; group: string; color: string }

const RAW: [string, string, number, string][] = [
  ["Gênesis", "Gn", 50, "Lei"], ["Êxodo", "Êx", 40, "Lei"], ["Levítico", "Lv", 27, "Lei"], ["Números", "Nm", 36, "Lei"], ["Deuteronômio", "Dt", 34, "Lei"],
  ["Josué", "Js", 24, "Históricos"], ["Juízes", "Jz", 21, "Históricos"], ["Rute", "Rt", 4, "Históricos"], ["1 Samuel", "1Sm", 31, "Históricos"], ["2 Samuel", "2Sm", 24, "Históricos"],
  ["1 Reis", "1Rs", 22, "Históricos"], ["2 Reis", "2Rs", 25, "Históricos"], ["1 Crônicas", "1Cr", 29, "Históricos"], ["2 Crônicas", "2Cr", 36, "Históricos"], ["Esdras", "Ed", 10, "Históricos"],
  ["Neemias", "Ne", 13, "Históricos"], ["Ester", "Et", 10, "Históricos"],
  ["Jó", "Jó", 42, "Poéticos"], ["Salmos", "Sl", 150, "Poéticos"], ["Provérbios", "Pv", 31, "Poéticos"], ["Eclesiastes", "Ec", 12, "Poéticos"], ["Cânticos", "Ct", 8, "Poéticos"],
  ["Isaías", "Is", 66, "Profetas maiores"], ["Jeremias", "Jr", 52, "Profetas maiores"], ["Lamentações", "Lm", 5, "Profetas maiores"], ["Ezequiel", "Ez", 48, "Profetas maiores"], ["Daniel", "Dn", 12, "Profetas maiores"],
  ["Oseias", "Os", 14, "Profetas menores"], ["Joel", "Jl", 3, "Profetas menores"], ["Amós", "Am", 9, "Profetas menores"], ["Obadias", "Ob", 1, "Profetas menores"], ["Jonas", "Jn", 4, "Profetas menores"],
  ["Miqueias", "Mq", 7, "Profetas menores"], ["Naum", "Na", 3, "Profetas menores"], ["Habacuque", "Hc", 3, "Profetas menores"], ["Sofonias", "Sf", 3, "Profetas menores"], ["Ageu", "Ag", 2, "Profetas menores"],
  ["Zacarias", "Zc", 14, "Profetas menores"], ["Malaquias", "Ml", 4, "Profetas menores"],
  ["Mateus", "Mt", 28, "Evangelhos"], ["Marcos", "Mc", 16, "Evangelhos"], ["Lucas", "Lc", 24, "Evangelhos"], ["João", "Jo", 21, "Evangelhos"],
  ["Atos", "At", 28, "Histórico"],
  ["Romanos", "Rm", 16, "Cartas de Paulo"], ["1 Coríntios", "1Co", 16, "Cartas de Paulo"], ["2 Coríntios", "2Co", 13, "Cartas de Paulo"], ["Gálatas", "Gl", 6, "Cartas de Paulo"], ["Efésios", "Ef", 6, "Cartas de Paulo"],
  ["Filipenses", "Fp", 4, "Cartas de Paulo"], ["Colossenses", "Cl", 4, "Cartas de Paulo"], ["1 Tessalonicenses", "1Ts", 5, "Cartas de Paulo"], ["2 Tessalonicenses", "2Ts", 3, "Cartas de Paulo"],
  ["1 Timóteo", "1Tm", 6, "Cartas de Paulo"], ["2 Timóteo", "2Tm", 4, "Cartas de Paulo"], ["Tito", "Tt", 3, "Cartas de Paulo"], ["Filemom", "Fm", 1, "Cartas de Paulo"],
  ["Hebreus", "Hb", 13, "Cartas gerais"], ["Tiago", "Tg", 5, "Cartas gerais"], ["1 Pedro", "1Pe", 5, "Cartas gerais"], ["2 Pedro", "2Pe", 3, "Cartas gerais"],
  ["1 João", "1Jo", 5, "Cartas gerais"], ["2 João", "2Jo", 1, "Cartas gerais"], ["3 João", "3Jo", 1, "Cartas gerais"], ["Judas", "Jd", 1, "Cartas gerais"],
  ["Apocalipse", "Ap", 22, "Profecia"],
];

export const PLAN_DAYS = 365;

/** Cor própria de cada livro: matiz espalhado pelo “ângulo de ouro”, para livros vizinhos nunca terem cores parecidas. */
const colorFor = (i: number) => `hsl(${Math.round((i * 137.508 + 8) % 360)} 68% 58%)`;

export const BOOKS: Book[] = RAW.map(([name, abbr, chapters, group], i) => ({
  id: i + 1, name, abbr, chapters, group, testament: i < 39 ? "AT" : "NT", color: colorFor(i),
}));

export const TOTAL_CHAPTERS = BOOKS.reduce((n, b) => n + b.chapters, 0);

export interface Reading { book: Book; from: number; to: number }
export interface PlanDay { day: number; readings: Reading[]; chapters: number }
export interface BookSchedule { book: Book; startDay: number; endDay: number; days: number }

let cache: { days: PlanDay[]; books: BookSchedule[] } | null = null;

function build() {
  if (cache) return cache;
  const chapters: { book: Book; ch: number }[] = [];
  for (const b of BOOKS) for (let c = 1; c <= b.chapters; c++) chapters.push({ book: b, ch: c });
  const days: PlanDay[] = [];
  const books = new Map<number, BookSchedule>();
  for (let d = 1; d <= PLAN_DAYS; d++) {
    const from = Math.floor((TOTAL_CHAPTERS * (d - 1)) / PLAN_DAYS);
    const to = Math.floor((TOTAL_CHAPTERS * d) / PLAN_DAYS);
    const readings: Reading[] = [];
    for (const { book, ch } of chapters.slice(from, to)) {
      const last = readings[readings.length - 1];
      if (last && last.book.id === book.id) last.to = ch; else readings.push({ book, from: ch, to: ch });
      const s = books.get(book.id);
      if (s) { s.endDay = d; s.days = d - s.startDay + 1; } else books.set(book.id, { book, startDay: d, endDay: d, days: 1 });
    }
    days.push({ day: d, readings, chapters: to - from });
  }
  cache = { days, books: BOOKS.map((b) => books.get(b.id)!) };
  return cache;
}

export const planDays = () => build().days;
export const bookSchedule = () => build().books;
export const planDay = (d: number) => build().days[d - 1] ?? null;

/** “Gênesis 1–3”, “Salmos 23”. */
export const readingLabel = (r: Reading) => `${r.book.name} ${r.from === r.to ? r.from : `${r.from}–${r.to}`}`;
export const dayLabel = (d: PlanDay) => d.readings.map(readingLabel).join("; ");

// ---------- datas (sempre em dias “de calendário”, sem fuso) ----------
/** "2026-01-01" → número de dias desde 1970 (UTC), para contas sem problemas de fuso. */
export const isoToEpochDay = (iso: string) => Math.floor(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 864e5);
export const epochDayToIso = (n: number) => new Date(n * 864e5).toISOString().slice(0, 10);

/** Dia do plano (1–365) correspondente a uma data; fora do plano devolve null. */
export function dayForDate(startIso: string, dateIso: string): number | null {
  const d = isoToEpochDay(dateIso) - isoToEpochDay(startIso) + 1;
  return d >= 1 && d <= PLAN_DAYS ? d : null;
}
/** Data (AAAA-MM-DD) de um dia do plano. */
export const dateForDay = (startIso: string, day: number) => epochDayToIso(isoToEpochDay(startIso) + day - 1);

/** “Hoje” no horário de Brasília (o mesmo critério do banco). */
export function todayIsoBR(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
