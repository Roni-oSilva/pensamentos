import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/** "AAAA-MM-DD" ↔ Date local (meia-noite), sem deslocamento de fuso. */
export const isoToDate = (iso: string) => new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
export const dateToIso = (d: Date) => format(d, "yyyy-MM-dd");
export const fmtBR = (d: Date | string, f: string) => format(typeof d === "string" ? isoToDate(d) : d, f, { locale: ptBR });
/** Só a primeira letra maiúscula: “Outubro de 2026”, “Terça-feira, 6 de outubro”. */
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
