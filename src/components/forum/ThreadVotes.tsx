"use client";
import { useState, useTransition } from "react";
import { voteThread } from "@/actions/forum";

/** 👍 / 👎 da discussão: toque de novo para retirar o voto. */
export function ThreadVotes({ threadId, up, down, mine, signedIn }: { threadId: string; up: number; down: number; mine: 0 | 1 | -1; signedIn: boolean }) {
  const [state, setState] = useState({ up, down, mine });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function vote(value: 1 | -1) {
    if (!signedIn) { window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`; return; }
    setError(null);
    start(async () => {
      const r = await voteThread(threadId, value);
      if (!r.ok) { setError(r.error); return; }
      setState((s) => {
        let { up: u, down: d } = s;
        if (s.mine === 1) u -= 1; else if (s.mine === -1) d -= 1;
        if (r.mine === 1) u += 1; else if (r.mine === -1) d += 1;
        return { up: u, down: d, mine: r.mine };
      });
    });
  }
  const btn = (value: 1 | -1, active: boolean, n: number, emoji: string, label: string) => (
    <button type="button" onClick={() => vote(value)} disabled={pending} aria-pressed={active} aria-label={label}
      className={`flex min-h-[44px] items-center gap-2 rounded-full border px-4 text-sm transition active:scale-90 ${active ? "border-ash-100 bg-ash-100 text-ink-950" : "border-ink-600 text-ash-200 hover:border-ash-400 hover:bg-ink-800"}`}>
      <span aria-hidden>{emoji}</span><span className="tabular-nums">{n}</span>
    </button>
  );
  return (
    <div>
      <div className="flex gap-2">{btn(1, state.mine === 1, state.up, "👍", "Gostei")}{btn(-1, state.mine === -1, state.down, "👎", "Não gostei")}</div>
      {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}
