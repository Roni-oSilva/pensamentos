import raw from "../../../content/estudos/estudos.json";

export interface QuizQuestion { pergunta: string; opcoes: string[]; correta: number; explicacao: string }
export interface Lesson {
  ordem: number; titulo: string; resumo: string; minutos: number;
  versiculo: { ref: string; texto: string }; texto: string[]; apoio: string[]; reflexao: string; oracao: string; quiz: QuizQuestion[];
  contexto: string; aprofundamento: string[]; termos: { termo: string; definicao: string }[];
  heroi: { nome: string; periodo: string; titulo: string; historia: string[]; licao: string };
  pratica: string[];
}
export interface Track { slug: string; titulo: string; descricao: string; nivel: string; aulas: Lesson[] }
export interface PlanDay { dia: number; leitura: string; tema: string }
export interface Plan { slug: string; titulo: string; descricao: string; dias: PlanDay[] }

const data = raw as unknown as { trilhas: Track[]; plano: Plan };

export const TRACKS: Track[] = data.trilhas;
export const PLAN: Plan = data.plano;
export const getTrack = (slug: string) => TRACKS.find((t) => t.slug === slug) ?? null;
export const getLesson = (track: Track, order: number) => track.aulas.find((a) => a.ordem === order) ?? null;
