"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createPoll } from "@/actions/forum";

export function PollForm() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (i: number, v: string) => setOptions((o) => o.map((x, j) => (j === i ? v : x)));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await createPoll({ question, options });
      if (!r.ok) { setError(r.error); return; }
      router.push("/forum"); router.refresh();
    });
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="p-q" className="mb-1.5 block text-sm text-ash-200">Pergunta</label>
        <input id="p-q" value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={200} required className="field" placeholder="Ex.: Qual o melhor horário para a oração em comunhão?" />
      </div>
      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-sm text-ash-200">Opções (2 a 8)</legend>
        {options.map((o, i) => (
          <div key={i} className="flex gap-2">
            <input value={o} onChange={(e) => set(i, e.target.value)} maxLength={80} className="field" aria-label={`Opção ${i + 1}`} placeholder={`Opção ${i + 1}`} />
            {options.length > 2 && <button type="button" className="btn-ghost" aria-label={`Remover opção ${i + 1}`} onClick={() => setOptions((x) => x.filter((_, j) => j !== i))}>✕</button>}
          </div>
        ))}
        {options.length < 8 && <button type="button" className="btn-ghost" onClick={() => setOptions((o) => [...o, ""])}>+ Adicionar opção</button>}
      </fieldset>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <button className="btn-primary" disabled={pending || question.trim().length < 5 || options.filter((o) => o.trim()).length < 2}>{pending ? "Publicando…" : "Abrir votação"}</button>
    </form>
  );
}
