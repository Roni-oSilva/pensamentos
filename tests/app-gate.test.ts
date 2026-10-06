import { describe, expect, it } from "vitest";
import { isWebPath, sharedPostId, showDownloadPage, type GateInput } from "@/lib/app-gate";

const base: GateInput = { path: "/", method: "GET", isAppCookie: false, fromAppLaunch: false, userAgent: "Mozilla/5.0 (iPhone) Safari", isRouterRequest: false };
const show = (o: Partial<GateInput>) => showDownloadPage({ ...base, ...o });

describe("o site virou app", () => {
  it("no navegador, qualquer página mostra a página de download", () => {
    for (const path of ["/", "/comunidade", "/estudos/biblia", "/forum/123", "/perfil/joao", "/cadastro"]) expect(show({ path })).toBe(true);
  });
  it("dentro do app (cookie ou abertura pelo ícone) tudo funciona", () => {
    expect(show({ isAppCookie: true })).toBe(false);
    expect(show({ fromAppLaunch: true })).toBe(false);
  });
  it("páginas legais, links de e-mail e o painel continuam abertos no navegador", () => {
    for (const path of ["/app", "/privacidade", "/termos", "/diretrizes", "/auth/callback", "/configuracoes/senha", "/login", "/mfa", "/admin", "/admin/posts"]) {
      expect(isWebPath(path)).toBe(true);
      expect(show({ path })).toBe(false);
    }
    expect(isWebPath("/administrador")).toBe(false);
    expect(isWebPath("/configuracoes")).toBe(false);
  });
  it("não mexe em ações, navegação interna nem em envios de formulário", () => {
    expect(show({ isRouterRequest: true })).toBe(false);
    expect(show({ method: "POST" })).toBe(false);
  });
  it("robôs de prévia de link veem a publicação real", () => {
    expect(show({ path: "/comunidade/x", userAgent: "WhatsApp/2.23.20.0" })).toBe(false);
    expect(show({ path: "/comunidade/x", userAgent: "facebookexternalhit/1.1" })).toBe(false);
    expect(show({ path: "/comunidade/x", userAgent: "Googlebot/2.1" })).toBe(true);
  });
  it("reconhece links compartilhados de publicações", () => {
    const id = "3f2b8a4e-1c2d-4e5f-8a9b-0c1d2e3f4a5b";
    expect(sharedPostId(`/comunidade/${id}`)).toBe(id);
    expect(sharedPostId(`/frases/${id}`)).toBe(id);
    expect(sharedPostId("/comunidade/nova")).toBeNull();
    expect(sharedPostId(`/forum/${id}`)).toBeNull();
  });
});
