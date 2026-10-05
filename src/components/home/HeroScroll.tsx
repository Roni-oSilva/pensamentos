"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

/**
 * Abertura cinematográfica da home, guiada pelo scroll (sem nenhum texto de título):
 * a mão sai do borrado para o nítido, a luz cresce, a borboleta sobe até a luz, tudo escurece
 * e sobra o símbolo brilhante — então o manifesto aparece. O progresso (0→1) vira a variável CSS --p.
 */
export function HeroScroll() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.phase = "open";
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const stickyTop = 64; // altura do cabeçalho
      const total = r.height - (window.innerHeight - stickyTop);
      const p = total > 0 ? Math.min(1, Math.max(0, (stickyTop - r.top) / total)) : 0;
      el.style.setProperty("--p", p.toFixed(4));
      el.dataset.phase = p > 0.8 ? "open" : "closed";
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // parallax leve com o mouse (desktop)
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !root.current) return;
    root.current.style.setProperty("--mx", String((e.clientX / window.innerWidth - 0.5) * 2));
    root.current.style.setProperty("--my", String((e.clientY / window.innerHeight - 0.5) * 2));
  };

  return (
    <div ref={root} className="hero" data-phase="closed" onPointerMove={onPointerMove}>
      <div className="hero-stage">
        <h1 className="sr-only">Heresias que passam pela minha cabeça</h1>

        <div className="cine-red" aria-hidden />
        <div className="cine-fog cine-fog-a" aria-hidden><i /><i /><i /></div>
        <div className="cine-fog cine-fog-b" aria-hidden><i /><i /><i /></div>
        <div className="cine-light" aria-hidden><div className="cine-rays" /></div>

        <Image src="/hero/hand.webp" alt="" width={240} height={548} priority className="cine-hand" aria-hidden />
        <div className="cine-veil" aria-hidden />
        <div className="cine-butterfly" aria-hidden><Image src="/hero/butterfly.webp" alt="" width={178} height={156} priority /></div>

        <div className="cine-grain" aria-hidden />
        <div className="cine-vignette" aria-hidden />

        <div className="scroll-hint text-center text-[10px] uppercase tracking-[0.4em] text-ash-300" aria-hidden>Role<span /></div>

        <div className="hero-manifesto">
          <p className="eyebrow">Manifesto</p>
          <p className="max-w-4xl font-poster text-[clamp(2.4rem,8vw,6.5rem)] uppercase leading-[0.95] text-white">
            Nem toda dúvida<br />precisa de <span className="text-poster">resposta.</span>
          </p>
          <p className="max-w-lg text-ash-300">Frases, reflexões e poemas que chegam sem pedir licença. Leia, discorde, guarde — e deixe a sua própria heresia na comunidade.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/heresia" prefetch={false} className="btn-primary px-7 py-3.5 uppercase tracking-widest">Mostrar uma heresia</Link>
            <Link href="/comunidade" className="btn-ghost px-7 py-3.5 uppercase tracking-widest">Explorar a comunidade</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
