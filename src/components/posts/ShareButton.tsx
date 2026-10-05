/* eslint-disable @next/next/no-img-element -- pré-visualização usa blob: URL, incompatível com next/image */
"use client";
import { useEffect, useRef, useState } from "react";
import { registerShare } from "@/actions/social";
import { renderShareImage, SHARE_BACKGROUNDS } from "@/lib/share-image";

type Mode = "link" | "texto" | "imagem";
const MODES: { id: Mode; title: string; hint: string }[] = [
  { id: "link", title: "Link", hint: "Endereço da publicação" },
  { id: "texto", title: "Só o texto", hint: "Versículo ou frase" },
  { id: "imagem", title: "Imagem PNG", hint: "Cartão com imagem de fundo" },
];

export function ShareButton({ postId, path, title, text, count }: { postId: string; path: string; title: string; text: string; count: number }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<Mode>("link");
  const [shares, setShares] = useState(count);
  const [note, setNote] = useState<string | null>(null);
  const [img, setImg] = useState<{ blob: Blob; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [bg, setBg] = useState<number | null>(1);

  const url = () => `${window.location.origin}${path}`;
  const done = (msg: string) => { setNote(msg); setShares((n) => n + 1); void registerShare(postId); };
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const quote = `“${text}”\n— Igreja de Cristo`;

  // gera a imagem sob demanda, ao abrir a aba e sempre que trocar o fundo
  useEffect(() => {
    if (mode !== "imagem") return;
    let cancelled = false;
    setBusy(true);
    renderShareImage(text, bg)
      .then((blob) => { if (!cancelled) setImg((old) => { if (old) URL.revokeObjectURL(old.url); return { blob, url: URL.createObjectURL(blob) }; }); })
      .catch(() => { if (!cancelled) setNote("Não foi possível gerar a imagem."); })
      .finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [mode, bg]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { if (img) URL.revokeObjectURL(img.url); }, [img]);

  const open = () => { setNote(null); ref.current?.showModal(); };
  const close = () => ref.current?.close();

  async function copy(value: string, msg: string) {
    try { await navigator.clipboard.writeText(value); done(msg); } catch { setNote("Não foi possível copiar."); }
  }
  async function nativeShare(data: ShareData, okMsg: string) {
    try { await navigator.share(data); done(okMsg); } catch { /* cancelado pelo usuário */ }
  }
  function download() {
    if (!img) return;
    const a = document.createElement("a");
    a.href = img.url; a.download = "igreja-de-cristo.png"; a.click();
    done("Imagem baixada.");
  }
  async function shareImage() {
    if (!img) return;
    const file = new File([img.blob], "igreja-de-cristo.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) await nativeShare({ files: [file], title }, "Imagem compartilhada.");
    else download();
  }
  const enc = encodeURIComponent;

  return (
    <>
      <button type="button" onClick={open} className="action" aria-label="Compartilhar" aria-haspopup="dialog">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" /></svg>
        <span className="count">{shares}</span>
      </button>

      <dialog ref={ref} aria-labelledby={`share-${postId}`} onClick={(e) => e.target === ref.current && close()}
        className="w-[min(94vw,36rem)] rounded-xl border border-ink-600 bg-ink-900 p-0 text-ash-200 backdrop:bg-black/80 backdrop:backdrop-blur-sm">
        <div className="space-y-5 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="eyebrow mb-1">Compartilhar</p>
              <h3 id={`share-${postId}`} className="font-poster text-3xl uppercase tracking-wide text-white">Como você quer enviar?</h3>
            </div>
            <button type="button" onClick={close} aria-label="Fechar" className="rounded-md p-2 text-ash-400 hover:bg-ink-800 hover:text-white">✕</button>
          </div>

          <div role="tablist" aria-label="Formato" className="grid grid-cols-3 gap-2">
            {MODES.map((m) => (
              <button key={m.id} role="tab" aria-selected={mode === m.id} type="button" onClick={() => { setMode(m.id); setNote(null); }}
                className={`min-h-[52px] rounded-lg border p-3 text-left transition active:scale-95 max-[439px]:text-center ${mode === m.id ? "border-poster bg-poster/10 text-white" : "border-ink-600 hover:border-ash-400"}`}>
                <span className="block font-poster text-lg uppercase tracking-wide">{m.title}</span>
                <span className="mt-0.5 hidden text-[11px] leading-tight text-ash-400 min-[440px]:block">{m.hint}</span>
              </button>
            ))}
          </div>

          {mode === "link" && (
            <div className="space-y-3">
              <input readOnly value={typeof window === "undefined" ? path : url()} onFocus={(e) => e.currentTarget.select()} aria-label="Link da publicação" className="field text-sm" />
              <div className="flex flex-wrap gap-2">
                {canNativeShare && <button type="button" className="btn-primary" onClick={() => nativeShare({ title, url: url() }, "Link compartilhado.")}>Compartilhar…</button>}
                <button type="button" className={canNativeShare ? "btn-ghost" : "btn-primary"} onClick={() => copy(url(), "Link copiado ✓")}>Copiar link</button>
                <a className="btn-ghost" target="_blank" rel="noopener noreferrer" onClick={() => done("Aberto no WhatsApp.")} href={`https://wa.me/?text=${enc(`${title} ${typeof window === "undefined" ? "" : url()}`)}`}>WhatsApp</a>
                <a className="btn-ghost" target="_blank" rel="noopener noreferrer" onClick={() => done("Aberto no X.")} href={`https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(typeof window === "undefined" ? path : url())}`}>X</a>
                <a className="btn-ghost" target="_blank" rel="noopener noreferrer" onClick={() => done("Aberto no Facebook.")} href={`https://www.facebook.com/sharer/sharer.php?u=${enc(typeof window === "undefined" ? path : url())}`}>Facebook</a>
              </div>
            </div>
          )}

          {mode === "texto" && (
            <div className="space-y-3">
              <blockquote className="preline max-h-52 overflow-y-auto rounded-lg border-l-2 border-poster bg-ink-800 p-4 font-display text-lg text-ash-100">{text}</blockquote>
              <div className="flex flex-wrap gap-2">
                {canNativeShare && <button type="button" className="btn-primary" onClick={() => nativeShare({ text: quote }, "Frase compartilhada.")}>Compartilhar…</button>}
                <button type="button" className={canNativeShare ? "btn-ghost" : "btn-primary"} onClick={() => copy(quote, "Frase copiada ✓")}>Copiar frase</button>
                <a className="btn-ghost" target="_blank" rel="noopener noreferrer" onClick={() => done("Aberto no WhatsApp.")} href={`https://wa.me/?text=${enc(quote)}`}>WhatsApp</a>
              </div>
            </div>
          )}

          {mode === "imagem" && (
            <div className="space-y-3">
              <div className="relative flex min-h-48 items-center justify-center rounded-lg border border-ink-600 bg-ink-950 p-3">
                {img ? <img src={img.url} alt="Pré-visualização do cartão" className={`max-h-[46vh] w-auto rounded transition ${busy ? "opacity-40" : ""}`} />
                  : <p className="animate-flicker text-sm text-ash-400">{busy ? "Gerando imagem…" : "—"}</p>}
                {img && busy && <p className="absolute text-sm text-white">Atualizando…</p>}
              </div>
              <div role="radiogroup" aria-label="Imagem de fundo" className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {SHARE_BACKGROUNDS.map((b) => (
                  <button key={b.id} type="button" role="radio" aria-checked={bg === b.id} aria-label={`Fundo: ${b.label}`} onClick={() => setBg(b.id)}
                    className={`relative h-16 w-14 shrink-0 overflow-hidden rounded-md border-2 transition active:scale-95 ${bg === b.id ? "border-poster" : "border-ink-600 hover:border-ash-400"}`}>
                    <img src={b.src} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
                <button type="button" role="radio" aria-checked={bg === null} aria-label="Fundo liso" onClick={() => setBg(null)}
                  className={`grid h-16 w-14 shrink-0 place-items-center rounded-md border-2 bg-ink-800 text-[10px] uppercase tracking-wider transition active:scale-95 ${bg === null ? "border-poster text-white" : "border-ink-600 text-ash-400"}`}>Liso</button>
              </div>
              <p className="text-xs text-ash-400">A imagem sempre leva o nome <strong className="text-ash-200">Igreja de Cristo</strong>.</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-primary" disabled={!img} onClick={download}>Baixar PNG</button>
                {canNativeShare && <button type="button" className="btn-ghost" disabled={!img} onClick={shareImage}>Compartilhar imagem…</button>}
              </div>
            </div>
          )}

          <p role="status" aria-live="polite" className="min-h-5 text-sm text-ash-300">{note}</p>
        </div>
      </dialog>
    </>
  );
}
