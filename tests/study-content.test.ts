import { describe, expect, it } from "vitest";
import { PLAN, TRACKS } from "@/lib/study/content";

const SYMBOLS = ["livro", "sol", "cruz", "coracao", "arvore", "pomba", "agua", "igreja", "pao", "luz", "cajado", "tumulo", "videira", "maos", "chama"];

describe("conteúdo da Área de Estudo", () => {
  it("tem trilhas com slugs únicos e aulas numeradas em sequência", () => {
    expect(new Set(TRACKS.map((t) => t.slug)).size).toBe(TRACKS.length);
    for (const t of TRACKS) t.aulas.forEach((a, i) => expect(a.ordem).toBe(i + 1));
  });
  it("cada aula está completa", () => {
    for (const t of TRACKS) for (const a of t.aulas) {
      const id = `${t.slug}/${a.ordem}`;
      expect(a.titulo, id).toBeTruthy();
      expect(a.versiculo.texto.length, id).toBeGreaterThan(10);
      expect(a.texto.length, id).toBeGreaterThanOrEqual(3);
      expect(a.aprofundamento.length, id).toBeGreaterThanOrEqual(3);
      expect(a.termos.length, id).toBeGreaterThanOrEqual(3);
      expect(a.heroi.historia.length, id).toBeGreaterThanOrEqual(3);
      expect(a.pratica.length, id).toBeGreaterThanOrEqual(2);
      expect(a.curiosidades.length, id).toBe(3);
      expect(a.linha.length, id).toBeGreaterThanOrEqual(3);
      expect(a.leitura.length, id).toBeGreaterThanOrEqual(2);
      expect(SYMBOLS, id).toContain(a.simbolo);
    }
  });
  it("o quiz tem 3 perguntas com resposta válida", () => {
    for (const t of TRACKS) for (const a of t.aulas) {
      expect(a.quiz.length, `${t.slug}/${a.ordem}`).toBe(3);
      for (const q of a.quiz) {
        expect(q.opcoes.length).toBe(3);
        expect(q.correta).toBeGreaterThanOrEqual(0);
        expect(q.correta).toBeLessThan(3);
        expect(q.explicacao.length).toBeGreaterThan(5);
      }
    }
  });
  it("o plano de leitura tem 30 dias numerados", () => {
    expect(PLAN.dias.map((d) => d.dia)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
  });
});
