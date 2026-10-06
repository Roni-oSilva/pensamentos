import { describe, expect, it } from "vitest";
import { LEVELS, lessonXp, levelFor, totalXp } from "@/lib/study/xp";

describe("níveis de estudo", () => {
  it("começa na Semente com 0 XP", () => {
    const l = levelFor(0);
    expect(l).toMatchObject({ level: 1, name: "Semente", pct: 0, next: 40, remaining: 40 });
  });
  it("sobe de nível exatamente no limite", () => {
    expect(levelFor(39).level).toBe(1);
    expect(levelFor(40)).toMatchObject({ level: 2, name: "Broto", pct: 0 });
  });
  it("calcula a porcentagem dentro do nível", () => {
    expect(levelFor(70).pct).toBe(50); // 40..100
  });
  it("último nível não tem próximo", () => {
    const last = levelFor(99999);
    expect(last.level).toBe(LEVELS.length);
    expect(last).toMatchObject({ next: null, pct: 100, remaining: 0 });
  });
  it("ignora XP negativo", () => expect(levelFor(-5).xp).toBe(0));
  it("quiz perfeito vale bônus", () => {
    expect(lessonXp(2, 2)).toBe(30);
    expect(lessonXp(1, 2)).toBe(20);
    expect(lessonXp(0, 0)).toBe(20);
  });
  it("soma aulas, trilhas e dias do plano", () => {
    expect(totalXp({ lessons: [{ quiz_correct: 2, quiz_total: 2 }, { quiz_correct: 1, quiz_total: 2 }], trails: 1, planDays: 4 })).toBe(30 + 20 + 100 + 20);
  });
});
