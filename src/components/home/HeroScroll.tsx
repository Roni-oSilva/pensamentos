"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";

/**
 * Home: o vídeo avança conforme a rolagem (scroll scrubbing). O progresso (0→1) vira a variável CSS --p;
 * o tempo do vídeo segue o scroll com suavização, e no final o manifesto entra por cima.
 * Sem texto de título: só imagem, luz, grão e movimento.
 */
export function HeroScroll() {
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = root.current, v = video.current;
    if (!el || !v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { el.dataset.phase = "open"; return; }

    let target = 0.4;    // tempo (s) pedido pelo scroll
    let current = 0.4;   // tempo (s) exibido, suavizado
    let raf = 0;
    const stickyTop = 64; // altura do cabeçalho

    const readScroll = () => {
      const r = el.getBoundingClientRect();
      const total = r.height - (window.innerHeight - stickyTop);
      const p = total > 0 ? Math.min(1, Math.max(0, (stickyTop - r.top) / total)) : 0;
      el.style.setProperty("--p", p.toFixed(4));
      el.dataset.phase = p > 0.8 ? "open" : "closed";
      const dur = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 11.4;
      target = 0.4 + Math.min(1, p / 0.82) * Math.max(0, dur - 0.45); // começa no 1º quadro com imagem (0,4 s)
      kick();
    };
    const tick = () => {
      raf = 0;
      current += (target - current) * 0.16;           // suaviza o "arrasto" do vídeo
      if (Math.abs(target - current) < 0.004) current = target;
      if (Math.abs(v.currentTime - current) > 1 / 48) { try { v.currentTime = current; } catch { /* vídeo ainda carregando */ } }
      if (current !== target) kick();
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

    // iOS/Safari só libera o "seek" depois de um play/pause mudo
    v.muted = true;
    v.play().then(() => v.pause()).catch(() => { /* sem autoplay: o seek ainda funciona na maioria dos navegadores */ });
    v.addEventListener("loadedmetadata", readScroll);
    readScroll();
    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("resize", readScroll);
    return () => {
      window.removeEventListener("scroll", readScroll);
      window.removeEventListener("resize", readScroll);
      v.removeEventListener("loadedmetadata", readScroll);
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

        <video ref={video} className="hero-video" muted playsInline preload="auto" poster="/hero/intro-poster.jpg" aria-hidden tabIndex={-1} disablePictureInPicture>
          <source src="/hero/intro.mp4" type="video/mp4" />
          <source src="/hero/intro.webm" type="video/webm" />
        </video>
        <div className="hero-glow-edge" aria-hidden />
        <div className="hero-flicker" aria-hidden />
        <div className="cine-grain" aria-hidden />
        <div className="cine-vignette" aria-hidden />

        <div className="scroll-hint text-center text-[10px] uppercase tracking-[0.4em] text-ash-300" aria-hidden>Role<span /></div>
        <div className="hero-progress" aria-hidden><i /></div>

        <div className="hero-manifesto">
          <p className="eyebrow">Manifesto</p>
          <p className="max-w-4xl font-poster text-[clamp(2.4rem,8vw,6.5rem)] uppercase leading-[0.95] text-white">
            Nem toda dúvida<br />precisa de <span className="text-poster">resposta.</span>
          </p>
          <p className="max-w-lg text-ash-300">Frases, reflexões e poemas que chegam sem pedir licença. Leia, discorde, guarde — e deixe a sua própria heresia na comunidade.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/frases" className="btn-primary px-7 py-3.5 uppercase tracking-widest">Ler as frases</Link>
            <Link href="/heresia" prefetch={false} className="btn-ghost px-7 py-3.5 uppercase tracking-widest">Mostrar uma heresia</Link>
            <Link href="/comunidade" className="btn-ghost px-7 py-3.5 uppercase tracking-widest">Comunidade</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
