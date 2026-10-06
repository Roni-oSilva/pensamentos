/** Sistema de níveis da Área de Estudo. O XP nunca é guardado: é calculado a partir dos registros de progresso. */
export const XP = { lesson: 20, perfectQuiz: 10, trail: 100, planDay: 5, bibleDay: 5 } as const;

export const LEVELS = [
  { name: "Semente", min: 0 },
  { name: "Broto", min: 40 },
  { name: "Raiz", min: 100 },
  { name: "Caule", min: 180 },
  { name: "Ramo", min: 280 },
  { name: "Folha", min: 420 },
  { name: "Flor", min: 600 },
  { name: "Fruto", min: 850 },
  { name: "Árvore", min: 1100 },
] as const;

export interface LevelInfo {
  level: number;       // 1..9
  name: string;
  xp: number;
  floor: number;       // XP em que este nível começou
  next: number | null; // XP do próximo nível (null no último)
  nextName: string | null;
  pct: number;         // 0..100 dentro do nível atual
  remaining: number;   // XP que falta para o próximo nível
}

export function levelFor(xp: number): LevelInfo {
  const total = Math.max(0, Math.floor(xp));
  let i = 0;
  while (i + 1 < LEVELS.length && total >= LEVELS[i + 1]!.min) i++;
  const cur = LEVELS[i]!;
  const nxt = LEVELS[i + 1] ?? null;
  const pct = nxt ? Math.min(100, Math.round(((total - cur.min) / (nxt.min - cur.min)) * 100)) : 100;
  return { level: i + 1, name: cur.name, xp: total, floor: cur.min, next: nxt?.min ?? null, nextName: nxt?.name ?? null, pct, remaining: nxt ? nxt.min - total : 0 };
}

export const lessonXp = (correct: number, total: number): number => XP.lesson + (total > 0 && correct === total ? XP.perfectQuiz : 0);

export function totalXp(input: { lessons: { quiz_correct: number; quiz_total: number }[]; trails: number; planDays: number; bibleDays?: number }): number {
  return input.lessons.reduce((n, l) => n + lessonXp(l.quiz_correct, l.quiz_total), 0) + input.trails * XP.trail + input.planDays * XP.planDay + (input.bibleDays ?? 0) * XP.bibleDay;
}
