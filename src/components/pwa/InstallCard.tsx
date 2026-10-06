"use client";
import { useEffect, useState } from "react";
import { canPromptInstall, detectPlatform, isStandalone, onInstallChange, promptInstall, type Platform } from "@/lib/pwa";
import { ShareIosIcon, AddSquareIcon, DotsIcon } from "./InstallIcons";

type State = "loading" | "installed" | "done" | Platform;

/** Botão/instruções de instalação adaptados ao aparelho de quem abre a página. */
export function InstallCard({ url }: { url: string }) {
  const [state, setState] = useState<State>("loading");
  const [canPrompt, setCanPrompt] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setState(isStandalone() ? "installed" : detectPlatform());
    setCanPrompt(canPromptInstall());
    return onInstallChange(() => setCanPrompt(canPromptInstall()));
  }, []);

  async function install() {
    const r = await promptInstall();
    if (r === "accepted") setState("done");
  }
  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* sem permissão */ }
  }

  const box = "rounded-2xl border border-ink-600 bg-ink-900 p-5 sm:p-6";
  if (state === "loading") return <div className={`${box} h-40 animate-pulse`} aria-hidden />;
  if (state === "installed") return <div className={box} role="status"><p className="text-lg font-semibold text-white">Você já está usando o app. ✓</p><p className="mt-1 text-sm text-ash-300">Ele fica na sua tela inicial com o ícone da igreja.</p></div>;
  if (state === "done") return <div className={box} role="status"><p className="text-lg font-semibold text-white">App instalado! ✓</p><p className="mt-1 text-sm text-ash-300">Procure o ícone da Igreja de Cristo na sua tela inicial.</p></div>;

  if (canPrompt) {
    return (
      <div className={box}>
        <button type="button" onClick={install} className="btn-primary w-full justify-center py-4 text-lg sm:w-auto sm:px-10">Instalar o app</button>
        <p className="mt-3 text-sm text-ash-400">Gratuito, sem loja, ocupa pouco espaço e atualiza sozinho.</p>
      </div>
    );
  }
  if (state === "ios-safari") {
    return (
      <div className={box}>
        <p className="font-semibold text-white">No iPhone, são dois toques:</p>
        <ol className="mt-4 space-y-3 text-ash-200">
          <li className="flex gap-3"><Step n={1} /><span className="leading-8">Toque em <Chip><ShareIosIcon /> Compartilhar</Chip> na barra do Safari.</span></li>
          <li className="flex gap-3"><Step n={2} /><span className="leading-8">Escolha <Chip><AddSquareIcon /> Adicionar à Tela de Início</Chip></span></li>
        </ol>
        <p className="mt-4 text-sm text-ash-400">Se não aparecer, role a lista de opções para baixo.</p>
      </div>
    );
  }
  if (state === "ios-other") {
    return (
      <div className={box}>
        <p className="font-semibold text-white">Abra esta página no Safari</p>
        <p className="mt-1 text-sm text-ash-300">No iPhone, a instalação funciona pelo Safari. Copie o link, abra o Safari e cole na barra de endereço.</p>
        <button type="button" onClick={copy} className="btn-primary mt-4">{copied ? "Link copiado ✓" : "Copiar link"}</button>
      </div>
    );
  }
  if (state === "android-other") {
    return (
      <div className={box}>
        <p className="font-semibold text-white">Abra esta página no Chrome</p>
        <p className="mt-1 text-sm text-ash-300">Dentro do Instagram, Facebook ou WhatsApp não dá para instalar. Toque no menu <Chip><DotsIcon /></Chip> e escolha <Chip>Abrir no Chrome</Chip>, ou copie o link e cole no Chrome.</p>
        <button type="button" onClick={copy} className="btn-primary mt-4">{copied ? "Link copiado ✓" : "Copiar link"}</button>
      </div>
    );
  }
  if (state === "android") {
    return (
      <div className={box}>
        <p className="font-semibold text-white">No Android:</p>
        <ol className="mt-4 space-y-3 text-ash-200">
          <li className="flex gap-3"><Step n={1} /><span className="leading-8">Abra no Chrome e toque no menu <Chip><DotsIcon /></Chip> no canto de cima.</span></li>
          <li className="flex gap-3"><Step n={2} /><span className="leading-8">Toque em <Chip>Instalar app</Chip> ou <Chip>Adicionar à tela inicial</Chip>.</span></li>
        </ol>
      </div>
    );
  }
  return (
    <div className={box}>
      <p className="font-semibold text-white">No computador</p>
      <p className="mt-1 text-sm text-ash-300">No Chrome ou no Edge, clique no ícone de instalar que aparece no fim da barra de endereço. Para o celular, aponte a câmera para o QR code abaixo.</p>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="mx-0.5 inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-ink-800 px-2 py-0.5 align-middle text-white">{children}</span>;
}

function Step({ n }: { n: number }) {
  return <span aria-hidden className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ash-100 text-sm font-bold text-ink-950">{n}</span>;
}
