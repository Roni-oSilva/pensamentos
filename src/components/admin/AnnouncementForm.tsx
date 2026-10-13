"use client";
import { useActionState, useState } from "react";
import { sendAnnouncement } from "@/actions/admin";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormMessage } from "@/components/ui/FormMessage";
import { MARK_WHITE_URL } from "@/lib/church-mark";

/** Avisos prontos: o admin escolhe um, ajusta se quiser e envia quando achar melhor. */
const READY: { label: string; title: string; body: string; url: string }[] = [
  { label: "Novo: Momentos", title: "Compartilhe Momentos 📸", body: "No app Igreja de Cristo, com nosso novo sistema! Tire uma foto agora e compartilhe com a igreja. Some em 24 h.", url: "/momentos" },
  { label: "Momento do culto", title: "Como está o culto hoje? 🙌", body: "Registre um momento do culto e compartilhe com a igreja no app Igreja de Cristo.", url: "/momentos" },
  { label: "Bom dia", title: "Bom dia, igreja! ☀️", body: "Comece o dia na Palavra: a leitura de hoje da Bíblia em um ano já está esperando você.", url: "/estudos/biblia" },
  { label: "Bíblia em um ano", title: "Leitura de hoje 📖", body: "Não fique para trás! Leia o capítulo de hoje e marque “estou junto” com a igreja.", url: "/estudos/biblia" },
  { label: "Estudos e XP", title: "Suba no ranking 🏆", body: "Faça uma aula nos Estudos, ganhe XP e veja sua posição no ranking da igreja.", url: "/estudos" },
  { label: "Comunidade", title: "O que Deus fez na sua semana? ✨", body: "Compartilhe um testemunho ou um versículo com a comunidade no app.", url: "/comunidade" },
  { label: "Pedido de oração", title: "Vamos orar juntos 🙏", body: "Tem um pedido de oração? Compartilhe no Fórum e a igreja ora com você.", url: "/forum" },
  { label: "Lembrete de culto", title: "Hoje tem culto! ⛪", body: "Esperamos você. Chame alguém para ir junto e venha adorar com a igreja.", url: "/" },
  { label: "Boa noite", title: "Boa noite, igreja 🌙", body: "Antes de dormir, um versículo e uma oração. Deus cuida de você.", url: "/" },
  { label: "Convidar amigos", title: "Convide um amigo 💌", body: "Mostre o app Igreja de Cristo para alguém e caminhem juntos na fé.", url: "/" },
];

export function AnnouncementForm({ links }: { links: { url: string; label: string }[] }) {
  const [state, action] = useActionState(sendAnnouncement, {});
  const [pick, setPick] = useState(0);
  const [title, setTitle] = useState(READY[0]!.title);
  const [body, setBody] = useState(READY[0]!.body);
  const [url, setUrl] = useState(READY[0]!.url);
  const choose = (i: number) => { const r = READY[i]!; setPick(i); setTitle(r.title); setBody(r.body); setUrl(r.url); };
  return (
    <form action={action} className="grid max-w-3xl gap-8 md:grid-cols-[1fr_18rem]">
      <div className="space-y-5">
        <fieldset>
          <legend className="label">Avisos prontos · toque para escolher</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {READY.map((r, i) => (
              <button key={r.label} type="button" onClick={() => choose(i)} aria-pressed={pick === i}
                className={`rounded-full border px-3.5 py-2 text-sm transition ${pick === i ? "border-white bg-white font-semibold text-black" : "border-ink-600 text-ash-200 hover:border-ash-400"}`}>
                {r.label}
              </button>
            ))}
          </div>
        </fieldset>
        <div>
          <label className="label" htmlFor="a-title">Título</label>
          <input id="a-title" name="title" className="field" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} required />
        </div>
        <div>
          <label className="label" htmlFor="a-body">Mensagem</label>
          <textarea id="a-body" name="body" className="field min-h-28" value={body} onChange={(e) => setBody(e.target.value)} maxLength={180} required />
          <p className="mt-1 text-right text-xs text-ash-400">{body.length}/180</p>
        </div>
        <div>
          <label className="label" htmlFor="a-url">Ao tocar, abre</label>
          <select id="a-url" name="url" className="field" value={url} onChange={(e) => setUrl(e.target.value)}>
            {links.map((l) => <option key={l.url} value={l.url}>{l.label}</option>)}
          </select>
        </div>
        <FormMessage state={state} />
        <SubmitButton>Enviar para todos</SubmitButton>
      </div>

      <div aria-hidden>
        <p className="eyebrow mb-3">Como aparece no celular</p>
        <div className="force-dark rounded-[1.4rem] bg-neutral-800/90 p-3 text-white shadow-xl">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[0.7rem]" style={{ background: "linear-gradient(160deg,#e1251b,#8f140e)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={MARK_WHITE_URL} alt="" className="h-7 w-auto" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex justify-between text-[13px] font-semibold"><span className="truncate">{title || "Título"}</span><span className="pl-2 font-normal text-white/50">agora</span></p>
              <p className="mt-0.5 line-clamp-4 text-[13px] leading-snug text-white/85">{body || "Mensagem"}</p>
            </div>
          </div>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-ash-400">
          Apita no celular de quem ativou as notificações. E aparece para todos no início do app por 7 dias.
        </p>
      </div>
    </form>
  );
}
