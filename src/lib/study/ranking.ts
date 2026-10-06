import "server-only";
import { createClient } from "@/lib/supabase/server";
import { levelFor, type LevelInfo } from "./xp";

export type RankPeriod = "all" | "month";

export interface RankRow {
  pos: number;
  userId: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  memberSince: string | null;
  xp: number;
  lessons: number;
  perfect: number;    // quizzes sem errar
  trails: number;
  planDays: number;
  bibleDays: number;
  lastAt: string | null; // último estudo/leitura
  level: LevelInfo;
}

export interface PublicLevel {
  info: LevelInfo;
  lessons: number;
  trails: number;
  pos: number | null; // posição no ranking geral (null = ainda sem XP)
  ranked: number;     // quantas pessoas estão no ranking
  inRanking: boolean; // false para a equipe (moderadores, administradores e o Criador)
}

/** Ranking de quem mais aprende. Sem a migração 0012 no banco, devolve lista vazia (a página continua abrindo). */
export async function getRanking(period: RankPeriod, limit = 50): Promise<RankRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("study_ranking", { period, lim: limit });
  if (error || !data) return [];
  type Raw = { pos: number; user_id: string; username: string; display_name: string | null; avatar_url: string | null; bio?: string | null; member_since?: string | null;
    xp: number; lessons: number; perfect?: number; trails: number; plan_days?: number; bible_days?: number; last_at?: string | null };
  return (data as Raw[]).map((r) => ({
    pos: Number(r.pos), userId: r.user_id, username: r.username, name: r.display_name || r.username, avatarUrl: r.avatar_url,
    bio: r.bio ?? null, memberSince: r.member_since ?? null,
    xp: r.xp, lessons: r.lessons, perfect: r.perfect ?? 0, trails: r.trails, planDays: r.plan_days ?? 0, bibleDays: r.bible_days ?? 0, lastAt: r.last_at ?? null,
    level: levelFor(r.xp),
  }));
}

/** Nível público de uma pessoa (aparece no perfil para todos). */
export async function getPublicLevel(userId: string): Promise<PublicLevel | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("study_public_level", { uid: userId });
  const row = !error && Array.isArray(data) ? (data[0] as { xp: number; lessons: number; trails: number; pos: number | null; ranked: number; in_ranking: boolean | null } | undefined) : undefined;
  if (!row) return null;
  return { info: levelFor(row.xp), lessons: row.lessons, trails: row.trails, pos: row.pos === null ? null : Number(row.pos), ranked: Number(row.ranked), inRanking: row.in_ranking !== false };
}
