import type { Metadata } from "next";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { SITE_URL } from "@/lib/env";
import { InstallCard } from "@/components/pwa/InstallCard";
import { CopyLink } from "@/components/pwa/CopyLink";
import { ShareIosIcon, AddSquareIcon, DotsIcon } from "@/components/pwa/InstallIcons";

export const metadata: Metadata = {
  title: "Baixe o app",
  description: "Instale o app Igreja de Cristo no seu celular ou computador: versículos, estudos, comunidade e fórum na tela inicial.",
};

async function appUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return /^[a-z0-9.-]+(:\d+)?$/i.test(host) ? `${proto}://${host}/app` : `${SITE_URL}/app`;
}

const BENEFITS = [
  { t: "Na tela inicial", d: "O ícone da igreja junto com os seus outros apps. Um toque e pronto." },
  { t: "Tela cheia", d: "Sem barra de endereço: só a Palavra, os estudos e a comunidade." },
  { t: "Sempre atualizado", d: "Nada para baixar de novo. Toda novidade chega sozinha." },
  { t: "Leve e seguro", d: "Ocupa pouquíssimo espaço e usa a mesma conta e a mesma proteção do site." },
];

const FAQ = [
  { q: "Preciso de loja de aplicativos?", a: "Não. A instalação é feita pelo navegador, de graça, sem Play Store ou App Store." },
  { q: "Ocupa muito espaço?", a: "Não. O app usa poucos megabytes, bem menos que um app comum." },
  { q: "Como atualizo?", a: "Não precisa. Sempre que você abre, ele já está na versão mais nova." },
  { q: "Funciona sem internet?", a: "As publicações, estudos e a comunidade precisam de internet. Sem conexão, o app mostra um aviso e volta assim que a internet voltar." },
  { q: "Minha conta é a mesma do site?", a: "Sim. Entre com o mesmo e-mail e senha. Seu progresso nos estudos, favoritos e notificações continuam iguais." },
  { q: "Como desinstalo?", a: "Como qualquer app: segure o ícone na tela inicial e escolha remover." },
];

export default async function AppPage() {
  const url = await appUrl();
  const qr = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#050505", light: "#ffffff" } });

  return (
    <div className="container-wide space-y-20 py-12">
      <section className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="space-y-6">
          <p className="eyebrow">App oficial</p>
          <h1 className="font-poster text-5xl leading-[0.95] text-white sm:text-6xl">Igreja de <span className="church-accent text-poster">Cristo</span><br />no seu celular</h1>
          <p className="max-w-xl text-lg text-ash-300">Versículos, estudos com níveis, comunidade, fórum e pedidos de oração, direto da tela inicial. Gratuito e sem loja de aplicativos.</p>
          <InstallCard url={url} />
        </div>
        <PhoneMock />
      </section>

      <section aria-labelledby="por-que" className="space-y-6">
        <h2 id="por-que" className="eyebrow">Por que instalar</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div key={b.t} className="card p-5">
              <p className="font-display text-2xl text-white">{b.t}</p>
              <p className="mt-2 text-sm text-ash-300">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="como" className="space-y-6">
        <h2 id="como" className="eyebrow">Como instalar</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="card space-y-4 p-6">
            <p className="font-display text-3xl text-white">iPhone</p>
            <ol className="space-y-3 text-sm text-ash-200">
              <li>1. Abra o site no <strong className="text-white">Safari</strong>.</li>
              <li className="flex flex-wrap items-center gap-1">2. Toque em <span className="inline-flex items-center gap-1 rounded-md bg-ink-800 px-2 py-0.5 text-white"><ShareIosIcon /> Compartilhar</span>.</li>
              <li className="flex flex-wrap items-center gap-1">3. Escolha <span className="inline-flex items-center gap-1 rounded-md bg-ink-800 px-2 py-0.5 text-white"><AddSquareIcon /> Adicionar à Tela de Início</span>.</li>
              <li>4. Toque em <strong className="text-white">Adicionar</strong>.</li>
            </ol>
          </div>
          <div className="card space-y-4 p-6">
            <p className="font-display text-3xl text-white">Android</p>
            <ol className="space-y-3 text-sm text-ash-200">
              <li>1. Abra o site no <strong className="text-white">Chrome</strong>.</li>
              <li>2. Toque em <strong className="text-white">Instalar</strong> no aviso que aparece, ou</li>
              <li className="flex flex-wrap items-center gap-1">3. Toque no menu <span className="inline-flex items-center rounded-md bg-ink-800 px-2 py-0.5 text-white"><DotsIcon /></span> e em <strong className="text-white">Instalar app</strong>.</li>
            </ol>
          </div>
          <div className="card space-y-4 p-6">
            <p className="font-display text-3xl text-white">Computador</p>
            <ol className="space-y-3 text-sm text-ash-200">
              <li>1. Abra o site no <strong className="text-white">Chrome</strong> ou no <strong className="text-white">Edge</strong>.</li>
              <li>2. Clique no ícone de instalar, no fim da barra de endereço.</li>
              <li>3. Confirme em <strong className="text-white">Instalar</strong>.</li>
            </ol>
          </div>
        </div>
      </section>

      <section aria-labelledby="qr" className="card grid items-center gap-8 p-6 sm:grid-cols-[12rem_minmax(0,1fr)] sm:p-8">
        <div className="mx-auto w-48 overflow-hidden rounded-xl bg-white p-2" aria-hidden dangerouslySetInnerHTML={{ __html: qr }} />
        <div className="space-y-3 text-center sm:text-left">
          <h2 id="qr" className="font-display text-3xl text-white">Aponte a câmera</h2>
          <p className="text-ash-300">Use o QR code em cartazes, no telão do culto ou nas redes. Ele abre esta página no celular, pronta para instalar.</p>
          <p className="break-all font-mono text-sm text-ash-400">{url}</p>
          <CopyLink url={url} />
        </div>
      </section>

      <section aria-labelledby="faq" className="space-y-4">
        <h2 id="faq" className="eyebrow">Perguntas frequentes</h2>
        <div className="divide-y divide-ink-700 rounded-2xl border border-ink-700">
          {FAQ.map((f) => (
            <details key={f.q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-white">{f.q}<span aria-hidden className="text-ash-400 transition group-open:rotate-45">+</span></summary>
              <p className="mt-3 text-sm text-ash-300">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

/** Celular desenhado em CSS mostrando uma tela real do app. */
function PhoneMock() {
  return (
    <div className="force-dark relative mx-auto w-[17rem] sm:w-[19rem]" aria-hidden>
      <div className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(circle,rgba(232,69,60,.25),transparent_65%)]" />
      <div className="rounded-[2.6rem] border border-white/15 bg-black p-2.5 shadow-2xl">
        <div className="relative overflow-hidden rounded-[2.1rem] bg-ink-950">
          <div className="relative h-8 bg-ink-950"><div className="absolute left-1/2 top-2 h-5 w-20 -translate-x-1/2 rounded-full bg-black" /></div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/pwa/screen-estudos.png" alt="" width={780} height={1688} className="block h-auto w-full" />
        </div>
      </div>
    </div>
  );
}
