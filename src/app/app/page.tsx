import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { Bell, BookOpen, CalendarDays, Download, HandHeart, MessageCircle, Quote, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { SITE_URL } from "@/lib/env";
import { sharedPostId } from "@/lib/app-gate";
import { getPost } from "@/lib/data";
import { ChurchMark } from "@/components/ui/ChurchMark";
import { InstallCard } from "@/components/pwa/InstallCard";
import { CopyLink } from "@/components/pwa/CopyLink";
import { ShareIosIcon, AddSquareIcon, DotsIcon } from "@/components/pwa/InstallIcons";

const DESCRIPTION = "A Igreja de Cristo agora é app: versículos, estudos com níveis, Bíblia em um ano, comunidade, oração e fórum na sua tela inicial. Grátis e sem loja de aplicativos.";

export const metadata: Metadata = {
  title: { absolute: "Igreja de Cristo · agora é app" },
  description: DESCRIPTION,
  openGraph: { title: "Igreja de Cristo agora é app", description: DESCRIPTION },
};

async function appUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return /^[a-z0-9.-]+(:\d+)?$/i.test(host) ? `${proto}://${host}/app` : `${SITE_URL}/app`;
}

const FEATURES = [
  { icon: Quote, t: "Palavras", d: "Versículos, frases e pensamentos para cada dia." },
  { icon: CalendarDays, t: "Bíblia em um ano", d: "A leitura do dia, e a igreja marcando presença junto." },
  { icon: BookOpen, t: "Estudos", d: "Trilhas profundas, quiz e níveis que sobem a cada aula." },
  { icon: Users, t: "Comunidade", d: "Compartilhe o que Deus tem falado com você." },
  { icon: HandHeart, t: "Comunhão", d: "Pedidos de oração e irmãos orando por você." },
  { icon: MessageCircle, t: "Fórum", d: "Conversas sobre fé e votações da igreja." },
];

const BADGES = [
  { icon: Download, t: "Grátis, sem loja" },
  { icon: RefreshCw, t: "Atualiza sozinho" },
  { icon: ShieldCheck, t: "Sua conta de sempre" },
  { icon: Bell, t: "Avisos na hora" },
];

const FAQ = [
  { q: "O site acabou?", a: "O endereço continua o mesmo, mas agora ele serve para instalar o app. Tudo o que havia no site (palavras, estudos, comunidade, fórum) está dentro do app." },
  { q: "Preciso de Play Store ou App Store?", a: "Não. A instalação é feita pelo navegador, de graça, em poucos segundos." },
  { q: "Já tenho conta. Preciso criar outra?", a: "Não. Entre no app com o mesmo e-mail e senha. Seu nível nos estudos, favoritos e publicações continuam lá." },
  { q: "Ocupa muito espaço?", a: "Não. O app usa poucos megabytes, bem menos que um app comum." },
  { q: "Como atualizo?", a: "Não precisa. Sempre que você abre, ele já está na versão mais nova." },
  { q: "Como desinstalo?", a: "Como qualquer app: segure o ícone na tela inicial e escolha remover." },
];

async function loadShared(from: string) {
  const id = sharedPostId(from);
  if (!id) return null;
  try {
    const p = await getPost(id, null);
    return p && p.status === "PUBLISHED" ? p : null;
  } catch { return null; }
}

