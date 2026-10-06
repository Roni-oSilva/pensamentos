import type { MetadataRoute } from "next";

/** Manifesto do app (PWA): nome, ícones, cores e atalhos usados quando o site é instalado no celular ou no computador. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Igreja de Cristo",
    short_name: "Igreja de Cristo",
    description: "Comunidade cristã para compartilhar versículos, orar, estudar a Palavra e engrandecer a Cristo.",
    lang: "pt-BR",
    dir: "ltr",
    start_url: "/?origem=app",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#050505",
    theme_color: "#050505",
    categories: ["lifestyle", "education", "social"],
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/pwa/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Palavras", url: "/frases?origem=atalho", icons: [{ src: "/pwa/shortcut-sol.png", sizes: "96x96", type: "image/png" }] },
      { name: "Estudos", url: "/estudos?origem=atalho", icons: [{ src: "/pwa/shortcut-livro.png", sizes: "96x96", type: "image/png" }] },
      { name: "Comunidade", url: "/comunidade?origem=atalho", icons: [{ src: "/pwa/shortcut-igreja.png", sizes: "96x96", type: "image/png" }] },
      { name: "Fórum", url: "/forum?origem=atalho", icons: [{ src: "/pwa/shortcut-forum.png", sizes: "96x96", type: "image/png" }] },
    ],
    screenshots: [
      { src: "/pwa/screen-estudos.png", sizes: "780x1688", type: "image/png", form_factor: "narrow", label: "Estudos com trilhas, aulas e níveis" },
      { src: "/pwa/screen-aula.png", sizes: "780x1688", type: "image/png", form_factor: "narrow", label: "Aulas com versículo, herói da fé e quiz" },
      { src: "/pwa/screen-wide.png", sizes: "1440x900", type: "image/png", form_factor: "wide", label: "Igreja de Cristo no computador" },
    ],
  };
}
