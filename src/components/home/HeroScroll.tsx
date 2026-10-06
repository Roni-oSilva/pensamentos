"use client";
import { ChurchMark } from "@/components/ui/ChurchMark";
import { useEffect, useRef, useState } from "react";

const COUNT = 171; // quadros (15 por segundo, ~11,4 s)
const SETS = { p: "/hero/seq/p", l: "/hero/seq/l" } as const; // p = vertical (celular), l = horizontal (computador)
type SetKey = keyof typeof SETS;
const frameUrl = (set: SetKey, i: number) => `${SETS[set]}/${String(i + 1).padStart(4, "0")}.webp`;

/**
 * Home: sequência de quadros desenhada num <canvas> e guiada pelo scroll. Nada toca sozinho: a rolagem
 * escolhe o quadro exato (com mistura entre quadros vizinhos para ficar fluido). O progresso (0→1) vira --p.
 * Sem texto de título: só imagem, luz, grão e movimento.
 */
export function HeroScroll() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(0);

  useEffect(() => {
    if (document.documentElement.dataset.app === "1") return; // no app instalado a abertura é a igreja, sem o vídeo
    const el = root.current, cv = canvas.current;
    const ctx = cv?.getContext("2d", { alpha: false });
    if (!el || !cv || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let set: SetKey = window.innerHeight > window.innerWidth * 0.9 ? "p" : "l";
    let frames: (HTMLImageElement | null)[] = new Array(COUNT).fill(null);
    let generation = 0;
    let target = 0, current = 0, raf = 0, drawn = -1;
    const stickyTop = 64; // altura do cabeçalho

    const nearest = (i: number): HTMLImageElement | null => {
      for (let d = 0; d < COUNT; d++) { const a = frames[i - d], b = frames[i + d]; if (a) return a; if (b) return b; }
      return null;
    };
    const draw = () => {
      const i0 = Math.min(COUNT - 1, Math.floor(current)), a = current - i0;
      const f0 = nearest(i0);
      if (!f0) return;
      if (cv.width !== f0.naturalWidth) { cv.width = f0.naturalWidth; cv.height = f0.naturalHeight; drawn = -1; }
      if (Math.abs(drawn - current) < 0.001) return;
      drawn = current;
      ctx.globalAlpha = 1;
      ctx.drawImage(f0, 0, 0);
      const f1 = i0 + 1 < COUNT ? frames[i0 + 1] : null;
      if (f1 && a > 0.02) { ctx.globalAlpha = a; ctx.drawImage(f1, 0, 0); ctx.globalAlpha = 1; } // mistura com o próximo quadro
    };
    const tick = () => {
      raf = 0;
      current += (target - current) * 0.14; // suavização maior = acompanha o dedo com mais calma
      if (Math.abs(target - current) < 0.01) current = target;
      draw();
      if (current !== target) kick();
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

    const load = (which: SetKey) => {
      const gen = ++generation;
      set = which; frames = new Array(COUNT).fill(null); drawn = -1; setLoaded(0);
      let next = 0, settled = 0;
      const fetchFrame = async (i: number): Promise<HTMLImageElement | null> => {
        for (let attempt = 0; attempt < 3; attempt++) { // tenta de novo se a rede falhar
          const img = new Image();
          img.decoding = "async";
          img.src = frameUrl(which, i) + (attempt ? `?r=${attempt}` : "");
          try { await img.decode(); return img; } catch { await new Promise((r) => setTimeout(r, 250 * (attempt + 1))); }
        }
        return null;
      };
      const worker = async () => {
        while (gen === generation && next < COUNT) {
          const i = next++;
          const img = await fetchFrame(i);
          if (gen !== generation) return;
          frames[i] = img; settled++;
          if (settled % 8 === 0 || settled === COUNT) setLoaded(settled / COUNT);
          kick();
        }
      };
      for (let k = 0; k < 4; k++) void worker();
    };

    const readScroll = () => {
      const r = el.getBoundingClientRect();
      const total = r.height - (window.innerHeight - stickyTop);
      const p = total > 0 ? Math.min(1, Math.max(0, (stickyTop - r.top) / total)) : 0;
      el.style.setProperty("--p", p.toFixed(4));
      el.dataset.phase = p > 0.8 ? "open" : "closed";
      target = Math.min(1, p / 0.82) * (COUNT - 1);
      kick();
    };
    const onResize = () => {
      const want: SetKey = window.innerHeight > window.innerWidth * 0.9 ? "p" : "l";
      if (want !== set) load(want);
      readScroll();
    };
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      el.style.setProperty("--mx", String((e.clientX / window.innerWidth - 0.5) * 2));
      el.style.setProperty("--my", String((e.clientY / window.innerHeight - 0.5) * 2));
    };

    load(set);
    if (reduce) { el.dataset.phase = "open"; target = current = COUNT - 1; return; }
    readScroll();
    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      generation++;
      window.removeEventListener("scroll", readScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={root} className="hero" data-phase="closed">
      <div className="hero-stage">
        <h1 className="sr-only">Igreja de Cristo: uma comunidade para compartilhar a Palavra e engrandecer a Cristo</h1>

        <canvas ref={canvas} className="hero-canvas" aria-hidden />
        <div className="hero-glow-edge" aria-hidden />
        <div className="hero-flicker" aria-hidden />
        <div className="cine-grain" aria-hidden />
        <div className="cine-vignette" aria-hidden />

        {loaded < 0.99 && <div className="hero-loading" role="status" aria-live="polite">Carregando {Math.round(loaded * 100)}%</div>}
        <div className="scroll-hint text-center text-[10px] uppercase tracking-[0.4em] text-ash-300" aria-hidden>Role<span /></div>
        <div className="hero-progress" aria-hidden><i /></div>

        <div className="hero-manifesto">
          <ChurchMark className="h-24 w-auto text-white sm:h-32" />
          <h2 className="church-name text-[clamp(2.4rem,11vw,7rem)] text-white">Igreja de <span className="church-accent text-poster">Cristo</span></h2>
          <a href="#continuar" aria-label="Continuar para o conteúdo" className="mt-4 grid h-12 w-12 place-items-center rounded-full border border-white/30 text-white/80 transition hover:border-white hover:text-white active:scale-90">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="animate-bounce"><path d="m6 9 6 6 6-6" /></svg>
          </a>
        </div>
      </div>
    </div>
  );
}
