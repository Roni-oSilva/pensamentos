import type { LevelInfo } from "@/lib/study/xp";
import { ProgressBar } from "./ProgressBar";

/** Cartão de nível: nome, XP e barra até o próximo nível. */
export function LevelCard({ info, compact = false }: { info: LevelInfo; compact?: boolean }) {
  return (
    <div className={`card ${compact ? "p-4" : "p-5 sm:p-6"}`}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-1">Nível {info.level}</p>
          <p className="font-display text-3xl leading-none text-white sm:text-4xl">{info.name}</p>
        </div>
        <p className="text-right text-sm text-ash-300"><span className="text-lg font-semibold tabular-nums text-white">{info.xp}</span> XP</p>
      </div>
      <ProgressBar pct={info.pct} label={`Progresso no nível ${info.name}`} className="mt-4" />
      <p className="mt-2 text-xs text-ash-400">
        {info.next ? `Faltam ${info.remaining} XP para o nível ${info.level + 1}, ${info.nextName}.` : "Você chegou ao nível máximo. Continue estudando!"}
      </p>
    </div>
  );
}
