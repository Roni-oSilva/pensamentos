import { describe, expect, it } from "vitest";
import { BOOKS, TOTAL_CHAPTERS, PLAN_DAYS, planDays, bookSchedule, planDay, dayLabel, dayForDate, dateForDay, todayIsoBR } from "@/lib/bible-plan";

describe("Bíblia em um ano", () => {
  it("tem os 66 livros e 1.189 capítulos (929 no AT e 260 no NT)", () => {
    expect(BOOKS).toHaveLength(66);
    expect(TOTAL_CHAPTERS).toBe(1189);
    expect(BOOKS.filter((b) => b.testament === "AT").reduce((n, b) => n + b.chapters, 0)).toBe(929);
    expect(BOOKS.filter((b) => b.testament === "NT").reduce((n, b) => n + b.chapters, 0)).toBe(260);
  });
  it("divide todos os capítulos em 365 dias, sem pular nem repetir", () => {
    const days = planDays();
    expect(days).toHaveLength(PLAN_DAYS);
    expect(days.reduce((n, d) => n + d.chapters, 0)).toBe(1189);
    for (const d of days) { expect(d.chapters).toBeGreaterThanOrEqual(3); expect(d.chapters).toBeLessThanOrEqual(4); }
    const seen = new Set<string>();
    for (const d of days) for (const r of d.readings) for (let c = r.from; c <= r.to; c++) {
      const k = `${r.book.id}:${c}`; expect(seen.has(k)).toBe(false); seen.add(k);
    }
    expect(seen.size).toBe(1189);
  });
  it("começa em Gênesis 1 e termina em Apocalipse 22", () => {
    expect(dayLabel(planDay(1)!)).toMatch(/^Gênesis 1–/);
    expect(dayLabel(planDay(365)!)).toMatch(/Apocalipse \d+–22$/);
  });
  it("calcula início, fim e duração de cada livro, em ordem", () => {
    const s = bookSchedule();
    expect(s).toHaveLength(66);
    expect(s[0]).toMatchObject({ startDay: 1 });
    expect(s[65]).toMatchObject({ endDay: 365 });
    for (let i = 1; i < s.length; i++) expect(s[i]!.startDay).toBeGreaterThanOrEqual(s[i - 1]!.endDay);
    for (const b of s) expect(b.days).toBe(b.endDay - b.startDay + 1);
  });
  it("cada livro tem uma cor, e livros vizinhos têm cores diferentes", () => {
    for (let i = 1; i < BOOKS.length; i++) expect(BOOKS[i]!.color).not.toBe(BOOKS[i - 1]!.color);
  });
  it("converte datas em dias do plano, inclusive em ano bissexto", () => {
    expect(dayForDate("2026-01-01", "2026-01-01")).toBe(1);
    expect(dayForDate("2026-01-01", "2026-12-31")).toBe(365);
    expect(dayForDate("2026-01-01", "2027-01-01")).toBeNull();
    expect(dayForDate("2026-01-01", "2025-12-31")).toBeNull();
    expect(dateForDay("2028-02-20", 10)).toBe("2028-02-29");
    expect(todayIsoBR(new Date("2026-03-01T02:00:00Z"))).toBe("2026-02-28"); // 23h em Brasília
  });
});
