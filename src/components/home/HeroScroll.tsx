"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

const LETTERS = "HERESIAS".split("");

/**
 * Abertura da home: o nome "HERESIAS" se abre ao rolar a página, a mão se afasta da borboleta
 * e o manifesto aparece. O progresso (0→1) vira a variável CSS --p; toda a animação é CSS.
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
      el.dataset.phase = p > 0.55 ? "open" : "closed";
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
        <div className="hero-glow" aria-hidden />
        <div className="hero-slit" aria-hidden />

        {/* microtipografia de pôster */}
        <p className="hero-micro left-1/2 top-[4.5vh] -translate-x-1/2 tracking-[0.5em]" aria-hidden>I Heresias</p>
        <p className="hero-micro hero-vertical right-[2vw] top-[22vh] hidden md:block" aria-hidden>Metamorfose</p>

        <div className="hero-title" aria-hidden>
          {LETTERS.map((l, i) => (
            <span key={i} className="hero-letter" style={{ "--d": ((i - 3.5) / 3.5).toFixed(3) } as React.CSSProperties}>{l}</span>
          ))}
        </div>

        <div className="hero-figure" aria-hidden>
          <Image src="/hero/hand.webp" alt="" width={240} height={548} priority className="hero-hand" />
          <div className="hero-butterfly"><Image src="/hero/butterfly.webp" alt="" width={178} height={156} priority className="h-auto w-full" /></div>
        </div>


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
