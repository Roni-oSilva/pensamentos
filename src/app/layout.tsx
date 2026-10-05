import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "@fontsource/anton/latin-400.css";
import "@fontsource-variable/inter/index.css";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Analytics } from "@vercel/analytics/next";
import { BackBar } from "@/components/layout/BackBar";
import { SITE_URL } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Igreja de Cristo", template: "%s · Igreja de Cristo" },
  description: "Uma comunidade cristã para compartilhar versículos, frases, pensamentos e conselhos e, acima de tudo, engrandecer a Cristo.",
  openGraph: { siteName: "Igreja de Cristo", locale: "pt_BR", type: "website" },
};
export const viewport: Viewport = { themeColor: "#050505", width: "device-width", initialScale: 1 };

// Aplica o tema salvo ANTES da primeira pintura (evita piscar). Padrão: escuro.
const THEME_SCRIPT = `try{var t=localStorage.getItem("igreja:theme");if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t;if(t==="light"){var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content","#fcfbf8")}}}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined; // a política de segurança só aceita script com nonce
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head><script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} /></head>
      <body className="min-h-screen">
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-black">Pular para o conteúdo</a>
        <Header />
        <BackBar />
        <main id="conteudo" className="pb-8">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
