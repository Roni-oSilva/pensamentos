import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "@fontsource-variable/inter-tight/index.css";
import "@fontsource/instrument-serif/latin-400.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Analytics } from "@vercel/analytics/next";
import { BackBar } from "@/components/layout/BackBar";
import { HelpButton } from "@/components/layout/HelpButton";
import { SITE_URL } from "@/lib/env";
import { getSession } from "@/lib/auth";
import { PwaRuntime } from "@/components/pwa/PwaRuntime";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { AppTabBar } from "@/components/pwa/AppTabBar";
import { Toaster } from "@/components/feedback/Toaster";

// Telas de abertura do iPhone (largura × altura em pontos, densidade, arquivo em pixels).
const SPLASH: [number, number, number][] = [[440, 956, 3], [430, 932, 3], [402, 874, 3], [393, 852, 3], [390, 844, 3], [428, 926, 3], [375, 812, 3], [414, 896, 2], [375, 667, 2]];

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Igreja de Cristo", template: "%s · Igreja de Cristo" },
  description: "Uma comunidade cristã para compartilhar versículos, frases, pensamentos e conselhos e, acima de tudo, engrandecer a Cristo.",
  openGraph: { siteName: "Igreja de Cristo", locale: "pt_BR", type: "website" },
  applicationName: "Igreja de Cristo",
  icons: { apple: "/pwa/apple-touch-icon.png" },
  formatDetection: { telephone: false },
  other: { "apple-mobile-web-app-capable": "yes" }, // iPhones mais antigos ainda leem esta marca
  appleWebApp: {
    capable: true,
    title: "Igreja de Cristo",
    statusBarStyle: "black-translucent",
    startupImage: SPLASH.map(([w, h, r]) => ({
      url: `/pwa/splash/splash-${w * r}x${h * r}.png`,
      media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)`,
    })),
  },
};
export const viewport: Viewport = { themeColor: "#050505", width: "device-width", initialScale: 1, viewportFit: "cover" };

// Aplica o tema salvo ANTES da primeira pintura (evita piscar). Padrão: escuro.
// Também marca o modo app (instalado) e guarda o convite de instalação do Chrome antes do React carregar.
const THEME_SCRIPT = `try{if(matchMedia("(display-mode: standalone)").matches||navigator.standalone){document.documentElement.dataset.app="1"}window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__bip=e})}catch(e){}try{var t=localStorage.getItem("igreja:theme");if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t;if(t==="light"){var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content","#fcfbf8")}}}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined; // a política de segurança só aceita script com nonce
  const session = await getSession();
  const meHref = session ? `/perfil/${session.profile.username}` : "/login";
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head><script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} /></head>
      <body className="min-h-screen">
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-black">Pular para o conteúdo</a>
        <Header />
        <BackBar />
        <main id="conteudo" className="pb-8">{children}</main>
        <Footer />
        <HelpButton />
        <AppTabBar meHref={meHref} />
        <Toaster />
        <InstallBanner />
        <PwaRuntime />
        <Analytics />
      </body>
    </html>
  );
}
