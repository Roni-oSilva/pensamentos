"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deletePoll, setPollStatus, votePoll } from "@/actions/forum";
import type { Poll } from "@/lib/forum";

export function PollCard({ poll, signedIn, isCreator }: { poll: Poll; signedIn: boolean; isCreator: boolean }) {
  const router = useRouter();
  const [mine, setMine] = useState(poll.mine);
  const [counts, setCounts] = useState(() => Object.fromEntries(poll.options.map((o) => [o.id, o.vote_count])));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const open = poll.status === "OPEN";
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  function vote(optionId: string) {
    if (!signedIn) { window.location.href = `/login?next=${encodeURIComponent("/forum")}`; return; }
    if (!open || optionId === mine) return;
    setError(null);
    const prev = { mine, counts };
    setCounts((c) => ({ ...c, [optionId]: (c[optionId] ?? 0) + 1, ...(mine ? { [mine]: Math.max((c[mine] ?? 1) - 1, 0) } : {}) }));
    setMine(optionId);
    start(async () => {
      const r = await votePoll(poll.id, optionId);
      if (!r.ok) { setMine(prev.mine); setCounts(prev.counts); setError(r.error); }
    });
  }
  const manage = (fn: () => Promise<{ ok: boolean }>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    start(async () => { await fn(); router.refresh(); });
  };
  const showResults = !open || !!mine;

  return (
    <article className="card space-y-4 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">{open ? "Votação aberta" : "Votação encerrada"}</p>
          <h3 className="font-display text-2xl leading-snug text-white sm:text-3xl">{poll.question}</h3>
        </div>
      </div>
      <ul className="space-y-2">
        {poll.options.map((o) => {
          const n = counts[o.id] ?? 0;
          const pct = total ? Math.round((n / total) * 100) : 0;
          const active = mine === o.id;
          return (
            <li key={o.id}>
              <button type="button" onClick={() => vote(o.id)} disabled={pending || !open} aria-pressed={active}
                className={`relative flex min-h-[48px] w-full items-center justify-between gap-3 overflow-hidden rounded-xl border px-4 text-left text-sm transition active:scale-[0.99] ${active ? "border-ash-100 text-white" : "border-ink-600 text-ash-200"} ${open ? "hover:border-ash-400" : "cursor-default"}`}>
                {showResults && <span aria-hidden className="absolute inset-y-0 left-0 bg-ash-100/10 transition-all duration-500" style={{ width: `${pct}%` }} />}
                <span className="relative">{active && "✓ "}{o.label}</span>
                {showResults && <span className="relative tabular-nums text-ash-300">{pct}% · {n}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-ash-400">{total} {total === 1 ? "voto" : "votos"}{open && mine ? " · você pode trocar seu voto" : ""}{open && !signedIn ? " · entre para votar" : ""}</p>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      {isCreator && (
        <div className="flex flex-wrap gap-4 border-t border-ink-700 pt-3 text-xs text-ash-400">
          <button type="button" disabled={pending} className="hover:text-white" onClick={() => manage(() => setPollStatus(poll.id, open ? "CLOSED" : "OPEN"))}>{open ? "Encerrar votação" : "Reabrir votação"}</button>
          <button type="button" disabled={pending} className="hover:text-red-300" onClick={() => manage(() => deletePoll(poll.id), "Excluir esta votação e todos os votos?")}>Excluir</button>
        </div>
      )}
    </article>
  );
}