export default async function AppPage() {
  const from = (await headers()).get("x-landing-from") ?? "/app";
  const [url, shared] = await Promise.all([appUrl(), loadShared(from)]);
  const qr = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#050505", light: "#ffffff" } });

  return (
    <div className="landing relative isolate overflow-hidden">
      {/* fundo: luz da igreja + textura */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[56rem]">
        <div className="absolute inset-0 bg-[url('/share/bg5.webp')] bg-cover bg-center opacity-[0.14] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="landing-glow absolute left-1/2 top-[-12rem] h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,.22),rgba(232,69,60,.12)_45%,transparent_70%)]" />
      </div>

      <header className="container-wide flex items-center justify-between pt-[max(1.25rem,env(safe-area-inset-top))]">
        <span className="flex items-center gap-2.5 text-white">
          <ChurchMark className="h-9 w-auto" />
          <span className="church-name text-lg leading-none">Igreja de <span className="church-accent text-poster">Cristo</span></span>
        </span>
        <a href="#instalar" className="btn-primary px-4 py-2 text-sm">Instalar</a>
      </header>

      <section className="container-wide grid items-center gap-14 pb-16 pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:pt-20">
        <div className="space-y-7">
          <p className="landing-rise inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
            <span className="landing-dot h-1.5 w-1.5 rounded-full bg-amber-300" aria-hidden />O site virou app
          </p>
          <h1 className="landing-rise font-poster text-[clamp(3rem,13vw,5.6rem)] leading-[0.92] text-white [animation-delay:.08s]">
            Igreja de <span className="church-accent text-poster">Cristo</span>
            <span className="mt-2 block font-display text-[0.8em] italic text-ash-200">agora é app.</span>
          </h1>
          <p className="landing-rise max-w-xl text-lg text-ash-300 [animation-delay:.16s]">
            Deixamos o navegador para trás. A Palavra, os estudos, a Bíblia em um ano, a comunidade e a oração estão agora num app leve, direto na sua tela inicial.
          </p>

          {shared && (
            <figure className="landing-rise rounded-2xl border border-ink-600 bg-ink-900/80 p-5 backdrop-blur [animation-delay:.2s]">
              <p className="eyebrow mb-3">Compartilharam com você</p>
              {shared.title && <p className="mb-1 font-semibold text-white">{shared.title}</p>}
              <blockquote className="line-clamp-4 font-display text-xl leading-snug text-ash-100">“{shared.content}”</blockquote>
              {shared.author && <figcaption className="mt-3 text-sm text-ash-400">por @{shared.author.username} · abra no app para curtir e comentar</figcaption>}
            </figure>
          )}

          <div id="instalar" className="landing-rise scroll-mt-6 [animation-delay:.24s]"><InstallCard url={url} /></div>

          <ul className="landing-rise grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm text-ash-300 sm:flex sm:flex-wrap sm:gap-x-6 [animation-delay:.32s]">
            {BADGES.map(({ icon: Icon, t }) => (
              <li key={t} className="flex items-center gap-2"><Icon aria-hidden className="h-4 w-4 text-amber-300" />{t}</li>
            ))}
          </ul>
        </div>
        <Phones />
      </section>

      <section aria-labelledby="dentro" className="container-wide space-y-8 py-16">
        <div className="space-y-2">
          <p className="eyebrow">Dentro do app</p>
          <h2 id="dentro" className="font-display text-4xl text-white sm:text-5xl">Tudo o que era o site, <em>na palma da mão</em>.</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, t, d }) => (
            <div key={t} className="group rounded-2xl border border-ink-700 bg-ink-900/70 p-4 transition hover:border-ink-500 sm:p-5">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-amber-400/20 to-rose-500/10 text-amber-200 ring-1 ring-amber-300/20">
                <Icon aria-hidden className="h-5 w-5" />
              </span>
              <p className="mt-4 font-semibold text-white sm:text-lg">{t}</p>
              <p className="mt-1 text-[13px] leading-snug text-ash-300 sm:text-sm">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="como" className="container-wide space-y-8 py-16">
        <div className="space-y-2">
          <p className="eyebrow">Como instalar</p>
          <h2 id="como" className="font-display text-4xl text-white sm:text-5xl">Em menos de um minuto.</h2>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <Platform name="iPhone" steps={[
            <>Abra este endereço no <strong className="text-white">Safari</strong>.</>,
            <>Toque em <Chip><ShareIosIcon /> Compartilhar</Chip></>,
            <>Escolha <Chip><AddSquareIcon /> Adicionar à Tela de Início</Chip> e toque em <strong className="text-white">Adicionar</strong>.</>,
          ]} />
          <Platform name="Android" steps={[
            <>Abra este endereço no <strong className="text-white">Chrome</strong>.</>,
            <>Toque em <strong className="text-white">Instalar o app</strong>, ou no menu <Chip><DotsIcon /></Chip></>,
            <>Escolha <Chip>Instalar app</Chip> e confirme.</>,
          ]} />
          <Platform name="Computador" steps={[
            <>Abra no <strong className="text-white">Chrome</strong> ou no <strong className="text-white">Edge</strong>.</>,
            <>Clique no ícone de instalar, no fim da barra de endereço.</>,
            <>Ou aponte a câmera do celular para o QR code abaixo.</>,
          ]} />
        </div>
      </section>

      <section aria-labelledby="qr" className="container-wide py-16">
        <div className="relative overflow-hidden rounded-3xl border border-ink-600 bg-ink-900 p-6 sm:p-10">
          <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,.18),transparent_70%)]" />
          <div className="relative grid items-center gap-8 sm:grid-cols-[13rem_minmax(0,1fr)]">
            <div className="mx-auto w-52 overflow-hidden rounded-2xl bg-white p-2.5 shadow-2xl" aria-hidden dangerouslySetInnerHTML={{ __html: qr }} />
            <div className="space-y-3 text-center sm:text-left">
              <h2 id="qr" className="font-display text-4xl text-white">Aponte a câmera</h2>
              <p className="text-ash-300">Está no computador? Abra a câmera do celular e aponte para o código. Também serve para cartazes, telão do culto e redes sociais.</p>
              <p className="break-all font-mono text-sm text-ash-400">{url}</p>
              <CopyLink url={url} />
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="faq" className="container-wide space-y-6 py-16">
        <h2 id="faq" className="font-display text-4xl text-white">Perguntas frequentes</h2>
        <div className="divide-y divide-ink-700 rounded-2xl border border-ink-700 bg-ink-900/50">
          {FAQ.map((f) => (
            <details key={f.q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-white">{f.q}<span aria-hidden className="text-xl text-ash-400 transition group-open:rotate-45">+</span></summary>
              <p className="mt-3 text-ash-300">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="container-wide pb-20 pt-6 text-center">
        <ChurchMark className="mx-auto h-16 w-auto text-white" />
        <p className="mx-auto mt-5 max-w-md font-display text-3xl text-white">Engrandeça a Cristo de onde estiver.</p>
        <a href="#instalar" className="btn-primary mt-6 inline-flex px-8 py-3.5 text-base">Instalar o app</a>
      </section>

      <footer className="border-t border-ink-800 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="container-wide flex flex-col items-center justify-between gap-4 text-sm text-ash-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Igreja de Cristo</p>
          <nav aria-label="Documentos" className="flex gap-5">
            <Link href="/privacidade" className="hover:text-white">Privacidade</Link>
            <Link href="/termos" className="hover:text-white">Termos</Link>
            <Link href="/diretrizes" className="hover:text-white">Diretrizes</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function Platform({ name, steps }: { name: string; steps: React.ReactNode[] }) {
  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-900/70 p-6">
      <p className="font-display text-3xl text-white">{name}</p>
      <ol className="mt-5 space-y-4 text-sm text-ash-200">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ash-100 text-xs font-bold text-ink-950">{i + 1}</span>
            <span className="leading-7">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="mx-0.5 inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-ink-800 px-2 py-0.5 align-middle text-white">{children}</span>;
}

/** Dois celulares desenhados em CSS com telas reais do app: a abertura (a igreja) e a Bíblia em um ano. */
function Phones() {
  return (
    <div className="relative mx-auto h-[33rem] w-full max-w-[24rem] sm:h-[37rem]" aria-hidden>
      <div className="absolute inset-0 -z-10 rounded-full bg-[radial-gradient(circle,rgba(232,69,60,.22),transparent_62%)]" />
      <Phone src="/pwa/screen-biblia.png" className="landing-float-b absolute right-0 top-10 w-[13rem] rotate-[7deg] opacity-90 sm:w-[14.5rem]" />
      <Phone src="/pwa/screen-inicio.png" className="landing-float absolute left-0 top-0 w-[15rem] -rotate-[4deg] sm:w-[16.5rem]" />
    </div>
  );
}

function Phone({ src, className }: { src: string; className: string }) {
  return (
    <div className={className}>
      <div className="rounded-[2.6rem] border border-white/15 bg-black p-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,.9)]">
        <div className="relative overflow-hidden rounded-[2.15rem] bg-ink-950">
          <div className="absolute left-1/2 top-2 z-10 h-5 w-[4.5rem] -translate-x-1/2 rounded-full bg-black" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" width={780} height={1688} className="block h-auto w-full" />
        </div>
      </div>
    </div>
  );
}
