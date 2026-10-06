import Link from "next/link";
import { Trophy } from "lucide-react";
import type { PublicLevel } from "@/lib/study/ranking";
import { ProgressBar } from "./ProgressBar";

/** Nível nos estudos, visível para todos no perfil: nível, XP, posição no ranking e o que já concluiu. */
export function PublicLevelCard({ level, isMe, name }: { level: PublicLevel; isMe: boolean; name: string }) {
  const { info } = level;
  const medal = level.pos === 1 ? "#f2c14e" : level.pos === 2 ? "#c9d1d9" : level.pos === 3 ? "#d08a4e" : undefined;
  return (
    <div className="card overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-1">Nos estudos · nível {info.level}</p>
            <p className="font-display text-3xl leading-none text-white sm:text-4xl">{info.name}</p>
          </div>
          <p className="text-right text-sm text-ash-300"><span className="text-lg font-semibold tabular-nums text-white">{info.xp}</span> XP</p>
        </div>
        <ProgressBar pct={info.pct} label={`Progresso no nível ${info.name}`} className="mt-4" />
        <p className="mt-2 text-xs text-ash-400">
          {info.next ? (isMe ? `Faltam ${info.remaining} XP para o nível ${info.level + 1}, ${info.nextName}.` : `Próximo nível: ${info.nextName}.`) : "Nível máximo: Árvore."}
        </p>
      </div>
      <div className="grid grid-cols-3 divide-x divide-ink-700 border-t border-ink-700 text-center">
        <Link href="/estudos/ranking" className="flex flex-col items-center gap-0.5 px-2 py-3 transition hover:bg-ink-800">
          <span className="flex items-center gap-1 font-display text-2xl tabular-nums text-white">
            {medal && <Trophy aria-hidden className="h-4 w-4" style={{ color: medal }} />}
            {!level.inRanking ? "Equipe" : level.pos ? `${level.pos}º` : "—"}
          </span>
          <span className="text-[11px] uppercase tracking-widest text-ash-400">{level.inRanking ? "no ranking" : "fora do ranking"}</span>
        </Link>
        <div className="flex flex-col items-center gap-0.5 px-2 py-3">
          <span className="font-display text-2xl tabular-nums text-white">{level.lessons}</span>
          <span className="text-[11px] uppercase tracking-widest text-ash-400">{level.lessons === 1 ? "aula" : "aulas"}</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-2 py-3">
          <span className="font-display text-2xl tabular-nums text-white">{level.trails}</span>
          <span className="text-[11px] uppercase tracking-widest text-ash-400">{level.trails === 1 ? "trilha" : "trilhas"}</span>
        </div>
      </div>
      {level.inRanking && !level.pos && <p className="border-t border-ink-700 px-5 py-3 text-xs text-ash-400">{isMe ? "Conclua uma aula para entrar no ranking." : `${name} ainda não começou os estudos.`}</p>}
    </div>
  );
}
