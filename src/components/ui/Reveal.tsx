"use client";
import { useEffect, useRef } from "react";

/** Entrada suave ao rolar (IntersectionObserver). Sem JS o conteúdo permanece visível via <noscript> da página. */
export function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { el.dataset.in = ""; return; }
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { el.dataset.in = ""; io.disconnect(); } }, { rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${className}`} style={{ "--delay": `${delay}ms` } as React.CSSProperties}>{children}</div>;
}
