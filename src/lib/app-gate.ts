/**
 * A Igreja de Cristo agora é app: no navegador, o endereço só serve para instalar.
 * Quem abre qualquer página fora do app vê a página de download (/app), no mesmo endereço.
 * Dentro do app instalado (cookie ic_app) tudo funciona normalmente.
 *
 * Continuam abertas no navegador: as páginas legais, os links que chegam por e-mail
 * (confirmação de conta e troca de senha) e o painel de administração (entrar, MFA e /admin).
 */
export const APP_COOKIE = "ic_app";
/** Parâmetro do start_url do manifesto: o app instalado sempre abre com ele. */
export const APP_PARAM = { name: "origem", value: "app" } as const;

const WEB_PATHS = [
  "/app", "/privacidade", "/termos", "/diretrizes",
  "/auth", "/configuracoes/senha",
  "/login", "/mfa", "/configuracoes/seguranca", "/admin",
];

// Robôs que montam a prévia de links (WhatsApp, Instagram, Telegram…): veem a página real, para a prévia
// mostrar a publicação compartilhada. Quem toca no link cai na página de download.
const PREVIEW_BOTS = /WhatsApp|facebookexternalhit|Facebot|meta-externalagent|Twitterbot|TelegramBot|Slackbot|Discordbot|LinkedInBot|Pinterest|SkypeUriPreview|redditbot|Embedly|vkShare|Iframely/i;

export interface GateInput {
  path: string;
  method: string;
  isAppCookie: boolean;
  fromAppLaunch: boolean;
  userAgent: string;
  /** navegação interna do Next (RSC), prefetch ou server action */
  isRouterRequest: boolean;
}

export function isWebPath(path: string): boolean {
  return WEB_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

/** true = mostrar a página de download no lugar da página pedida. */
export function showDownloadPage(i: GateInput): boolean {
  if (i.isAppCookie || i.fromAppLaunch) return false;
  if (i.method !== "GET" && i.method !== "HEAD") return false;
  if (i.isRouterRequest) return false;
  if (PREVIEW_BOTS.test(i.userAgent)) return false;
  return !isWebPath(i.path);
}

/** Endereço compartilhado de uma publicação (para mostrar a prévia na página de download). */
export function sharedPostId(path: string): string | null {
  const m = path.match(/^\/(?:frases|comunidade)\/([0-9a-f-]{36})$/i);
  return m?.[1] ?? null;
}
