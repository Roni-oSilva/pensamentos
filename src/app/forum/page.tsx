import Link from "next/link";
import { getSession } from "@/lib/auth";
import { listPolls, listThreads } from "@/lib/forum";
import { PageTitle } from "@/components/ui/Section";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { PollCard } from "@/components/forum/PollCard";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Fórum", description: "Discussões e votações da comunidade Igreja de Cristo." };
export const dynamic = "force-dynamic";

const SORTS = [
  { id: "novas", label: "Recentes" },
  { id: "populares", label: "Mais curtidas" },
  { id: "respondidas", label: "Mais respondidas" },
] as const;

export default async function Forum({ searchParams }: { searchParams: Promise<{ ordem?: string }> }) {
  const sp = await searchParams;
  const sort = SORTS.find((s) => s.id === sp.ordem)?.id ?? "novas";
  const session = await getSession();
  const [threads, polls] = await Promise.all([listThreads(sort), listPolls(session?.user.id ?? null)]);
  const isCreator = session?.profile.role === "CREATOR";

  return (
    <>
      <PageTitle eyebrow="Conversa" title="Fórum">Mais que o feed rápido: espaço para conversar com calma, perguntar, discordar com respeito e crescer juntos.</PageTitle>
      <div className="container-wide mt-10 space-y-12">
        {(polls.length > 0 || isCreator) && (
          <section aria-labelledby="votacoes-h" className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 id="votacoes-h" className="eyebrow">Votações</h2>
              {isCreator && <Link href="/forum/votacao/nova" className="btn-ghost">+ Nova votação</Link>}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {polls.map((p) => <PollCard key={p.id} poll={p} signedIn={!!session} isCreator={isCreator} />)}
            </div>
            {polls.length === 0 && <p className="text-sm text-ash-400">Nenhuma votação aberta ainda.</p>}
          </section>
        )}

        <section aria-labelledby="discussoes-h" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="discussoes-h" className="eyebrow">Discussões</h2>
            <Link href={session ? "/forum/nova" : "/login?next=/forum/nova"} className="btn-primary">+ Abrir discussão</Link>
          </div>
          <nav aria-label="Ordenar" className="flex flex-wrap gap-2">
            {SORTS.map((s) => (
              <Link key={s.id} href={s.id === "novas" ? "/forum" : `/forum?ordem=${s.id}`} aria-current={s.id === sort ? "page" : undefined}
                className={`rounded-full border px-4 py-2 text-sm transition ${s.id === sort ? "border-ash-100 bg-ash-100 text-ink-950" : "border-ink-600 text-ash-300 hover:border-ash-400"}`}>{s.label}</Link>
            ))}
          </nav>
          {threads.length === 0 ? <EmptyState title="Nenhuma discussão ainda." hint="Abra a primeira conversa: uma pergunta, uma dúvida de fé, um tema para refletir." /> : (
            <ul className="space-y-3">
              {threads.map((t) => (
                <li key={t.id}>
                  <Link href={`/forum/${t.id}`} className="card block p-5 transition hover:border-ash-400 active:scale-[0.995]">
                    <h3 className="font-display text-2xl leading-snug text-white">{t.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-ash-300">{t.body}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ash-300">
                      <span className="flex items-center gap-2"><Avatar src={t.author?.avatar_url} name={t.author?.username ?? "?"} size={22} />@{t.author?.username ?? "anônimo"} · {timeAgo(t.created_at)}</span>
                      <span>{t.reply_count} {t.reply_count === 1 ? "resposta" : "respostas"}</span>
                      <span aria-label={`${t.up_count} curtidas`}>👍 {t.up_count}</span>
                      <span aria-label={`${t.down_count} não curtidas`}>👎 {t.down_count}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
