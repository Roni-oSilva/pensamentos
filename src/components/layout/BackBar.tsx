"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const KEY = "heresias:depth";
const HIDE = ["/", "/login", "/cadastro", "/recuperar-senha"];

function read(): number { try { return Number(sessionStorage.getItem(KEY) ?? 0) || 0; } catch { return 0; } }
function write(n: number) { try { sessionStorage.setItem(KEY, String(Math.max(0, n))); } catch { /* sem storage: cai no fallback */ } }

/**
 * Barra "Voltar" fixa sob o cabeçalho nas páginas internas. Conta quantas páginas do site a pessoa já abriu
 * nesta aba: com histórico interno volta de verdade (mantém a posição de rolagem); sem histórico, vai para a home.
 */
export function BackBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [depth, setDepth] = useState(0);
  const fromPop = useRef(false);
  const first = useRef(true);

  useEffect(() => {
    const onPop = () => { fromPop.current = true; try { sessionStorage.setItem("heresias:popped", String(Date.now())); } catch { /* ignora */ } };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (first.current) first.current = false;
    else if (fromPop.current) write(read() - 1);
    else write(read() + 1);
    fromPop.current = false;
    setDepth(read());
  }, [pathname]);

  if (HIDE.includes(pathname) || pathname.startsWith("/admin")) return null;

  function back() {
    if (depth > 0) { fromPop.current = true; try { sessionStorage.setItem("heresias:popped", String(Date.now())); } catch { /* ignora */ } router.back(); }
    else router.push("/");
  }

  return (
    <div className="sticky top-16 z-40 border-b border-ink-700/70 bg-ink-950/90 backdrop-blur-md">
      <div className="container-wide flex h-12 items-center">
        <button type="button" onClick={back} aria-label={depth > 0 ? "Voltar para a página anterior" : "Ir para o início"}
          className="-ml-2 inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-sm text-ash-200 transition hover:bg-ink-800 hover:text-white active:scale-95">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 18l-6-6 6-6" /></svg>
          {depth > 0 ? "Voltar" : "Início"}
        </button>
      </div>
    </div>
  );
}
