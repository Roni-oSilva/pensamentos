"use client";
import { usePathname } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { submitFeedback } from "@/actions/feedback";
import { FormMessage } from "@/components/ui/FormMessage";

const FAQ: { q: string; a: string }[] = [
  { q: "Como crio a minha conta?", a: "Toque em “Criar conta”, escolha um nome de usuário (3 a 24 letras, números ou _), informe o e-mail e uma senha de 10 ou mais caracteres, com letras e números." },
  { q: "Esqueci a minha senha. E agora?", a: "Na tela de entrar, toque em “Esqueci a senha”. Enviaremos um link para o seu e-mail para você criar uma nova." },
  { q: "Por que a minha publicação não aparece?", a: "Toda publicação da comunidade passa por uma revisão rápida antes de aparecer. Assim que for aprovada, ela entra na lista e você recebe um aviso." },
  { q: "Como faço um pedido de oração?", a: "Abra a aba Comunhão e toque em “Fazer um pedido de oração”. Os irmãos poderão ver, comentar e orar por você." },
  { q: "Como compartilho um versículo fora do site?", a: "Toque no ícone de compartilhar na publicação. Você pode enviar o link, só o texto ou criar uma imagem, escolhendo uma foto de fundo. A imagem sempre leva o nome Igreja de Cristo." },
  { q: "Como troco a minha foto de perfil?", a: "Vá em Configurações, toque em “Escolher e ajustar foto”, posicione e aproxime a imagem no círculo e salve o perfil." },
  { q: "Como denuncio algo que não está certo?", a: "Use o botão “Denunciar” na publicação ou no comentário. A equipe analisa cada caso com cuidado." },
  { q: "Dá para usar o site com fundo branco?", a: "Sim! Toque no ícone de sol ou lua no topo da página para alternar entre o tema claro e o escuro." },
];

const KINDS = [
  { id: "QUESTION", label: "Dúvida" },
  { id: "HELP", label: "Preciso de ajuda" },
  { id: "SUGGESTION", label: "Sugestão" },
] as const;

/** Botão flutuante "Ajuda": perguntas frequentes + formulário de dúvidas, ajuda e sugestões. */
export function HelpButton() {
  const path = usePathname();
  const ref = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<"faq" | "form">("faq");
  const [kind, setKind] = useState<(typeof KINDS)[number]["id"]>("QUESTION");
  const [state, action, pending] = useActionState(submitFeedback, {});
  const [formKey, setFormKey] = useState(0);

  const open = (t: "faq" | "form" = "faq") => { setTab(t); ref.current?.showModal(); };
  const close = () => ref.current?.close();
  useEffect(() => {
    const on = () => open("faq");
    window.addEventListener("igreja:help", on);
    return () => window.removeEventListener("igreja:help", on);
  }, []);
  useEffect(() => { if (state.success) setFormKey((k) => k + 1); }, [state.success]); // limpa o formulário depois de enviar

  if (path.startsWith("/admin")) return null;
  return (
    <>
      <button type="button" onClick={() => open("faq")} aria-haspopup="dialog" aria-label="Dúvidas, ajuda e sugestões"
        className="help-fab no-print fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-[55] inline-flex min-h-[48px] items-center gap-2 rounded-full border border-ink-500 bg-ink-900/95 px-4 text-sm font-medium text-ash-100 shadow-xl backdrop-blur transition hover:border-ash-300 hover:text-white active:scale-95">
        <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full bg-poster text-sm font-bold text-ink-950">?</span>
        Ajuda
      </button>

      <dialog ref={ref} aria-labelledby="help-title" onClick={(e) => e.target === ref.current && close()}
        className="w-[min(94vw,34rem)] max-h-[92dvh] rounded-2xl border border-ink-600 bg-ink-900 p-0 text-ash-200 backdrop:bg-black/80 backdrop:backdrop-blur-sm">
        <div className="flex max-h-[92dvh] flex-col">
          <div className="flex items-start justify-between gap-4 p-5 pb-3">
            <div>
              <p className="eyebrow mb-1">Ajuda</p>
              <h3 id="help-title" className="font-poster text-3xl leading-tight text-white">Como podemos <span className="church-accent text-poster">ajudar?</span></h3>
            </div>
            <button type="button" onClick={close} aria-label="Fechar" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ash-300 hover:bg-ink-800 hover:text-white">✕</button>
          </div>

          <div role="tablist" aria-label="Seções" className="mx-5 grid grid-cols-2 gap-1 rounded-xl bg-ink-800 p-1">
            {([["faq", "Dúvidas frequentes"], ["form", "Falar com a gente"]] as const).map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                className={`min-h-[44px] rounded-lg px-2 text-sm font-medium transition active:scale-95 ${tab === id ? "bg-ash-100 text-ink-950" : "text-ash-300 hover:text-white"}`}>{label}</button>
            ))}
          </div>

          <div className="overflow-y-auto overscroll-contain p-5 pt-4">
            {tab === "faq" ? (
              <div className="space-y-2">
                {FAQ.map((f) => (
                  <details key={f.q} className="group rounded-xl border border-ink-600 bg-ink-950/40 open:border-poster/50">
                    <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 px-4 text-[15px] font-medium text-white [&::-webkit-details-marker]:hidden">
                      {f.q}<span aria-hidden className="text-ash-400 transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="px-4 pb-4 text-sm leading-relaxed text-ash-300">{f.a}</p>
                  </details>
                ))}
                <button type="button" onClick={() => setTab("form")} className="btn-primary mt-3 w-full">Não achei a resposta: falar com a gente</button>
              </div>
            ) : (
              <form key={formKey} action={action} className="space-y-4">
                <input type="hidden" name="page" value={path} />
                <input type="hidden" name="kind" value={kind} />
                <div role="radiogroup" aria-label="Tipo de mensagem" className="grid grid-cols-3 gap-2">
                  {KINDS.map((k) => (
                    <button key={k.id} type="button" role="radio" aria-checked={kind === k.id} onClick={() => setKind(k.id)}
                      className={`min-h-[48px] rounded-lg border px-2 text-xs font-medium transition active:scale-95 sm:text-sm ${kind === k.id ? "border-poster bg-poster/10 text-white" : "border-ink-600 text-ash-300 hover:border-ash-400"}`}>{k.label}</button>
                  ))}
                </div>
                <div>
                  <label className="label" htmlFor="help-message">{kind === "SUGGESTION" ? "Sua sugestão" : kind === "HELP" ? "Como podemos ajudar?" : "Qual é a sua dúvida?"}</label>
                  <textarea id="help-message" name="message" required minLength={5} maxLength={2000} rows={5} className="field" placeholder="Escreva aqui…" />
                </div>
                <div>
                  <label className="label" htmlFor="help-contact">E-mail ou WhatsApp (opcional)</label>
                  <input id="help-contact" name="contact" maxLength={120} autoComplete="email" className="field" placeholder="Só se quiser receber uma resposta" />
                </div>
                {/* campo-isca contra robôs: invisível para pessoas */}
                <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden"><label>Site<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
                <FormMessage state={state} />
                <button type="submit" className="btn-primary w-full" disabled={pending}>{pending ? "Enviando…" : "Enviar mensagem"}</button>
              </form>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
