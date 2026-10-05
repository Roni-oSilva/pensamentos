import type { Metadata, Viewport } from "next";
import "@fontsource/anton/latin-400.css";
import "@fontsource-variable/inter/index.css";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BackBar } from "@/components/layout/BackBar";
import { SITE_URL } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Heresias que passam pela minha cabeça", template: "%s · Heresias" },
  description: "Frases, pensamentos e reflexões que não pedem licença. Leia, explore e publique na comunidade.",
  openGraph: { siteName: "Heresias que passam pela minha cabeça", locale: "pt_BR", type: "website" },
};
export const viewport: Viewport = { themeColor: "#050505", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-black">Pular para o conteúdo</a>
        <Header />
        <BackBar />
        <main id="conteudo" className="pb-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
