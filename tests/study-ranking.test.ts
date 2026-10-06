import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { XP } from "@/lib/study/xp";

// O ranking soma o XP no banco; a regra precisa ser a mesma do app (src/lib/study/xp.ts).
const sql = readFileSync("supabase/migrations/20240101000012_study_ranking.sql", "utf8");

describe("ranking: XP do banco igual ao do app", () => {
  it("documenta a mesma regra", () => {
    expect(sql).toContain(`XP: aula=${XP.lesson} quiz_perfeito=${XP.perfectQuiz} trilha=${XP.trail} dia_do_plano=${XP.planDay} dia_da_biblia=${XP.bibleDay}`);
  });
  it("usa os mesmos valores no cálculo", () => {
    expect(sql).toMatch(new RegExp(`${XP.lesson} \\+ case when sp\\.quiz_total > 0 and sp\\.quiz_correct = sp\\.quiz_total then ${XP.perfectQuiz} else 0 end`));
    expect(sql).toMatch(new RegExp(`select td\\.user_id, ${XP.trail}, 0, 1 from public\\.study_trail_done`));
    expect(sql).toMatch(new RegExp(`select pd\\.user_id, ${XP.planDay}, 0, 0 from public\\.study_plan_days`));
    expect(sql).toMatch(new RegExp(`select bm\\.user_id, ${XP.bibleDay}, 0, 0 from public\\.bible_plan_marks`));
  });
});
